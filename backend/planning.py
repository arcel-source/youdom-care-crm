"""Module planning — Youdom Care CRM."""
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status

from database import get_db
from auth import require_permission
from models import InterventionCreate, InterventionUpdate, TypeRecurrence, JourSemaine
from utils import serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter()


def format_intervention(doc: dict) -> dict:
    if not doc:
        return None
    result = serialize_doc(doc)
    if "date_debut" in result and "date_fin" in result:
        try:
            d1 = datetime.fromisoformat(result["date_debut"])
            d2 = datetime.fromisoformat(result["date_fin"])
            result["duree_minutes"] = int((d2 - d1).total_seconds() / 60)
        except Exception:
            result["duree_minutes"] = 0
    return result


async def check_conflicts(
    db, intervenant_id: str, date_debut: datetime, date_fin: datetime,
    exclude_id: str = None
) -> List[dict]:
    """Vérifier les conflits horaires pour un intervenant."""
    query = {
        "intervenant_id": intervenant_id,
        "statut": {"$ne": "annule"},
        "$or": [
            {"date_debut": {"$lt": date_fin, "$gte": date_debut}},
            {"date_fin": {"$gt": date_debut, "$lte": date_fin}},
            {"date_debut": {"$lte": date_debut}, "date_fin": {"$gte": date_fin}},
        ]
    }
    if exclude_id:
        query["_id"] = {"$ne": ObjectId(exclude_id)}

    conflicts = await db.planning.find(query).to_list(length=10)
    return [serialize_doc(c) for c in conflicts]


def get_recurrence_dates(
    date_debut: datetime,
    date_fin: datetime,
    recurrence: TypeRecurrence,
    jours_recurrence: Optional[List[JourSemaine]],
    date_fin_recurrence: Optional[datetime],
    max_occurrences: int = 52
) -> List[tuple]:
    """Générer les occurrences d'une récurrence."""
    dates = [(date_debut, date_fin)]

    if recurrence == TypeRecurrence.AUCUNE or not date_fin_recurrence:
        return dates

    duree = date_fin - date_debut
    current_debut = date_debut

    if recurrence == TypeRecurrence.QUOTIDIENNE:
        delta = timedelta(days=1)
    elif recurrence == TypeRecurrence.HEBDOMADAIRE:
        delta = timedelta(weeks=1)
    elif recurrence == TypeRecurrence.MENSUELLE:
        delta = timedelta(days=30)  # Approximation
    else:
        return dates

    count = 0
    while count < max_occurrences:
        current_debut += delta
        if current_debut.date() > date_fin_recurrence:
            break

        if recurrence == TypeRecurrence.HEBDOMADAIRE and jours_recurrence:
            # Vérifier si le jour correspond
            day_names = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
            current_day = day_names[current_debut.weekday()]
            jour_values = [j.value if hasattr(j, 'value') else j for j in jours_recurrence]
            if current_day not in jour_values:
                count += 1
                continue

        dates.append((current_debut, current_debut + duree))
        count += 1

    return dates


