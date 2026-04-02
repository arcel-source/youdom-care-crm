"""Modèles Pydantic pour Youdom Care CRM."""
from datetime import datetime, date
from typing import Optional, List, Any
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
import re


# ============================================================
# ENUMS
# ============================================================

class RoleUtilisateur(str, Enum):
    ADMIN = "admin"
    DIRECTION = "direction"
    COORDINATION = "coordination"
    QUALITE = "qualite"
    COMPTABILITE = "comptabilite"
    INTERVENANT = "intervenant"


class StatutBeneficiaire(str, Enum):
    PROSPECT = "prospect"
    ACTIF = "actif"
    SUSPENDU = "suspendu"
    TERMINE = "termine"
    ARCHIVE = "archive"


class TypePublic(str, Enum):
    PERSONNE_AGEE = "personne_agee"
    HANDICAP = "handicap"
    ENFANT_HANDICAP = "enfant_handicap"
    MALADE = "malade"
    AUTRE = "autre"


class NiveauDependance(str, Enum):
    GIR1 = "GIR1"
    GIR2 = "GIR2"
    GIR3 = "GIR3"
    GIR4 = "GIR4"
    GIR5 = "GIR5"
    GIR6 = "GIR6"
    NON_EVALUE = "non_evalue"


class TypeHandicap(str, Enum):
    MOTEUR = "moteur"
    COGNITIF = "cognitif"
    SENSORIEL = "sensoriel"
    PSYCHIQUE = "psychique"
    POLYHANDICAP = "polyhandicap"
    AUTRE = "autre"


class TypeContrat(str, Enum):
    PRESTATAIRE = "prestataire"
    MANDATAIRE = "mandataire"
    GREMUNERATION = "gre_a_gre"


class StatutLead(str, Enum):
    NOUVEAU = "nouveau"
    QUALIFICATION = "qualification"
    VISITE_DOMICILE = "visite_domicile"
    DEVIS_ENVOYE = "devis_envoye"
    ACCEPTE = "accepte"
    EN_COURS = "en_cours"
    TERMINE = "termine"
    PERDU = "perdu"
    ARCHIVE = "archive"


class SourceLead(str, Enum):
    SITE_WEB = "site_web"
    GOOGLE_ADS = "google_ads"
    PRESCRIPTEUR = "prescripteur"
    APPEL = "appel"
    BOUCHE_A_OREILLE = "bouche_a_oreille"
    RESEAUX_SOCIAUX = "reseaux_sociaux"
    AUTRE = "autre"


class TypeService(str, Enum):
    AUTONOMIE = "autonomie"
    MENAGE = "menage"
    NUIT = "nuit"
    ACCOMPAGNEMENT = "accompagnement"
    GARDE_ENFANT_HANDICAP = "garde_enfant_handicap"
    PORTAGE_REPAS = "portage_repas"
    TELESURVEILLANCE = "telesurveillance"


class StatutDevis(str, Enum):
    BROUILLON = "brouillon"
    ENVOYE = "envoye"
    ACCEPTE = "accepte"
    EN_ATTENTE_AIDE = "en_attente_aide"
    REFUSE = "refuse"
    EXPIRE = "expire"


class StatutFacture(str, Enum):
    BROUILLON = "brouillon"
    EMISE = "emise"
    PARTIELLEMENT_PAYEE = "partiellement_payee"
    PAYEE = "payee"
    IMPAYEE = "impayee"
    ANNULEE = "annulee"


class TypeFinancement(str, Enum):
    APA = "apa"
    PCH = "pch"
    MUTUELLE = "mutuelle"
    CAISSE_RETRAITE = "caisse_retraite"
    AIDE_SOCIALE = "aide_sociale"
    PARTICULIER = "particulier"


class PrioriteTicket(str, Enum):
    FAIBLE = "faible"
    NORMALE = "normale"
    HAUTE = "haute"
    URGENTE = "urgente"


