"""Module intervenants — Youdom Care CRM."""
import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status, BackgroundTasks

from database import get_db
from auth import require_permission
from models import (
    IntervenantCreate, IntervenantUpdate, IntervenantResponse, StatutIntervenant
)
from utils import serialize_doc, sanitize_string

logger = logging.getLogger(__name__)
router = APIRouter()


def format_intervenant(doc: dict) -> dict:
    """Formater un intervenant pour la réponse API."""
    return serialize_doc(doc) if doc else None


async def send_otp_email(email: str, nom: str, otp_code: str):
    """Envoyer l'OTP par email à l'intervenant (non bloquant)."""
    # Import ici pour éviter les imports circulaires
    try:
        from communications import send_email
        await send_email(
            to=email,
            subject="Votre code d'accès Youdom Care",
            body=f"""Bonjour {nom},

Voici votre code d'accès pour vous connecter au portail intervenant :

**{otp_code}**

Ce code est valable 10 minutes.

Si vous n'avez pas demandé ce code, ignorez cet email.

L'équipe Youdom Care"""
        )
    except Exception as e:
        logger.error(f"Erreur envoi OTP email: {e}")


@router.get("", summary="Lister les intervenants")
async def list_intervenants(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    statut: Optional[StatutIntervenant] = None,
    competence: Optional[str] = None,
    current_user: dict = Depends(require_permission("intervenants:read"))
):
    """Liste paginée des intervenants."""
    db = get_db()
    query = {}

    if statut:
        query["statut"] = statut.value
    if competence:
        query["competences"] = {"$in": [competence]}
    if search:
        s = sanitize_string(search, 100)
        query["$or"] = [
            {"nom": {"$regex": s, "$options": "i"}},
            {"prenom": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
        ]

    total = await db.intervenants.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.intervenants.find(query).sort("nom", 1).skip(skip).limit(limit).to_list(length=limit)

    return {
        "items": [format_intervenant(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer un intervenant")
async def create_intervenant(
    data: IntervenantCreate,
    current_user: dict = Depends(require_permission("intervenants:write"))
):
    """Créer une nouvelle fiche intervenant."""
    db = get_db()

    # Vérifier unicité email
    existing = await db.intervenants.find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Un intervenant avec cet email existe déjà"
        )

    doc = data.model_dump()
    doc["statut"] = StatutIntervenant.ACTIF.value
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["created_by"] = current_user["id"]
    doc["absences"] = []

    # Sérialiser les dates
    if isinstance(doc.get("date_naissance"), datetime):
        doc["date_naissance"] = doc["date_naissance"].isoformat()

    # Sérialiser les disponibilités
    if doc.get("disponibilites"):
        doc["disponibilites"] = [
            {**d, "jour": d["jour"].value if hasattr(d["jour"], "value") else d["jour"]}
            for d in doc["disponibilites"]
        ]

    result = await db.intervenants.insert_one(doc)
    created = await db.intervenants.find_one({"_id": result.inserted_id})
    logger.info(f"Intervenant créé: {data.email} par {current_user['email']}")
    return format_intervenant(created)


@router.get("/{intervenant_id}", summary="Détail d'un intervenant")
async def get_intervenant(
    intervenant_id: str,
    current_user: dict = Depends(require_permission("intervenants:read"))
):
    """Récupérer la fiche complète d'un intervenant."""
    db = get_db()
    try:
        doc = await db.intervenants.find_one({"_id": ObjectId(intervenant_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    if not doc:
        raise HTTPException(status_code=404, detail="Intervenant non trouvé")

    return format_intervenant(doc)


@router.patch("/{intervenant_id}", summary="Modifier un intervenant")
async def update_intervenant(
    intervenant_id: str,
    data: IntervenantUpdate,
    current_user: dict = Depends(require_permission("intervenants:write"))
):
    """Modifier la fiche d'un intervenant."""
    db = get_db()
    try:
        obj_id = ObjectId(intervenant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    existing = await db.intervenants.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Intervenant non trouvé")

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à modifier")

    if "disponibilites" in update_data and update_data["disponibilites"]:
        update_data["disponibilites"] = [
            {**d, "jour": d["jour"].value if hasattr(d["jour"], "value") else d["jour"]}
            for d in update_data["disponibilites"]
        ]

    update_data["updated_at"] = datetime.utcnow()
    await db.intervenants.update_one({"_id": obj_id}, {"$set": update_data})

    updated = await db.intervenants.find_one({"_id": obj_id})
    logger.info(f"Intervenant {intervenant_id} modifié par {current_user['email']}")
    return format_intervenant(updated)


@router.delete("/{intervenant_id}", summary="Désactiver un intervenant")
async def deactivate_intervenant(
    intervenant_id: str,
    current_user: dict = Depends(require_permission("intervenants:write"))
):
    """Désactiver (soft delete) un intervenant."""
    db = get_db()
    try:
        obj_id = ObjectId(intervenant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    result = await db.intervenants.update_one(
        {"_id": obj_id},
        {"$set": {
            "statut": StatutIntervenant.INACTIF.value,
            "updated_at": datetime.utcnow(),
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Intervenant non trouvé")

    logger.info(f"Intervenant {intervenant_id} désactivé par {current_user['email']}")
    return {"message": "Intervenant désactivé avec succès"}


@router.get("/{intervenant_id}/planning", summary="Planning d'un intervenant")
async def get_intervenant_planning(
    intervenant_id: str,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    current_user: dict = Depends(require_permission("planning:read"))
):
    """Récupérer le planning d'un intervenant."""
    db = get_db()
    query = {"intervenant_id": intervenant_id}

    if date_debut:
        query["date_debut"] = {"$gte": datetime.fromisoformat(date_debut)}
    if date_fin:
        query.setdefault("date_debut", {})["$lte"] = datetime.fromisoformat(date_fin)

    interventions = await db.planning.find(query).sort("date_debut", 1).to_list(length=200)
    return [serialize_doc(i) for i in interventions]


@router.post("/{intervenant_id}/absences", summary="Signaler une absence")
async def signal_absence(
    intervenant_id: str,
    absence_data: dict,
    current_user: dict = Depends(require_permission("intervenants:write"))
):
    """Signaler une absence d'intervenant."""
    db = get_db()
    try:
        obj_id = ObjectId(intervenant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    existing = await db.intervenants.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Intervenant non trouvé")

    absence = {
        "date_debut": absence_data.get("date_debut"),
        "date_fin": absence_data.get("date_fin"),
        "motif": absence_data.get("motif", ""),
        "type": absence_data.get("type", "absence"),
        "created_by": current_user["email"],
        "created_at": datetime.utcnow().isoformat(),
    }

    await db.intervenants.update_one(
        {"_id": obj_id},
        {
            "$push": {"absences": absence},
            "$set": {"updated_at": datetime.utcnow()},
        }
    )

    # Créer une notification pour la coordination
    from notifications import create_internal_notification
    from models import TypeNotification
    await create_internal_notification(
        db=db,
        type_notification=TypeNotification.ABSENCE_INTERVENANT,
        titre=f"Absence signalée — {existing['prenom']} {existing['nom']}",
        message=f"Absence du {absence.get('date_debut', '')} au {absence.get('date_fin', '')} — {absence.get('motif', '')}",
        roles_cibles=["admin", "direction", "coordination"],
        lien=f"/intervenants/{intervenant_id}",
    )

    logger.info(f"Absence signalée pour intervenant {intervenant_id}")
    return {"message": "Absence enregistrée avec succès", "absence": absence}


# ============================================================
# Auth OTP intervenants
# ============================================================

@router.post("/auth/otp/request", summary="Demande OTP intervenant", tags=["Auth Intervenant"])
async def request_otp(email_data: dict, background_tasks: BackgroundTasks):
    """Demander un code OTP pour l'authentification intervenant."""
    email = email_data.get("email", "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")

    db = get_db()
    intervenant = await db.intervenants.find_one({
        "email": email,
        "statut": StatutIntervenant.ACTIF.value
    })

    if not intervenant:
        # Réponse identique pour éviter l'énumération des emails
        return {"message": "Si cet email existe, vous recevrez un code OTP"}

    # Générer un code OTP à 6 chiffres
    otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

    # Stocker le OTP hashé (ne jamais stocker en clair)
    import hashlib
    otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()

    # Supprimer les anciens OTP
    await db.otp_codes.delete_many({"email": email})

    await db.otp_codes.insert_one({
        "email": email,
        "otp_hash": otp_hash,
        "intervenant_id": str(intervenant["_id"]),
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "attempts": 0,
    })

    nom_complet = f"{intervenant.get('prenom', '')} {intervenant.get('nom', '')}"
    background_tasks.add_task(send_otp_email, email, nom_complet, otp_code)

    logger.info(f"OTP demandé pour intervenant: {email}")
    return {"message": "Si cet email existe, vous recevrez un code OTP"}


@router.post("/auth/otp/verify", summary="Vérifier OTP intervenant", tags=["Auth Intervenant"])
async def verify_otp(otp_data: dict):
    """Vérifier le code OTP et créer une session intervenant."""
    email = otp_data.get("email", "").lower().strip()
    otp_code = otp_data.get("code", "").strip()

    if not email or not otp_code:
        raise HTTPException(status_code=400, detail="Email et code requis")

    db = get_db()
    import hashlib
    otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()

    otp_record = await db.otp_codes.find_one({
        "email": email,
        "expires_at": {"$gt": datetime.utcnow()},
    })

    if not otp_record:
        raise HTTPException(status_code=401, detail="Code invalide ou expiré")

    # Vérifier le nombre de tentatives
    if otp_record.get("attempts", 0) >= 3:
        await db.otp_codes.delete_one({"_id": otp_record["_id"]})
        raise HTTPException(status_code=401, detail="Trop de tentatives. Demandez un nouveau code.")

    # Vérifier le hash
    if otp_record["otp_hash"] != otp_hash:
        await db.otp_codes.update_one(
            {"_id": otp_record["_id"]},
            {"$inc": {"attempts": 1}}
        )
        remaining = 3 - (otp_record.get("attempts", 0) + 1)
        raise HTTPException(
            status_code=401,
            detail=f"Code incorrect. {remaining} tentative(s) restante(s)"
        )

    # OTP valide — supprimer et créer session
    await db.otp_codes.delete_one({"_id": otp_record["_id"]})

    intervenant_id = otp_record["intervenant_id"]
    intervenant = await db.intervenants.find_one({"_id": ObjectId(intervenant_id)})

    if not intervenant:
        raise HTTPException(status_code=404, detail="Intervenant non trouvé")

    # Créer une session limitée
    from utils import generate_secure_token
    token = generate_secure_token(32)
    await db.sessions.insert_one({
        "token": token,
        "user_id": intervenant_id,
        "user_type": "intervenant",
        "user_data": {"email": email},
        "expires_at": datetime.utcnow() + timedelta(hours=12),
        "created_at": datetime.utcnow(),
    })

    logger.info(f"OTP validé pour intervenant: {email}")
    return {
        "token": token,
        "intervenant": {
            "id": str(intervenant["_id"]),
            "nom": intervenant.get("nom", ""),
            "prenom": intervenant.get("prenom", ""),
            "email": email,
        }
    }
