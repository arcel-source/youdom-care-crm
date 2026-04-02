"""Module tableaux de bord — Youdom Care CRM."""
import logging
from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query

from database import get_db
from auth import require_permission
from models import StatutFacture, StatutTicket, PrioriteTicket, StatutLead, StatutBeneficiaire

logger = logging.getLogger(__name__)
router = APIRouter()


def mois_courant_range():
    """Retourner le début et la fin du mois courant."""
    today = datetime.utcnow()
    debut = datetime(today.year, today.month, 1)
    if today.month == 12:
        fin = datetime(today.year + 1, 1, 1)
    else:
        fin = datetime(today.year, today.month + 1, 1)
    return debut, fin


# ============================================================
# Dashboard Activité
# ============================================================

@router.get("/activite", summary="Dashboard activité opérationnelle")
async def dashboard_activite(
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """
    Indicateurs d'activité :
    - Bénéficiaires actifs
    - Heures planifiées et réalisées ce mois
    - Taux d'occupation intervenants
    - Interventions par statut
    """
    db = get_db()
    debut_mois, fin_mois = mois_courant_range()

    # Bénéficiaires actifs
    nb_beneficiaires_actifs = await db.beneficiaires.count_documents(
        {"statut": StatutBeneficiaire.ACTIF.value}
    )
    nb_beneficiaires_total = await db.beneficiaires.count_documents({})

    # Intervenants actifs
    nb_intervenants_actifs = await db.intervenants.count_documents({"statut": "actif"})

    # Interventions du mois
    interventions_mois = await db.planning.find(
        {"date_debut": {"$gte": debut_mois, "$lt": fin_mois}}
    ).to_list(length=10000)

    heures_planifiees = 0.0
    heures_realisees = 0.0
    par_statut = {}
    for intv in interventions_mois:
        duree_h = (intv.get("date_fin", intv["date_debut"]) - intv["date_debut"]).total_seconds() / 3600
        statut = intv.get("statut", "planifie")
        par_statut[statut] = par_statut.get(statut, 0) + 1
        heures_planifiees += duree_h
        if statut == "realise":
            heures_realisees += duree_h

    taux_realisation = round(heures_realisees / heures_planifiees * 100, 1) if heures_planifiees > 0 else 0

    # Taux d'occupation intervenants (heures réalisées / capacité théorique 35h/sem * 4)
    capacite_theorique_mensuelle = nb_intervenants_actifs * 35 * 4
    taux_occupation = round(heures_realisees / capacite_theorique_mensuelle * 100, 1) if capacite_theorique_mensuelle > 0 else 0

    # Interventions aujourd'hui
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    nb_interventions_aujourd_hui = await db.planning.count_documents(
        {"date_debut": {"$gte": today, "$lt": tomorrow}}
    )

    return {
        "beneficiaires": {
            "actifs": nb_beneficiaires_actifs,
            "total": nb_beneficiaires_total,
        },
        "intervenants": {
            "actifs": nb_intervenants_actifs,
        },
        "interventions_mois": {
            "heures_planifiees": round(heures_planifiees, 1),
            "heures_realisees": round(heures_realisees, 1),
            "taux_realisation_pct": taux_realisation,
            "par_statut": par_statut,
            "total": len(interventions_mois),
        },
        "taux_occupation_intervenants_pct": taux_occupation,
        "interventions_aujourd_hui": nb_interventions_aujourd_hui,
        "periode": {
            "debut": debut_mois.isoformat(),
            "fin": fin_mois.isoformat(),
        },
    }


# ============================================================
# Dashboard Qualité
# ============================================================

@router.get("/qualite", summary="Dashboard qualité")
async def dashboard_qualite(
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """
    Indicateurs qualité :
    - Incidents ouverts/en cours
    - Réclamations par statut
    - Délai moyen de traitement
    - Score satisfaction moyen
    """
    db = get_db()

    # Tickets par type et statut
    pipeline_par_type = [
        {"$group": {
            "_id": {"type": "$type_ticket", "statut": "$statut"},
            "count": {"$sum": 1}
        }}
    ]
    par_type_statut = await db.tickets_qualite.aggregate(pipeline_par_type).to_list(length=50)

    # Tickets urgents non résolus
    urgents_ouverts = await db.tickets_qualite.count_documents({
        "priorite": PrioriteTicket.URGENTE.value,
        "statut": {"$nin": [StatutTicket.FERME.value, StatutTicket.RESOLU.value]}
    })

    # Délai moyen de résolution
    pipeline_delai = [
        {"$match": {"closed_at": {"$ne": None}}},
        {"$project": {
            "delai_jours": {
                "$divide": [
                    {"$subtract": ["$closed_at", "$created_at"]},
                    86400000
                ]
            }
        }},
        {"$group": {"_id": None, "delai_moyen": {"$avg": "$delai_jours"}}}
    ]
    delai_res = await db.tickets_qualite.aggregate(pipeline_delai).to_list(length=1)
    delai_moyen = round(delai_res[0]["delai_moyen"], 1) if delai_res else None

    # Score satisfaction moyen global
    pipeline_satisfaction = [
        {"$unwind": "$reponses"},
        {"$group": {"_id": None, "score_moyen": {"$avg": "$reponses.score"}, "nb_reponses": {"$sum": 1}}}
    ]
    satisfaction_res = await db.enquetes_satisfaction.aggregate(pipeline_satisfaction).to_list(length=1)
    satisfaction = satisfaction_res[0] if satisfaction_res else {"score_moyen": None, "nb_reponses": 0}

    # Résumé par type
    types_summary = {}
    for item in par_type_statut:
        t = item["_id"]["type"]
        s = item["_id"]["statut"]
        if t not in types_summary:
            types_summary[t] = {}
        types_summary[t][s] = item["count"]

    total_ouverts = await db.tickets_qualite.count_documents(
        {"statut": {"$in": [StatutTicket.OUVERT.value, StatutTicket.EN_COURS.value]}}
    )

    return {
        "tickets": {
            "total_ouverts": total_ouverts,
            "urgents_ouverts": urgents_ouverts,
            "par_type": types_summary,
            "delai_moyen_resolution_jours": delai_moyen,
        },
        "satisfaction": {
            "score_moyen": round(satisfaction["score_moyen"], 2) if satisfaction.get("score_moyen") else None,
            "nb_reponses": satisfaction.get("nb_reponses", 0),
            "echelle": "1 à 5",
        },
    }


# ============================================================
# Dashboard Commercial
# ============================================================

@router.get("/commercial", summary="Dashboard commercial / leads")
async def dashboard_commercial(
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """
    Indicateurs commerciaux :
    - Leads par statut
    - Taux de conversion
    - Délai moyen de conversion
    - Sources de leads
    """
    db = get_db()
    debut_mois, fin_mois = mois_courant_range()

    # Leads par statut
    par_statut = await db.leads.aggregate([
        {"$group": {"_id": "$statut", "count": {"$sum": 1}}}
    ]).to_list(length=20)

    # Leads par source
    par_source = await db.leads.aggregate([
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]).to_list(length=20)

    # Leads ce mois
    leads_mois = await db.leads.count_documents(
        {"created_at": {"$gte": debut_mois, "$lt": fin_mois}}
    )

    # Leads convertis (accepté/en_cours/terminé)
    leads_convertis_total = await db.leads.count_documents(
        {"statut": {"$in": ["accepte", "en_cours", "termine"]}}
    )
    leads_total = await db.leads.count_documents({})
    taux_conversion = round(leads_convertis_total / leads_total * 100, 1) if leads_total > 0 else 0

    # Leads perdus ce mois
    leads_perdus_mois = await db.leads.count_documents({
        "statut": "perdu",
        "updated_at": {"$gte": debut_mois, "$lt": fin_mois}
    })

    # Score moyen des leads actifs
    pipeline_score = [
        {"$match": {"statut": {"$in": ["nouveau", "qualification", "visite_domicile", "devis_envoye"]}}},
        {"$group": {"_id": None, "score_moyen": {"$avg": "$score"}}}
    ]
    score_res = await db.leads.aggregate(pipeline_score).to_list(length=1)
    score_moyen = round(score_res[0]["score_moyen"], 1) if score_res else None

    return {
        "leads": {
            "total": leads_total,
            "ce_mois": leads_mois,
            "perdus_ce_mois": leads_perdus_mois,
            "par_statut": {r["_id"]: r["count"] for r in par_statut},
            "par_source": {r["_id"]: r["count"] for r in par_source},
        },
        "conversion": {
            "leads_convertis": leads_convertis_total,
            "taux_conversion_pct": taux_conversion,
        },
        "score_moyen_leads_actifs": score_moyen,
        "periode": {
            "debut": debut_mois.isoformat(),
            "fin": fin_mois.isoformat(),
        },
    }


# ============================================================
# Dashboard Financier
# ============================================================

@router.get("/financier", summary="Dashboard financier")
async def dashboard_financier(
    annee: int = Query(datetime.utcnow().year, ge=2020, le=2100),
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """
    Indicateurs financiers :
    - CA mensuel de l'année
    - CA par type de financement
    - Montant impayés
    - Taux d'encaissement
    """
    db = get_db()
    debut_annee = datetime(annee, 1, 1)
    fin_annee = datetime(annee + 1, 1, 1)

    # CA mensuel
    pipeline_mensuel = [
        {"$match": {
            "date_emission": {"$gte": debut_annee, "$lt": fin_annee},
            "statut_paiement": {"$ne": StatutFacture.ANNULEE.value}
        }},
        {"$group": {
            "_id": {"$month": "$date_emission"},
            "ca_total": {"$sum": "$montant_total_ht"},
            "ca_encaisse": {"$sum": "$montant_paye"},
        }},
        {"$sort": {"_id": 1}}
    ]
    ca_mensuel_raw = await db.factures.aggregate(pipeline_mensuel).to_list(length=12)
    mois_labels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
                   "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    ca_mensuel = []
    for m in range(1, 13):
        trouve = next((x for x in ca_mensuel_raw if x["_id"] == m), None)
        ca_mensuel.append({
            "mois": m,
            "label": mois_labels[m - 1],
            "ca_total": round(trouve["ca_total"], 2) if trouve else 0,
            "ca_encaisse": round(trouve["ca_encaisse"], 2) if trouve else 0,
        })

    # CA par financement
    pipeline_financement = [
        {"$match": {
            "date_emission": {"$gte": debut_annee, "$lt": fin_annee},
            "statut_paiement": {"$ne": StatutFacture.ANNULEE.value}
        }},
        {"$group": {
            "_id": "$type_financement",
            "ca_total": {"$sum": "$montant_total_ht"},
            "ca_encaisse": {"$sum": "$montant_paye"},
            "nb_factures": {"$sum": 1},
        }}
    ]
    ca_par_financement = await db.factures.aggregate(pipeline_financement).to_list(length=20)

    # Impayés globaux
    pipeline_impayes = [
        {"$match": {"statut_paiement": {"$in": [StatutFacture.IMPAYEE.value, StatutFacture.EMISE.value]}}},
        {"$group": {
            "_id": None,
            "montant_total": {"$sum": "$montant_total_ht"},
            "montant_paye": {"$sum": "$montant_paye"},
            "nombre": {"$sum": 1}
        }}
    ]
    impayes_res = await db.factures.aggregate(pipeline_impayes).to_list(length=1)
    impayes = impayes_res[0] if impayes_res else {"montant_total": 0, "montant_paye": 0, "nombre": 0}
    montant_restant_impaye = round(impayes.get("montant_total", 0) - impayes.get("montant_paye", 0), 2)

    # CA total année
    ca_total_annee = sum(m["ca_total"] for m in ca_mensuel)
    ca_encaisse_annee = sum(m["ca_encaisse"] for m in ca_mensuel)
    taux_encaissement = round(ca_encaisse_annee / ca_total_annee * 100, 1) if ca_total_annee > 0 else 0

    return {
        "annee": annee,
        "ca_annuel": {
            "ca_total": round(ca_total_annee, 2),
            "ca_encaisse": round(ca_encaisse_annee, 2),
            "taux_encaissement_pct": taux_encaissement,
        },
        "ca_mensuel": ca_mensuel,
        "ca_par_financement": [
            {
                "financement": r["_id"],
                "ca_total": round(r["ca_total"], 2),
                "ca_encaisse": round(r["ca_encaisse"], 2),
                "nb_factures": r["nb_factures"],
            }
            for r in ca_par_financement
        ],
        "impayes": {
            "montant_restant": montant_restant_impaye,
            "nombre_factures": impayes.get("nombre", 0),
        },
    }


# ============================================================
# Dashboard Réglementaire
# ============================================================

@router.get("/reglementaire", summary="Dashboard réglementaire APA/PCH")
async def dashboard_reglementaire(
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """
    Indicateurs réglementaires :
    - Alertes fin de droits APA/PCH (30 jours)
    - Dossiers à réévaluer
    - Documents expirés
    """
    db = get_db()
    today = date.today()
    dans_30_jours = today + timedelta(days=30)
    dans_30_jours_dt = datetime.combine(dans_30_jours, datetime.min.time())
    today_dt = datetime.combine(today, datetime.min.time())

    # Documents conformité expirant dans 30 jours
    expirations_proches = await db.conformite_documents.find({
        "date_expiration": {
            "$gte": today_dt,
            "$lte": dans_30_jours_dt
        }
    }).to_list(length=200)

    # Documents déjà expirés
    expires = await db.conformite_documents.find({
        "date_expiration": {"$lt": today_dt}
    }).to_list(length=200)

    # Bénéficiaires APA expirant bientôt
    apa_expiration = await db.beneficiaires.find({
        "aide_apa.date_fin": {
            "$gte": today.isoformat(),
            "$lte": dans_30_jours.isoformat()
        }
    }).to_list(length=200)

    # Bénéficiaires PCH expirant bientôt
    pch_expiration = await db.beneficiaires.find({
        "aide_pch.date_fin": {
            "$gte": today.isoformat(),
            "$lte": dans_30_jours.isoformat()
        }
    }).to_list(length=200)

    # Enrichir avec noms bénéficiaires
    async def enrichir_docs(docs):
        result = []
        for doc in docs:
            d = {
                "id": str(doc.get("_id", "")),
                "beneficiaire_id": doc.get("beneficiaire_id", ""),
                "type_aide": doc.get("type_aide", ""),
                "titre": doc.get("titre", ""),
                "date_expiration": doc.get("date_expiration", ""),
            }
            if d["beneficiaire_id"]:
                try:
                    from bson import ObjectId
                    ben = await db.beneficiaires.find_one({"_id": ObjectId(d["beneficiaire_id"])})
                    if ben:
                        d["beneficiaire_nom"] = f"{ben.get('prenom', '')} {ben.get('nom', '')}".strip()
                except Exception:
                    pass
            result.append(d)
        return result

    async def enrichir_beneficiaires(docs, type_aide):
        result = []
        for doc in docs:
            aide = doc.get(f"aide_{type_aide}", {}) or {}
            result.append({
                "beneficiaire_id": str(doc.get("_id", "")),
                "beneficiaire_nom": f"{doc.get('prenom', '')} {doc.get('nom', '')}".strip(),
                "type_aide": type_aide.upper(),
                "date_fin": aide.get("date_fin", ""),
                "montant_mensuel": aide.get("montant_mensuel"),
            })
        return result

    exp_proches_enrichies = await enrichir_docs(expirations_proches)
    exp_expirees_enrichies = await enrichir_docs(expires)
    apa_enrichies = await enrichir_beneficiaires(apa_expiration, "apa")
    pch_enrichies = await enrichir_beneficiaires(pch_expiration, "pch")

    return {
        "alertes": {
            "documents_expirant_30j": len(expirations_proches),
            "documents_expires": len(expires),
            "apa_expirant_30j": len(apa_expiration),
            "pch_expirant_30j": len(pch_expiration),
            "total_alertes": len(expirations_proches) + len(expires) + len(apa_expiration) + len(pch_expiration),
        },
        "details": {
            "documents_expirant_bientot": exp_proches_enrichies,
            "documents_expires": exp_expirees_enrichies,
            "apa_expirant_bientot": apa_enrichies,
            "pch_expirant_bientot": pch_enrichies,
        },
        "date_calcul": today.isoformat(),
    }
