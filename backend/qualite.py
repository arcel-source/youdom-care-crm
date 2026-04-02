"""Module qualité et incidents — Youdom Care CRM."""
import logging
from datetime import datetime, date
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status

from database import get_db
from auth import require_permission
from models import (
    TicketQualiteCreate, TicketQualiteUpdate,
    TypeTicket, PrioriteTicket, StatutTicket
)
from utils import serialize_doc, generate_numero_dossier

logger = logging.getLogger(__name__)
router = APIRouter()


# Transitions d'état autorisées
TICKET_TRANSITIONS = {
    "ouvert": ["en_cours", "en_attente", "ferme"],
    "en_cours": ["en_attente", "resolu", "ferme"],
    "en_attente": ["en_cours", "ferme"],
    "resolu": ["ferme", "en_cours"],
    "ferme": [],
}


def can_transition_ticket(current: str, new: str) -> bool:
    return new in TICKET_TRANSITIONS.get(current, [])


def format_ticket(doc: dict) -> dict:
    return serialize_doc(doc) if doc else None


async def get_next_ticket_number(db) -> str:
    result = await db.counters.find_one_and_update(
        {"_id": "tickets_qualite"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return generate_numero_dossier("YC-QUA", result.get("seq", 1))


async def enrichir_ticket(doc: dict, db) -> dict:
    result = serialize_doc(doc)
    if result.get("beneficiaire_id"):
        try:
            ben = await db.beneficiaires.find_one({"_id": ObjectId(result["beneficiaire_id"])})
            if ben:
                result["beneficiaire_nom"] = f"{ben.get('prenom', '')} {ben.get('nom', '')}".strip()
        except Exception:
            pass
    return result


# ============================================================
# CRUD Tickets Qualité
# ============================================================

@router.get("", summary="Lister les tickets qualité")
async def list_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    statut: Optional[StatutTicket] = None,
    type_ticket: Optional[TypeTicket] = None,
    priorite: Optional[PrioriteTicket] = None,
    beneficiaire_id: Optional[str] = None,
    current_user: dict = Depends(require_permission("qualite:read"))
):
    """Liste paginée des tickets qualité."""
    db = get_db()
    query = {}
    if statut:
        query["statut"] = statut.value
    if type_ticket:
        query["type_ticket"] = type_ticket.value
    if priorite:
        query["priorite"] = priorite.value
    if beneficiaire_id:
        query["beneficiaire_id"] = beneficiaire_id

    total = await db.tickets_qualite.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.tickets_qualite.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    items = []
    for d in docs:
        items.append(await enrichir_ticket(d, db))

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("", summary="Créer un ticket qualité", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    data: TicketQualiteCreate,
    current_user: dict = Depends(require_permission("qualite:write"))
):
    """Créer un nouveau ticket qualité."""
    db = get_db()

    if data.beneficiaire_id:
        try:
            ben = await db.beneficiaires.find_one({"_id": ObjectId(data.beneficiaire_id)})
        except Exception:
            raise HTTPException(status_code=400, detail="ID bénéficiaire invalide")
        if not ben:
            raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    numero = await get_next_ticket_number(db)
    now = datetime.utcnow()

    doc = {
        "numero": numero,
        "type_ticket": data.type_ticket.value,
        "titre": data.titre,
        "description": data.description,
        "beneficiaire_id": data.beneficiaire_id,
        "intervenant_id": data.intervenant_id,
        "priorite": data.priorite.value,
        "statut": StatutTicket.OUVERT.value,
        "responsable_id": data.responsable_id,
        "date_limite": datetime.combine(data.date_limite, datetime.min.time()) if data.date_limite else None,
        "resolution": None,
        "commentaires": [],
        "historique": [
            {
                "statut": StatutTicket.OUVERT.value,
                "auteur_id": current_user["id"],
                "auteur_nom": f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip(),
                "date": now,
                "note": "Ticket créé",
            }
        ],
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
        "closed_at": None,
    }

    result = await db.tickets_qualite.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await enrichir_ticket(doc, db)


@router.get("/stats", summary="Statistiques qualité")
async def stats_qualite(
    current_user: dict = Depends(require_permission("qualite:read"))
):
    """Statistiques globales qualité: par type, par statut, délai moyen de résolution."""
    db = get_db()

    par_statut = await db.tickets_qualite.aggregate([
        {"$group": {"_id": "$statut", "count": {"$sum": 1}}}
    ]).to_list(length=20)

    par_type = await db.tickets_qualite.aggregate([
        {"$group": {"_id": "$type_ticket", "count": {"$sum": 1}}}
    ]).to_list(length=20)

    par_priorite = await db.tickets_qualite.aggregate([
        {"$group": {"_id": "$priorite", "count": {"$sum": 1}}}
    ]).to_list(length=10)

    # Délai moyen de résolution en jours
    pipeline_delai = [
        {"$match": {"closed_at": {"$ne": None}}},
        {"$project": {
            "delai_jours": {
                "$divide": [
                    {"$subtract": ["$closed_at", "$created_at"]},
                    86400000  # ms en jours
                ]
            }
        }},
        {"$group": {"_id": None, "delai_moyen": {"$avg": "$delai_jours"}}}
    ]
    delai_res = await db.tickets_qualite.aggregate(pipeline_delai).to_list(length=1)
    delai_moyen = round(delai_res[0]["delai_moyen"], 1) if delai_res else None

    # Tickets urgents ouverts
    urgents_ouverts = await db.tickets_qualite.count_documents({
        "priorite": PrioriteTicket.URGENTE.value,
        "statut": {"$nin": [StatutTicket.FERME.value, StatutTicket.RESOLU.value]}
    })

    return {
        "par_statut": {r["_id"]: r["count"] for r in par_statut},
        "par_type": {r["_id"]: r["count"] for r in par_type},
        "par_priorite": {r["_id"]: r["count"] for r in par_priorite},
        "delai_moyen_resolution_jours": delai_moyen,
        "urgents_ouverts": urgents_ouverts,
    }


@router.get("/{ticket_id}", summary="Détail d'un ticket")
async def get_ticket(
    ticket_id: str,
    current_user: dict = Depends(require_permission("qualite:read"))
):
    db = get_db()
    try:
        oid = ObjectId(ticket_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID ticket invalide")

    doc = await db.tickets_qualite.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    return await enrichir_ticket(doc, db)


@router.patch("/{ticket_id}", summary="Modifier un ticket")
async def update_ticket(
    ticket_id: str,
    data: TicketQualiteUpdate,
    current_user: dict = Depends(require_permission("qualite:write"))
):
    """Mettre à jour un ticket, avec gestion du workflow de statut."""
    db = get_db()
    try:
        oid = ObjectId(ticket_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID ticket invalide")

    doc = await db.tickets_qualite.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")

    update = {"updated_at": datetime.utcnow()}
    historique_entry = None

    if data.titre is not None:
        update["titre"] = data.titre
    if data.description is not None:
        update["description"] = data.description
    if data.priorite is not None:
        update["priorite"] = data.priorite.value
    if data.responsable_id is not None:
        update["responsable_id"] = data.responsable_id
    if data.date_limite is not None:
        update["date_limite"] = datetime.combine(data.date_limite, datetime.min.time())
    if data.resolution is not None:
        update["resolution"] = data.resolution

    if data.statut is not None:
        current_statut = doc.get("statut", "ouvert")
        new_statut = data.statut.value
        if current_statut != new_statut:
            if not can_transition_ticket(current_statut, new_statut):
                raise HTTPException(
                    status_code=409,
                    detail=f"Transition '{current_statut}' → '{new_statut}' non autorisée"
                )
            update["statut"] = new_statut
            if new_statut in [StatutTicket.FERME.value, StatutTicket.RESOLU.value]:
                update["closed_at"] = datetime.utcnow()
            historique_entry = {
                "statut": new_statut,
                "auteur_id": current_user["id"],
                "auteur_nom": f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip(),
                "date": datetime.utcnow(),
                "note": data.resolution or f"Statut changé en {new_statut}",
            }

    await db.tickets_qualite.update_one({"_id": oid}, {"$set": update})
    if historique_entry:
        await db.tickets_qualite.update_one(
            {"_id": oid},
            {"$push": {"historique": historique_entry}}
        )

    doc = await db.tickets_qualite.find_one({"_id": oid})
    return await enrichir_ticket(doc, db)


@router.post("/{ticket_id}/commentaires", summary="Ajouter un commentaire")
async def add_commentaire(
    ticket_id: str,
    contenu: str,
    current_user: dict = Depends(require_permission("qualite:write"))
):
    """Ajouter un commentaire à un ticket."""
    db = get_db()
    try:
        oid = ObjectId(ticket_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID ticket invalide")

    doc = await db.tickets_qualite.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")

    if not contenu or len(contenu.strip()) < 1:
        raise HTTPException(status_code=400, detail="Le commentaire ne peut pas être vide")
    if len(contenu) > 2000:
        raise HTTPException(status_code=400, detail="Commentaire trop long (max 2000 caractères)")

    commentaire = {
        "auteur_id": current_user["id"],
        "auteur_nom": f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip(),
        "contenu": contenu.strip(),
        "created_at": datetime.utcnow(),
    }

    await db.tickets_qualite.update_one(
        {"_id": oid},
        {"$push": {"commentaires": commentaire}, "$set": {"updated_at": datetime.utcnow()}}
    )
    return {"message": "Commentaire ajouté", "commentaire": serialize_doc(commentaire)}


# ============================================================
# Enquêtes satisfaction
# ============================================================

@router.post("/enquetes", summary="Créer une enquête satisfaction", status_code=status.HTTP_201_CREATED)
async def create_enquete(
    titre: str,
    questions: List[str],
    beneficiaire_ids: Optional[List[str]] = None,
    current_user: dict = Depends(require_permission("qualite:write"))
):
    """Créer une enquête de satisfaction."""
    db = get_db()
    if not questions:
        raise HTTPException(status_code=400, detail="L'enquête doit contenir au moins une question")
    if len(questions) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 questions par enquête")

    now = datetime.utcnow()
    doc = {
        "titre": titre[:200],
        "questions": [q[:500] for q in questions],
        "beneficiaire_ids": beneficiaire_ids or [],
        "statut": "brouillon",
        "reponses": [],
        "score_moyen": None,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.enquetes_satisfaction.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/enquetes", summary="Lister les enquêtes")
async def list_enquetes(
    current_user: dict = Depends(require_permission("qualite:read"))
):
    """Lister toutes les enquêtes de satisfaction."""
    db = get_db()
    docs = await db.enquetes_satisfaction.find({}).sort("created_at", -1).to_list(length=100)
    return [serialize_doc(d) for d in docs]


@router.post("/enquetes/{enquete_id}/repondre", summary="Soumettre une réponse")
async def repondre_enquete(
    enquete_id: str,
    beneficiaire_id: str,
    reponses: List[int],  # scores 1-5 par question
    commentaire: Optional[str] = None,
    current_user: dict = Depends(require_permission("qualite:read"))
):
    """Enregistrer les réponses à une enquête de satisfaction."""
    db = get_db()
    try:
        oid = ObjectId(enquete_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID enquête invalide")

    enquete = await db.enquetes_satisfaction.find_one({"_id": oid})
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquête non trouvée")

    nb_questions = len(enquete.get("questions", []))
    if len(reponses) != nb_questions:
        raise HTTPException(
            status_code=400,
            detail=f"Nombre de réponses incorrect: {nb_questions} questions attendues"
        )
    for r in reponses:
        if r not in range(1, 6):
            raise HTTPException(status_code=400, detail="Les scores doivent être entre 1 et 5")

    score = round(sum(reponses) / len(reponses), 2)
    reponse_doc = {
        "beneficiaire_id": beneficiaire_id,
        "reponses": reponses,
        "score": score,
        "commentaire": commentaire,
        "submitted_at": datetime.utcnow(),
    }

    await db.enquetes_satisfaction.update_one(
        {"_id": oid},
        {"$push": {"reponses": reponse_doc}}
    )

    # Recalculer le score moyen
    enquete_updated = await db.enquetes_satisfaction.find_one({"_id": oid})
    toutes_reponses = enquete_updated.get("reponses", [])
    score_moyen = round(sum(r["score"] for r in toutes_reponses) / len(toutes_reponses), 2) if toutes_reponses else None
    await db.enquetes_satisfaction.update_one(
        {"_id": oid},
        {"$set": {"score_moyen": score_moyen, "updated_at": datetime.utcnow()}}
    )

    return {"message": "Réponse enregistrée", "score": score, "score_moyen_enquete": score_moyen}


@router.get("/enquetes/{enquete_id}/resultats", summary="Résultats d'une enquête")
async def resultats_enquete(
    enquete_id: str,
    current_user: dict = Depends(require_permission("qualite:read"))
):
    """Obtenir les résultats et le scoring d'une enquête."""
    db = get_db()
    try:
        oid = ObjectId(enquete_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID enquête invalide")

    enquete = await db.enquetes_satisfaction.find_one({"_id": oid})
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquête non trouvée")

    reponses = enquete.get("reponses", [])
    nb_reponses = len(reponses)

    scores_par_question = []
    nb_questions = len(enquete.get("questions", []))
    for i, question in enumerate(enquete.get("questions", [])):
        scores_q = [r["reponses"][i] for r in reponses if i < len(r.get("reponses", []))]
        scores_par_question.append({
            "question": question,
            "score_moyen": round(sum(scores_q) / len(scores_q), 2) if scores_q else None,
            "nb_reponses": len(scores_q),
            "distribution": {str(s): scores_q.count(s) for s in range(1, 6)},
        })

    result = serialize_doc(enquete)
    result["resultats"] = {
        "nb_reponses": nb_reponses,
        "score_moyen_global": enquete.get("score_moyen"),
        "scores_par_question": scores_par_question,
    }
    return result
