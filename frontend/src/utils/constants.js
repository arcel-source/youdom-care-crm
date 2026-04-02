// Statuts bénéficiaires
export const BENEFICIAIRE_STATUTS = {
  ACTIF: 'actif',
  INACTIF: 'inactif',
  SUSPENDU: 'suspendu',
  EN_ATTENTE: 'en_attente',
};

export const BENEFICIAIRE_STATUT_LABELS = {
  actif: 'Actif',
  inactif: 'Inactif',
  suspendu: 'Suspendu',
  en_attente: 'En attente',
};

export const BENEFICIAIRE_STATUT_COLORS = {
  actif: '#10b981',
  inactif: '#6b7280',
  suspendu: '#f59e0b',
  en_attente: '#3b82f6',
};

// Types de public
export const TYPES_PUBLIC = {
  PERSONNES_AGEES: 'personnes_agees',
  HANDICAP: 'handicap',
  ENFANT: 'enfant',
  MALADIE: 'maladie',
  AUTRE: 'autre',
};

export const TYPES_PUBLIC_LABELS = {
  personnes_agees: 'Personnes âgées',
  handicap: 'Handicap',
  enfant: 'Enfant',
  maladie: 'Maladie',
  autre: 'Autre',
};

// Niveaux de dépendance GIR
export const NIVEAUX_DEPENDANCE = {
  GIR1: 'GIR1',
  GIR2: 'GIR2',
  GIR3: 'GIR3',
  GIR4: 'GIR4',
  GIR5: 'GIR5',
  GIR6: 'GIR6',
  NON_EVALUE: 'non_evalue',
};

export const NIVEAUX_DEPENDANCE_LABELS = {
  GIR1: 'GIR 1 (très dépendant)',
  GIR2: 'GIR 2',
  GIR3: 'GIR 3',
  GIR4: 'GIR 4',
  GIR5: 'GIR 5',
  GIR6: 'GIR 6 (autonome)',
  non_evalue: 'Non évalué',
};

// Statuts leads
export const LEAD_STATUTS = {
  NOUVEAU: 'nouveau',
  CONTACTE: 'contacte',
  QUALIFIE: 'qualifie',
  DEVIS_ENVOYE: 'devis_envoye',
  GAGNE: 'gagne',
  PERDU: 'perdu',
};

export const LEAD_STATUT_LABELS = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  qualifie: 'Qualifié',
  devis_envoye: 'Devis envoyé',
  gagne: 'Gagné',
  perdu: 'Perdu',
};

export const LEAD_STATUT_COLORS = {
  nouveau: '#3b82f6',
  contacte: '#8b5cf6',
  qualifie: '#f59e0b',
  devis_envoye: '#06b6d4',
  gagne: '#10b981',
  perdu: '#ef4444',
};

export const LEAD_SOURCES = {
  SITE_WEB: 'site_web',
  PRESCRIPTEUR: 'prescripteur',
  BOUCHE_A_OREILLE: 'bouche_a_oreille',
  PUBLICITE: 'publicite',
  HOPITAL: 'hopital',
  AUTRE: 'autre',
};

export const LEAD_SOURCE_LABELS = {
  site_web: 'Site web',
  prescripteur: 'Prescripteur',
  bouche_a_oreille: 'Bouche à oreille',
  publicite: 'Publicité',
  hopital: 'Hôpital',
  autre: 'Autre',
};

// Statuts devis
export const DEVIS_STATUTS = {
  BROUILLON: 'brouillon',
  ENVOYE: 'envoye',
  ACCEPTE: 'accepte',
  REFUSE: 'refuse',
  EXPIRE: 'expire',
};

export const DEVIS_STATUT_LABELS = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré',
};

export const DEVIS_STATUT_COLORS = {
  brouillon: '#6b7280',
  envoye: '#3b82f6',
  accepte: '#10b981',
  refuse: '#ef4444',
  expire: '#f59e0b',
};

// Statuts factures
export const FACTURE_STATUTS = {
  BROUILLON: 'brouillon',
  EMISE: 'emise',
  ENVOYEE: 'envoyee',
  PAYEE: 'payee',
  EN_RETARD: 'en_retard',
  ANNULEE: 'annulee',
};

