"""Module familles/aidants — Youdom Care CRM."""
import logging
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional

from database import get_db
from auth import get_current_user, require_permission
from models import FamilleCreate, FamilleUpdate, FamilleResponse
from utils import serialize_doc, sanitize_string

logger = logging.getLogger(__name__)
router = APIRouter()


def format_famille(doc: dict) -> dict:
    """Formater une famille pour la réponse API."""
    return serialize_doc(doc) if doc else None


@router.get("", summary="Lister les familles/aidants")
async def list_familles(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    beneficiaire_id: Optional[str] = None,
    current_user: dict = Depends(require_permission("familles:read"))
):
    """Liste paginée des familles avec filtres."""
    db = get_db()
    query = {}

    if beneficiaire_id:
        query["beneficiaire_ids"] = beneficiaire_id

    if search:
        s = sanitize_string(search, 100)
        query["$or"] = [
            {"nom": {"$regex": s, "$options": "i"}},
            {"prenom": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
        ]

    total = await db.familles.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.familles.find(query).sort("nom", 1).skip(skip).limit(limit).to_list(length=limit)

    return {
        "items": [format_famille(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer un aidant/famille")
async def create_famille(
    data: FamilleCreate,
    current_user: dict = Depends(require_permission("familles:write"))
):
    """Créer une nouvelle fiche famille/aidant."""
    db = get_db()

    # Vérifier que les bénéficiaires existent
    for ben_id in data.beneficiaire_ids:
        try:
            obj_id = ObjectId(ben_id)
        except Exception:
            raise HTTPException(status_code=400, detail=f"ID bénéficiaire invalide: {ben_id}")
        ben = await db.beneficiaires.find_one({"_id": obj_id})
        if not ben:
            raise HTTPException(status_code=404, detail=f"Bénéficiaire {ben_id} non trouvé")

    doc = data.model_dump()
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["created_by"] = current_user["id"]

    result = await db.familles.insert_one(doc)
    created = await db.familles.find_one({"_id": result.inserted_id})
    logger.info(f"Famille créée par {current_user['email']}")
    return format_famille(created)


@router.get("/{famille_id}", summary="Détail d'une famille")
async def get_famille(
    famille_id: str,
    current_user: dict = Depends(require_permission("familles:read"))
):
    """Récupérer la fiche complète d'une famille."""
    db = get_db()
    try:
        doc = await db.familles.find_one({"_id": ObjectId(famille_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    if not doc:
        raise HTTPException(status_code=404, detail="Famille non trouvée")

    famille = format_famille(doc)

    # Enrichir avec les infos bénéficiaires
    beneficiaires = []
    for ben_id in doc.get("beneficiaire_ids", []):
        try:
            ben = await db.beneficiaires.find_one(
                {"_id": ObjectId(ben_id)},
                {"nom": 1, "prenom": 1, "statut": 1}
            )
            if ben:
                beneficiaires.append(serialize_doc(ben))
        except Exception:
            pass
    famille["beneficiaires"] = beneficiaires

    return famille


@router.patch("/{famille_id}", summary="Modifier une famille")
async def update_famille(
    famille_id: str,
    data: FamilleUpdate,
    current_user: dict = Depends(require_permission("familles:write"))
):
    """Modifier une fiche famille."""
    db = get_db()
    try:
        obj_id = ObjectId(famille_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    existing = await db.familles.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Famille non trouvée")

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à modifier")

    # Vérifier bénéficiaires si modifiés
    if "beneficiaire_ids" in update_data:
        for ben_id in update_data["beneficiaire_ids"]:
            try:
                ben = await db.beneficiaires.find_one({"_id": ObjectId(ben_id)})
            except Exception:
                raise HTTPException(status_code=400, detail=f"ID bénéficiaire invalide: {ben_id}")
            if not ben:
                raise HTTPException(status_code=404, detail=f"Bénéficiaire {ben_id} non trouvé")

    update_data["updated_at"] = datetime.utcnow()
    await db.familles.update_one({"_id": obj_id}, {"$set": update_data})

    updated = await db.familles.find_one({"_id": obj_id})
    logger.info(f"Famille {famille_id} modifiée par {current_user['email']}")
    return format_famille(updated)


@router.delete("/{famille_id}", summary="Supprimer une famille")
async def delete_famille(
    famille_id: str,
    current_user: dict = Depends(require_permission("familles:write"))
):
    """Supprimer une fiche famille."""
    db = get_db()
    try:
        obj_id = ObjectId(famille_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    result = await db.familles.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Famille non trouvée")

    logger.info(f"Famille {famille_id} supprimée par {current_user['email']}")
    return {"message": "Famille supprimée avec succès"}


@router.post("/{famille_id}/portail/invite", summary="Envoyer invitation portail")
async def invite_portail(
    famille_id: str,
    current_user: dict = Depends(require_permission("familles:write"))
):
    """Envoyer une invitation portail famille par email."""
    db = get_db()
    try:
        famille = await db.familles.find_one({"_id": ObjectId(famille_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    if not famille:
        raise HTTPException(status_code=404, detail="Famille non trouvée")

    if not famille.get("email"):
        raise HTTPException(status_code=400, detail="L'aidant n'a pas d'adresse email")

    # Activer l'accès portail
    await db.familles.update_one(
        {"_id": ObjectId(famille_id)},
        {"$set": {"acces_portail": True, "updated_at": datetime.utcnow()}}
    )

    # Créer un magic link
    from utils import generate_secure_token
    from datetime import timedelta
    token = generate_secure_token(32)
    await db.magic_links.insert_one({
        "token": token,
        "famille_id": famille_id,
        "email": famille["email"],
        "type_acteur": "famille",
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=7),
    })

    logger.info(f"Invitation portail envoyée à {famille['email']}")
    return {
        "message": f"Invitation envoyée à {famille['email']}",
        "portail_url": f"{__import__('config').get_settings().app_url}/portail?token={token}",
    }