@router.get("", summary="Lister les interventions planifiées")
async def list_interventions(
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    beneficiaire_id: Optional[str] = None,
    intervenant_id: Optional[str] = None,
    statut: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_permission("planning:read"))
):
    """Lister les interventions avec filtres de dates."""
    db = get_db()
    query = {}

    if beneficiaire_id:
        query["beneficiaire_id"] = beneficiaire_id
    if intervenant_id:
        query["intervenant_id"] = intervenant_id
    if statut:
        query["statut"] = statut

    if date_debut:
        try:
            d = datetime.fromisoformat(date_debut)
            query.setdefault("date_debut", {})["$gte"] = d
        except ValueError:
            raise HTTPException(status_code=400, detail="Format date_debut invalide (ISO 8601)")

    if date_fin:
        try:
            d = datetime.fromisoformat(date_fin)
            query.setdefault("date_debut", {})["$lte"] = d
        except ValueError:
            raise HTTPException(status_code=400, detail="Format date_fin invalide (ISO 8601)")

    total = await db.planning.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.planning.find(query).sort("date_debut", 1).skip(skip).limit(limit).to_list(length=limit)

    # Enrichir avec les noms
    items = []
    for doc in docs:
        item = format_intervention(doc)
        try:
            ben = await db.beneficiaires.find_one(
                {"_id": ObjectId(doc["beneficiaire_id"])},
                {"nom": 1, "prenom": 1}
            )
            if ben:
                item["beneficiaire_nom"] = f"{ben.get('prenom', '')} {ben.get('nom', '')}"
        except Exception:
            pass
        try:
            interv = await db.intervenants.find_one(
                {"_id": ObjectId(doc["intervenant_id"])},
                {"nom": 1, "prenom": 1}
            )
            if interv:
                item["intervenant_nom"] = f"{interv.get('prenom', '')} {interv.get('nom', '')}"
        except Exception:
            pass
        try:
            svc = await db.services.find_one(
                {"_id": ObjectId(doc["service_id"])},
                {"nom": 1}
            )
            if svc:
                item["service_nom"] = svc.get("nom", "")
        except Exception:
            pass
        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer une intervention")
async def create_intervention(
    data: InterventionCreate,
    current_user: dict = Depends(require_permission("planning:write"))
):
    """Planifier une intervention (avec gestion des récurrences)."""
    db = get_db()

    # Vérifier existence bénéficiaire, intervenant, service
    for entity, collection, label in [
        (data.beneficiaire_id, "beneficiaires", "Bénéficiaire"),
        (data.intervenant_id, "intervenants", "Intervenant"),
        (data.service_id, "services", "Service"),
    ]:
        try:
            obj = await db[collection].find_one({"_id": ObjectId(entity)})
        except Exception:
            raise HTTPException(status_code=400, detail=f"ID {label} invalide")
        if not obj:
            raise HTTPException(status_code=404, detail=f"{label} non trouvé")

    # Vérifier les conflits pour la première occurrence
    conflicts = await check_conflicts(
        db, data.intervenant_id, data.date_debut, data.date_fin
    )
    if conflicts:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Conflit horaire détecté pour cet intervenant",
                "conflicts": conflicts[:3],
            }
        )

    # Générer les occurrences
    date_fin_rec = None
    if data.date_fin_recurrence:
        date_fin_rec = datetime.combine(data.date_fin_recurrence, datetime.min.time())

    occurrences = get_recurrence_dates(
        data.date_debut, data.date_fin,
        data.recurrence, data.jours_recurrence,
        date_fin_rec
    )

    # Créer toutes les occurrences
    docs = []
    recurrence_group_id = str(ObjectId()) if len(occurrences) > 1 else None

    for debut, fin in occurrences:
        doc = {
            "beneficiaire_id": data.beneficiaire_id,
            "intervenant_id": data.intervenant_id,
            "service_id": data.service_id,
            "date_debut": debut,
            "date_fin": fin,
            "statut": "planifie",
            "recurrence": data.recurrence.value,
            "jours_recurrence": [j.value for j in (data.jours_recurrence or [])],
            "recurrence_group_id": recurrence_group_id,
            "notes": data.notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user["id"],
        }
        docs.append(doc)

    if len(docs) == 1:
        result = await db.planning.insert_one(docs[0])
        created = await db.planning.find_one({"_id": result.inserted_id})
        logger.info(f"Intervention planifiée par {current_user['email']}")
        return format_intervention(created)
    else:
        result = await db.planning.insert_many(docs)
        logger.info(f"{len(docs)} interventions récurrentes créées par {current_user['email']}")
        return {
            "message": f"{len(docs)} interventions créées",
            "recurrence_group_id": recurrence_group_id,
            "count": len(docs),
        }


