"""Module facturation — Youdom Care CRM."""
import csv
import io
import logging
from datetime import datetime, date, timedelta
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import StreamingResponse

from database import get_db
from auth import require_permission
from models import (
    FactureCreate, FactureUpdate, FactureResponse,
    StatutFacture, TypeFinancement, LigneFacture
)
from utils import serialize_doc, generate_numero_dossier

logger = logging.getLogger(__name__)
router = APIRouter()


def format_facture(doc: dict) -> dict:
    return serialize_doc(doc) if doc else None


async def get_next_facture_number(db) -> str:
    result = await db.counters.find_one_and_update(
        {"_id": "factures"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return generate_numero_dossier("YC-FAC", result.get("seq", 1))


def calculer_montants(
    lignes: List[dict],
    taux_prise_en_charge: float = 0.0,
    montant_financement_force: Optional[float] = None,
) -> dict:
    """Calculer les montants totaux, part financeur et reste à charge."""
    montant_total_ht = sum(l["montant"] for l in lignes)
    if montant_financement_force is not None:
        montant_financement = min(montant_financement_force, montant_total_ht)
    else:
        montant_financement = round(montant_total_ht * taux_prise_en_charge / 100, 2)
    reste_a_charge = round(montant_total_ht - montant_financement, 2)
    return {
        "montant_total_ht": round(montant_total_ht, 2),
        "montant_financement": montant_financement,
        "reste_a_charge": reste_a_charge,
    }


async def enrichir_facture(doc: dict, db) -> dict:
    """Enrichir une facture avec les noms bénéficiaire."""
    if not doc:
        return doc
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
# CRUD Factures
# ============================================================

@router.get("", summary="Lister les factures")
async def list_factures(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    beneficiaire_id: Optional[str] = None,
    statut: Optional[StatutFacture] = None,
    type_financement: Optional[TypeFinancement] = None,
    impayees_seulement: bool = Query(False),
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    current_user: dict = Depends(require_permission("facturation:read"))
):
    """Liste paginée des factures avec filtres."""
    db = get_db()
    query = {}

    if beneficiaire_id:
        query["beneficiaire_id"] = beneficiaire_id
    if statut:
        query["statut_paiement"] = statut.value
    if type_financement:
        query["type_financement"] = type_financement.value
    if impayees_seulement:
        query["statut_paiement"] = StatutFacture.IMPAYEE.value
    if date_debut:
        query.setdefault("date_emission", {})["$gte"] = datetime.combine(date_debut, datetime.min.time())
    if date_fin:
        query.setdefault("date_emission", {})["$lte"] = datetime.combine(date_fin, datetime.max.time())

    total = await db.factures.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.factures.find(query).sort("date_emission", -1).skip(skip).limit(limit).to_list(length=limit)

    items = []
    for d in docs:
        items.append(await enrichir_facture(d, db))

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("", summary="Créer une facture", status_code=status.HTTP_201_CREATED)
async def create_facture(
    data: FactureCreate,
    current_user: dict = Depends(require_permission("facturation:write"))
):
    """Créer une nouvelle facture avec calcul automatique des montants."""
    db = get_db()

    # Vérifier le bénéficiaire
    try:
        ben = await db.beneficiaires.find_one({"_id": ObjectId(data.beneficiaire_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID bénéficiaire invalide")
    if not ben:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    lignes_dict = [l.model_dump() for l in data.lignes]
    montants = calculer_montants(
        lignes_dict,
        taux_prise_en_charge=data.taux_prise_en_charge,
        montant_financement_force=data.montant_financement,
    )

    numero = await get_next_facture_number(db)
    now = datetime.utcnow()
    echeance = (now + timedelta(days=30)).date()

    doc = {
        "numero": numero,
        "beneficiaire_id": data.beneficiaire_id,
        "periode_debut": datetime.combine(data.periode_debut, datetime.min.time()),
        "periode_fin": datetime.combine(data.periode_fin, datetime.min.time()),
        "lignes": lignes_dict,
        "montant_total_ht": montants["montant_total_ht"],
        "montant_financement": montants["montant_financement"],
        "reste_a_charge": montants["reste_a_charge"],
        "type_financement": data.type_financement.value,
        "taux_prise_en_charge": data.taux_prise_en_charge,
        "statut_paiement": StatutFacture.EMISE.value,
        "montant_paye": 0.0,
        "paiements": [],
        "date_paiement": None,
        "notes": data.notes,
        "date_emission": now,
        "date_echeance": datetime.combine(echeance, datetime.min.time()),
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.factures.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await enrichir_facture(doc, db)


@router.get("/stats/ca", summary="Statistiques chiffre d'affaires")
async def stats_ca(
    annee: int = Query(datetime.utcnow().year, ge=2020, le=2100),
    mois: Optional[int] = Query(None, ge=1, le=12),
    current_user: dict = Depends(require_permission("facturation:read"))
):
    """CA mensuel par service, par zone, par financement."""
    db = get_db()
    date_debut = datetime(annee, mois or 1, 1)
    if mois:
        # Dernier jour du mois
        if mois == 12:
            date_fin = datetime(annee + 1, 1, 1)
        else:
            date_fin = datetime(annee, mois + 1, 1)
    else:
        date_fin = datetime(annee + 1, 1, 1)

    pipeline_financement = [
        {"$match": {
            "date_emission": {"$gte": date_debut, "$lt": date_fin},
            "statut_paiement": {"$ne": StatutFacture.ANNULEE.value}
        }},
        {"$group": {
            "_id": "$type_financement",
            "ca_total": {"$sum": "$montant_total_ht"},
            "ca_encaisse": {"$sum": "$montant_paye"},
            "nombre_factures": {"$sum": 1},
        }}
    ]

    pipeline_mensuel = [
        {"$match": {
            "date_emission": {"$gte": datetime(annee, 1, 1), "$lt": datetime(annee + 1, 1, 1)},
            "statut_paiement": {"$ne": StatutFacture.ANNULEE.value}
        }},
        {"$group": {
            "_id": {"$month": "$date_emission"},
            "ca_total": {"$sum": "$montant_total_ht"},
            "ca_encaisse": {"$sum": "$montant_paye"},
            "nombre_factures": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}}
    ]

    # Impayés
    pipeline_impayes = [
        {"$match": {"statut_paiement": StatutFacture.IMPAYEE.value}},
        {"$group": {
            "_id": None,
            "montant_total": {"$sum": "$montant_total_ht"},
            "montant_paye": {"$sum": "$montant_paye"},
            "nombre": {"$sum": 1},
        }}
    ]

    ca_par_financement = await db.factures.aggregate(pipeline_financement).to_list(length=20)
    ca_mensuel = await db.factures.aggregate(pipeline_mensuel).to_list(length=12)
    impayes = await db.factures.aggregate(pipeline_impayes).to_list(length=1)

    mois_labels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
                   "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    ca_mensuel_formatte = []
    for m in range(1, 13):
        trouve = next((x for x in ca_mensuel if x["_id"] == m), None)
        ca_mensuel_formatte.append({
            "mois": m,
            "label": mois_labels[m - 1],
            "ca_total": trouve["ca_total"] if trouve else 0,
            "ca_encaisse": trouve["ca_encaisse"] if trouve else 0,
            "nombre_factures": trouve["nombre_factures"] if trouve else 0,
        })

    return {
        "annee": annee,
        "ca_par_financement": [
            {
                "financement": r["_id"],
                "ca_total": r["ca_total"],
                "ca_encaisse": r["ca_encaisse"],
                "nombre_factures": r["nombre_factures"],
            }
            for r in ca_par_financement
        ],
        "ca_mensuel": ca_mensuel_formatte,
        "impayes": impayes[0] if impayes else {"montant_total": 0, "montant_paye": 0, "nombre": 0},
    }


@router.get("/export/csv", summary="Exporter les factures en CSV")
async def export_factures_csv(
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    statut: Optional[StatutFacture] = None,
    current_user: dict = Depends(require_permission("facturation:read"))
):
    """Exporter les factures au format CSV."""
    db = get_db()
    query = {}
    if date_debut:
        query.setdefault("date_emission", {})["$gte"] = datetime.combine(date_debut, datetime.min.time())
    if date_fin:
        query.setdefault("date_emission", {})["$lte"] = datetime.combine(date_fin, datetime.max.time())
    if statut:
        query["statut_paiement"] = statut.value

    docs = await db.factures.find(query).sort("date_emission", -1).to_list(length=5000)

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "Numéro", "Bénéficiaire ID", "Période début", "Période fin",
        "Montant total HT", "Part financeur", "Reste à charge",
        "Type financement", "Taux prise en charge (%)",
        "Statut paiement", "Montant payé", "Date paiement",
        "Date émission", "Date échéance"
    ])

    for doc in docs:
        d = serialize_doc(doc)
        writer.writerow([
            d.get("numero", ""),
            d.get("beneficiaire_id", ""),
            d.get("periode_debut", "")[:10] if d.get("periode_debut") else "",
            d.get("periode_fin", "")[:10] if d.get("periode_fin") else "",
            d.get("montant_total_ht", 0),
            d.get("montant_financement", 0),
            d.get("reste_a_charge", 0),
            d.get("type_financement", ""),
            d.get("taux_prise_en_charge", 0),
            d.get("statut_paiement", ""),
            d.get("montant_paye", 0),
            d.get("date_paiement", "")[:10] if d.get("date_paiement") else "",
            d.get("date_emission", "")[:10] if d.get("date_emission") else "",
            d.get("date_echeance", "")[:10] if d.get("date_echeance") else "",
        ])

    output.seek(0)
    filename = f"factures_{date.today().isoformat()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/impayes", summary="Liste des impayés")
async def list_impayes(
    current_user: dict = Depends(require_permission("facturation:read"))
):
    """Lister toutes les factures impayées."""
    db = get_db()
    query = {
        "statut_paiement": {"$in": [StatutFacture.IMPAYEE.value, StatutFacture.EMISE.value]},
        "date_echeance": {"$lt": datetime.utcnow()}
    }
    docs = await db.factures.find(query).sort("date_echeance", 1).to_list(length=500)
    items = []
    for d in docs:
        items.append(await enrichir_facture(d, db))
    total_impaye = sum(
        d.get("montant_total_ht", 0) - d.get("montant_paye", 0) for d in [serialize_doc(d) for d in await db.factures.find(query).to_list(length=500)]
    )
    return {
        "items": items,
        "nombre": len(items),
        "montant_total_impaye": round(total_impaye, 2),
    }


@router.get("/{facture_id}", summary="Détail d'une facture")
async def get_facture(
    facture_id: str,
    current_user: dict = Depends(require_permission("facturation:read"))
):
    """Récupérer une facture par ID."""
    db = get_db()
    try:
        oid = ObjectId(facture_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID facture invalide")

    doc = await db.factures.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return await enrichir_facture(doc, db)


@router.patch("/{facture_id}", summary="Modifier une facture")
async def update_facture(
    facture_id: str,
    data: FactureUpdate,
    current_user: dict = Depends(require_permission("facturation:write"))
):
    """Mettre à jour le statut, paiement ou notes d'une facture."""
    db = get_db()
    try:
        oid = ObjectId(facture_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID facture invalide")

    doc = await db.factures.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")

    update = {"updated_at": datetime.utcnow()}

    if data.statut_paiement:
        update["statut_paiement"] = data.statut_paiement.value
    if data.montant_paye is not None:
        update["montant_paye"] = data.montant_paye
        # Recalculer le statut automatiquement
        montant_total = doc.get("montant_total_ht", 0)
        if data.montant_paye >= montant_total:
            update["statut_paiement"] = StatutFacture.PAYEE.value
        elif data.montant_paye > 0:
            update["statut_paiement"] = StatutFacture.PARTIELLEMENT_PAYEE.value
    if data.date_paiement:
        update["date_paiement"] = datetime.combine(data.date_paiement, datetime.min.time())
        # Enregistrer dans l'historique des paiements
        paiement_entry = {
            "date": datetime.combine(data.date_paiement, datetime.min.time()),
            "montant": data.montant_paye or 0,
            "enregistre_par": current_user["id"],
            "enregistre_at": datetime.utcnow(),
        }
        await db.factures.update_one({"_id": oid}, {"$push": {"paiements": paiement_entry}})
    if data.notes is not None:
        update["notes"] = data.notes
    if data.motif_annulation:
        update["statut_paiement"] = StatutFacture.ANNULEE.value
        update["motif_annulation"] = data.motif_annulation

    await db.factures.update_one({"_id": oid}, {"$set": update})
    doc = await db.factures.find_one({"_id": oid})
    return await enrichir_facture(doc, db)


@router.delete("/{facture_id}", summary="Supprimer une facture")
async def delete_facture(
    facture_id: str,
    current_user: dict = Depends(require_permission("facturation:write"))
):
    """Supprimer une facture (uniquement si en brouillon)."""
    db = get_db()
    try:
        oid = ObjectId(facture_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID facture invalide")

    doc = await db.factures.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")

    if doc.get("statut_paiement") not in [StatutFacture.BROUILLON.value, StatutFacture.ANNULEE.value]:
        raise HTTPException(
            status_code=409,
            detail="Seules les factures en brouillon ou annulées peuvent être supprimées"
        )

    await db.factures.delete_one({"_id": oid})
    return {"message": "Facture supprimée"}
