"""Module conformité médico-sociale et réglementaire — Youdom Care CRM."""
import logging
import os
import shutil
from datetime import datetime, date, timedelta
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, status

from database import get_db
from auth import require_permission
from models import DocumentConformiteCreate, DocumentConformiteResponse
from utils import serialize_doc, generate_secure_token

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/data/uploads/conformite")
MAX_FILE_SIZE_MB = 10


def format_document(doc: dict) -> dict:
    if not doc:
        return None
    result = serialize_doc(doc)
    # Calculer jours restants et statut alerte
    if result.get("date_expiration"):
        try:
            exp_str = result["date_expiration"]
            if isinstance(exp_str, str):
                exp_date = date.fromisoformat(exp_str[:10])
            else:
                exp_date = exp_str
            today = date.today()
            jours = (exp_date - today).days
            result["jours_restants"] = jours
            result["est_expire"] = jours < 0
            result["alerte_active"] = 0 <= jours <= result.get("alerte_avant_jours", 30)
        except Exception:
            result["jours_restants"] = None
            result["est_expire"] = False
            result["alerte_active"] = False
    else:
        result["jours_restants"] = None
        result["est_expire"] = False
        result["alerte_active"] = False
    return result


async def enrichir_document(doc: dict, db) -> dict:
    result = format_document(doc)
    if result and result.get("beneficiaire_id"):
        try:
            ben = await db.beneficiaires.find_one({"_id": ObjectId(result["beneficiaire_id"])})
            if ben:
                result["beneficiaire_nom"] = f"{ben.get('prenom', '')} {ben.get('nom', '')}".strip()
        except Exception:
            pass
    return result


# ============================================================
# CRUD Documents conformité
# ============================================================

