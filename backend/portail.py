"""Module portail familles — Youdom Care CRM."""
import logging
from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status, Request

from database import get_db
from models import MagicLinkRequest, TypeTicket, PrioriteTicket, StatutTicket
from utils import serialize_doc, generate_secure_token, sanitize_string

logger = logging.getLogger(__name__)
router = APIRouter()

MAGIC_LINK_EXPIRE_HOURS = 24
SESSION_EXPIRE_HOURS = 8


# ============================================================
# Helpers auth portail
# ============================================================

async def get_portail_session(request: Request) -> dict:
    """Récupérer et valider la session portail depuis le header Authorization."""
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("portail_session")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification portail requise"
        )

    db = get_db()
    session = await db.portail_sessions.find_one({"token": token})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session portail invalide ou expirée"
        )

    if session.get("expires_at") < datetime.utcnow():
        await db.portail_sessions.delete_one({"token": token})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session portail expirée"
        )

    return session


# ============================================================
# Auth Magic Link
# ============================================================

@router.post("/auth/demander-lien", summary="Demander un magic link de connexion")
async def demander_magic_link(data: MagicLinkRequest):
    """
    Envoyer un magic link à l'email de la famille ou du bénéficiaire.
    Le lien est valable 24h.
    """
    db = get_db()
    email = data.email.lower().strip()

    # Chercher l'acteur selon le type
    acteur = None
    if data.type_acteur == "famille":
        acteur = await db.familles.find_one({"email": email, "acces_portail": True})
    elif data.type_acteur == "beneficiaire":
        acteur = await db.beneficiaires.find_one({"email": email})

    # Même si l'acteur n'est pas trouvé, on répond positivement (anti-enumération)
    if acteur:
        token = generate_secure_token(32)
        now = datetime.utcnow()
        await db.magic_links.insert_one({
            "token": token,
            "email": email,
            "type_acteur": data.type_acteur,
            "acteur_id": str(acteur["_id"]),
            "expires_at": now + timedelta(hours=MAGIC_LINK_EXPIRE_HOURS),
            "created_at": now,
            "utilise": False,
        })

        lien = f"/portail/auth/valider?token={token}"
        logger.info(f"Magic link portail créé pour {email} ({data.type_acteur}): {lien}")

        # En production, envoyer l'email via le module communications
        # Pour l'instant, logger le lien (remplacer par envoi SMTP en prod)
        logger.info(f"[PORTAIL] Lien de connexion pour {email}: {lien}")

    return {
        "message": "Si votre email est associé à un compte portail, vous recevrez un lien de connexion."
    }


@router.get("/auth/valider", summary="Valider un magic link")
async def valider_magic_link(token: str):
    """Valider le magic link et créer une session portail."""
    db = get_db()
    link = await db.magic_links.find_one({"token": token, "utilise": False})

    if not link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien de connexion invalide ou déjà utilisé"
        )

    if link.get("expires_at") < datetime.utcnow():
        await db.magic_links.delete_one({"token": token})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien de connexion expiré. Veuillez en demander un nouveau."
        )

    # Marquer le lien comme utilisé
    await db.magic_links.update_one(
        {"token": token},
        {"$set": {"utilise": True, "utilise_at": datetime.utcnow()}}
    )

    # Créer la session portail
    session_token = generate_secure_token(32)
    now = datetime.utcnow()
    session = {
        "token": session_token,
        "email": link["email"],
        "type_acteur": link["type_acteur"],
        "acteur_id": link["acteur_id"],
        "expires_at": now + timedelta(hours=SESSION_EXPIRE_HOURS),
        "created_at": now,
    }
    await db.portail_sessions.insert_one(session)

    return {
        "message": "Connexion réussie",
        "session_token": session_token,
        "type_acteur": link["type_acteur"],
        "acteur_id": link["acteur_id"],
        "expires_at": (now + timedelta(hours=SESSION_EXPIRE_HOURS)).isoformat(),
    }


@router.post("/auth/deconnexion", summary="Se déconnecter du portail")
async def deconnexion_portail(session: dict = Depends(get_portail_session)):
    """Invalider la session portail courante."""
    db = get_db()
    await db.portail_sessions.delete_one({"token": session["token"]})
    return {"message": "Déconnexion réussie"}


