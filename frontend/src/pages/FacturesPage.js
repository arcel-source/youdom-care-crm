import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Download,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Euro,
  BarChart2,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';

/* ─── Mock data ────────────────────────────────────────────────────────── */
const MOCK_FACTURES = [
  { id: 'FAC-2024-001', beneficiaire: 'Marie Dupont', service: 'Aide à domicile', periode: 'Janvier 2024', montant: 1240.00, statut: 'Payée', dateEmission: '2024-01-31', dateEcheance: '2024-02-15', datePaiement: '2024-02-10', intervenant: 'Sophie Martin' },
  { id: 'FAC-2024-002', beneficiaire: 'Jean Leroy', service: 'Aide ménagère', periode: 'Janvier 2024', montant: 680.50, statut: 'En attente', dateEmission: '2024-01-31', dateEcheance: '2024-02-15', datePaiement: null, intervenant: 'Fatou Diallo' },
  { id: 'FAC-2024-003', beneficiaire: 'Simone Moreau', service: 'Aide à domicile', periode: 'Janvier 2024', montant: 1560.00, statut: 'Impayée', dateEmission: '2024-01-31', dateEcheance: '2024-02-15', datePaiement: null, intervenant: 'Claire Bernard' },
  { id: 'FAC-2024-004', beneficiaire: 'André Petit', service: 'Portage de repas', periode: 'Janvier 2024', montant: 340.00, statut: 'Payée', dateEmission: '2024-01-31', dateEcheance: '2024-02-15', datePaiement: '2024-02-08', intervenant: 'Karine Lefebvre' },
  { id: 'FAC-2024-005', beneficiaire: 'Yvette Garnier', service: 'Aide à domicile', periode: 'Février 2024', montant: 1120.00, statut: 'Payée', dateEmission: '2024-02-29', dateEcheance: '2024-03-15', datePaiement: '2024-03-12', intervenant: 'Sophie Martin' },
  { id: 'FAC-2024-006', beneficiaire: 'Roger Blanc', service: 'Aide ménagère', periode: 'Février 2024', montant: 520.75, statut: 'Annulée', dateEmission: '2024-02-29', dateEcheance: '2024-03-15', datePaiement: null, intervenant: 'Fatou Diallo' },
  { id: 'FAC-2024-007', beneficiaire: 'Hélène Rousseau', service: 'Aide à domicile', periode: 'Février 2024', montant: 1890.00, statut: 'En attente', dateEmission: '2024-02-29', dateEcheance: '2024-03-15', datePaiement: null, intervenant: 'Claire Bernard' },
  { id: 'FAC-2024-008', beneficiaire: 'Paul Fontaine', service: 'Garde de nuit', periode: 'Février 2024', montant: 2340.00, statut: 'Payée', dateEmission: '2024-02-29', dateEcheance: '2024-03-15', datePaiement: '2024-03-05', intervenant: 'Marc Aubert' },
  { id: 'FAC-2024-009', beneficiaire: 'Lucie Renard', service: 'Aide à domicile', periode: 'Mars 2024', montant: 1360.00, statut: 'En attente', dateEmission: '2024-03-31', dateEcheance: '2024-04-15', datePaiement: null, intervenant: 'Sophie Martin' },
  { id: 'FAC-2024-010', beneficiaire: 'Georges Lambert', service: 'Aide ménagère', periode: 'Mars 2024', montant: 760.00, statut: 'Impayée', dateEmission: '2024-03-31', dateEcheance: '2024-04-15', datePaiement: null, intervenant: 'Karine Lefebvre' },
];

const STATUT_CONFIG = {
  'Payée':      { variant: 'success', icon: CheckCircle },
  'En attente': { variant: 'warning', icon: Clock },
  'Impayée':    { variant: 'danger',  icon: AlertCircle },
  'Annulée':    { variant: 'neutral', icon: XCircle },
};

const PERIODES = ['Toutes les périodes', 'Janvier 2024', 'Février 2024', 'Mars 2024'];
const STATUTS  = ['Tous les statuts', 'Payée', 'En attente', 'Impayée', 'Annulée'];

const EMPTY_FORM = {
  beneficiaire: '', service: 'Aide à domicile', periode: '', montant: '', statut: 'En attente',
  dateEmission: '', dateEcheance: '', intervenant: '',
};

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

