"""Module services — catalogue de services Youdom Care CRM."""
import logging
from datetime import datetime
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status

from database import get_db
from auth import require_permission
from models import ServiceCreate, ServiceUpdate, TypeService
from utils import serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", summary="Lister les services")
async def list_services(
    type_service: Optional[TypeService] = None,
    actif: Optional[bool] = None,
    current_user: dict = Depends(require_permission("services:read"))
):
    """Lister tous les services du catalogue."""
    db = get_db()
    query = {}
    if type_service:
        query["type_service"] = type_service.value
    if actif is not None:
        query["actif"] = actif

    docs = await db.services.find(query).sort("nom", 1).to_list(length=100)
    return [serialize_doc(d) for d in docs]


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer un service")
async def create_service(
    data: ServiceCreate,
    current_user: dict = Depends(require_permission("services:write"))
):
    """Créer un nouveau service dans le catalogue."""
    db = get_db()
    doc = data.model_dump()
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["created_by"] = current_user["id"]

    result = await db.services.insert_one(doc)
    created = await db.services.find_one({"_id": result.inserted_id})
    logger.info(f"Service créé: {data.nom}")
    return serialize_doc(created)


@router.get("/{service_id}", summary="Détail d'un service")
async def get_service(
    service_id: str,
    current_user: dict = Depends(require_permission("services:read"))
):
    """Récupérer un service du catalogue."""
    db = get_db()
    try:
        doc = await db.services.find_one({"_id": ObjectId(service_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    if not doc:
        raise HTTPException(status_code=404, detail="Service non trouvé")

    return serialize_doc(doc)


@router.patch("/{service_id}", summary="Modifier un service")
async def update_service(
    service_id: str,
    data: ServiceUpdate,
    current_user: dict = Depends(require_permission("services:write"))
):
    """Modifier un service du catalogue."""
    db = get_db()
    try:
        obj_id = ObjectId(service_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à modifier")

    update_data["updated_at"] = datetime.utcnow()
    result = await db.services.update_one({"_id": obj_id}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service non trouvé")

    updated = await db.services.find_one({"_id": obj_id})
    return serialize_doc(updated)


@router.delete("/{service_id}", summary="Désactiver un service")
async def deactivate_service(
    service_id: str,
    current_user: dict = Depends(require_permission("services:write"))
):
    """Désactiver un service (soft delete)."""
    db = get_db()
    try:
        obj_id = ObjectId(service_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    result = await db.services.update_one(
        {"_id": obj_id},
        {"$set": {"actif": False, "updated_at": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service non trouvé")

    return {"message": "Service désactivé avec succès"}


async def seed_default_services(db):
    """Initialiser les services par défaut si la collection est vide."""
    count = await db.services.count_documents({})
    if count > 0:
        return

    services_defaut = [
        {
            "nom": "Aide à l'autonomie",
            "type_service": "autonomie",
            "description": "Aide au lever, coucher, toilette, habillage, repas",
            "tarif": {
                "tarif_horaire_jour": 22.50,
                "tarif_horaire_nuit": 28.00,
                "tarif_horaire_weekend": 25.00,
                "tarif_horaire_ferie": 30.00,
                "duree_minimum_minutes": 30,
            },
            "duree_standard_minutes": 60,
            "actif": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system",
        },
        {
            "nom": "Aide ménagère",
            "type_service": "menage",
            "description": "Entretien du logement, linge, repassage",
            "tarif": {
                "tarif_horaire_jour": 18.50,
                "tarif_horaire_nuit": None,
                "tarif_horaire_weekend": 21.00,
                "tarif_horaire_ferie": 25.00,
                "duree_minimum_minutes": 60,
            },
            "duree_standard_minutes": 120,
            "actif": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system",
        },
        {
            "nom": "Présence de nuit",
            "type_service": "nuit",
            "description": "Garde de nuit, surveillance, assistance nocturne",
            "tarif": {
                "tarif_horaire_jour": 18.00,
                "tarif_horaire_nuit": 26.00,
                "tarif_horaire_weekend": 30.00,
                "tarif_horaire_ferie": 35.00,
                "duree_minimum_minutes": 480,
            },
            "duree_standard_minutes": 480,
            "actif": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system",
        },
        {
            "nom": "Accompagnement",
            "type_service": "accompagnement",
            "description": "Courses, rendez-vous médicaux, sorties, loisirs",
            "tarif": {
                "tarif_horaire_jour": 20.00,
                "tarif_horaire_nuit": None,
                "tarif_horaire_weekend": 23.00,
                "tarif_horaire_ferie": 27.00,
                "duree_minimum_minutes": 60,
            },
            "duree_standard_minutes": 120,
            "actif": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system",
        },
        {
            "nom": "Garde d'enfant handicapé",
            "type_service": "garde_enfant_handicap",
            "description": "Garde spécialisée pour enfants en situation de handicap",
            "tarif": {
                "tarif_horaire_jour": 24.00,
                "tarif_horaire_nuit": 30.00,
                "tarif_horaire_weekend": 27.00,
                "tarif_horaire_ferie": 32.00,
                "duree_minimum_minutes": 60,
            },
            "duree_standard_minutes": 240,
            "actif": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system",
        },
    ]

    await db.services.insert_many(services_defaut)
    logger.info("Services par défaut initialisés")
