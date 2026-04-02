"""Utilitaires partagés pour Youdom Care CRM."""
import re
import secrets
import string
import logging
from datetime import datetime, date, timedelta
from typing import Optional, Any
import bleach
from bson import ObjectId
from cryptography.fernet import Fernet
import base64
import hashlib
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_fernet() -> Fernet:
    """Obtenir une instance Fernet pour le chiffrement."""
    key = settings.encryption_key
    if not key:
        # Générer une clé par défaut (dev only)
        key = base64.urlsafe_b64encode(
            hashlib.sha256(settings.secret_key.encode()).digest()
        ).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_sensitive(value: str) -> str:
    """Chiffrer une donnée sensible."""
    if not value:
        return value
    try:
        f = get_fernet()
        return f.encrypt(value.encode()).decode()
    except Exception:
        return value


def decrypt_sensitive(encrypted: str) -> str:
    """Déchiffrer une donnée sensible."""
    if not encrypted:
        return encrypted
    try:
        f = get_fernet()
        return f.decrypt(encrypted.encode()).decode()
    except Exception:
        return encrypted


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Nettoyer une chaîne de caractères."""
    if not value:
        return value
    # Supprimer les balises HTML
    cleaned = bleach.clean(value, tags=[], strip=True)
    # Supprimer les caractères de contrôle
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', cleaned)
    return cleaned.strip()[:max_length]


def sanitize_dict(data: dict) -> dict:
    """Nettoyer récursivement un dictionnaire."""
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = sanitize_string(value)
        elif isinstance(value, dict):
            result[key] = sanitize_dict(value)
        elif isinstance(value, list):
            result[key] = [
                sanitize_string(v) if isinstance(v, str) else
                sanitize_dict(v) if isinstance(v, dict) else v
                for v in value
            ]
        else:
            result[key] = value
    return result


def serialize_doc(doc: dict) -> dict:
    """Sérialiser un document MongoDB pour JSON."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, date):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [
                serialize_doc(item) if isinstance(item, dict) else
                str(item) if isinstance(item, ObjectId) else
                item.isoformat() if isinstance(item, (datetime, date)) else
                item
                for item in value
            ]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
    return result


def generate_numero_dossier(prefix: str, counter: int) -> str:
    """Générer un numéro de dossier unique."""
    annee = datetime.now().year
    return f"{prefix}-{annee}-{counter:05d}"


def generate_secure_token(length: int = 32) -> str:
    """Générer un token sécurisé."""
    return secrets.token_urlsafe(length)


def calculate_age(date_naissance: date) -> int:
    """Calculer l'âge en années."""
    today = date.today()
    return today.year - date_naissance.year - (
        (today.month, today.day) < (date_naissance.month, date_naissance.day)
    )


def calculate_lead_score(lead_data: dict) -> int:
    """Calculer le score d'un lead (0-100)."""
    score = 0

    # Urgence (0-25 pts)
    urgence_scores = {"urgente": 25, "haute": 20, "normale": 10, "faible": 5}
    score += urgence_scores.get(lead_data.get("urgence", "normale"), 10)

    # Type public (0-20 pts) — priorité aux plus vulnérables
    type_scores = {
        "personne_agee": 15, "handicap": 20,
        "enfant_handicap": 20, "malade": 18, "autre": 5
    }
    score += type_scores.get(lead_data.get("type_public", "autre"), 5)

    # Complétude des infos (0-20 pts)
    if lead_data.get("email"):
        score += 5
    if lead_data.get("adresse"):
        score += 5
    if lead_data.get("description_besoin") and len(lead_data["description_besoin"]) > 50:
        score += 10

    # Source (0-15 pts)
    source_scores = {
        "prescripteur": 15, "appel": 12, "site_web": 10,
        "bouche_a_oreille": 8, "google_ads": 7, "reseaux_sociaux": 5, "autre": 3
    }
    score += source_scores.get(lead_data.get("source", "autre"), 3)

    # Présence APA/PCH (0-20 pts)
    if lead_data.get("aide_apa"):
        score += 10
    if lead_data.get("aide_pch"):
        score += 10

    return min(score, 100)


def days_until(target_date: date) -> Optional[int]:
    """Calculer le nombre de jours jusqu'à une date."""
    if not target_date:
        return None
    delta = target_date - date.today()
    return delta.days


def format_montant(montant: float, devise: str = "€") -> str:
    """Formater un montant en euros."""
    return f"{montant:,.2f} {devise}".replace(",", " ")


def validate_siret(siret: str) -> bool:
    """Valider un numéro SIRET."""
    siret = re.sub(r'\s', '', siret)
    if not re.match(r'^\d{14}$', siret):
        return False
    total = 0
    for i, digit in enumerate(siret):
        n = int(digit)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0


# ============================================================
# TRANSITIONS D'ÉTAT LEAD
# ============================================================

LEAD_TRANSITIONS = {
    "nouveau": ["qualification", "perdu", "archive"],
    "qualification": ["visite_domicile", "perdu", "archive"],
    "visite_domicile": ["devis_envoye", "perdu", "archive"],
    "devis_envoye": ["accepte", "perdu", "archive"],
    "accepte": ["en_cours", "perdu"],
    "en_cours": ["termine", "perdu"],
    "termine": ["archive"],
    "perdu": ["archive", "nouveau"],
    "archive": [],
}


def can_transition_lead(current_statut: str, new_statut: str) -> bool:
    """Vérifier si une transition de statut lead est autorisée."""
    allowed = LEAD_TRANSITIONS.get(current_statut, [])
    return new_statut in allowed


# ============================================================
# PERMISSIONS
# ============================================================

ROLE_PERMISSIONS = {
    "admin": ["*"],
    "direction": [
        "beneficiaires:read", "beneficiaires:write",
        "familles:read", "familles:write",
        "intervenants:read", "intervenants:write",
        "leads:read", "leads:write",
        "planning:read", "planning:write",
        "devis_contrats:read", "devis_contrats:write",
        "facturation:read", "facturation:write",
        "qualite:read", "qualite:write",
        "dashboard:read",
        "conformite:read", "conformite:write",
        "communications:read", "communications:write",
        "services:read", "services:write",
        "prescripteurs:read", "prescripteurs:write",
        "users:read",
    ],
    "coordination": [
        "beneficiaires:read", "beneficiaires:write",
        "familles:read", "familles:write",
        "intervenants:read",
        "leads:read", "leads:write",
        "planning:read", "planning:write",
        "devis_contrats:read", "devis_contrats:write",
        "qualite:read", "qualite:write",
        "dashboard:read",
        "conformite:read",
        "communications:read", "communications:write",
        "services:read",
        "prescripteurs:read", "prescripteurs:write",
    ],
    "qualite": [
        "beneficiaires:read",
        "qualite:read", "qualite:write",
        "dashboard:read",
        "communications:read",
    ],
    "comptabilite": [
        "beneficiaires:read",
        "facturation:read", "facturation:write",
        "devis_contrats:read",
        "dashboard:read",
    ],
    "intervenant": [
        "planning:read",
        "beneficiaires:read",
    ],
}


def has_permission(role: str, permission: str) -> bool:
    """Vérifier si un rôle a une permission."""
    perms = ROLE_PERMISSIONS.get(role, [])
    if "*" in perms:
        return True
    if permission in perms:
        return True
    # Vérifier wildcard sur la ressource
    resource = permission.split(":")[0]
    if f"{resource}:*" in perms:
        return True
    return False
