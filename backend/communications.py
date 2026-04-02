"""Module communications — Emails/SMS — Youdom Care CRM."""
import logging
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status

from database import get_db
from auth import require_permission
from models import CommunicationCreate, CommunicationResponse
from utils import serialize_doc
from config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


# ============================================================
# Templates email par défaut
# ============================================================

TEMPLATES_DEFAUT = {
    "confirmation_service": {
        "sujet": "Confirmation de votre prise en charge — Youdom Care",
        "corps": """Madame, Monsieur {civilite_nom},

Nous avons le plaisir de vous confirmer la mise en place de votre accompagnement par nos services.

Votre intervenant(e) : {intervenant_nom}
Début de la prestation : {date_debut}
Volume hebdomadaire : {heures_semaine} heures/semaine

Notre équipe reste disponible pour tout renseignement.

Cordialement,
L'équipe Youdom Care
Tél : 01 XX XX XX XX
""",
        "variables": ["civilite_nom", "intervenant_nom", "date_debut", "heures_semaine"],
        "actif": True,
    },
    "rappel_rdv": {
        "sujet": "Rappel de votre rendez-vous — Youdom Care",
        "corps": """Madame, Monsieur {civilite_nom},

Nous vous rappelons votre rendez-vous prévu le {date_rdv} à {heure_rdv}.

Intervenant(e) : {intervenant_nom}

En cas d'empêchement, merci de nous contacter au 01 XX XX XX XX.

Cordialement,
L'équipe Youdom Care
""",
        "variables": ["civilite_nom", "date_rdv", "heure_rdv", "intervenant_nom"],
        "actif": True,
    },
    "alerte_absence": {
        "sujet": "Information — Absence de votre intervenant(e) — Youdom Care",
        "corps": """Madame, Monsieur {civilite_nom},

Nous vous informons que votre intervenant(e) {intervenant_nom} sera absent(e) le {date_absence}.

{remplacement_info}

Nous vous prions d'accepter nos sincères excuses pour la gêne occasionnée.

Cordialement,
L'équipe Youdom Care
""",
        "variables": ["civilite_nom", "intervenant_nom", "date_absence", "remplacement_info"],
        "actif": True,
    },
    "relance_impaye": {
        "sujet": "Rappel de paiement — Facture {numero_facture} — Youdom Care",
        "corps": """Madame, Monsieur {civilite_nom},

Sauf erreur de notre part, la facture n°{numero_facture} d'un montant de {montant} €, émise le {date_emission}, reste impayée à ce jour.

Nous vous saurions gré de bien vouloir procéder au règlement dans les meilleurs délais.

Pour tout renseignement, contactez notre service comptabilité au 01 XX XX XX XX.

Cordialement,
L'équipe Youdom Care
""",
        "variables": ["civilite_nom", "numero_facture", "montant", "date_emission"],
        "actif": True,
    },
    "bienvenue_portail": {
        "sujet": "Accès à votre espace famille — Youdom Care",
        "corps": """Madame, Monsieur {civilite_nom},

Votre espace famille Youdom Care est maintenant accessible.

Cliquez sur le lien ci-dessous pour vous connecter (valable 24 heures) :
{lien_connexion}

Cet espace vous permet de consulter le planning, les factures et les documents de votre proche.

Cordialement,
L'équipe Youdom Care
""",
        "variables": ["civilite_nom", "lien_connexion"],
        "actif": True,
    },
}


# ============================================================
# Helpers
# ============================================================