class StatutTicket(str, Enum):
    OUVERT = "ouvert"
    EN_COURS = "en_cours"
    EN_ATTENTE = "en_attente"
    RESOLU = "resolu"
    FERME = "ferme"


class TypeTicket(str, Enum):
    RECLAMATION = "reclamation"
    INCIDENT = "incident"
    SIGNAL_FAIBLE = "signal_faible"
    SUGGESTION = "suggestion"


class TypeNotification(str, Enum):
    NOUVEAU_LEAD = "nouveau_lead"
    LEAD_CHAUD = "lead_chaud"
    INTERVENTION_PLANIFIEE = "intervention_planifiee"
    ABSENCE_INTERVENANT = "absence_intervenant"
    INCIDENT = "incident"
    FACTURE = "facture"
    FIN_DROITS_APA = "fin_droits_apa"
    FIN_DROITS_PCH = "fin_droits_pch"
    RAPPEL_EVALUATION = "rappel_evaluation"
    NOUVEAU_MESSAGE = "nouveau_message"


class StatutIntervenant(str, Enum):
    ACTIF = "actif"
    INACTIF = "inactif"
    CONGE = "conge"
    ARRET_MALADIE = "arret_maladie"


class TypeStructurePrescripteur(str, Enum):
    HOPITAL = "hopital"
    CLINIQUE = "clinique"
    CLIC = "clic"
    MDPH = "mdph"
    CCAS = "ccas"
    EHPAD = "ehpad"
    RESIDENCE_AUTONOMIE = "residence_autonomie"
    ASSISTANTE_SOCIALE = "assistante_sociale"
    MEDECIN = "medecin"
    ASSOCIATION = "association"
    AUTRE = "autre"


class JourSemaine(str, Enum):
    LUNDI = "lundi"
    MARDI = "mardi"
    MERCREDI = "mercredi"
    JEUDI = "jeudi"
    VENDREDI = "vendredi"
    SAMEDI = "samedi"
    DIMANCHE = "dimanche"


class TypeRecurrence(str, Enum):
    AUCUNE = "aucune"
    QUOTIDIENNE = "quotidienne"
    HEBDOMADAIRE = "hebdomadaire"
    MENSUELLE = "mensuelle"


# ============================================================
# MODÈLES DE BASE
# ============================================================

class PyObjectId(str):
    """Wrapper pour les ObjectId MongoDB."""
    pass


class AdresseModel(BaseModel):
    rue: str = Field(..., min_length=2, max_length=200)
    complement: Optional[str] = Field(None, max_length=100)
    code_postal: str = Field(..., pattern=r"^\d{5}$")
    ville: str = Field(..., min_length=2, max_length=100)
    etage: Optional[str] = Field(None, max_length=20)
    digicode: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PersonneAPrevenir(BaseModel):
    nom: str = Field(..., min_length=1, max_length=100)
    prenom: str = Field(..., min_length=1, max_length=100)
    lien: str = Field(..., max_length=50)
    telephone: str = Field(..., max_length=20)
    email: Optional[EmailStr] = None
    est_contact_principal: bool = False


class AideAPA(BaseModel):
    gir: NiveauDependance = NiveauDependance.NON_EVALUE
    montant_mensuel: Optional[float] = Field(None, ge=0)
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    numero_decision: Optional[str] = Field(None, max_length=50)
    heures_accordees: Optional[float] = Field(None, ge=0)
    taux_participation: Optional[float] = Field(None, ge=0, le=100)


class AidePCH(BaseModel):
    type_pch: Optional[str] = Field(None, max_length=50)
    volume_heures_mensuel: Optional[float] = Field(None, ge=0)
    montant_mensuel: Optional[float] = Field(None, ge=0)
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    numero_decision: Optional[str] = Field(None, max_length=50)


class DisponibiliteIntervenant(BaseModel):
    jour: JourSemaine
    heure_debut: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    heure_fin: str = Field(..., pattern=r"^\d{2}:\d{2}$")


