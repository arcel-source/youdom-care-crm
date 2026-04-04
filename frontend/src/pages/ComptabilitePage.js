import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Calculator, FileText, Users, TrendingUp, Download, Edit2, Trash2,
  Mail, CheckCircle, Clock, AlertCircle, Plus, Eye, Send, ChevronDown,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

// ─── Mock data ────────────────────────────────────────────────────────────────

const INTERVENANTS = [
  { id: 1, nom: 'Marie Dupont' },
  { id: 2, nom: 'Sophie Martin' },
  { id: 3, nom: 'Isabelle Bernard' },
  { id: 4, nom: 'Claire Moreau' },
  { id: 5, nom: 'Fatou Diallo' },
  { id: 6, nom: 'Nathalie Leclerc' },
  { id: 7, nom: 'Julie Petit' },
  { id: 8, nom: 'Amina Koné' },
  { id: 9, nom: 'Céline Robert' },
  { id: 10, nom: 'Laura Dubois' },
];

const CONTRATS_INITIAL = [
  {
    id: 1, intervenantId: 1, intervenant: 'Marie Dupont', type: 'CDI', poste: 'Auxiliaire de vie',
    dateDebut: '2022-03-15', dateFin: null, tauxHoraire: 13.50, heuresHebdo: 35, heuresMois: 151.67,
    statut: 'Actif', notes: 'Temps plein, diplômée DEAVS',
  },
  {
    id: 2, intervenantId: 2, intervenant: 'Sophie Martin', type: 'CDI', poste: 'Aide-ménagère',
    dateDebut: '2021-09-01', dateFin: null, tauxHoraire: 12.50, heuresHebdo: 28, heuresMois: 121.33,
    statut: 'Actif', notes: 'Temps partiel, intervention secteur nord',
  },
  {
    id: 3, intervenantId: 3, intervenant: 'Isabelle Bernard', type: 'CDD', poste: 'Auxiliaire de vie',
    dateDebut: '2026-01-10', dateFin: '2026-06-30', tauxHoraire: 13.00, heuresHebdo: 20, heuresMois: 86.67,
    statut: 'Actif', notes: 'Remplacement congé maternité',
  },
  {
    id: 4, intervenantId: 4, intervenant: 'Claire Moreau', type: 'CESU', poste: 'Aide à domicile',
    dateDebut: '2023-05-20', dateFin: null, tauxHoraire: 12.00, heuresHebdo: 15, heuresMois: 65.00,
    statut: 'Actif', notes: 'CESU préfinancé, client famille Leroy',
  },
  {
    id: 5, intervenantId: 5, intervenant: 'Fatou Diallo', type: 'CDI', poste: 'Auxiliaire de vie sociale',
    dateDebut: '2020-11-02', dateFin: null, tauxHoraire: 14.20, heuresHebdo: 35, heuresMois: 151.67,
    statut: 'Actif', notes: 'Responsable de secteur adjoint',
  },
  {
    id: 6, intervenantId: 6, intervenant: 'Nathalie Leclerc', type: 'CDD', poste: 'Aide-ménagère',
    dateDebut: '2025-09-01', dateFin: '2026-02-28', tauxHoraire: 12.50, heuresHebdo: 25, heuresMois: 108.33,
    statut: 'Expiré', notes: 'CDD saisonnier terminé',
  },
  {
    id: 7, intervenantId: 7, intervenant: 'Julie Petit', type: 'CDI', poste: 'Auxiliaire de vie',
    dateDebut: '2026-04-01', dateFin: null, tauxHoraire: 13.50, heuresHebdo: 30, heuresMois: 130.00,
    statut: 'En attente signature', notes: 'Nouveau recrutement, contrat transmis par email',
  },
  {
    id: 8, intervenantId: 8, intervenant: 'Amina Koné', type: 'CDI', poste: 'Aide à domicile',
    dateDebut: '2024-02-14', dateFin: null, tauxHoraire: 12.80, heuresHebdo: 20, heuresMois: 86.67,
    statut: 'Actif', notes: 'Spécialiste Alzheimer',
  },
  {
    id: 9, intervenantId: 9, intervenant: 'Céline Robert', type: 'CESU', poste: 'Aide-ménagère',
    dateDebut: '2023-08-01', dateFin: null, tauxHoraire: 11.88, heuresHebdo: 10, heuresMois: 43.33,
    statut: 'Actif', notes: 'CESU employeur particulier',
  },
  {
    id: 10, intervenantId: 10, intervenant: 'Laura Dubois', type: 'CDD', poste: 'Auxiliaire de vie',
    dateDebut: '2026-03-01', dateFin: '2026-08-31', tauxHoraire: 13.00, heuresHebdo: 35, heuresMois: 151.67,
    statut: 'Actif', notes: 'CDD remplacement longue maladie',
  },
];

