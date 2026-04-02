"""Module devis et contrats — Youdom Care CRM."""
import logging
import io
from datetime import datetime, date, timedelta
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import StreamingResponse

from database import get_db
from auth import require_permission
from models import DevisCreate, DevisUpdate, StatutDevis, TypeFinancement
from utils import serialize_doc, generate_numero_dossier, format_montant

logger = logging.getLogger(__name__)
router = APIRouter()


def calculate_totals(lignes: list, taux_prise_en_charge: float = 0) -> dict:
    """Calculer les totaux d'un devis."""
    montant_total = sum(l.get("montant_total", l.get("quantite_heures", 0) * l.get("tarif_horaire", 0)) for l in lignes)
    montant_pc = montant_total * (taux_prise_en_charge / 100) if taux_prise_en_charge else 0
    reste = montant_total - montant_pc
    return {
        "montant_total_ht": round(montant_total, 2),
        "montant_prise_en_charge": round(montant_pc, 2),
        "reste_a_charge": round(reste, 2),
    }


def format_devis(doc: dict) -> dict:
    return serialize_doc(doc) if doc else None


async def get_next_devis_number(db) -> str:
    result = await db.counters.find_one_and_update(
        {"_id": "devis"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return generate_numero_dossier("YC-DEV", result.get("seq", 1))


def generate_devis_pdf(devis: dict, beneficiaire: dict) -> bytes:
    """Générer le PDF d'un devis avec ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.colors import HexColor, black, white, grey
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    from reportlab.lib.units import cm
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    bleu = HexColor("#1e3a5f")
    vert = HexColor("#059669")

    title_style = ParagraphStyle(
        "title", parent=styles["Heading1"], textColor=bleu,
        fontSize=22, spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        "subtitle", parent=styles["Normal"], textColor=grey,
        fontSize=10, spaceAfter=12
    )
    header_style = ParagraphStyle(
        "header", parent=styles["Heading2"], textColor=bleu, fontSize=13
    )
    normal_style = styles["Normal"]
    normal_style.fontSize = 10

    elements = []

    # En-tête
    elements.append(Paragraph("YOUDOM CARE", title_style))
    elements.append(Paragraph("Service d'aide à domicile — Paris 12e", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=bleu))
    elements.append(Spacer(1, 0.5*cm))

    # Infos devis
    num = devis.get("numero", "N/A")
    date_creation = devis.get("created_at", datetime.utcnow())
    if isinstance(date_creation, str):
        try:
            date_creation = datetime.fromisoformat(date_creation)
        except Exception:
            date_creation = datetime.utcnow()
    date_str = date_creation.strftime("%d/%m/%Y")

    date_val = devis.get("date_validite")
    if date_val:
        if isinstance(date_val, str):
            try:
                date_val = datetime.fromisoformat(date_val).strftime("%d/%m/%Y")
            except Exception:
                date_val = str(date_val)
    else:
        date_val = "30 jours"

    info_data = [
        ["DEVIS", num],
        ["Date", date_str],
        ["Validité", date_val],
        ["Statut", devis.get("statut", "brouillon").upper()],
    ]
    info_table = Table(info_data, colWidths=[4*cm, 6*cm])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), HexColor("#f0f4f8")),
        ("TEXTCOLOR", (0, 0), (0, -1), bleu),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, grey),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.5*cm))

    # Bénéficiaire
    elements.append(Paragraph("BÉNÉFICIAIRE", header_style))
    ben_nom = f"{beneficiaire.get('prenom', '')} {beneficiaire.get('nom', '')}"
    adresse = beneficiaire.get("adresse", {})
    adr_str = ""
    if isinstance(adresse, dict):
        adr_str = f"{adresse.get('rue', '')} — {adresse.get('code_postal', '')} {adresse.get('ville', '')}"

    elements.append(Paragraph(f"<b>{ben_nom}</b>", normal_style))
    if adr_str:
        elements.append(Paragraph(adr_str, normal_style))
    elements.append(Spacer(1, 0.5*cm))

    # Lignes de devis
    elements.append(Paragraph("DÉTAIL DES PRESTATIONS", header_style))
    table_data = [
        ["Service", "Heures", "Tarif/h", "Montant"]
    ]
    for ligne in devis.get("lignes", []):
        qte = float(ligne.get("quantite_heures", 0))
        tarif = float(ligne.get("tarif_horaire", 0))
        montant = float(ligne.get("montant_total", qte * tarif))
        table_data.append([
            ligne.get("service_nom", ""),
            f"{qte:.1f}h",
            format_montant(tarif),
            format_montant(montant),
        ])

    prestations_table = Table(table_data, colWidths=[9*cm, 2.5*cm, 3*cm, 3*cm])
    prestations_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), bleu),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f8fafb")]),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    elements.append(prestations_table)
    elements.append(Spacer(1, 0.5*cm))

    # Totaux
    taux_pc = float(devis.get("taux_prise_en_charge", 0) or 0)
    totaux_data = [
        ["Total mensuel", format_montant(float(devis.get("montant_total_ht", 0)))],
        [f"Prise en charge ({taux_pc:.0f}%)", f"- {format_montant(float(devis.get('montant_prise_en_charge', 0)))}"],
        ["RESTE À CHARGE", format_montant(float(devis.get("reste_a_charge", 0)))],
    ]
    totaux_table = Table(totaux_data, colWidths=[12*cm, 5.5*cm])
    totaux_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("BACKGROUND", (0, 2), (-1, 2), vert),
        ("TEXTCOLOR", (0, 2), (-1, 2), white),
        ("FONTSIZE", (0, 2), (-1, 2), 12),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, 2), (-1, 2), 1.5, bleu),
    ]))
    elements.append(totaux_table)

    if devis.get("notes"):
        elements.append(Spacer(1, 0.5*cm))
        elements.append(Paragraph("NOTES", header_style))
        elements.append(Paragraph(devis["notes"], normal_style))

    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph(
        "Ce devis est établi selon les tarifs en vigueur. TVA non applicable, Art. 293 B du CGI.",
        ParagraphStyle("footnote", parent=styles["Normal"], fontSize=8, textColor=grey)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()


@router.get("", summary="Lister les devis/contrats")
async def list_devis(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    statut: Optional[StatutDevis] = None,
    beneficiaire_id: Optional[str] = None,
    current_user: dict = Depends(require_permission("devis_contrats:read"))
):
    """Liste paginée des devis et contrats."""
    db = get_db()
    query = {}
    if statut:
        query["statut"] = statut.value
    if beneficiaire_id:
        query["beneficiaire_id"] = beneficiaire_id

    total = await db.devis_contrats.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.devis_contrats.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    items = []
    for doc in docs:
        item = format_devis(doc)
        if doc.get("beneficiaire_id"):
            try:
                ben = await db.beneficiaires.find_one(
                    {"_id": ObjectId(doc["beneficiaire_id"])},
                    {"nom": 1, "prenom": 1}
                )
                if ben:
                    item["beneficiaire_nom"] = f"{ben.get('prenom', '')} {ben.get('nom', '')}"
            except Exception:
                pass
        items.append(item)

    return {"items": items, "total": total, "page": page, "limit": limit,
            "pages": (total + limit - 1) // limit if total > 0 else 0}


@router.post("", status_code=status.HTTP_201_CREATED, summary="Créer un devis")
async def create_devis(
    data: DevisCreate,
    current_user: dict = Depends(require_permission("devis_contrats:write"))
):
    """Créer un nouveau devis."""
    db = get_db()

    # Vérifier bénéficiaire
    try:
        ben = await db.beneficiaires.find_one({"_id": ObjectId(data.beneficiaire_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID bénéficiaire invalide")
    if not ben:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")

    numero = await get_next_devis_number(db)
    lignes = [l.model_dump() for l in data.lignes]
    totaux = calculate_totals(lignes, data.taux_prise_en_charge or 0)

    doc = {
        "numero": numero,
        "beneficiaire_id": data.beneficiaire_id,
        "statut": StatutDevis.BROUILLON.value,
        "lignes": lignes,
        **totaux,
        "taux_prise_en_charge": data.taux_prise_en_charge,
        "type_financement": data.type_financement.value if data.type_financement else None,
        "date_validite": data.date_validite.isoformat() if data.date_validite else None,
        "notes": data.notes,
        "conditions": data.conditions,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_user["id"],
    }

    result = await db.devis_contrats.insert_one(doc)
    created = await db.devis_contrats.find_one({"_id": result.inserted_id})
    logger.info(f"Devis créé: {numero} par {current_user['email']}")
    return format_devis(created)


@router.get("/{devis_id}", summary="Détail d'un devis")
async def get_devis(
    devis_id: str,
    current_user: dict = Depends(require_permission("devis_contrats:read"))
):
    """Récupérer les détails d'un devis."""
    db = get_db()
    try:
        doc = await db.devis_contrats.find_one({"_id": ObjectId(devis_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")
    if not doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")

    item = format_devis(doc)
    if doc.get("beneficiaire_id"):
        try:
            ben = await db.beneficiaires.find_one({"_id": ObjectId(doc["beneficiaire_id"])})
            if ben:
                item["beneficiaire_nom"] = f"{ben.get('prenom', '')} {ben.get('nom', '')}"
                item["beneficiaire_adresse"] = ben.get("adresse")
        except Exception:
            pass
    return item


@router.patch("/{devis_id}", summary="Modifier un devis")
async def update_devis(
    devis_id: str,
    data: DevisUpdate,
    current_user: dict = Depends(require_permission("devis_contrats:write"))
):
    """Modifier un devis."""
    db = get_db()
    try:
        obj_id = ObjectId(devis_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    existing = await db.devis_contrats.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Devis non trouvé")

    if existing["statut"] in [StatutDevis.ACCEPTE.value] and not current_user.get("role") in ["admin"]:
        raise HTTPException(status_code=400, detail="Impossible de modifier un devis accepté")

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}

    if "lignes" in update_data:
        update_data["lignes"] = [
            l.model_dump() if hasattr(l, "model_dump") else l
            for l in update_data["lignes"]
        ]
        taux = update_data.get("taux_prise_en_charge", existing.get("taux_prise_en_charge", 0)) or 0
        totaux = calculate_totals(update_data["lignes"], taux)
        update_data.update(totaux)

    if "statut" in update_data and hasattr(update_data["statut"], "value"):
        update_data["statut"] = update_data["statut"].value

    if "type_financement" in update_data and update_data["type_financement"]:
        if hasattr(update_data["type_financement"], "value"):
            update_data["type_financement"] = update_data["type_financement"].value

    if "date_validite" in update_data and isinstance(update_data["date_validite"], date):
        update_data["date_validite"] = update_data["date_validite"].isoformat()

    update_data["updated_at"] = datetime.utcnow()
    await db.devis_contrats.update_one({"_id": obj_id}, {"$set": update_data})

    updated = await db.devis_contrats.find_one({"_id": obj_id})
    return format_devis(updated)


@router.get("/{devis_id}/pdf", summary="Télécharger le devis en PDF")
async def download_devis_pdf(
    devis_id: str,
    current_user: dict = Depends(require_permission("devis_contrats:read"))
):
    """Générer et télécharger le devis en format PDF."""
    db = get_db()
    try:
        doc = await db.devis_contrats.find_one({"_id": ObjectId(devis_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")
    if not doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")

    beneficiaire = {}
    if doc.get("beneficiaire_id"):
        try:
            ben = await db.beneficiaires.find_one({"_id": ObjectId(doc["beneficiaire_id"])})
            if ben:
                beneficiaire = serialize_doc(ben)
        except Exception:
            pass

    try:
        pdf_bytes = generate_devis_pdf(serialize_doc(doc), beneficiaire)
    except Exception as e:
        logger.error(f"Erreur génération PDF devis: {e}")
        raise HTTPException(status_code=500, detail="Erreur génération PDF")

    filename = f"devis_{doc.get('numero', devis_id)}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/{devis_id}/envoyer", summary="Envoyer le devis par email")
async def send_devis(
    devis_id: str,
    current_user: dict = Depends(require_permission("devis_contrats:write"))
):
    """Marquer le devis comme envoyé."""
    db = get_db()
    try:
        obj_id = ObjectId(devis_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Identifiant invalide")

    result = await db.devis_contrats.update_one(
        {"_id": obj_id},
        {"$set": {
            "statut": StatutDevis.ENVOYE.value,
            "date_envoi": datetime.utcnow(),
            "envoye_par": current_user["email"],
            "updated_at": datetime.utcnow(),
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Devis non trouvé")

    return {"message": "Devis marqué comme envoyé"}
