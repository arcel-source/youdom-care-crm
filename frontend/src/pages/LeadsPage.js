import React, { useState, useEffect } from 'react';
import { Search, Plus, List, Columns, Edit2, Trash2, ArrowUp, ArrowDown, Phone, Mail, Calendar } from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/common/EmptyState';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatDate, filterBySearch, getStatusVariant } from '../utils/helpers';
import { LEAD_STATUT_LABELS, LEAD_STATUTS, LEAD_SOURCE_LABELS } from '../utils/constants';

const MOCK_LEADS = [
  { id: 1, nom: 'Sophie Leclerc', source: 'prescripteur', statut: 'qualifie', score: 85, telephone: '0612345680', email: 'sophie.leclerc@email.fr', notes: 'Besoin aide ménagère + toilette', date: '2026-03-28' },
  { id: 2, nom: 'Robert Moreau', source: 'site_web', statut: 'contacte', score: 60, telephone: '0698765435', email: null, notes: '', date: '2026-03-30' },
  { id: 3, nom: 'Isabelle Petit', source: 'hopital', statut: 'devis_envoye', score: 90, telephone: '0645678915', email: 'isa.petit@email.fr', notes: 'GIR 2, aide intensive', date: '2026-03-31' },
  { id: 4, nom: 'Paul Bernard', source: 'bouche_a_oreille', statut: 'nouveau', score: 40, telephone: '0678901236', email: null, notes: '', date: '2026-04-01' },
  { id: 5, nom: 'Lucie Simon', source: 'site_web', statut: 'gagne', score: 95, telephone: '0623456790', email: 'lucie.simon@email.fr', notes: 'Converti en bénéficiaire', date: '2026-03-25' },
  { id: 6, nom: 'Henri Dubois', source: 'prescripteur', statut: 'perdu', score: 30, telephone: '0689012346', email: null, notes: 'A choisi un concurrent', date: '2026-03-20' },
];

