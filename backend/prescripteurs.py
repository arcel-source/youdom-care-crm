"""Module prescripteurs/partenaires — Youdom Care CRM."""
import logging
from datetime import datetime
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status

from database import get_db
from auth import require_permission
from models import PrescripteurCreate, PrescripteurUpdate, TypeStructurePrescripteur
from utils import serialize_doc, sanitize_string

logger = logging.getLogger(__name__)
router = APIRouter()


def format_prescripteur(doc: dict) -> dict:
    return serialize_doc(doc) if doc else None


@router.get("", summary="Lister les prescripteurs")
async def list_prescripteurs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    type_structure: Optional[TypeStructurePrescripteur] = None,
    current_user: dict = Depends(require_permission("prescripteurs:read"))
):
    """Liste paginée des prescripteurs."""
    db = get_db()
    query = {}

    if type_structure:
        query["type_structure"] = type_structure.value
    if search:
        s = sanitize_string(search, 100)
        query["$or"] = [
            {"nom": {"$regex": s, "$options": "i"}},
            {"prenom": {"$regex": s, "$options": "i"}},
            {"organisation": {"$regex": s, "$options": "i"}},
        ]

    total = await db.prescripteurs.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.prescripteurs.find(query).sort("nom", 1).skip(skip).limit(limit).to_list(length=limit)

    # Enrichir avec le nombre de leads
    items = []
    for doc in docs:
        p = format_prescripteur(doc)
        p_id = str(doc["_id"])
        p["nombre_leads"] = await db.leads.count_documents({"prescripteur_id": p_id})
        items.append(p)

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer un prescripteur")
async def create_prescripteur(
    data: PrescripteurCreate,
    current_user: dict = Depends(require_permission("prescripteurs:write"))
):
    """Créer une nouvelle fiche prescripteur."""
    db = get_db()
    doc = data.model_dump()
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["created_by"] = current_user["id"]
    doc["historique_echanges"] = []

    result = await db.prescripteurs.insert_one(doc)
    created = await db.prescripteurs.find_one({"_id": result.inserted_id})
    logger.info(f"Prescripteur créé par {current_user['email']}")
    return format_prescripteur(created)


@router.get("/{prescripteur_id}", summary="Détail d'un prescripteur")
async def get_prescripteur(
    prescripteur_id: str,
    current_user: dict = Depends(require_permission("prescripteurs:read"))
):
    """Récupérer la fiche d'un prescripteur."""
    db = get_db()
    try:
        doc = await db.prescripteurs.find_one({"_id": ObjectId(prescripteur_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    if not doc:
        raise HTTPException(status_code=404, detail="Prescripteur non trouvé")

    p = format_prescripteur(doc)
    p["nombre_leads"] = await db.leads.count_documents({"prescripteur_id": prescripteur_id})

    # Récupérer les leads récents
    leads_recents = await db.leads.find(
        {"prescripteur_id": prescripteur_id},
        {"nom": 1, "prenom": 1, "statut": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(length=5)
    p["leads_recents"] = [serialize_doc(l) for l in leads_recents]

    return p


@router.patch("/{prescripteur_id}", summary="Modifier un prescripteur")
async def update_prescripteur(
    prescripteur_id: str,
    data: PrescripteurUpdate,
    current_user: dict = Depends(require_permission("prescripteurs:write"))
):
    """Modifier la fiche d'un prescripteur."""
    db = get_db()
    try:
        obj_id = ObjectId(prescripteur_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à modifier")

    update_data["updated_at"] = datetime.utcnow()
    result = await db.prescripteurs.update_one({"_id": obj_id}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prescripteur non trouvé")

    updated = await db.prescripteurs.find_one({"_id": obj_id})
    return format_prescripteur(updated)


@router.delete("/{prescripteur_id}", summary="Supprimer un prescripteur")
async def delete_prescripteur(
    prescripteur_id: str,
    current_user: dict = Depends(require_permission("prescripteurs:write"))
):
    """Supprimer un prescripteur."""
    db = get_db()
    try:
        obj_id = ObjectId(prescripteur_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    # Vérifier qu'il n'a pas de leads actifs
    leads_actifs = await db.leads.count_documents({
        "prescripteur_id": prescripteur_id,
        "statut": {"$nin": ["perdu", "archive", "termine"]}
    })
    if leads_actifs > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de supprimer: {leads_actifs} lead(s) actif(s) lié(s)"
        )

    result = await db.prescripteurs.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prescripteur non trouvé")

    return {"message": "Prescripteur supprimé avec succès"}


@router.post("/{prescripteur_id}/echanges", summary="Ajouter un échange")
async def add_echange(
    prescripteur_id: str,
    echange_data: dict,
    current_user: dict = Depends(require_permission("prescripteurs:write"))
):
    """Ajouter une note d'échange avec un prescripteur."""
    db = get_db()
    try:
        obj_id = ObjectId(prescripteur_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    echange = {
        "date": datetime.utcnow().isoformat(),
        "auteur": f"{current_user.get('prenom', '')} {current_user.get('nom', '')}",
        "type": echange_data.get("type", "note"),
        "contenu": sanitize_string(echange_data.get("contenu", ""), 2000),
    }

    result = await db.prescripteurs.update_one(
        {"_id": obj_id},
        {
            "$push": {"historique_echanges": {"$each": [echange], "$position": 0}},
            "$set": {"updated_at": datetime.utcnow()},
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prescripteur non trouvé")

    return {"message": "Échange enregistré", "echange": echange}