@router.get("/auth/profil", summary="Profil portail de l'utilisateur connecté")
async def profil_portail(session: dict = Depends(get_portail_session)):
    """Informations sur l'utilisateur connecté au portail."""
    db = get_db()
    acteur_id = session.get("acteur_id")
    type_acteur = session.get("type_acteur")

    acteur = None
    if type_acteur == "famille":
        try:
            doc = await db.familles.find_one({"_id": ObjectId(acteur_id)})
            if doc:
                acteur = {
                    "id": str(doc["_id"]),
                    "nom": f"{doc.get('prenom', '')} {doc.get('nom', '')}".strip(),
                    "email": doc.get("email"),
                    "role": doc.get("role"),
                    "beneficiaire_ids": doc.get("beneficiaire_ids", []),
                }
        except Exception:
            pass
    elif type_acteur == "beneficiaire":
        try:
            doc = await db.beneficiaires.find_one({"_id": ObjectId(acteur_id)})
            if doc:
                acteur = {
                    "id": str(doc["_id"]),
                    "nom": f"{doc.get('prenom', '')} {doc.get('nom', '')}".strip(),
                    "email": doc.get("email"),
                }
        except Exception:
            pass

    return {
        "session": {
            "type_acteur": type_acteur,
            "expires_at": session.get("expires_at", "").isoformat() if hasattr(session.get("expires_at"), "isoformat") else str(session.get("expires_at", "")),
        },
        "profil": acteur,
    }


# ============================================================
# Consultation planning
# ============================================================

@router.get("/planning/{beneficiaire_id}", summary="Planning du bénéficiaire")
async def get_planning_beneficiaire(
    beneficiaire_id: str,
    semaines: int = Query(2, ge=1, le=8),
    session: dict = Depends(get_portail_session)
):
    """Consulter le planning d'un bénéficiaire (accès restreint à ses ayants droit)."""
    db = get_db()

    # Vérifier les droits d'accès
    await _verifier_acces_beneficiaire(beneficiaire_id, session, db)

    date_debut = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    date_fin = date_debut + timedelta(weeks=semaines)

    interventions = await db.planning.find({
        "beneficiaire_id": beneficiaire_id,
        "date_debut": {"$gte": date_debut, "$lt": date_fin},
        "statut": {"$ne": "annule"}
    }).sort("date_debut", 1).to_list(length=200)

    result = []
    for intv in interventions:
        d = serialize_doc(intv)
        # Enrichir avec le nom de l'intervenant (seulement prénom pour la vie privée)
        if d.get("intervenant_id"):
            try:
                intervenant = await db.intervenants.find_one({"_id": ObjectId(d["intervenant_id"])})
                if intervenant:
                    d["intervenant_prenom"] = intervenant.get("prenom", "")
            except Exception:
                pass
        # Enrichir avec le nom du service
        if d.get("service_id"):
            try:
                service = await db.services.find_one({"_id": ObjectId(d["service_id"])})
                if service:
                    d["service_nom"] = service.get("nom", "")
            except Exception:
                pass
        # Retirer les données sensibles
        d.pop("notes_realisation", None)
        result.append(d)

    return {
        "interventions": result,
        "periode": {
            "debut": date_debut.isoformat(),
            "fin": date_fin.isoformat(),
        }
    }


# ============================================================
# Consultation devis
# ============================================================

@router.get("/devis/{beneficiaire_id}", summary="Devis du bénéficiaire")
async def get_devis_beneficiaire(
    beneficiaire_id: str,
    session: dict = Depends(get_portail_session)
):
    """Consulter les devis d'un bénéficiaire."""
    db = get_db()
    await _verifier_acces_beneficiaire(beneficiaire_id, session, db)

    docs = await db.devis_contrats.find({
        "beneficiaire_id": beneficiaire_id,
        "type": "devis",
        "statut": {"$nin": ["brouillon"]}
    }).sort("created_at", -1).to_list(length=50)

    result = []
    for d in docs:
        dd = serialize_doc(d)
        # Masquer les notes internes
        dd.pop("notes_internes", None)
        result.append(dd)

    return result


# ============================================================
# Consultation factures
# ============================================================

@router.get("/factures/{beneficiaire_id}", summary="Factures du bénéficiaire")
async def get_factures_beneficiaire(
    beneficiaire_id: str,
    session: dict = Depends(get_portail_session)
):
    """Consulter les factures d'un bénéficiaire."""
    db = get_db()
    await _verifier_acces_beneficiaire(beneficiaire_id, session, db)

    docs = await db.factures.find({
        "beneficiaire_id": beneficiaire_id,
        "statut_paiement": {"$ne": "brouillon"}
    }).sort("date_emission", -1).to_list(length=100)

    result = []
    for d in docs:
        dd = serialize_doc(d)
        # Ne pas exposer le détail des paiements internes
        dd.pop("paiements", None)
        dd.pop("notes", None)
        result.append(dd)

    return result