@router.get("/{intervention_id}", summary="Détail d'une intervention")
async def get_intervention(
    intervention_id: str,
    current_user: dict = Depends(require_permission("planning:read"))
):
    """Récupérer les détails d'une intervention."""
    db = get_db()
    try:
        doc = await db.planning.find_one({"_id": ObjectId(intervention_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    if not doc:
        raise HTTPException(status_code=404, detail="Intervention non trouvée")

    item = format_intervention(doc)

    # Enrichir avec les noms
    for entity_id, collection, field in [
        (doc.get("beneficiaire_id"), "beneficiaires", "beneficiaire_nom"),
        (doc.get("intervenant_id"), "intervenants", "intervenant_nom"),
    ]:
        if entity_id:
            try:
                obj = await db[collection].find_one({"_id": ObjectId(entity_id)}, {"nom": 1, "prenom": 1})
                if obj:
                    item[field] = f"{obj.get('prenom', '')} {obj.get('nom', '')}"
            except Exception:
                pass

    return item


@router.patch("/{intervention_id}", summary="Modifier une intervention")
async def update_intervention(
    intervention_id: str,
    data: InterventionUpdate,
    current_user: dict = Depends(require_permission("planning:write"))
):
    """Modifier une intervention planifiée."""
    db = get_db()
    try:
        obj_id = ObjectId(intervention_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    existing = await db.planning.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Intervention non trouvée")

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}

    # Vérifier conflits si changement d'horaire
    if "date_debut" in update_data or "date_fin" in update_data:
        new_debut = update_data.get("date_debut", existing["date_debut"])
        new_fin = update_data.get("date_fin", existing["date_fin"])
        intervenant_id = update_data.get("intervenant_id", existing["intervenant_id"])

        conflicts = await check_conflicts(
            db, intervenant_id, new_debut, new_fin, exclude_id=intervention_id
        )
        if conflicts:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Conflit horaire détecté",
                    "conflicts": conflicts[:3],
                }
            )

    update_data["updated_at"] = datetime.utcnow()
    await db.planning.update_one({"_id": obj_id}, {"$set": update_data})

    updated = await db.planning.find_one({"_id": obj_id})
    return format_intervention(updated)


@router.delete("/{intervention_id}", summary="Annuler une intervention")
async def cancel_intervention(
    intervention_id: str,
    motif: Optional[str] = Query(None, max_length=500),
    current_user: dict = Depends(require_permission("planning:write"))
):
    """Annuler une intervention planifiée."""
    db = get_db()
    try:
        obj_id = ObjectId(intervention_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    result = await db.planning.update_one(
        {"_id": obj_id},
        {"$set": {
            "statut": "annule",
            "motif_annulation": motif,
            "annule_par": current_user["email"],
            "annule_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Intervention non trouvée")

    return {"message": "Intervention annulée avec succès"}


@router.post("/{intervention_id}/realiser", summary="Marquer une intervention comme réalisée")
async def marquer_realise(
    intervention_id: str,
    realisation_data: dict,
    current_user: dict = Depends(require_permission("planning:write"))
):
    """Marquer une intervention comme réalisée avec notes."""
    db = get_db()
    try:
        obj_id = ObjectId(intervention_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    update = {
        "statut": "realise",
        "notes_realisation": realisation_data.get("notes", ""),
        "date_realisation": datetime.utcnow(),
        "realise_par": current_user["email"],
        "updated_at": datetime.utcnow(),
    }

    if "duree_reelle_minutes" in realisation_data:
        update["duree_reelle_minutes"] = realisation_data["duree_reelle_minutes"]

    result = await db.planning.update_one({"_id": obj_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Intervention non trouvée")

    return {"message": "Intervention marquée comme réalisée"}


@router.get("/check-conflicts", summary="Vérifier les conflits")
async def check_planning_conflicts(
    intervenant_id: str,
    date_debut: str,
    date_fin: str,
    exclude_id: Optional[str] = None,
    current_user: dict = Depends(require_permission("planning:read"))
):
    """Vérifier les conflits horaires avant planification."""
    db = get_db()
    try:
        d1 = datetime.fromisoformat(date_debut)
        d2 = datetime.fromisoformat(date_fin)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format de date invalide")

    conflicts = await check_conflicts(db, intervenant_id, d1, d2, exclude_id)
    return {
        "has_conflicts": len(conflicts) > 0,
        "conflicts": conflicts,
    }