class TarifService(BaseModel):
    tarif_horaire_jour: float = Field(..., ge=0)
    tarif_horaire_nuit: Optional[float] = Field(None, ge=0)
    tarif_horaire_weekend: Optional[float] = Field(None, ge=0)
    tarif_horaire_ferie: Optional[float] = Field(None, ge=0)
    duree_minimum_minutes: int = Field(60, ge=15)


# ============================================================
# UTILISATEURS CRM
# ============================================================

class UserCreate(BaseModel):
    email: EmailStr
    nom: str = Field(..., min_length=1, max_length=100)
    prenom: str = Field(..., min_length=1, max_length=100)
    role: RoleUtilisateur = RoleUtilisateur.COORDINATION
    google_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    nom: str
    prenom: str
    role: RoleUtilisateur
    actif: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class UserUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    prenom: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[RoleUtilisateur] = None
    actif: Optional[bool] = None


# ============================================================
# BÉNÉFICIAIRES
# ============================================================

class BeneficiaireCreate(BaseModel):
    civilite: str = Field(..., pattern=r"^(M|Mme|Dr|Pr)$")
    nom: str = Field(..., min_length=1, max_length=100)
    prenom: str = Field(..., min_length=1, max_length=100)
    date_naissance: date
    numero_secu: Optional[str] = Field(None, max_length=200)  # Chiffré
    adresse: AdresseModel
    telephone_fixe: Optional[str] = Field(None, max_length=20)
    telephone_portable: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    type_public: TypePublic
    niveau_dependance: NiveauDependance = NiveauDependance.NON_EVALUE
    type_handicap: Optional[TypeHandicap] = None
    aide_apa: Optional[AideAPA] = None
    aide_pch: Optional[AidePCH] = None
    pathologies: Optional[List[str]] = Field(default_factory=list)
    consignes: Optional[str] = Field(None, max_length=2000)
    restrictions: Optional[str] = Field(None, max_length=1000)
    professionnels_sante: Optional[List[str]] = Field(default_factory=list)
    type_contrat: Optional[TypeContrat] = None
    date_debut_contrat: Optional[date] = None
    volume_heures_semaine: Optional[float] = Field(None, ge=0)
    personnes_a_prevenir: Optional[List[PersonneAPrevenir]] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=5000)

    @field_validator("date_naissance")
    @classmethod
    def validate_date_naissance(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 0 or age > 130:
            raise ValueError("Date de naissance invalide")
        return v


class BeneficiaireUpdate(BaseModel):
    civilite: Optional[str] = Field(None, pattern=r"^(M|Mme|Dr|Pr)$")
    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    prenom: Optional[str] = Field(None, min_length=1, max_length=100)
    date_naissance: Optional[date] = None
    adresse: Optional[AdresseModel] = None
    telephone_fixe: Optional[str] = Field(None, max_length=20)
    telephone_portable: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    type_public: Optional[TypePublic] = None
    niveau_dependance: Optional[NiveauDependance] = None
    type_handicap: Optional[TypeHandicap] = None
    aide_apa: Optional[AideAPA] = None
    aide_pch: Optional[AidePCH] = None
    pathologies: Optional[List[str]] = None
    consignes: Optional[str] = Field(None, max_length=2000)
    restrictions: Optional[str] = Field(None, max_length=1000)
    professionnels_sante: Optional[List[str]] = None
    type_contrat: Optional[TypeContrat] = None
    date_debut_contrat: Optional[date] = None
    volume_heures_semaine: Optional[float] = Field(None, ge=0)
    personnes_a_prevenir: Optional[List[PersonneAPrevenir]] = None
    notes: Optional[str] = Field(None, max_length=5000)
    statut: Optional[StatutBeneficiaire] = None


class BeneficiaireResponse(BaseModel):
    id: str
    numero_dossier: str
    civilite: str
    nom: str
    prenom: str
    date_naissance: date
    age: int
    adresse: AdresseModel
    telephone_fixe: Optional[str] = None
    telephone_portable: Optional[str] = None
    email: Optional[str] = None
    type_public: TypePublic
    niveau_dependance: NiveauDependance
    type_handicap: Optional[TypeHandicap] = None
    aide_apa: Optional[AideAPA] = None
    aide_pch: Optional[AidePCH] = None
    type_contrat: Optional[TypeContrat] = None
    date_debut_contrat: Optional[date] = None
    volume_heures_semaine: Optional[float] = None
    statut: StatutBeneficiaire
    personnes_a_prevenir: List[PersonneAPrevenir] = []
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================
# FAMILLES / AIDANTS
# ============================================================

class FamilleCreate(BaseModel):
    civilite: str = Field(..., pattern=r"^(M|Mme|Dr|Pr)$")
    nom: str = Field(..., min_length=1, max_length=100)
    prenom: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    telephone: str = Field(..., max_length=20)
    adresse: Optional[AdresseModel] = None
    beneficiaire_ids: List[str] = Field(..., min_length=1)
    role: str = Field(..., max_length=50)  # enfant, conjoint, tuteur, curateur
    autorisation_signature: bool = False
    autorisation_decisions: bool = False
    acces_portail: bool = False
    preference_canal: str = Field("email", pattern=r"^(email|sms|telephone)$")
    notes: Optional[str] = Field(None, max_length=2000)


class FamilleUpdate(BaseModel):
    civilite: Optional[str] = Field(None, pattern=r"^(M|Mme|Dr|Pr)$")
    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    prenom: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    telephone: Optional[str] = Field(None, max_length=20)
    adresse: Optional[AdresseModel] = None
    beneficiaire_ids: Optional[List[str]] = None
    role: Optional[str] = Field(None, max_length=50)
    autorisation_signature: Optional[bool] = None
    autorisation_decisions: Optional[bool] = None
    acces_portail: Optional[bool] = None
    preference_canal: Optional[str] = Field(None, pattern=r"^(email|sms|telephone)$")
    notes: Optional[str] = Field(None, max_length=2000)


class FamilleResponse(BaseModel):
    id: str
    civilite: str
    nom: str
    prenom: str
    email: Optional[str] = None
    telephone: str
    adresse: Optional[AdresseModel] = None
    beneficiaire_ids: List[str]
    role: str
    autorisation_signature: bool
    autorisation_decisions: bool
    acces_portail: bool
    preference_canal: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================
# INTERVENANTS
# ============================================================

class IntervenantCreate(BaseModel):
    civilite: str = Field(..., pattern=r"^(M|Mme|Dr|Pr)$")
    nom: str = Field(..., min_length=1, max_length=100)
    prenom: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    telephone: str = Field(..., max_length=20)
    date_naissance: Optional[date] = None
    adresse: Optional[AdresseModel] = None
    type_contrat_rh: Optional[str] = Field(None, max_length=50)  # CDI, CDD, etc.
    poste: Optional[str] = Field(None, max_length=100)
    diplomes: Optional[List[str]] = Field(default_factory=list)
    formations: Optional[List[str]] = Field(default_factory=list)
    competences: Optional[List[str]] = Field(default_factory=list)
    disponibilites: Optional[List[DisponibiliteIntervenant]] = Field(default_factory=list)
    secteur_geographique: Optional[List[str]] = Field(default_factory=list)
    moyen_transport: Optional[str] = Field(None, max_length=50)
    contraintes: Optional[List[str]] = Field(default_factory=list)  # pas de nuits, etc.
    notes: Optional[str] = Field(None, max_length=2000)


class IntervenantUpdate(BaseModel):
    civilite: Optional[str] = Field(None, pattern=r"^(M|Mme|Dr|Pr)$")
    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    prenom: Optional[str] = Field(None, min_length=1, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    adresse: Optional[AdresseModel] = None
    statut: Optional[StatutIntervenant] = None
    type_contrat_rh: Optional[str] = Field(None, max_length=50)
    poste: Optional[str] = Field(None, max_length=100)
    diplomes: Optional[List[str]] = None
    formations: Optional[List[str]] = None
    competences: Optional[List[str]] = None
    disponibilites: Optional[List[DisponibiliteIntervenant]] = None
    secteur_geographique: Optional[List[str]] = None
    moyen_transport: Optional[str] = Field(None, max_length=50)
    contraintes: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=2000)


class IntervenantResponse(BaseModel):
    id: str
    civilite: str
    nom: str
    prenom: str
    email: str
    telephone: str
    date_naissance: Optional[date] = None
    adresse: Optional[AdresseModel] = None
    statut: StatutIntervenant
    type_contrat_rh: Optional[str] = None
    poste: Optional[str] = None
    diplomes: List[str] = []
    formations: List[str] = []
    competences: List[str] = []
    disponibilites: List[DisponibiliteIntervenant] = []
    secteur_geographique: List[str] = []
    moyen_transport: Optional[str] = None
    contraintes: List[str] = []
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================
# PRESCRIPTEURS
# ============================================================

class PrescripteurCreate(BaseModel):
    civilite: Optional[str] = Field(None, pattern=r"^(M|Mme|Dr|Pr)$")
    nom: str = Field(..., min_length=1, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    organisation: Optional[str] = Field(None, max_length=200)
    type_structure: TypeStructurePrescripteur
    email: Optional[EmailStr] = None
    telephone: Optional[str] = Field(None, max_length=20)
    adresse: Optional[AdresseModel] = None
    notes: Optional[str] = Field(None, max_length=2000)


class PrescripteurUpdate(BaseModel):
    civilite: Optional[str] = Field(None, pattern=r"^(M|Mme|Dr|Pr)$")
    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    organisation: Optional[str] = Field(None, max_length=200)
    type_structure: Optional[TypeStructurePrescripteur] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = Field(None, max_length=20)
    adresse: Optional[AdresseModel] = None
    notes: Optional[str] = Field(None, max_length=2000)


class PrescripteurResponse(BaseModel):
    id: str
    civilite: Optional[str] = None
    nom: str
    prenom: Optional[str] = None
    organisation: Optional[str] = None
    type_structure: TypeStructurePrescripteur
    email: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[AdresseModel] = None
    notes: Optional[str] = None
    nombre_leads: int = 0
    created_at: datetime
    updated_at: datetime


# ============================================================
# SERVICES
# ============================================================

class ServiceCreate(BaseModel):
    nom: str = Field(..., min_length=2, max_length=100)
    type_service: TypeService
    description: Optional[str] = Field(None, max_length=1000)
    tarif: TarifService
    duree_standard_minutes: int = Field(60, ge=15)
    conditions_specifiques: Optional[str] = Field(None, max_length=500)
    actif: bool = True


class ServiceUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    tarif: Optional[TarifService] = None
    duree_standard_minutes: Optional[int] = Field(None, ge=15)
    conditions_specifiques: Optional[str] = Field(None, max_length=500)
    actif: Optional[bool] = None


class ServiceResponse(BaseModel):
    id: str
    nom: str
    type_service: TypeService
    description: Optional[str] = None
    tarif: TarifService
    duree_standard_minutes: int
    conditions_specifiques: Optional[str] = None
    actif: bool
    created_at: datetime
    updated_at: datetime


# ============================================================
# LEADS
# ============================================================

class PlanAide(BaseModel):
    volume_heures_semaine: float = Field(..., ge=0)
    services: List[str] = Field(..., min_length=1)  # IDs de services
    frequence: str = Field(..., max_length=100)
    horaires_preferes: Optional[str] = Field(None, max_length=200)
    remarques: Optional[str] = Field(None, max_length=1000)
    estimation_mensuelle: Optional[float] = Field(None, ge=0)


class ChecklistVisiteModel(BaseModel):
    environnement_evalue: bool = False
    besoins_identifies: bool = False
    famille_rencontree: bool = False
    documents_recueillis: bool = False
    aide_apa_verifiee: bool = False
    aide_pch_verifiee: bool = False
    plan_aide_propose: bool = False
    consentement_obtenu: bool = False
    notes_visite: Optional[str] = Field(None, max_length=3000)
    date_visite: Optional[datetime] = None
    intervenant_visite: Optional[str] = None


class LeadCreate(BaseModel):
    nom: str = Field(..., min_length=1, max_length=100)
    prenom: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    telephone: str = Field(..., max_length=20)
    adresse: Optional[AdresseModel] = None
    type_public: Optional[TypePublic] = None
    source: SourceLead = SourceLead.APPEL
    prescripteur_id: Optional[str] = None
    description_besoin: Optional[str] = Field(None, max_length=2000)
    urgence: Optional[str] = Field(None, pattern=r"^(faible|normale|haute|urgente)$")
    notes: Optional[str] = Field(None, max_length=2000)


class LeadUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    prenom: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    telephone: Optional[str] = Field(None, max_length=20)
    adresse: Optional[AdresseModel] = None
    type_public: Optional[TypePublic] = None
    source: Optional[SourceLead] = None
    prescripteur_id: Optional[str] = None
    description_besoin: Optional[str] = Field(None, max_length=2000)
    urgence: Optional[str] = Field(None, pattern=r"^(faible|normale|haute|urgente)$")
    statut: Optional[StatutLead] = None
    plan_aide: Optional[PlanAide] = None
    checklist_visite: Optional[ChecklistVisiteModel] = None
    notes: Optional[str] = Field(None, max_length=2000)
    motif_perte: Optional[str] = Field(None, max_length=500)


class LeadResponse(BaseModel):
    id: str
    nom: str
    prenom: str
    email: Optional[str] = None
    telephone: str
    adresse: Optional[AdresseModel] = None
    type_public: Optional[TypePublic] = None
    source: SourceLead
    prescripteur_id: Optional[str] = None
    statut: StatutLead
    score: int = 0
    description_besoin: Optional[str] = None
    urgence: Optional[str] = None
    plan_aide: Optional[PlanAide] = None
    checklist_visite: Optional[ChecklistVisiteModel] = None
    notes: Optional[str] = None
    motif_perte: Optional[str] = None
    beneficiaire_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================
# PLANNING
# ============================================================

class InterventionCreate(BaseModel):
    beneficiaire_id: str
    intervenant_id: str
    service_id: str
    date_debut: datetime
    date_fin: datetime
    recurrence: TypeRecurrence = TypeRecurrence.AUCUNE
    jours_recurrence: Optional[List[JourSemaine]] = None
    date_fin_recurrence: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)

    @model_validator(mode='after')
    def validate_dates(self):
        if self.date_fin <= self.date_debut:
            raise ValueError("La date de fin doit être après la date de début")
        duration = (self.date_fin - self.date_debut).total_seconds() / 60
        if duration < 15:
            raise ValueError("La durée minimale est de 15 minutes")
        return self


class InterventionUpdate(BaseModel):
    intervenant_id: Optional[str] = None
    service_id: Optional[str] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    statut: Optional[str] = Field(None, pattern=r"^(planifie|realise|annule|absent)$")
    notes: Optional[str] = Field(None, max_length=1000)
    notes_realisation: Optional[str] = Field(None, max_length=2000)


class InterventionResponse(BaseModel):
    id: str
    beneficiaire_id: str
    beneficiaire_nom: Optional[str] = None
    intervenant_id: str
    intervenant_nom: Optional[str] = None
    service_id: str
    service_nom: Optional[str] = None
    date_debut: datetime
    date_fin: datetime
    duree_minutes: int
    statut: str
    recurrence: TypeRecurrence
    jours_recurrence: Optional[List[JourSemaine]] = None
    notes: Optional[str] = None
    notes_realisation: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================
# DEVIS / CONTRATS
# ============================================================

class LigneDevis(BaseModel):
    service_id: str
    service_nom: str
    description: Optional[str] = None
    quantite_heures: float = Field(..., ge=0)
    tarif_horaire: float = Field(..., ge=0)
    montant_total: float = Field(..., ge=0)


class DevisCreate(BaseModel):
    beneficiaire_id: str
    lignes: List[LigneDevis] = Field(..., min_length=1)
    date_validite: Optional[date] = None
    taux_prise_en_charge: Optional[float] = Field(None, ge=0, le=100)
    type_financement: Optional[TypeFinancement] = None
    notes: Optional[str] = Field(None, max_length=2000)
    conditions: Optional[str] = Field(None, max_length=2000)


class DevisUpdate(BaseModel):
    lignes: Optional[List[LigneDevis]] = None
    statut: Optional[StatutDevis] = None
    date_validite: Optional[date] = None
    taux_prise_en_charge: Optional[float] = Field(None, ge=0, le=100)
    type_financement: Optional[TypeFinancement] = None
    notes: Optional[str] = Field(None, max_length=2000)
    conditions: Optional[str] = Field(None, max_length=2000)
    motif_refus: Optional[str] = Field(None, max_length=500)


class DevisResponse(BaseModel):
    id: str
    numero: str
    beneficiaire_id: str
    beneficiaire_nom: Optional[str] = None
    statut: StatutDevis
    lignes: List[LigneDevis]
    montant_total_ht: float
    montant_prise_en_charge: float
    reste_a_charge: float
    taux_prise_en_charge: Optional[float] = None
    type_financement: Optional[TypeFinancement] = None
    date_validite: Optional[date] = None
    notes: Optional[str] = None
    conditions: Optional[str] = None
    motif_refus: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================
# FACTURATION
# ============================================================

class LigneFacture(BaseModel):
    description: str = Field(..., max_length=200)
    quantite: float = Field(..., ge=0)
    tarif_unitaire: float = Field(..., ge=0)
    montant: float = Field(..., ge=0)
    type_horaire: str = Field("jour", pattern=r"^(jour|nuit|weekend|ferie)$")


class FactureCreate(BaseModel):
    beneficiaire_id: str
    periode_debut: date
    periode_fin: date
    lignes: List[LigneFacture] = Field(..., min_length=1)
    type_financement: TypeFinancement = TypeFinancement.PARTICULIER
    taux_prise_en_charge: float = Field(0, ge=0, le=100)
    montant_financement: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=2000)