@router.get("", summary="Lister les documents de conformité")
async def list_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    beneficiaire_id: Optional[str] = None,
    type_aide: Optional[str] = None,
    expires_seulement: bool = Query(False),
    alertes_seulement: bool = Query(False),
    current_user: dict = Depends(require_permission("conformite:read"))
):
    """Lister les documents de conformité APA/PCH et autres."""
    db = get_db()
    query = {}

    if beneficiaire_id:
        query["beneficiaire_id"] = beneficiaire_id
    if type_aide:
        query["type_aide"] = type_aide

    today_dt = datetime.combine(date.today(), datetime.min.time())

    if expires_seulement:
        query["date_expiration"] = {"$lt": today_dt}
    elif alertes_seulement:
        dans_30j = datetime.combine(date.today() + timedelta(days=30), datetime.min.time())
        query["date_expiration"] = {"$gte": today_dt, "$lte": dans_30j}

    total = await db.conformite_documents.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.conformite_documents.find(query).sort("date_expiration", 1).skip(skip).limit(limit).to_list(length=limit)

    items = []
    for d in docs:
        items.append(await enrichir_document(d, db))

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("", summary="Créer un document de conformité", status_code=status.HTTP_201_CREATED)
async def create_document(
    data: DocumentConformiteCreate,
    current_user: dict = Depends(require_permission("conformite:write"))
):
    """Créer un enregistrement de suivi APA/PCH ou autre document réglementaire."""
    db = get_db()

    try:
        ben = await db.beneficiaires.find_one({"_id": ObjectId(data.beneficiaire_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID bénéficiaire invalide")
    if not ben:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    now = datetime.utcnow()
    doc = {
        "beneficiaire_id": data.beneficiaire_id,
        "type_aide": data.type_aide,
        "titre": data.titre,
        "description": data.description,
        "date_attribution": datetime.combine(data.date_attribution, datetime.min.time()) if data.date_attribution else None,
        "date_expiration": datetime.combine(data.date_expiration, datetime.min.time()) if data.date_expiration else None,
        "montant_mensuel": data.montant_mensuel,
        "organisme": data.organisme,
        "numero_decision": data.numero_decision,
        "fichier_nom": data.fichier_nom,
        "fichier_path": None,
        "alerte_avant_jours": data.alerte_avant_jours,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.conformite_documents.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await enrichir_document(doc, db)


@router.get("/alertes", summary="Alertes fin de droits et dossiers à réévaluer")
async def get_alertes(
    jours: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(require_permission("conformite:read"))
):
    """
    Retourner toutes les alertes :
    - Documents expirant dans X jours
    - Documents déjà expirés
    - APA/PCH bénéficiaires expirant bientôt
    - Dossiers à réévaluer
    """
    db = get_db()
    today = date.today()
    horizon = today + timedelta(days=jours)
    today_dt = datetime.combine(today, datetime.min.time())
    horizon_dt = datetime.combine(horizon, datetime.min.time())

    # Documents expirant bientôt
    expirant_bientot = await db.conformite_documents.find({
        "date_expiration": {"$gte": today_dt, "$lte": horizon_dt}
    }).sort("date_expiration", 1).to_list(length=500)

    # Documents expirés
    expires = await db.conformite_documents.find({
        "date_expiration": {"$lt": today_dt}
    }).sort("date_expiration", 1).to_list(length=500)

    async def build_alerte_list(docs, urgence):
        result = []
        for doc in docs:
            d = await enrichir_document(doc, db)
            d["urgence"] = urgence
            result.append(d)
        return result

    alertes_proches = await build_alerte_list(expirant_bientot, "attention")
    alertes_expires = await build_alerte_list(expires, "critique")

    # APA/PCH dans les bénéficiaires
    apa_expirant = await db.beneficiaires.find({
        "aide_apa.date_fin": {
            "$gte": today.isoformat(),
            "$lte": horizon.isoformat()
        }
    }).to_list(length=200)

    pch_expirant = await db.beneficiaires.find({
        "aide_pch.date_fin": {
            "$gte": today.isoformat(),
            "$lte": horizon.isoformat()
        }
    }).to_list(length=200)

    alertes_apa = []
    for ben in apa_expirant:
        aide = ben.get("aide_apa", {}) or {}
        alertes_apa.append({
            "beneficiaire_id": str(ben["_id"]),
            "beneficiaire_nom": f"{ben.get('prenom', '')} {ben.get('nom', '')}".strip(),
            "type": "APA",
            "date_fin": aide.get("date_fin", ""),
            "montant_mensuel": aide.get("montant_mensuel"),
            "urgence": "attention",
        })

    alertes_pch = []
    for ben in pch_expirant:
        aide = ben.get("aide_pch", {}) or {}
        alertes_pch.append({
            "beneficiaire_id": str(ben["_id"]),
            "beneficiaire_nom": f"{ben.get('prenom', '')} {ben.get('nom', '')}".strip(),
            "type": "PCH",
            "date_fin": aide.get("date_fin", ""),
            "montant_mensuel": aide.get("montant_mensuel"),
            "urgence": "attention",
        })

    toutes_alertes = alertes_expires + alertes_proches + alertes_apa + alertes_pch

    return {
        "total_alertes": len(toutes_alertes),
        "horizon_jours": jours,
        "date_calcul": today.isoformat(),
        "documents_expires": alertes_expires,
        "documents_expirant_bientot": alertes_proches,
        "apa_expirant_bientot": alertes_apa,
        "pch_expirant_bientot": alertes_pch,
    }


@router.get("/{document_id}", summary="Détail d'un document")
async def get_document(
    document_id: str,
    current_user: dict = Depends(require_permission("conformite:read"))
):
    db = get_db()
    try:
        oid = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID document invalide")

    doc = await db.conformite_documents.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    return await enrichir_document(doc, db)


@router.patch("/{document_id}", summary="Modifier un document")
async def update_document(
    document_id: str,
    titre: Optional[str] = None,
    description: Optional[str] = None,
    date_expiration: Optional[date] = None,
    montant_mensuel: Optional[float] = None,
    numero_decision: Optional[str] = None,
    alerte_avant_jours: Optional[int] = None,
    current_user: dict = Depends(require_permission("conformite:write"))
):
    """Mettre à jour un document de conformité."""
    db = get_db()
    try:
        oid = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID document invalide")

    doc = await db.conformite_documents.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    update = {"updated_at": datetime.utcnow()}
    if titre is not None:
        update["titre"] = titre
    if description is not None:
        update["description"] = description
    if date_expiration is not None:
        update["date_expiration"] = datetime.combine(date_expiration, datetime.min.time())
    if montant_mensuel is not None:
        update["montant_mensuel"] = montant_mensuel
    if numero_decision is not None:
        update["numero_decision"] = numero_decision
    if alerte_avant_jours is not None:
        update["alerte_avant_jours"] = alerte_avant_jours

    await db.conformite_documents.update_one({"_id": oid}, {"$set": update})
    doc = await db.conformite_documents.find_one({"_id": oid})
    return await enrichir_document(doc, db)


@router.post("/{document_id}/fichier", summary="Uploader un fichier lié")
async def upload_fichier(
    document_id: str,
    fichier: UploadFile = File(...),
    current_user: dict = Depends(require_permission("conformite:write"))
):
    """Attacher un fichier (PDF, image) à un document de conformité."""
    db = get_db()
    try:
        oid = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID document invalide")

    doc = await db.conformite_documents.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    # Vérifications basiques
    if fichier.content_type not in [
        "application/pdf", "image/jpeg", "image/png", "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé (PDF, image, Word)")

    # Lire le fichier et vérifier la taille
    content = await fichier.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Fichier trop volumineux (max {MAX_FILE_SIZE_MB} Mo)")

    # Sauvegarder le fichier
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(fichier.filename or "fichier.pdf")[1]
    nom_fichier = f"{document_id}_{generate_secure_token(8)}{ext}"
    chemin = os.path.join(UPLOAD_DIR, nom_fichier)

    with open(chemin, "wb") as f:
        f.write(content)

    update = {
        "fichier_nom": fichier.filename,
        "fichier_path": chemin,
        "updated_at": datetime.utcnow(),
    }
    await db.conformite_documents.update_one({"_id": oid}, {"$set": update})

    return {
        "message": "Fichier uploadé avec succès",
        "fichier_nom": fichier.filename,
        "taille_octets": len(content),
    }


@router.delete("/{document_id}", summary="Supprimer un document")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(require_permission("conformite:write"))
):
    db = get_db()
    try:
        oid = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID document invalide")

    doc = await db.conformite_documents.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    # Supprimer le fichier physique si présent
    if doc.get("fichier_path") and os.path.exists(doc["fichier_path"]):
        try:
            os.remove(doc["fichier_path"])
        except Exception as e:
            logger.warning(f"Impossible de supprimer le fichier {doc['fichier_path']}: {e}")

    await db.conformite_documents.delete_one({"_id": oid})
    return {"message": "Document supprimé"}


# ============================================================
# Visites d'évaluation et projets personnalisés
# ============================================================

@router.post("/visites-evaluation", summary="Enregistrer une visite d'évaluation")
async def create_visite_evaluation(
    beneficiaire_id: str,
    date_visite: date,
    evaluateur: str,
    synthese: str,
    recommandations: Optional[str] = None,
    prochaine_echeance: Optional[date] = None,
    current_user: dict = Depends(require_permission("conformite:write"))
):
    """Enregistrer une visite d'évaluation à domicile."""
    db = get_db()

    try:
        ben = await db.beneficiaires.find_one({"_id": ObjectId(beneficiaire_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID bénéficiaire invalide")
    if not ben:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    now = datetime.utcnow()
    doc = {
        "beneficiaire_id": beneficiaire_id,
        "date_visite": datetime.combine(date_visite, datetime.min.time()),
        "evaluateur": evaluateur,
        "synthese": synthese,
        "recommandations": recommandations,
        "prochaine_echeance": datetime.combine(prochaine_echeance, datetime.min.time()) if prochaine_echeance else None,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.visites_evaluation.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/visites-evaluation", summary="Lister les visites d'évaluation")
async def list_visites_evaluation(
    beneficiaire_id: Optional[str] = None,
    current_user: dict = Depends(require_permission("conformite:read"))
):
    """Lister les visites d'évaluation avec optionnel filtre bénéficiaire."""
    db = get_db()
    query = {}
    if beneficiaire_id:
        query["beneficiaire_id"] = beneficiaire_id

    docs = await db.visites_evaluation.find(query).sort("date_visite", -1).to_list(length=500)
    return [serialize_doc(d) for d in docs]


@router.post("/projets-personnalises", summary="Créer un projet personnalisé")
async def create_projet_personnalise(
    beneficiaire_id: str,
    titre: str,
    objectifs: List[str],
    axes_travail: List[str],
    date_debut: date,
    date_revision: Optional[date] = None,
    intervenants_impliques: Optional[List[str]] = None,
    current_user: dict = Depends(require_permission("conformite:write"))
):
    """Créer un projet personnalisé pour un bénéficiaire."""
    db = get_db()

    try:
        ben = await db.beneficiaires.find_one({"_id": ObjectId(beneficiaire_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID bénéficiaire invalide")
    if not ben:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    if not objectifs:
        raise HTTPException(status_code=400, detail="Au moins un objectif requis")

    now = datetime.utcnow()
    doc = {
        "beneficiaire_id": beneficiaire_id,
        "titre": titre[:200],
        "objectifs": objectifs,
        "axes_travail": axes_travail,
        "date_debut": datetime.combine(date_debut, datetime.min.time()),
        "date_revision": datetime.combine(date_revision, datetime.min.time()) if date_revision else None,
        "intervenants_impliques": intervenants_impliques or [],
        "statut": "actif",
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.projets_personnalises.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/projets-personnalises", summary="Lister les projets personnalisés")
async def list_projets_personnalises(
    beneficiaire_id: Optional[str] = None,
    current_user: dict = Depends(require_permission("conformite:read"))
):
    """Lister les projets personnalisés."""
    db = get_db()
    query = {}
    if beneficiaire_id:
        query["beneficiaire_id"] = beneficiaire_id

    docs = await db.projets_personnalises.find(query).sort("created_at", -1).to_list(length=200)
    return [serialize_doc(d) for d in docs]