const FICHES_PAIE_INITIAL = [
  {
    id: 1, intervenantId: 1, intervenant: 'Marie Dupont', periode: '2026-03',
    tauxHoraire: 13.50, heuresNormales: 143.50, heuresNuit: 4, heuresDimanche: 7.50, heuresFerie: 0,
    statut: 'Envoyée',
  },
  {
    id: 2, intervenantId: 2, intervenant: 'Sophie Martin', periode: '2026-03',
    tauxHoraire: 12.50, heuresNormales: 110.00, heuresNuit: 0, heuresDimanche: 4, heuresFerie: 0,
    statut: 'Envoyée',
  },
  {
    id: 3, intervenantId: 3, intervenant: 'Isabelle Bernard', periode: '2026-03',
    tauxHoraire: 13.00, heuresNormales: 78.00, heuresNuit: 0, heuresDimanche: 6, heuresFerie: 0,
    statut: 'Ouverte',
  },
  {
    id: 4, intervenantId: 4, intervenant: 'Claire Moreau', periode: '2026-03',
    tauxHoraire: 12.00, heuresNormales: 58.00, heuresNuit: 0, heuresDimanche: 0, heuresFerie: 0,
    statut: 'Générée',
  },
  {
    id: 5, intervenantId: 5, intervenant: 'Fatou Diallo', periode: '2026-03',
    tauxHoraire: 14.20, heuresNormales: 140.00, heuresNuit: 8, heuresDimanche: 10, heuresFerie: 7.50,
    statut: 'Envoyée',
  },
  {
    id: 6, intervenantId: 8, intervenant: 'Amina Koné', periode: '2026-03',
    tauxHoraire: 12.80, heuresNormales: 80.00, heuresNuit: 6, heuresDimanche: 0, heuresFerie: 0,
    statut: 'Erreur',
  },
  {
    id: 7, intervenantId: 9, intervenant: 'Céline Robert', periode: '2026-03',
    tauxHoraire: 11.88, heuresNormales: 40.00, heuresNuit: 0, heuresDimanche: 0, heuresFerie: 0,
    statut: 'Générée',
  },
  {
    id: 8, intervenantId: 10, intervenant: 'Laura Dubois', periode: '2026-03',
    tauxHoraire: 13.00, heuresNormales: 145.00, heuresNuit: 0, heuresDimanche: 8, heuresFerie: 7.50,
    statut: 'Envoyée',
  },
  {
    id: 9, intervenantId: 7, intervenant: 'Julie Petit', periode: '2026-03',
    tauxHoraire: 13.50, heuresNormales: 0, heuresNuit: 0, heuresDimanche: 0, heuresFerie: 0,
    statut: 'Générée',
  },
  {
    id: 10, intervenantId: 6, intervenant: 'Nathalie Leclerc', periode: '2026-02',
    tauxHoraire: 12.50, heuresNormales: 95.00, heuresNuit: 0, heuresDimanche: 5, heuresFerie: 0,
    statut: 'Envoyée',
  },
  {
    id: 11, intervenantId: 1, intervenant: 'Marie Dupont', periode: '2026-02',
    tauxHoraire: 13.50, heuresNormales: 141.00, heuresNuit: 3, heuresDimanche: 8, heuresFerie: 0,
    statut: 'Envoyée',
  },
];