const KANBAN_COLUMNS = [
  { key: 'nouveau', label: 'Nouveau', color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400' },
  { key: 'contacte', label: 'Contacté', color: 'bg-violet-500', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-400' },
  { key: 'qualifie', label: 'Qualifié', color: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
  { key: 'devis_envoye', label: 'Devis envoyé', color: 'bg-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-400' },
  { key: 'gagne', label: 'Gagné ✓', color: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  { key: 'perdu', label: 'Perdu', color: 'bg-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-400' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Toutes les sources' },
  { value: 'site_web', label: 'Site web' },
  { value: 'prescripteur', label: 'Prescripteur' },
  { value: 'hopital', label: 'Hôpital' },
  { value: 'bouche_a_oreille', label: 'Bouche à oreille' },
  { value: 'publicite', label: 'Publicité' },
  { value: 'autre', label: 'Autre' },
];

const EMPTY_FORM = { nom: '', telephone: '', email: '', source: 'site_web', statut: 'nouveau', score: 50, notes: '' };

function ScoreBar({ score, color = '#0d9488' }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: score >= 70 ? '#059669' : score >= 40 ? '#d97706' : '#e11d48' }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-6 text-right">{score}</span>
    </div>
  );
}

function LeadAvatar({ nom }) {
  const initials = nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = [
    ['#0d9488', '#064e3b'], ['#7c3aed', '#3b0764'], ['#0891b2', '#0c4a6e'],
    ['#d97706', '#78350f'], ['#059669', '#064e3b'],
  ];
  const idx = nom.charCodeAt(0) % colors.length;
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
      style={{ background: `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})` }}
    >
      {initials}
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    setTimeout(() => { setLeads(MOCK_LEADS); setLoading(false); }, 400);
  }, []);

  const filtered = leads
    .filter(l => !filterSource || l.source === filterSource)
    .filter(l => filterBySearch([l], search, ['nom', 'email', 'telephone']).length > 0);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortField], vb = b[sortField];
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    if (formData.id) {
      setLeads(prev => prev.map(l => l.id === formData.id ? formData : l));
    } else {
      const newId = Math.max(...leads.map(l => l.id), 0) + 1;
      setLeads(prev => [{ ...formData, id: newId, date: new Date().toISOString().split('T')[0] }, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setLeads(prev => prev.filter(l => l.id !== selectedId));
    setShowConfirm(false);
  };

  const handleStatusChange = (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, statut: newStatus } : l));
  };

  const handleDragStart = (e, leadId) => {
    setDragging(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (dragging) handleStatusChange(dragging, status);
    setDragging(null);
    setDragOver(null);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUp size={11} className="inline ml-1 text-slate-300" />;
    return sortDir === 'asc'
      ? <ArrowUp size={11} className="inline ml-1 text-teal-600" />
      : <ArrowDown size={11} className="inline ml-1 text-teal-600" />;
  };

  if (loading) return <PageLoader text="Chargement des leads..." />;

  // Stats rapides
  const gagnes = leads.filter(l => l.statut === 'gagne').length;
  const convRate = leads.length ? Math.round((gagnes / leads.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leads</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} lead{filtered.length > 1 ? 's' : ''} ·{' '}
            <span className="text-emerald-600 font-semibold">{gagnes} gagné{gagnes > 1 ? 's' : ''}</span> ·{' '}
            Taux de conversion : <span className="font-semibold text-teal-600">{convRate}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${view === 'kanban' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Columns size={13} /> Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${view === 'list' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={13} /> Liste
            </button>
          </div>
          <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>
            Nouveau lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un lead..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>
          <Select
            options={SOURCE_OPTIONS}
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            placeholder="Source"
          />
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {KANBAN_COLUMNS.map(col => {
              const colLeads = filtered.filter(l => l.statut === col.key);
              const isDragTarget = dragOver === col.key;

              return (
                <div
                  key={col.key}
                  className={`w-60 rounded-2xl border flex flex-col transition-all duration-150
                    ${isDragTarget ? `${col.border} ${col.bg} scale-[1.01]` : 'border-slate-200 bg-slate-50'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, col.key)}
                >
                  {/* Column header */}
                  <div className={`flex items-center gap-2 px-3 py-3 border-b ${isDragTarget ? col.border : 'border-slate-200'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.color}`} />
                    <span className={`text-xs font-semibold flex-1 ${col.text}`}>{col.label}</span>
                    <span className="text-xs text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full font-medium">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-2 space-y-2 min-h-28">
                    {colLeads.length === 0 && (
                      <div className="text-center text-xs text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-xl">
                        Déposer ici
                      </div>
                    )}
                    {colLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        className={`bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all duration-150
                          ${dragging === lead.id ? 'opacity-50 rotate-1' : 'cursor-grab active:cursor-grabbing'}`}
                      >
                        {/* Lead card header */}
                        <div className="flex items-start gap-2 mb-2">
                          <LeadAvatar nom={lead.nom} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{lead.nom}</p>
                            <p className="text-xs text-slate-400">{LEAD_SOURCE_LABELS[lead.source] || lead.source}</p>
                          </div>
                        </div>

                        {/* Score */}
                        <ScoreBar score={lead.score} />

                        {/* Contact */}
                        {lead.telephone && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                            <Phone size={10} />
                            <span>{lead.telephone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                            <Mail size={10} />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}

                        {/* Notes */}
                        {lead.notes && (
                          <p className="text-xs text-slate-500 mt-2 bg-slate-50 px-2 py-1.5 rounded-lg italic">
                            {lead.notes}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar size={10} />
                            <span>{formatDate(lead.date)}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setFormData({ ...lead }); setShowModal(true); }}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => { setSelectedId(lead.id); setShowConfirm(true); }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
          {sorted.length === 0 ? (
            <EmptyState icon="TrendingUp" title="Aucun lead trouvé" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('nom')}>
                      Nom <SortIcon field="nom" />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell cursor-pointer" onClick={() => handleSort('source')}>
                      Source <SortIcon field="source" />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('statut')}>
                      Statut <SortIcon field="statut" />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer" onClick={() => handleSort('score')}>
                      Score <SortIcon field="score" />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer" onClick={() => handleSort('date')}>
                      Date <SortIcon field="date" />
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map(lead => (
                    <tr key={lead.id} className="hover:bg-teal-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <LeadAvatar nom={lead.nom} />
                          <div>
                            <p className="font-semibold text-slate-800">{lead.nom}</p>
                            {lead.telephone && (
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Phone size={10} /> {lead.telephone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                        {LEAD_SOURCE_LABELS[lead.source] || lead.source}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(lead.statut)} size="xs">
                          {LEAD_STATUT_LABELS[lead.statut]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="w-28">
                          <ScoreBar score={lead.score} />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          {formatDate(lead.date)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setFormData({ ...lead }); setShowModal(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => { setSelectedId(lead.id); setShowConfirm(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Form modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={formData.id ? 'Modifier le lead' : 'Nouveau lead'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button loading={saving} onClick={handleSave}>{formData.id ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nom complet"
            value={formData.nom}
            onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))}
            required
            containerClassName="sm:col-span-2"
          />
          <Input label="Téléphone" type="tel" value={formData.telephone} onChange={e => setFormData(p => ({ ...p, telephone: e.target.value }))} />
          <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
          <Select
            label="Source"
            value={formData.source}
            onChange={e => setFormData(p => ({ ...p, source: e.target.value }))}
            options={SOURCE_OPTIONS.slice(1)}
          />
          <Select
            label="Statut"
            value={formData.statut}
            onChange={e => setFormData(p => ({ ...p, statut: e.target.value }))}
            options={Object.entries(LEAD_STATUT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Score de qualification : <span className="text-teal-600 font-bold">{formData.score}/100</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.score}
              onChange={e => setFormData(p => ({ ...p, score: parseInt(e.target.value) }))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Froid</span>
              <span>Tiède</span>
              <span>Chaud</span>
            </div>
          </div>
          <Input
            label="Notes"
            value={formData.notes || ''}
            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
            containerClassName="sm:col-span-2"
            placeholder="Observations, besoins spécifiques..."
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Supprimer le lead"
        message="Ce lead sera définitivement supprimé."
      />
    </div>
  );
}