async def send_email_smtp(destinataire_email: str, sujet: str, corps: str) -> bool:
    """Envoyer un email via SMTP (Brevo/SendGrid compatible)."""
    smtp_host = getattr(settings, "smtp_host", None)
    smtp_port = getattr(settings, "smtp_port", 587)
    smtp_user = getattr(settings, "smtp_user", None)
    smtp_password = getattr(settings, "smtp_password", None)
    smtp_from = getattr(settings, "smtp_from", "noreply@youdomcare.fr")

    if not smtp_host or not smtp_user:
        logger.warning("SMTP non configuré — email non envoyé (mode simulation)")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = sujet
        msg["From"] = smtp_from
        msg["To"] = destinataire_email
        msg.attach(MIMEText(corps, "plain", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, [destinataire_email], msg.as_string())
        logger.info(f"Email envoyé à {destinataire_email}: {sujet}")
        return True
    except Exception as e:
        logger.error(f"Erreur envoi email à {destinataire_email}: {e}")
        return False


async def get_destinataire_info(destinataire_id: str, type_acteur: str, db) -> dict:
    """Récupérer les infos d'un destinataire."""
    collection_map = {
        "beneficiaire": "beneficiaires",
        "famille": "familles",
        "intervenant": "intervenants",
        "prescripteur": "prescripteurs",
    }
    collection = collection_map.get(type_acteur)
    if not collection:
        return {}
    try:
        doc = await db[collection].find_one({"_id": ObjectId(destinataire_id)})
        if doc:
            return {
                "nom": f"{doc.get('prenom', '')} {doc.get('nom', '')}".strip(),
                "email": doc.get("email"),
                "telephone": doc.get("telephone") or doc.get("telephone_portable"),
            }
    except Exception:
        pass
    return {}


# ============================================================
# Endpoints Templates
# ============================================================

@router.get("/templates", summary="Lister les templates")
async def list_templates(
    current_user: dict = Depends(require_permission("communications:read"))
):
    """Lister tous les templates de communication."""
    db = get_db()
    # Templates custom en DB
    custom = await db.comm_templates.find({}).to_list(length=100)
    custom_ids = {t["template_id"] for t in custom}

    templates = []
    for key, t in TEMPLATES_DEFAUT.items():
        if key not in custom_ids:
            templates.append({"template_id": key, "source": "defaut", **t})

    for t in custom:
        templates.append(serialize_doc(t))

    return templates


@router.post("/templates", summary="Créer un template personnalisé", status_code=status.HTTP_201_CREATED)
async def create_template(
    template_id: str,
    sujet: str,
    corps: str,
    variables: Optional[List[str]] = None,
    current_user: dict = Depends(require_permission("communications:write"))
):
    """Créer ou remplacer un template email."""
    db = get_db()
    now = datetime.utcnow()
    doc = {
        "template_id": template_id,
        "sujet": sujet,
        "corps": corps,
        "variables": variables or [],
        "actif": True,
        "source": "custom",
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }
    await db.comm_templates.replace_one({"template_id": template_id}, doc, upsert=True)
    return {"message": "Template enregistré", "template_id": template_id}


@router.put("/templates/{template_id}", summary="Modifier un template")
async def update_template(
    template_id: str,
    sujet: Optional[str] = None,
    corps: Optional[str] = None,
    actif: Optional[bool] = None,
    current_user: dict = Depends(require_permission("communications:write"))
):
    """Modifier un template existant."""
    db = get_db()
    update = {"updated_at": datetime.utcnow()}
    if sujet is not None:
        update["sujet"] = sujet
    if corps is not None:
        update["corps"] = corps
    if actif is not None:
        update["actif"] = actif

    result = await db.comm_templates.update_one({"template_id": template_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    return {"message": "Template mis à jour"}


# ============================================================
# Endpoints Communications
# ============================================================

@router.get("", summary="Historique des communications")
async def list_communications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    destinataire_id: Optional[str] = None,
    type_acteur: Optional[str] = None,
    canal: Optional[str] = None,
    current_user: dict = Depends(require_permission("communications:read"))
):
    """Historique des communications envoyées."""
    db = get_db()
    query = {}
    if destinataire_id:
        query["destinataire_id"] = destinataire_id
    if type_acteur:
        query["type_acteur"] = type_acteur
    if canal:
        query["canal"] = canal

    total = await db.communications.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.communications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    return {
        "items": [serialize_doc(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("/envoyer", summary="Envoyer une communication", status_code=status.HTTP_201_CREATED)
async def envoyer_communication(
    data: CommunicationCreate,
    current_user: dict = Depends(require_permission("communications:write"))
):
    """Envoyer un email ou SMS à un acteur et enregistrer dans l'historique."""
    db = get_db()

    # Récupérer les infos du destinataire
    dest_info = await get_destinataire_info(data.destinataire_id, data.type_acteur, db)
    destinataire_nom = dest_info.get("nom", "Inconnu")
    destinataire_email = dest_info.get("email")

    sujet = data.sujet or "(sans objet)"
    statut_envoi = "simule"

    if data.canal == "email":
        if not destinataire_email:
            statut_envoi = "echec_pas_email"
        else:
            succes = await send_email_smtp(destinataire_email, sujet, data.contenu)
            statut_envoi = "envoye" if succes else "simule"
    elif data.canal == "sms":
        # Intégration SMS (Brevo/Twilio) à configurer — simulation
        statut_envoi = "simule"
        logger.info(f"SMS simulé pour {destinataire_nom}: {data.contenu[:50]}...")

    now = datetime.utcnow()
    doc = {
        "destinataire_id": data.destinataire_id,
        "destinataire_nom": destinataire_nom,
        "type_acteur": data.type_acteur,
        "canal": data.canal,
        "sujet": sujet,
        "contenu": data.contenu,
        "template_id": data.template_id,
        "statut_envoi": statut_envoi,
        "auteur_id": current_user["id"],
        "auteur_nom": f"{current_user.get('prenom', '')} {current_user.get('nom', '')}".strip(),
        "created_at": now,
    }

    result = await db.communications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.post("/envoyer-template", summary="Envoyer depuis un template")
async def envoyer_depuis_template(
    template_id: str,
    destinataire_id: str,
    type_acteur: str,
    variables: dict,
    canal: str = "email",
    current_user: dict = Depends(require_permission("communications:write"))
):
    """Remplir un template avec des variables et envoyer."""
    db = get_db()

    # Récupérer le template (DB puis défaut)
    template = await db.comm_templates.find_one({"template_id": template_id})
    if not template:
        if template_id in TEMPLATES_DEFAUT:
            template = TEMPLATES_DEFAUT[template_id]
        else:
            raise HTTPException(status_code=404, detail="Template non trouvé")

    sujet = template["sujet"]
    corps = template["corps"]

    # Remplacement des variables
    for var, val in variables.items():
        sujet = sujet.replace(f"{{{var}}}", str(val))
        corps = corps.replace(f"{{{var}}}", str(val))

    comm_data = CommunicationCreate(
        destinataire_id=destinataire_id,
        type_acteur=type_acteur,
        canal=canal,
        sujet=sujet,
        contenu=corps,
        template_id=template_id,
    )

    return await envoyer_communication(comm_data, current_user)


@router.get("/{communication_id}", summary="Détail d'une communication")
async def get_communication(
    communication_id: str,
    current_user: dict = Depends(require_permission("communications:read"))
):
    db = get_db()
    try:
        oid = ObjectId(communication_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID communication invalide")

    doc = await db.communications.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Communication non trouvée")
    return serialize_doc(doc)