const MASSE_SALARIALE_DATA = [
  { mois: 'Oct', masse: 28400 },
  { mois: 'Nov', masse: 29100 },
  { mois: 'Déc', masse: 27800 },
  { mois: 'Jan', masse: 30200 },
  { mois: 'Fév', masse: 31500 },
  { mois: 'Mar', masse: 32800 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculerFiche(fiche) {
  const { tauxHoraire, heuresNormales, heuresNuit, heuresDimanche, heuresFerie } = fiche;
  const brutNormales = heuresNormales * tauxHoraire;
  const brutNuit = heuresNuit * tauxHoraire * 1.25;
  const brutDimanche = heuresDimanche * tauxHoraire * 1.50;
  const brutFerie = heuresFerie * tauxHoraire * 2.00;
  const brutTotal = brutNormales + brutNuit + brutDimanche + brutFerie;
  const cotisationsPatronales = brutTotal * 0.4230;
  const cotisationsSalariales = brutTotal * 0.2180;
  const netAPayer = brutTotal - cotisationsSalariales;
  const totalHeures = heuresNormales + heuresNuit + heuresDimanche + heuresFerie;
  return {
    brutNormales, brutNuit, brutDimanche, brutFerie, brutTotal,
    cotisationsPatronales, cotisationsSalariales, netAPayer, totalHeures,
  };
}

function formatEuros(montant) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
}

function formatPeriode(periode) {
  const [annee, mois] = periode.split('-');
  const date = new Date(Number(annee), Number(mois) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function statutContratBadge(statut) {
  if (statut === 'Actif') return <Badge variant="success" dot>{statut}</Badge>;
  if (statut === 'Expiré') return <Badge variant="danger" dot>{statut}</Badge>;
  if (statut === 'En attente signature') return <Badge variant="warning" dot>{statut}</Badge>;
  return <Badge variant="neutral">{statut}</Badge>;
}

function statutEnvoiBadge(statut) {
  if (statut === 'Envoyée') return (
    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
      <CheckCircle size={14} className="text-emerald-500" /> Envoyée
    </span>
  );
  if (statut === 'Ouverte') return (
    <span className="inline-flex items-center gap-1 text-teal-700 text-xs font-medium">
      <Eye size={14} className="text-teal-500" /> Ouverte
    </span>
  );
  if (statut === 'Générée') return (
    <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
      <Clock size={14} className="text-amber-500" /> Générée
    </span>
  );
  if (statut === 'Erreur') return (
    <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-medium">
      <AlertCircle size={14} className="text-rose-500" /> Erreur
    </span>
  );
  return <Badge variant="neutral">{statut}</Badge>;
}

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'CESU', label: 'CESU' },
];

const STATUT_CONTRAT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'Actif', label: 'Actif' },
  { value: 'Expiré', label: 'Expiré' },
  { value: 'En attente signature', label: 'En attente signature' },
];

const STATUT_ENVOI_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'Générée', label: 'Générée' },
  { value: 'Envoyée', label: 'Envoyée' },
  { value: 'Ouverte', label: 'Ouverte' },
  { value: 'Erreur', label: 'Erreur' },
];

const POSTE_OPTIONS = [
  { value: 'Auxiliaire de vie', label: 'Auxiliaire de vie' },
  { value: 'Auxiliaire de vie sociale', label: 'Auxiliaire de vie sociale' },
  { value: 'Aide-ménagère', label: 'Aide-ménagère' },
  { value: 'Aide à domicile', label: 'Aide à domicile' },
  { value: 'Accompagnant éducatif', label: 'Accompagnant éducatif' },
];

