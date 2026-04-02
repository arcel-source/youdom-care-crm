"""Module bénéficiaires — Youdom Care CRM."""
import logging
from datetime import datetime, date
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status

from database import get_db
from auth import get_current_user, require_permission
from models import (
    BeneficiaireCreate, BeneficiaireUpdate, BeneficiaireResponse,
    StatutBeneficiaire, TypePublic, NiveauDependance
)
from utils import (
    serialize_doc, generate_numero_dossier, sanitize_string,
    encrypt_sensitive, decrypt_sensitive, calculate_age
)

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_next_dossier_number(db) -> str:
    """Générer le prochain numéro de dossier bénéficiaire."""
    result = await db.counters.find_one_and_update(
        {"_id": "beneficiaires"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return generate_numero_dossier("YC-BEN", result.get("seq", 1))


def format_beneficiaire(doc: dict) -> dict:
    """Formater un bénéficiaire pour la réponse API."""
    if not doc:
        return None
    b = serialize_doc(doc)
    if b.get("date_naissance"):
        try:
            dn = datetime.strptime(b["date_naissance"], "%Y-%m-%d").date() if isinstance(b["date_naissance"], str) else b["date_naissance"]
            b["age"] = calculate_age(dn)
        except Exception:
            b["age"] = 0
    else:
        b["age"] = 0
    # Ne pas exposer le numéro de sécu en clair
    b.pop("numero_secu", None)
    return b


@router.get("", summary="Lister les bénéficiaires")
async def list_beneficiaires(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    statut: Optional[StatutBeneficiaire] = None,
    type_public: Optional[TypePublic] = None,
    niveau_dependance: Optional[NiveauDependance] = None,
    current_user: dict = Depends(require_permission("beneficiaires:read"))
):
    """Liste paginée des bénéficiaires avec filtres."""
    db = get_db()
    query = {}

    if statut:
        query["statut"] = statut.value
    if type_public:
        query["type_public"] = type_public.value
    if niveau_dependance:
        query["niveau_dependance"] = niveau_dependance.value
    if search:
        s = sanitize_string(search, 100)
        query["$or"] = [
            {"nom": {"$regex": s, "$options": "i"}},
            {"prenom": {"$regex": s, "$options": "i"}},
            {"numero_dossier": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
        ]

    total = await db.beneficiaires.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.beneficiaires.find(query).sort("nom", 1).skip(skip).limit(limit).to_list(length=limit)

    return {
        "items": [format_beneficiaire(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer un bénéficiaire")
async def create_beneficiaire(
    data: BeneficiaireCreate,
    current_user: dict = Depends(require_permission("beneficiaires:write"))
):
    """Créer une nouvelle fiche bénéficiaire."""
    db = get_db()
    numero_dossier = await get_next_dossier_number(db)

    doc = data.model_dump()
    doc["numero_dossier"] = numero_dossier
    doc["statut"] = StatutBeneficiaire.PROSPECT.value
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["created_by"] = current_user["id"]
    doc["historique"] = []

    # Chiffrer le numéro de sécurité sociale
    if doc.get("numero_secu"):
        doc["numero_secu"] = encrypt_sensitive(doc["numero_secu"])

    # Sérialiser les dates
    for k in ["date_naissance", "date_debut_contrat"]:
        if isinstance(doc.get(k), date):
            doc[k] = doc[k].isoformat()

    if doc.get("aide_apa"):
        for k in ["date_debut", "date_fin"]:
            if isinstance(doc["aide_apa"].get(k), date):
                doc["aide_apa"][k] = doc["aide_apa"][k].isoformat()

    if doc.get("aide_pch"):
        for k in ["date_debut", "date_fin"]:
            if isinstance(doc["aide_pch"].get(k), date):
                doc["aide_pch"][k] = doc["aide_pch"][k].isoformat()

    result = await db.beneficiaires.insert_one(doc)
    created = await db.beneficiaires.find_one({"_id": result.inserted_id})
    logger.info(f"Bénéficiaire créé: {numero_dossier} par {current_user['email']}")
    return format_beneficiaire(created)


@router.get("/{beneficiaire_id}", summary="Détail d'un bénéficiaire")
async def get_beneficiaire(
    beneficiaire_id: str,
    current_user: dict = Depends(require_permission("beneficiaires:read"))
):
    """Récupérer la fiche complète d'un bénéficiaire."""
    db = get_db()
    try:
        doc = await db.beneficiaires.find_one({"_id": ObjectId(beneficiaire_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    if not doc:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    return format_beneficiaire(doc)


@router.patch("/{beneficiaire_id}", summary="Modifier un bénéficiaire")
async def update_beneficiaire(
    beneficiaire_id: str,
    data: BeneficiaireUpdate,
    current_user: dict = Depends(require_permission("beneficiaires:write"))
):
    """Modifier la fiche d'un bénéficiaire."""
    db = get_db()
    try:
        obj_id = ObjectId(beneficiaire_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    existing = await db.beneficiaires.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à modifier")

    # Sérialiser les dates
    for k in ["date_naissance", "date_debut_contrat"]:
        if isinstance(update_data.get(k), date):
            update_data[k] = update_data[k].isoformat()

    if update_data.get("aide_apa"):
        for k in ["date_debut", "date_fin"]:
            if isinstance(update_data["aide_apa"].get(k), date):
                update_data["aide_apa"][k] = update_data["aide_apa"][k].isoformat()

    if update_data.get("aide_pch"):
        for k in ["date_debut", "date_fin"]:
            if isinstance(update_data["aide_pch"].get(k), date):
                update_data["aide_pch"][k] = update_data["aide_pch"][k].isoformat()

    # Sauvegarder l'historique des modifications
    historique_entry = {
        "date": datetime.utcnow().isoformat(),
        "auteur": current_user["email"],
        "champs_modifies": list(update_data.keys()),
    }

    update_data["updated_at"] = datetime.utcnow()

    await db.beneficiaires.update_one(
        {"_id": obj_id},
        {
            "$set": update_data,
            "$push": {"historique": historique_entry},
        }
    )

    updated = await db.beneficiaires.find_one({"_id": obj_id})
    logger.info(f"Bénéficiaire {beneficiaire_id} modifié par {current_user['email']}")
    return format_beneficiaire(updated)


@router.delete("/{beneficiaire_id}", summary="Archiver un bénéficiaire")
async def delete_beneficiaire(
    beneficiaire_id: str,
    current_user: dict = Depends(require_permission("beneficiaires:write"))
):
    """Archiver (soft delete) un bénéficiaire."""
    db = get_db()
    try:
        obj_id = ObjectId(beneficiaire_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    result = await db.beneficiaires.update_one(
        {"_id": obj_id},
        {"$set": {
            "statut": StatutBeneficiaire.ARCHIVE.value,
            "updated_at": datetime.utcnow(),
            "archived_by": current_user["email"],
            "archived_at": datetime.utcnow(),
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    logger.info(f"Bénéficiaire {beneficiaire_id} archivé par {current_user['email']}")
    return {"message": "Bénéficiaire archivé avec succès"}


@router.get("/{beneficiaire_id}/historique", summary="Historique des modifications")
async def get_beneficiaire_historique(
    beneficiaire_id: str,
    current_user: dict = Depends(require_permission("beneficiaires:read"))
):
    """Récupérer l'historique des modifications d'un bénéficiaire."""
    db = get_db()
    try:
        obj_id = ObjectId(beneficiaire_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    doc = await db.beneficiaires.find_one({"_id": obj_id}, {"historique": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    historique = doc.get("historique", [])
    # Trier par date décroissante
    historique.sort(key=lambda x: x.get("date", ""), reverse=True)
    return {"historique": historique}


@router.get("/{beneficiaire_id}/interventions", summary="Interventions d'un bénéficiaire")
async def get_beneficiaire_interventions(
    beneficiaire_id: str,
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_permission("beneficiaires:read"))
):
    """Récupérer les interventions d'un bénéficiaire."""
    db = get_db()
    interventions = await db.planning.find(
        {"beneficiaire_id": beneficiaire_id}
    ).sort("date_debut", -1).limit(limit).to_list(length=limit)
    return [serialize_doc(i) for i in interventions]