export const FACTURE_STATUT_LABELS = {
  brouillon: 'Brouillon',
  emise: 'Émise',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard',
  annulee: 'Annulée',
};

export const FACTURE_STATUT_COLORS = {
  brouillon: '#6b7280',
  emise: '#8b5cf6',
  envoyee: '#3b82f6',
  payee: '#10b981',
  en_retard: '#ef4444',
  annulee: '#6b7280',
};

// Types de services
export const TYPES_SERVICES = {
  AIDE_MENAGERE: 'aide_menagere',
  AIDE_TOILETTE: 'aide_toilette',
  AIDE_REPAS: 'aide_repas',
  GARDE_NUIT: 'garde_nuit',
  SORTIE_ACCOMPAGNEE: 'sortie_accompagnee',
  AIDE_ADMINISTRATIVE: 'aide_administrative',
  SOINS_INFIRMIERS: 'soins_infirmiers',
  PORTAGE_REPAS: 'portage_repas',
};

export const TYPES_SERVICES_LABELS = {
  aide_menagere: 'Aide ménagère',
  aide_toilette: 'Aide à la toilette',
  aide_repas: 'Aide aux repas',
  garde_nuit: 'Garde de nuit',
  sortie_accompagnee: 'Sortie accompagnée',
  aide_administrative: 'Aide administrative',
  soins_infirmiers: 'Soins infirmiers',
  portage_repas: 'Portage de repas',
};

// Statuts interventions
export const INTERVENTION_STATUTS = {
  PLANIFIEE: 'planifiee',
  EN_COURS: 'en_cours',
  TERMINEE: 'terminee',
  ANNULEE: 'annulee',
  ABSENT: 'absent',
};

export const INTERVENTION_STATUT_LABELS = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
  absent: 'Absent',
};

// Statuts tickets qualité
export const QUALITE_STATUTS = {
  OUVERT: 'ouvert',
  EN_COURS: 'en_cours',
  RESOLU: 'resolu',
  FERME: 'ferme',
};

export const QUALITE_STATUT_LABELS = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  resolu: 'Résolu',
  ferme: 'Fermé',
};

export const QUALITE_STATUT_COLORS = {
  ouvert: '#ef4444',
  en_cours: '#f59e0b',
  resolu: '#10b981',
  ferme: '#6b7280',
};

export const QUALITE_TYPES = {
  INCIDENT: 'incident',
  RECLAMATION: 'reclamation',
  SUGGESTION: 'suggestion',
  FELICITATION: 'felicitation',
};

export const QUALITE_TYPE_LABELS = {
  incident: 'Incident',
  reclamation: 'Réclamation',
  suggestion: 'Suggestion',
  felicitation: 'Félicitation',
};

// Types d'aides financières
export const TYPES_AIDES = {
  APA: 'APA',
  PCH: 'PCH',
  AIDE_SOCIALE: 'aide_sociale',
  MUTUELLE: 'mutuelle',
  PARTICULIER: 'particulier',
};

export const TYPES_AIDES_LABELS = {
  APA: 'APA (Allocation Personnalisée d\'Autonomie)',
  PCH: 'PCH (Prestation de Compensation du Handicap)',
  aide_sociale: 'Aide sociale',
  mutuelle: 'Mutuelle',
  particulier: 'Particulier',
};

// Navigation items
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
  { path: '/beneficiaires', label: 'Bénéficiaires', icon: 'Users' },
  { path: '/familles', label: 'Familles', icon: 'Heart' },
  { path: '/intervenants', label: 'Intervenants', icon: 'UserCheck' },
  { path: '/planning', label: 'Planning', icon: 'Calendar' },
  { path: '/leads', label: 'Leads', icon: 'TrendingUp' },
  { path: '/devis', label: 'Devis', icon: 'FileText' },
  { path: '/factures', label: 'Factures', icon: 'Receipt' },
  { path: '/qualite', label: 'Qualité', icon: 'Star' },
  { path: '/prescripteurs', label: 'Prescripteurs', icon: 'Building2' },
  { path: '/services', label: 'Services', icon: 'Briefcase' },
  { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  { path: '/settings', label: 'Paramètres', icon: 'Settings' },
];