const CONTRAT_TYPE_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'CESU', label: 'CESU' },
];

// ─── Composant modal contrat ──────────────────────────────────────────────────

function ModalContrat({ isOpen, onClose, contrat, onSave }) {
  const isEdit = !!contrat;
  const [form, setForm] = useState(() => contrat ? { ...contrat } : {
    intervenantId: '', intervenant: '', type: 'CDI', poste: 'Auxiliaire de vie',
    dateDebut: '', dateFin: '', tauxHoraire: '', heuresHebdo: '', heuresMois: '', notes: '',
    statut: 'En attente signature',
  });

  React.useEffect(() => {
    if (contrat) setForm({ ...contrat });
    else setForm({
      intervenantId: '', intervenant: '', type: 'CDI', poste: 'Auxiliaire de vie',
      dateDebut: '', dateFin: '', tauxHoraire: '', heuresHebdo: '', heuresMois: '', notes: '',
      statut: 'En attente signature',
    });
  }, [contrat, isOpen]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleIntervenantChange = (id) => {
    const iv = INTERVENANTS.find(i => i.id === Number(id));
    setForm(f => ({ ...f, intervenantId: Number(id), intervenant: iv ? iv.nom : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Modifier le contrat' : 'Nouveau contrat'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            variant="primary"
            className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
            onClick={handleSubmit}
          >
            {isEdit ? 'Enregistrer' : 'Créer le contrat'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Intervenant"
              required
              value={form.intervenantId}
              onChange={e => handleIntervenantChange(e.target.value)}
              options={INTERVENANTS.map(i => ({ value: i.id, label: i.nom }))}
              placeholder="Sélectionner un intervenant"
            />
          </div>
          <div>
            <Select
              label="Type de contrat"
              required
              value={form.type}
              onChange={e => set('type', e.target.value)}
              options={CONTRAT_TYPE_OPTIONS}
            />
          </div>
          <div>
            <Select
              label="Poste"
              required
              value={form.poste}
              onChange={e => set('poste', e.target.value)}
              options={POSTE_OPTIONS}
            />
          </div>
          <div>
            <Input
              label="Date de début"
              type="date"
              required
              value={form.dateDebut}
              onChange={e => set('dateDebut', e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Date de fin (CDD uniquement)"
              type="date"
              value={form.dateFin || ''}
              onChange={e => set('dateFin', e.target.value)}
              helper="Laisser vide pour CDI / CESU"
            />
          </div>
          <div>
            <Input
              label="Taux horaire (€)"
              type="number"
              step="0.01"
              min="11.88"
              required
              value={form.tauxHoraire}
              onChange={e => set('tauxHoraire', e.target.value)}
              prefix={<span className="text-xs">€</span>}
            />
          </div>
          <div>
            <Input
              label="Heures hebdomadaires"
              type="number"
              step="0.5"
              min="1"
              max="48"
              required
              value={form.heuresHebdo}
              onChange={e => {
                const v = e.target.value;
                set('heuresHebdo', v);
                set('heuresMois', v ? (Number(v) * 52 / 12).toFixed(2) : '');
              }}
            />
          </div>
          <div>
            <Input
              label="Heures mensuelles"
              type="number"
              step="0.01"
              value={form.heuresMois}
              onChange={e => set('heuresMois', e.target.value)}
              helper="Calculé automatiquement depuis les h/semaine"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Informations complémentaires..."
          />
        </div>
      </form>
    </Modal>
  );
}

// ─── Composant modal détail fiche de paie ─────────────────────────────────────

function ModalFichePaie({ isOpen, onClose, fiche }) {
  if (!fiche) return null;
  const calc = calculerFiche(fiche);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Fiche de paie — ${fiche.intervenant}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button
            variant="secondary"
            icon={Download}
            className="border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            Télécharger PDF
          </Button>
        </>
      }
    >
      <div className="space-y-5 animate-fadeIn">
        {/* Entête */}
        <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl border border-teal-100">
          <div>
            <p className="text-sm text-teal-600 font-medium">Période</p>
            <p className="text-lg font-bold text-teal-800 capitalize">{formatPeriode(fiche.periode)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-600 font-medium">Taux horaire</p>
            <p className="text-lg font-bold text-teal-800">{formatEuros(fiche.tauxHoraire)}/h</p>
          </div>
        </div>

        {/* Détail heures */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Détail des heures</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Heures normales ({fiche.heuresNormales} h)</span>
              <span className="text-sm font-medium text-slate-800">{formatEuros(calc.brutNormales)}</span>
            </div>
            {fiche.heuresNuit > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">
                  Heures de nuit ({fiche.heuresNuit} h) <span className="text-teal-600 font-medium">+25%</span>
                </span>
                <span className="text-sm font-medium text-slate-800">{formatEuros(calc.brutNuit)}</span>
              </div>
            )}
            {fiche.heuresDimanche > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">
                  Heures dimanche ({fiche.heuresDimanche} h) <span className="text-amber-600 font-medium">+50%</span>
                </span>
                <span className="text-sm font-medium text-slate-800">{formatEuros(calc.brutDimanche)}</span>
              </div>
            )}
            {fiche.heuresFerie > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">
                  Heures fériées ({fiche.heuresFerie} h) <span className="text-rose-600 font-medium">+100%</span>
                </span>
                <span className="text-sm font-medium text-slate-800">{formatEuros(calc.brutFerie)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-lg">
              <span className="text-sm font-semibold text-slate-700">Total heures : {calc.totalHeures} h</span>
              <span className="text-sm font-bold text-slate-800">{formatEuros(calc.brutTotal)}</span>
            </div>
          </div>
        </div>

        {/* Cotisations */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Cotisations</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Cotisations salariales (21,80%)</span>
              <span className="text-sm font-medium text-rose-700">− {formatEuros(calc.cotisationsSalariales)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Cotisations patronales (42,30%)</span>
              <span className="text-sm font-medium text-rose-700">− {formatEuros(calc.cotisationsPatronales)}</span>
            </div>
          </div>
        </div>

        {/* Net à payer */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div>
            <p className="text-sm text-emerald-600 font-medium">Salaire brut</p>
            <p className="text-base font-bold text-emerald-800">{formatEuros(calc.brutTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-emerald-600 font-medium">Net à payer</p>
            <p className="text-2xl font-bold text-emerald-800">{formatEuros(calc.netAPayer)}</p>
          </div>
        </div>

        {/* Statut */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Statut envoi :</span>
          {statutEnvoiBadge(fiche.statut)}
        </div>
      </div>
    </Modal>
  );
}

// ─── Onglet Contrats ──────────────────────────────────────────────────────────

function TabContrats({ contrats, onContratChange }) {
  const [filtreType, setFiltreType] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editContrat, setEditContrat] = useState(null);
  const [confirmResilier, setConfirmResilier] = useState(null);

  const filtres = useMemo(() => contrats.filter(c => {
    if (filtreType && c.type !== filtreType) return false;
    if (filtreStatut && c.statut !== filtreStatut) return false;
    return true;
  }), [contrats, filtreType, filtreStatut]);

  const handleSave = (form) => {
    if (editContrat) {
      onContratChange(contrats.map(c => c.id === editContrat.id ? { ...c, ...form } : c));
    } else {
      const newId = Math.max(...contrats.map(c => c.id)) + 1;
      onContratChange([...contrats, { ...form, id: newId }]);
    }
    setModalOpen(false);
    setEditContrat(null);
  };

  const handleResilier = () => {
    onContratChange(contrats.map(c => c.id === confirmResilier ? { ...c, statut: 'Expiré' } : c));
    setConfirmResilier(null);
  };

  return (
    <div className="animate-fadeIn">
      {/* Filtres + bouton */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="w-44">
          <Select
            label="Type de contrat"
            value={filtreType}
            onChange={e => setFiltreType(e.target.value)}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="w-52">
          <Select
            label="Statut"
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value)}
            options={STATUT_CONTRAT_OPTIONS}
          />
        </div>
        <div className="ml-auto">
          <Button
            icon={Plus}
            className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-500 text-white"
            onClick={() => { setEditContrat(null); setModalOpen(true); }}
          >
            Nouveau contrat
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtres.length === 0 ? (
        <EmptyState
          icon="FileText"
          title="Aucun contrat trouvé"
          description="Aucun contrat ne correspond à vos filtres."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Intervenant</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Poste</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Date début</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Date fin</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Taux/h</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">H/semaine</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtres.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.intervenant}</td>
                  <td className="px-4 py-3 text-slate-600">{c.poste}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.type === 'CDI' ? 'teal' : c.type === 'CDD' ? 'warning' : 'info'}>
                      {c.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(c.dateDebut).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : <span className="text-slate-400 italic">Indéterminé</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-teal-700">
                    {formatEuros(Number(c.tauxHoraire))}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.heuresHebdo} h</td>
                  <td className="px-4 py-3">{statutContratBadge(c.statut)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditContrat(c); setModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Télécharger PDF"
                      >
                        <Download size={15} />
                      </button>
                      {c.statut !== 'Expiré' && (
                        <button
                          onClick={() => setConfirmResilier(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Résilier"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalContrat
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditContrat(null); }}
        contrat={editContrat}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={!!confirmResilier}
        onClose={() => setConfirmResilier(null)}
        onConfirm={handleResilier}
        title="Résilier le contrat"
        message="Êtes-vous sûr de vouloir résilier ce contrat ? Cette action marquera le contrat comme Expiré."
        confirmLabel="Résilier"
        variant="danger"
      />
    </div>
  );
}

// ─── Onglet Fiches de paie ────────────────────────────────────────────────────

function TabFichesPaie({ fiches, onFichesChange }) {
  const [filtrePeriode, setFiltrePeriode] = useState('2026-03');
  const [filtreIntervenant, setFiltreIntervenant] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [fichesState, setFichesState] = useState(fiches);
  const [selectedFiche, setSelectedFiche] = useState(null);
  const [confirmEnvoiId, setConfirmEnvoiId] = useState(null);
  const [confirmEnvoiTout, setConfirmEnvoiTout] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  const periodeOptions = useMemo(() => {
    const periodes = [...new Set(fiches.map(f => f.periode))].sort().reverse();
    return periodes.map(p => ({ value: p, label: formatPeriode(p) }));
  }, [fiches]);

  const intervenantOptions = useMemo(() => [
    { value: '', label: 'Tous les intervenants' },
    ...INTERVENANTS.map(i => ({ value: String(i.id), label: i.nom })),
  ], []);

  const filtrees = useMemo(() => fichesState.filter(f => {
    if (filtrePeriode && f.periode !== filtrePeriode) return false;
    if (filtreIntervenant && String(f.intervenantId) !== filtreIntervenant) return false;
    if (filtreStatut && f.statut !== filtreStatut) return false;
    return true;
  }), [fichesState, filtrePeriode, filtreIntervenant, filtreStatut]);

  const handleEnvoyer = (id) => {
    setFichesState(prev => prev.map(f => f.id === id ? { ...f, statut: 'Envoyée' } : f));
    setConfirmEnvoiId(null);
  };

  const handleEnvoyerTout = () => {
    setFichesState(prev => prev.map(f =>
      filtrees.find(ff => ff.id === f.id) && f.statut === 'Générée'
        ? { ...f, statut: 'Envoyée' }
        : f
    ));
    setConfirmEnvoiTout(false);
  };

  const handleGenererBatch = () => {
    setGeneratingBatch(true);
    setTimeout(() => {
      setGeneratingBatch(false);
    }, 1500);
  };

  const nonEnvoyees = filtrees.filter(f => f.statut === 'Générée');

  return (
    <div className="animate-fadeIn">
      {/* Filtres + actions */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="w-44">
          <Select
            label="Période"
            value={filtrePeriode}
            onChange={e => setFiltrePeriode(e.target.value)}
            options={[{ value: '', label: 'Toutes les périodes' }, ...periodeOptions]}
          />
        </div>
        <div className="w-52">
          <Select
            label="Intervenant"
            value={filtreIntervenant}
            onChange={e => setFiltreIntervenant(e.target.value)}
            options={intervenantOptions}
          />
        </div>
        <div className="w-44">
          <Select
            label="Statut"
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value)}
            options={STATUT_ENVOI_OPTIONS}
          />
        </div>
        <div className="flex items-end gap-2 ml-auto">
          <Button
            variant="secondary"
            icon={FileText}
            onClick={handleGenererBatch}
            loading={generatingBatch}
          >
            Générer les fiches du mois
          </Button>
          {nonEnvoyees.length > 0 && (
            <Button
              icon={Send}
              className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-500 text-white"
              onClick={() => setConfirmEnvoiTout(true)}
            >
              Envoyer tout ({nonEnvoyees.length})
            </Button>
          )}
        </div>
      </div>

      {/* Info majorations */}
      <div className="flex flex-wrap gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Majorations appliquées :</span>
        <span className="text-teal-700 font-medium">🌙 Nuit +25%</span>
        <span className="text-amber-700 font-medium">☀️ Dimanche +50%</span>
        <span className="text-rose-700 font-medium">🎌 Férié +100%</span>
      </div>

      {/* Table */}
      {filtrees.length === 0 ? (
        <EmptyState
          icon="FileText"
          title="Aucune fiche de paie"
          description="Aucune fiche de paie ne correspond à vos filtres."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Intervenant</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Période</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">H. travaillées</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Taux/h</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Brut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Cotisations</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Net à payer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrees.map(f => {
                const calc = calculerFiche(f);
                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {f.intervenant}
                      {(f.heuresNuit > 0 || f.heuresDimanche > 0 || f.heuresFerie > 0) && (
                        <div className="flex gap-1 mt-0.5">
                          {f.heuresNuit > 0 && <span className="text-xs text-teal-600">🌙{f.heuresNuit}h</span>}
                          {f.heuresDimanche > 0 && <span className="text-xs text-amber-600">☀️{f.heuresDimanche}h</span>}
                          {f.heuresFerie > 0 && <span className="text-xs text-rose-600">🎌{f.heuresFerie}h</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{formatPeriode(f.periode)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{calc.totalHeures} h</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatEuros(f.tauxHoraire)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatEuros(calc.brutTotal)}</td>
                    <td className="px-4 py-3 text-right text-rose-600">{formatEuros(calc.cotisationsSalariales)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatEuros(calc.netAPayer)}</td>
                    <td className="px-4 py-3">{statutEnvoiBadge(f.statut)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedFiche(f)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Voir le détail"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Télécharger PDF"
                        >
                          <Download size={15} />
                        </button>
                        {(f.statut === 'Générée' || f.statut === 'Erreur') && (
                          <button
                            onClick={() => setConfirmEnvoiId(f.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Envoyer par email"
                          >
                            <Mail size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ModalFichePaie
        isOpen={!!selectedFiche}
        onClose={() => setSelectedFiche(null)}
        fiche={selectedFiche}
      />

      <ConfirmDialog
        isOpen={!!confirmEnvoiId}
        onClose={() => setConfirmEnvoiId(null)}
        onConfirm={() => handleEnvoyer(confirmEnvoiId)}
        title="Envoyer la fiche de paie"
        message="Envoyer cette fiche de paie par email à l'intervenant ?"
        confirmLabel="Envoyer"
        variant="info"
      />

      <ConfirmDialog
        isOpen={confirmEnvoiTout}
        onClose={() => setConfirmEnvoiTout(false)}
        onConfirm={handleEnvoyerTout}
        title="Envoyer toutes les fiches"
        message={`Envoyer par email les ${nonEnvoyees.length} fiche(s) de paie non encore envoyée(s) ?`}
        confirmLabel="Envoyer tout"
        variant="info"
      />
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ComptabilitePage() {
  const [activeTab, setActiveTab] = useState('contrats');
  const [contrats, setContrats] = useState(CONTRATS_INITIAL);
  const [fiches] = useState(FICHES_PAIE_INITIAL);

  // Stats calculées
  const stats = useMemo(() => {
    const fichesMarsMars = fiches.filter(f => f.periode === '2026-03');
    const masseSalariale = fichesMarsMars.reduce((sum, f) => sum + calculerFiche(f).brutTotal, 0);
    const chargesSociales = fichesMarsMars.reduce((sum, f) => sum + calculerFiche(f).cotisationsPatronales, 0);
    const nbFiches = fiches.length;
    const contratsActifs = contrats.filter(c => c.statut === 'Actif').length;
    return { masseSalariale, chargesSociales, nbFiches, contratsActifs };
  }, [fiches, contrats]);

  const TABS = [
    { id: 'contrats', label: 'Contrats', icon: FileText, count: contrats.length },
    { id: 'fiches', label: 'Fiches de paie', icon: Calculator, count: fiches.length },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-teal-100 rounded-xl">
              <Calculator size={22} className="text-teal-600" />
            </div>
            Comptabilité
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gestion des contrats et fiches de paie des intervenants</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
          <TrendingUp size={14} className="text-teal-600" />
          <span>Données mars 2026</span>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Masse salariale (mars)"
          value={formatEuros(stats.masseSalariale)}
          icon="Wallet"
          color="teal"
          trend={4.2}
          trendLabel="vs mois dernier"
          sparkline
        />
        <StatCard
          title="Charges sociales"
          value={formatEuros(stats.chargesSociales)}
          icon="TrendingUp"
          color="amber"
          trend={3.8}
          trendLabel="vs mois dernier"
          sparkline
        />
        <StatCard
          title="Fiches de paie générées"
          value={stats.nbFiches}
          icon="FileText"
          color="emerald"
          subtitle="dont mars 2026"
          sparkline
        />
        <StatCard
          title="Contrats actifs"
          value={stats.contratsActifs}
          icon="Users"
          color="teal"
          subtitle={`sur ${contrats.length} contrats`}
          sparkline
        />
      </div>

      {/* AreaChart masse salariale */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Évolution masse salariale</h2>
            <p className="text-xs text-slate-500">6 derniers mois</p>
          </div>
          <Badge variant="teal">Brut mensuel</Badge>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MASSE_SALARIALE_DATA} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradMasse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k€`}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 13 }}
                formatter={v => [formatEuros(v), 'Masse salariale']}
                labelStyle={{ fontWeight: 600, color: '#334155' }}
              />
              <Area
                type="monotone"
                dataKey="masse"
                stroke="#0d9488"
                strokeWidth={2.5}
                fill="url(#gradMasse)"
                dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#0d9488' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {/* Tab headers */}
        <div className="flex border-b border-slate-200 px-4 pt-4 gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all duration-150 border-b-2 -mb-px
                  ${isActive
                    ? 'text-teal-700 border-teal-600 bg-teal-50'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Icon size={15} />
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                  ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-5">
          {activeTab === 'contrats' && (
            <TabContrats contrats={contrats} onContratChange={setContrats} />
          )}
          {activeTab === 'fiches' && (
            <TabFichesPaie fiches={fiches} onFichesChange={() => {}} />
          )}
        </div>
      </div>
    </div>
  );
}
