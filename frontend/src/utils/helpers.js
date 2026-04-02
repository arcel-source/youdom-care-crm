import { BENEFICIAIRE_STATUT_COLORS, LEAD_STATUT_COLORS, DEVIS_STATUT_COLORS, FACTURE_STATUT_COLORS, QUALITE_STATUT_COLORS } from './constants';

/**
 * Formate une date en DD/MM/YYYY
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date en DD/MM/YYYY HH:mm
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formate un montant en euros
 * @param {number} amount
 * @returns {string} "1 234,56 €"
 */
export function formatMoney(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Retourne la couleur d'un badge selon le statut
 * @param {string} status
 * @param {string} type - 'beneficiaire' | 'lead' | 'devis' | 'facture' | 'qualite'
 * @returns {string} couleur hex
 */
export function getStatusBadgeColor(status, type = 'beneficiaire') {
  const colorMaps = {
    beneficiaire: BENEFICIAIRE_STATUT_COLORS,
    lead: LEAD_STATUT_COLORS,
    devis: DEVIS_STATUT_COLORS,
    facture: FACTURE_STATUT_COLORS,
    qualite: QUALITE_STATUT_COLORS,
  };
  const map = colorMaps[type] || BENEFICIAIRE_STATUT_COLORS;
  return map[status] || '#6b7280';
}

/**
 * Formate un numéro de téléphone français
 * @param {string} phone
 * @returns {string} "06 12 34 56 78"
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  if (cleaned.length === 11 && cleaned.startsWith('33')) {
    const local = '0' + cleaned.slice(2);
    return local.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}

/**
 * Calcule l'âge à partir d'une date de naissance
 * @param {string|Date} birthDate
 * @returns {number|null}
 */
export function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Tronque un texte à une longueur donnée
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Génère des initiales à partir d'un nom complet
 * @param {string} name
 * @returns {string} "JD"
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
}

/**
 * Classe les objets par une propriété
 * @param {Array} arr
 * @param {string} key
 * @param {string} direction - 'asc' | 'desc'
 * @returns {Array}
 */
export function sortBy(arr, key, direction = 'asc') {
  return [...arr].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filtre un tableau selon une recherche textuelle sur plusieurs champs
 * @param {Array} arr
 * @param {string} query
 * @param {string[]} fields
 * @returns {Array}
 */
export function filterBySearch(arr, query, fields) {
  if (!query) return arr;
  const q = query.toLowerCase();
  return arr.filter(item =>
    fields.some(field => {
      const val = item[field];
      return val && String(val).toLowerCase().includes(q);
    })
  );
}

/**
 * Retourne une couleur Tailwind pour un type de badge
 * @param {string} variant - 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'
 * @returns {string} classes Tailwind
 */
export function getBadgeClasses(variant) {
  const variants = {
    primary: 'bg-indigo-100 text-indigo-700',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-700',
    cyan: 'bg-cyan-100 text-cyan-700',
  };
  return variants[variant] || variants.gray;
}

/**
 * Retourne le variant de badge selon un statut
 */
export function getStatusVariant(status) {
  const map = {
    actif: 'success',
    inactif: 'gray',
    suspendu: 'warning',
    en_attente: 'info',
    nouveau: 'info',
    contacte: 'purple',
    qualifie: 'warning',
    devis_envoye: 'cyan',
    gagne: 'success',
    perdu: 'danger',
    brouillon: 'gray',
    envoye: 'info',
    accepte: 'success',
    refuse: 'danger',
    expire: 'warning',
    emise: 'purple',
    envoyee: 'info',
    payee: 'success',
    en_retard: 'danger',
    annulee: 'gray',
    ouvert: 'danger',
    en_cours: 'warning',
    resolu: 'success',
    ferme: 'gray',
    planifiee: 'info',
    terminee: 'success',
    absent: 'danger',
  };
  return map[status] || 'gray';
}

/**
 * Formate une durée en minutes en "Xh Ymin"
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Calcule le pourcentage
 * @param {number} value
 * @param {number} total
 * @returns {string}
 */
export function calcPercent(value, total) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}