class FactureUpdate(BaseModel):
    statut_paiement: Optional[StatutFacture] = None
    montant_paye: Optional[float] = Field(None, ge=0)
    date_paiement: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=2000)
    motif_annulation: Optional[str] = Field(None, max_length=500)


class FactureResponse(BaseModel):
    id: str
    numero: str
    beneficiaire_id: str
    beneficiaire_nom: Optional[str] = None
    periode_debut: date
    periode_fin: date
    lignes: List[LigneFacture]
    montant_total_ht: float
    montant_financement: float
    reste_a_charge: float
    type_financement: TypeFinancement
    taux_prise_en_charge: float
    statut_paiement: StatutFacture
    montant_paye: float
    date_paiement: Optional[date] = None
    notes: Optional[str] = None
    date_emission: datetime
    date_echeance: Optional[date] = None
    created_at: datetime
    updated_at: datetime


# ============================================================
# QUALITÉ
# ============================================================

class TicketQualiteCreate(BaseModel):
    type_ticket: TypeTicket
    titre: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    beneficiaire_id: Optional[str] = None
    intervenant_id: Optional[str] = None
    priorite: PrioriteTicket = PrioriteTicket.NORMALE
    responsable_id: Optional[str] = None
    date_limite: Optional[date] = None


class TicketQualiteUpdate(BaseModel):
    titre: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    priorite: Optional[PrioriteTicket] = None
    statut: Optional[StatutTicket] = None
    responsable_id: Optional[str] = None
    date_limite: Optional[date] = None
    resolution: Optional[str] = Field(None, max_length=5000)