/* ─── Component ────────────────────────────────────────────────────────── */
const FacturesPage = () => {
  const [search, setSearch]     = useState('');
  const [periode, setPeriode]   = useState('Toutes les périodes');
  const [statut, setStatut]     = useState('Tous les statuts');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [factures, setFactures] = useState(MOCK_FACTURES);

  /* Stats */
  const stats = useMemo(() => {
    const payees    = factures.filter(f => f.statut === 'Payée');
    const impayees  = factures.filter(f => f.statut === 'Impayée');
    const attente   = factures.filter(f => f.statut === 'En attente');
    const ca        = payees.reduce((s, f) => s + f.montant, 0);
    const totalImp  = impayees.reduce((s, f) => s + f.montant, 0);
    const totalAtt  = attente.reduce((s, f) => s + f.montant, 0);
    const total     = factures.reduce((s, f) => s + f.montant, 0);
    const taux      = total > 0 ? Math.round((ca / total) * 100) : 0;
    return { ca, impayees: totalImp, attente: totalAtt, taux };
  }, [factures]);

  /* Filtered list */
  const filtered = useMemo(() => {
    return factures.filter(f => {
      const matchSearch = search === '' ||
        f.beneficiaire.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase());
      const matchPeriode = periode === 'Toutes les périodes' || f.periode === periode;
      const matchStatut  = statut  === 'Tous les statuts'   || f.statut  === statut;
      return matchSearch && matchPeriode && matchStatut;
    });
  }, [factures, search, periode, statut]);

  /* Actions */
  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModalOpen(true); };
  const openEdit   = (f)  => {
    setForm({ beneficiaire: f.beneficiaire, service: f.service, periode: f.periode, montant: f.montant, statut: f.statut, dateEmission: f.dateEmission, dateEcheance: f.dateEcheance, intervenant: f.intervenant });
    setEditId(f.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editId) {
      setFactures(prev => prev.map(f => f.id === editId ? { ...f, ...form, montant: parseFloat(form.montant) } : f));
    } else {
      const newId = `FAC-2024-${String(factures.length + 1).padStart(3, '0')}`;
      setFactures(prev => [...prev, { ...form, id: newId, montant: parseFloat(form.montant) || 0, datePaiement: null }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette facture ?')) {
      setFactures(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Bénéficiaire', 'Service', 'Période', 'Montant', 'Statut', 'Date émission', 'Date échéance'].join(';'),
      ...filtered.map(f => [f.id, f.beneficiaire, f.service, f.periode, f.montant, f.statut, f.dateEmission, f.dateEcheance].join(';')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'factures.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Facturation</h1>
          <p className="text-sm text-slate-500 mt-0.5">{factures.length} factures · exercice 2024</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <Download size={16} /> Exporter
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl hover:from-teal-700 hover:to-teal-800 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Plus size={16} /> Nouvelle facture
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chiffre d'affaires"
          value={fmt(stats.ca)}
          icon={Euro}
          color="teal"
          trend="+8.2%"
          trendUp={true}
        />
        <StatCard
          title="Impayées"
          value={fmt(stats.impayees)}
          icon={AlertCircle}
          color="rose"
          trend="2 factures"
          trendUp={false}
        />
        <StatCard
          title="En attente"
          value={fmt(stats.attente)}
          icon={Clock}
          color="amber"
          trend="3 factures"
          trendUp={null}
        />
        <StatCard
          title="Taux de recouvrement"
          value={`${stats.taux}%`}
          icon={TrendingUp}
          color="emerald"
          trend="+3pts"
          trendUp={true}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une facture ou un bénéficiaire…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            {PERIODES.map(p => <option key={p}>{p}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={statut}
            onChange={e => setStatut(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            {STATUTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slideUp">
        {filtered.length === 0 ? (
          <EmptyState icon="file" title="Aucune facture trouvée" description="Modifiez vos filtres ou créez une nouvelle facture." action="Nouvelle facture" onAction={openCreate} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Référence', 'Bénéficiaire', 'Service', 'Période', 'Montant', 'Statut', 'Échéance', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((f, idx) => {
                  const cfg = STATUT_CONFIG[f.statut] || STATUT_CONFIG['En attente'];
                  const Icon = cfg.icon;
                  return (
                    <tr key={f.id} className="hover:bg-teal-50/30 transition-colors group" style={{ animationDelay: `${idx * 30}ms` }}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">{f.id}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{f.beneficiaire}</td>
                      <td className="px-4 py-3 text-slate-500">{f.service}</td>
                      <td className="px-4 py-3 text-slate-500">{f.periode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fmt(f.montant)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant} dot size="sm">
                          {f.statut}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{f.dateEcheance}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewModal(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Modifier la facture' : 'Nouvelle facture'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all">
              {editId ? 'Enregistrer' : 'Créer la facture'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Bénéficiaire', key: 'beneficiaire', type: 'text', placeholder: 'Nom du bénéficiaire' },
            { label: 'Intervenant', key: 'intervenant', type: 'text', placeholder: 'Nom de l\'intervenant' },
            { label: 'Période', key: 'periode', type: 'text', placeholder: 'ex. Janvier 2024' },
            { label: 'Montant (€)', key: 'montant', type: 'number', placeholder: '0.00' },
            { label: 'Date d\'émission', key: 'dateEmission', type: 'date' },
            { label: 'Date d\'échéance', key: 'dateEcheance', type: 'date' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Service</label>
            <select value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50">
              {['Aide à domicile', 'Aide ménagère', 'Portage de repas', 'Garde de nuit', 'Accompagnement'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Statut</label>
            <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50">
              {['En attente', 'Payée', 'Impayée', 'Annulée'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {viewModal && (
        <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title={`Facture ${viewModal.id}`} size="md"
          footer={
            <button onClick={() => setViewModal(null)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              Fermer
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-2xl font-bold text-slate-800">{fmt(viewModal.montant)}</span>
              <Badge variant={STATUT_CONFIG[viewModal.statut]?.variant} dot size="md">{viewModal.statut}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Bénéficiaire', viewModal.beneficiaire],
                ['Intervenant', viewModal.intervenant],
                ['Service', viewModal.service],
                ['Période', viewModal.periode],
                ['Date d\'émission', viewModal.dateEmission],
                ['Date d\'échéance', viewModal.dateEcheance],
                ['Date de paiement', viewModal.datePaiement || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-400 font-medium">{k}</dt>
                  <dd className="text-sm font-semibold text-slate-700 mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FacturesPage;