# ============================================================
# Avis et réclamations
# ============================================================

@router.post("/avis", summary="Soumettre un avis")
async def soumettre_avis(
    beneficiaire_id: str,
    note: int,
    commentaire: Optional[str] = None,
    session: dict = Depends(get_portail_session)
):
    """Soumettre un avis de satisfaction (note 1-5)."""
    db = get_db()
    await _verifier_acces_beneficiaire(beneficiaire_id, session, db)

    if note not in range(1, 6):
        raise HTTPException(status_code=400, detail="La note doit être entre 1 et 5")

    now = datetime.utcnow()
    doc = {
        "beneficiaire_id": beneficiaire_id,
        "auteur_id": session.get("acteur_id"),
        "type_auteur": session.get("type_acteur"),
        "note": note,
        "commentaire": sanitize_string(commentaire, 1000) if commentaire else None,
        "canal": "portail",
        "created_at": now,
    }

    result = await db.avis_portail.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"message": "Avis enregistré, merci pour votre retour.", "id": str(result.inserted_id)}


@router.post("/reclamations", summary="Soumettre une réclamation")
async def soumettre_reclamation(
    beneficiaire_id: str,
    titre: str,
    description: str,
    session: dict = Depends(get_portail_session)
):
    """Soumettre une réclamation via le portail famille."""
    db = get_db()
    await _verifier_acces_beneficiaire(beneficiaire_id, session, db)

    if not titre or len(titre.strip()) < 5:
        raise HTTPException(status_code=400, detail="Le titre doit contenir au moins 5 caractères")
    if not description or len(description.strip()) < 10:
        raise HTTPException(status_code=400, detail="La description doit contenir au moins 10 caractères")

    # Créer un ticket qualité de type réclamation
    from utils import generate_numero_dossier

    async def get_next_ticket_number(db):
        result = await db.counters.find_one_and_update(
            {"_id": "tickets_qualite"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True,
        )
        return generate_numero_dossier("YC-QUA", result.get("seq", 1))

    numero = await get_next_ticket_number(db)
    now = datetime.utcnow()

    ticket = {
        "numero": numero,
        "type_ticket": TypeTicket.RECLAMATION.value,
        "titre": sanitize_string(titre.strip(), 200),
        "description": sanitize_string(description.strip(), 5000),
        "beneficiaire_id": beneficiaire_id,
        "intervenant_id": None,
        "priorite": PrioriteTicket.NORMALE.value,
        "statut": StatutTicket.OUVERT.value,
        "responsable_id": None,
        "date_limite": None,
        "resolution": None,
        "commentaires": [],
        "historique": [
            {
                "statut": StatutTicket.OUVERT.value,
                "auteur_id": session.get("acteur_id"),
                "auteur_nom": "Portail famille",
                "date": now,
                "note": "Réclamation soumise via le portail famille",
            }
        ],
        "source": "portail",
        "created_by": f"portail:{session.get('acteur_id')}",
        "created_at": now,
        "updated_at": now,
        "closed_at": None,
    }

    result = await db.tickets_qualite.insert_one(ticket)
    return {
        "message": "Votre réclamation a bien été enregistrée. Notre équipe vous contactera rapidement.",
        "numero": numero,
        "id": str(result.inserted_id),
    }


# ============================================================
# Helper vérification accès
# ============================================================

async def _verifier_acces_beneficiaire(beneficiaire_id: str, session: dict, db) -> None:
    """Vérifier que la session portail a accès aux données du bénéficiaire."""
    type_acteur = session.get("type_acteur")
    acteur_id = session.get("acteur_id")

    if type_acteur == "beneficiaire":
        # Le bénéficiaire ne peut voir que ses propres données
        if acteur_id != beneficiaire_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé à ce bénéficiaire"
            )
    elif type_acteur == "famille":
        # La famille ne peut voir que ses bénéficiaires associés
        try:
            famille = await db.familles.find_one({"_id": ObjectId(acteur_id)})
        except Exception:
            raise HTTPException(status_code=403, detail="Accès refusé")
        if not famille:
            raise HTTPException(status_code=403, detail="Accès refusé")
        if beneficiaire_id not in (famille.get("beneficiaire_ids") or []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé à ce bénéficiaire"
            )
    else:
        raise HTTPException(status_code=403, detail="Type d'acteur portail inconnu")