class CommentaireTicket(BaseModel):
    auteur_id: str
    auteur_nom: str
    contenu: str = Field(..., min_length=1, max_length=2000)
    created_at: datetime


class TicketQualiteResponse(BaseModel):
    id: str
    numero: str
    type_ticket: TypeTicket
    titre: str
    description: str
    beneficiaire_id: Optional[str] = None
    beneficiaire_nom: Optional[str] = None
    intervenant_id: Optional[str] = None
    priorite: PrioriteTicket
    statut: StatutTicket
    responsable_id: Optional[str] = None
    date_limite: Optional[date] = None
    resolution: Optional[str] = None
    commentaires: List[CommentaireTicket] = []
    created_by: str
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None


# ============================================================
# NOTIFICATIONS
# ============================================================

class NotificationCreate(BaseModel):
    user_id: str
    type_notification: TypeNotification
    titre: str = Field(..., max_length=200)
    message: str = Field(..., max_length=1000)
    lien: Optional[str] = Field(None, max_length=200)
    data: Optional[dict] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type_notification: TypeNotification
    titre: str
    message: str
    lien: Optional[str] = None
    lu: bool
    created_at: datetime


# ============================================================
# COMMUNICATIONS
# ============================================================

class CommunicationCreate(BaseModel):
    destinataire_id: str
    type_acteur: str = Field(..., pattern=r"^(beneficiaire|famille|intervenant|prescripteur)$")
    canal: str = Field(..., pattern=r"^(email|sms|telephone|courrier)$")
    sujet: Optional[str] = Field(None, max_length=200)
    contenu: str = Field(..., min_length=1, max_length=10000)
    template_id: Optional[str] = None


