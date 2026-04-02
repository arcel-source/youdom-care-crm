"""Module leads — parcours client Youdom Care CRM."""
import logging
from datetime import datetime
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status, Request

from database import get_db
from auth import require_permission
from models import (
    LeadCreate, LeadUpdate, LeadResponse, StatutLead, SourceLead, TypePublic
)
from utils import (
    serialize_doc, sanitize_string, calculate_lead_score,
    can_transition_lead, generate_numero_dossier
)

logger = logging.getLogger(__name__)
router = APIRouter()


def format_lead(doc: dict) -> dict:
    return serialize_doc(doc) if doc else None


async def get_next_lead_number(db) -> str:
    result = await db.counters.find_one_and_update(
        {"_id": "leads"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return generate_numero_dossier("YC-LEAD", result.get("seq", 1))


@router.get("", summary="Lister les leads")
async def list_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    statut: Optional[StatutLead] = None,
    source: Optional[SourceLead] = None,
    type_public: Optional[TypePublic] = None,
    score_min: Optional[int] = Query(None, ge=0, le=100),
    current_user: dict = Depends(require_permission("leads:read"))
):
    """Liste paginée des leads avec filtres."""
    db = get_db()
    query = {}

    if statut:
        query["statut"] = statut.value
    if source:
        query["source"] = source.value
    if type_public:
        query["type_public"] = type_public.value
    if score_min is not None:
        query["score"] = {"$gte": score_min}
    if search:
        s = sanitize_string(search, 100)
        query["$or"] = [
            {"nom": {"$regex": s, "$options": "i"}},
            {"prenom": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
            {"telephone": {"$regex": s, "$options": "i"}},
        ]

    total = await db.leads.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.leads.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    return {
        "items": [format_lead(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.get("/kanban", summary="Vue Kanban des leads")
async def get_kanban(
    current_user: dict = Depends(require_permission("leads:read"))
):
    """Vue Kanban: leads groupés par statut."""
    db = get_db()
    kanban = {}

    for statut in StatutLead:
        leads = await db.leads.find(
            {"statut": statut.value}
        ).sort("score", -1).to_list(length=50)
        kanban[statut.value] = [format_lead(l) for l in leads]

    # Compter par statut
    counts = {}
    for statut in StatutLead:
        counts[statut.value] = len(kanban[statut.value])

    return {"kanban": kanban, "counts": counts}


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer un lead")
async def create_lead(
    data: LeadCreate,
    current_user: dict = Depends(require_permission("leads:write"))
):
    """Créer un nouveau lead."""
    db = get_db()
    numero = await get_next_lead_number(db)

    doc = data.model_dump()
    doc["numero"] = numero
    doc["statut"] = StatutLead.NOUVEAU.value
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["created_by"] = current_user["id"]
    doc["historique_statuts"] = [{
        "statut": StatutLead.NOUVEAU.value,
        "date": datetime.utcnow().isoformat(),
        "auteur": current_user["email"],
    }]

    # Calculer le score initial
    doc["score"] = calculate_lead_score(doc)

    result = await db.leads.insert_one(doc)
    created = await db.leads.find_one({"_id": result.inserted_id})

    # Notification nouveau lead
    try:
        from notifications import create_internal_notification
        from models import TypeNotification
        await create_internal_notification(
            db=db,
            type_notification=TypeNotification.NOUVEAU_LEAD,
            titre=f"Nouveau lead — {data.prenom} {data.nom}",
            message=f"Source: {data.source.value} | Tél: {data.telephone}",
            roles_cibles=["admin", "direction", "coordination"],
            lien=f"/leads/{str(result.inserted_id)}",
        )
    except Exception as e:
        logger.warning(f"Erreur notification nouveau lead: {e}")

    logger.info(f"Lead créé: {numero} par {current_user['email']}")
    return format_lead(created)


@router.post("/public", status_code=status.HTTP_201_CREATED, summary="Formulaire public de demande")
async def create_lead_public(request: Request, data: LeadCreate):
    """Endpoint public: créer un lead depuis le formulaire site web."""
    db = get_db()
    numero = await get_next_lead_number(db)

    doc = data.model_dump()
    doc["numero"] = numero
    doc["statut"] = StatutLead.NOUVEAU.value
    doc["source"] = SourceLead.SITE_WEB.value
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["created_by"] = "public_form"
    doc["ip_origine"] = request.client.host if request.client else None
    doc["historique_statuts"] = [{
        "statut": StatutLead.NOUVEAU.value,
        "date": datetime.utcnow().isoformat(),
        "auteur": "formulaire_web",
    }]
    doc["score"] = calculate_lead_score(doc)

    result = await db.leads.insert_one(doc)

    # Notification
    try:
        from notifications import create_internal_notification
        from models import TypeNotification
        await create_internal_notification(
            db=db,
            type_notification=TypeNotification.NOUVEAU_LEAD,
            titre=f"🌐 Nouveau lead web — {data.prenom} {data.nom}",
            message=f"Demande reçue via le formulaire web | Tél: {data.telephone}",
            roles_cibles=["admin", "direction", "coordination"],
            lien=f"/leads/{str(result.inserted_id)}",
        )
    except Exception as e:
        logger.warning(f"Erreur notification lead public: {e}")

    logger.info(f"Lead public créé: {numero}")
    return {
        "message": "Votre demande a bien été reçue. Notre équipe vous contactera rapidement.",
        "reference": numero,
    }


@router.get("/{lead_id}", summary="Détail d'un lead")
async def get_lead(
    lead_id: str,
    current_user: dict = Depends(require_permission("leads:read"))
):
    """Récupérer les détails d'un lead."""
    db = get_db()
    try:
        doc = await db.leads.find_one({"_id": ObjectId(lead_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    if not doc:
        raise HTTPException(status_code=404, detail="Lead non trouvé")

    lead = format_lead(doc)

    # Enrichir avec le prescripteur si présent
    if doc.get("prescripteur_id"):
        try:
            prescripteur = await db.prescripteurs.find_one(
                {"_id": ObjectId(doc["prescripteur_id"])},
                {"nom": 1, "prenom": 1, "organisation": 1}
            )
            if prescripteur:
                lead["prescripteur"] = serialize_doc(prescripteur)
        except Exception:
            pass

    return lead


@router.patch("/{lead_id}", summary="Modifier un lead")
async def update_lead(
    lead_id: str,
    data: LeadUpdate,
    current_user: dict = Depends(require_permission("leads:write"))
):
    """Modifier un lead et gérer les transitions d'état."""
    db = get_db()
    try:
        obj_id = ObjectId(lead_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    existing = await db.leads.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead non trouvé")

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}

    # Valider la transition de statut
    if "statut" in update_data:
        new_statut = update_data["statut"]
        current_statut = existing["statut"]
        if isinstance(new_statut, StatutLead):
            new_statut = new_statut.value
        if not can_transition_lead(current_statut, new_statut):
            raise HTTPException(
                status_code=400,
                detail=f"Transition '{current_statut}' → '{new_statut}' non autorisée"
            )
        update_data["statut"] = new_statut

        # Enregistrer l'historique de transition
        historique_entry = {
            "statut": new_statut,
            "date": datetime.utcnow().isoformat(),
            "auteur": current_user["email"],
            "notes": update_data.get("notes", ""),
        }

        await db.leads.update_one(
            {"_id": obj_id},
            {"$push": {"historique_statuts": historique_entry}}
        )

        # Si lead accepté → convertir en bénéficiaire potentiel
        if new_statut == StatutLead.ACCEPTE.value:
            logger.info(f"Lead {lead_id} accepté — prêt pour conversion en bénéficiaire")

        # Notification lead chaud
        if new_statut in ["qualification", "visite_domicile"] and existing.get("score", 0) >= 60:
            try:
                from notifications import create_internal_notification
                from models import TypeNotification
                await create_internal_notification(
                    db=db,
                    type_notification=TypeNotification.LEAD_CHAUD,
                    titre=f"🔥 Lead chaud — {existing['prenom']} {existing['nom']}",
                    message=f"Score: {existing.get('score', 0)}/100 | Statut: {new_statut}",
                    roles_cibles=["admin", "direction", "coordination"],
                    lien=f"/leads/{lead_id}",
                )
            except Exception as e:
                logger.warning(f"Erreur notification lead chaud: {e}")

    # Recalculer le score si données pertinentes modifiées
    merged = {**serialize_doc(existing), **update_data}
    update_data["score"] = calculate_lead_score(merged)
    update_data["updated_at"] = datetime.utcnow()

    # Sérialiser plan_aide si présent
    if "plan_aide" in update_data and hasattr(update_data["plan_aide"], "model_dump"):
        update_data["plan_aide"] = update_data["plan_aide"].model_dump()

    if "checklist_visite" in update_data and hasattr(update_data["checklist_visite"], "model_dump"):
        update_data["checklist_visite"] = update_data["checklist_visite"].model_dump()

    await db.leads.update_one({"_id": obj_id}, {"$set": update_data})

    updated = await db.leads.find_one({"_id": obj_id})
    logger.info(f"Lead {lead_id} modifié par {current_user['email']}")
    return format_lead(updated)


@router.post("/{lead_id}/convertir", summary="Convertir lead en bénéficiaire")
async def convert_lead_to_beneficiaire(
    lead_id: str,
    current_user: dict = Depends(require_permission("leads:write"))
):
    """Convertir un lead accepté en bénéficiaire."""
    db = get_db()
    try:
        obj_id = ObjectId(lead_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    lead = await db.leads.find_one({"_id": obj_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead non trouvé")

    if lead["statut"] not in [StatutLead.ACCEPTE.value, StatutLead.EN_COURS.value]:
        raise HTTPException(
            status_code=400,
            detail="Seuls les leads acceptés peuvent être convertis en bénéficiaire"
        )

    if lead.get("beneficiaire_id"):
        raise HTTPException(
            status_code=400,
            detail="Ce lead a déjà été converti en bénéficiaire"
        )

    # Créer la fiche bénéficiaire de base
    from utils import generate_numero_dossier
    result_counter = await db.counters.find_one_and_update(
        {"_id": "beneficiaires"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    numero_dossier = generate_numero_dossier("YC-BEN", result_counter.get("seq", 1))

    beneficiaire_doc = {
        "numero_dossier": numero_dossier,
        "civilite": "M",
        "nom": lead["nom"],
        "prenom": lead["prenom"],
        "email": lead.get("email"),
        "telephone_portable": lead.get("telephone"),
        "adresse": lead.get("adresse"),
        "type_public": lead.get("type_public", "autre"),
        "niveau_dependance": "non_evalue",
        "statut": "actif",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_user["id"],
        "lead_origine_id": lead_id,
        "historique": [{
            "date": datetime.utcnow().isoformat(),
            "auteur": current_user["email"],
            "champs_modifies": ["creation_depuis_lead"],
        }],
    }

    if lead.get("plan_aide"):
        beneficiaire_doc["volume_heures_semaine"] = lead["plan_aide"].get("volume_heures_semaine")

    result = await db.beneficiaires.insert_one(beneficiaire_doc)
    beneficiaire_id = str(result.inserted_id)

    # Mettre à jour le lead
    await db.leads.update_one(
        {"_id": obj_id},
        {"$set": {
            "beneficiaire_id": beneficiaire_id,
            "statut": StatutLead.EN_COURS.value,
            "updated_at": datetime.utcnow(),
        }}
    )

    logger.info(f"Lead {lead_id} converti en bénéficiaire {beneficiaire_id}")
    return {
        "message": "Lead converti en bénéficiaire avec succès",
        "beneficiaire_id": beneficiaire_id,
        "numero_dossier": numero_dossier,
    }


@router.delete("/{lead_id}", summary="Archiver un lead")
async def archive_lead(
    lead_id: str,
    current_user: dict = Depends(require_permission("leads:write"))
):
    """Archiver un lead."""
    db = get_db()
    try:
        obj_id = ObjectId(lead_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    result = await db.leads.update_one(
        {"_id": obj_id},
        {"$set": {
            "statut": StatutLead.ARCHIVE.value,
            "updated_at": datetime.utcnow(),
            "archived_by": current_user["email"],
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead non trouvé")

    return {"message": "Lead archivé avec succès"}