class CommunicationResponse(BaseModel):
    id: str
    destinataire_id: str
    destinataire_nom: Optional[str] = None
    type_acteur: str
    canal: str
    sujet: Optional[str] = None
    contenu: str
    statut_envoi: str
    auteur_id: str
    auteur_nom: Optional[str] = None
    created_at: datetime


# ============================================================
# CONFORMITÉ APA/PCH
# ============================================================

class DocumentConformiteCreate(BaseModel):
    beneficiaire_id: str
    type_aide: str = Field(..., pattern=r"^(apa|pch|apl|aide_sociale|mutuelle|autre)$")
    titre: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    date_attribution: Optional[date] = None
    date_expiration: Optional[date] = None
    montant_mensuel: Optional[float] = Field(None, ge=0)
    organisme: Optional[str] = Field(None, max_length=200)
    numero_decision: Optional[str] = Field(None, max_length=100)
    fichier_nom: Optional[str] = Field(None, max_length=200)
    alerte_avant_jours: int = Field(30, ge=1, le=365)


class DocumentConformiteResponse(BaseModel):
    id: str
    beneficiaire_id: str
    beneficiaire_nom: Optional[str] = None
    type_aide: str
    titre: str
    description: Optional[str] = None
    date_attribution: Optional[date] = None
    date_expiration: Optional[date] = None
    jours_restants: Optional[int] = None
    est_expire: bool = False
    alerte_active: bool = False
    montant_mensuel: Optional[float] = None
    organisme: Optional[str] = None
    numero_decision: Optional[str] = None
    alerte_avant_jours: int
    created_at: datetime
    updated_at: datetime


# ============================================================
# MAGIC LINK PORTAIL
# ============================================================

class MagicLinkRequest(BaseModel):
    email: EmailStr
    type_acteur: str = Field(..., pattern=r"^(famille|beneficiaire)$")


# ============================================================
# PAGINATION
# ============================================================

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    search: Optional[str] = Field(None, max_length=100)


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int
