import React, { useState, useEffect } from 'react';
import { Search, Plus, List, Columns, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
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
  { key: 'nouveau', label: 'Nouveau', color: 'bg-blue-500' },
  { key: 'contacte', label: 'Contacté', color: 'bg-purple-500' },
  { key: 'qualifie', label: 'Qualifié', color: 'bg-amber-500' },
  { key: 'devis_envoye', label: 'Devis envoyé', color: 'bg-cyan-500' },
  { key: 'gagne', label: 'Gagné', color: 'bg-green-500' },
  { key: 'perdu', label: 'Perdu', color: 'bg-red-500' },
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

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'
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
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ArrowUp size={12} className="inline ml-1" /> : <ArrowDown size={12} className="inline ml-1" />;
  };

  if (loading) return <PageLoader text="Chargement des leads..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leads</h1>
          <p className="text-gray-500 text-sm">{filtered.length} lead{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView('kanban')} className={`px-3 py-2 flex items-center gap-1 text-sm transition-colors ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Columns size={15} /> Kanban
            </button>
            <button onClick={() => setView('list')} className={`px-3 py-2 flex items-center gap-1 text-sm transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <List size={15} /> Liste
            </button>
          </div>
          <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>Nouveau lead</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Select options={SOURCE_OPTIONS} value={filterSource} onChange={e => setFilterSource(e.target.value)} placeholder="Source" />
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLUMNS.map(col => {
              const colLeads = filtered.filter(l => l.statut === col.key);
              return (
                <div key={col.key}
                  className="w-64 bg-gray-50 rounded-xl border border-gray-200 flex flex-col"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, col.key)}>
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200">
                    <span className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="text-sm font-medium text-gray-700">{col.label}</span>
                    <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full">{colLeads.length}</span>
                  </div>
                  <div className="flex-1 p-2 space-y-2 min-h-32">
                    {colLeads.length === 0 && (
                      <div className="text-center text-xs text-gray-400 py-6">Déposer ici</div>
                    )}
                    {colLeads.map(lead => (
                      <div key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow">
                        <p className="text-sm font-medium text-gray-800 mb-1">{lead.nom}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{LEAD_SOURCE_LABELS[lead.source] || lead.source}</span>
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${lead.score}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{lead.score}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(lead.date)}</p>
                        <div className="flex gap-1 mt-2">
                          <button onClick={() => { setFormData({...lead}); setShowModal(true); }} className="p-1 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50"><Edit2 size={12} /></button>
                          <button onClick={() => { setSelectedId(lead.id); setShowConfirm(true); }} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={12} /></button>
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {sorted.length === 0 ? (
            <EmptyState icon="TrendingUp" title="Aucun lead trouvé" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={() => handleSort('nom')}>Nom <SortIcon field="nom" /></th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell cursor-pointer" onClick={() => handleSort('source')}>Source <SortIcon field="source" /></th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={() => handleSort('statut')}>Statut <SortIcon field="statut" /></th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell cursor-pointer" onClick={() => handleSort('score')}>Score <SortIcon field="score" /></th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell cursor-pointer" onClick={() => handleSort('date')}>Date <SortIcon field="date" /></th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{lead.nom}</p>
                        {lead.telephone && <p className="text-xs text-gray-400">{lead.telephone}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{LEAD_SOURCE_LABELS[lead.source] || lead.source}</td>
                      <td className="px-4 py-3"><Badge variant={getStatusVariant(lead.statut)} size="xs">{LEAD_STATUT_LABELS[lead.statut]}</Badge></td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${lead.score}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{lead.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{formatDate(lead.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setFormData({...lead}); setShowModal(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"><Edit2 size={15} /></button>
                          <button onClick={() => { setSelectedId(lead.id); setShowConfirm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? 'Modifier le lead' : 'Nouveau lead'} size="md"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button><Button loading={saving} onClick={handleSave}>{formData.id ? 'Enregistrer' : 'Créer'}</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nom complet" value={formData.nom} onChange={e => setFormData(p => ({...p, nom: e.target.value}))} required containerClassName="sm:col-span-2" />
          <Input label="Téléphone" type="tel" value={formData.telephone} onChange={e => setFormData(p => ({...p, telephone: e.target.value}))} />
          <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
          <Select label="Source" value={formData.source} onChange={e => setFormData(p => ({...p, source: e.target.value}))} options={SOURCE_OPTIONS.slice(1)} />
          <Select label="Statut" value={formData.statut} onChange={e => setFormData(p => ({...p, statut: e.target.value}))}
            options={Object.entries(LEAD_STATUT_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">Score ({formData.score}/100)</label>
            <input type="range" min="0" max="100" value={formData.score} onChange={e => setFormData(p => ({...p, score: parseInt(e.target.value)}))}
              className="w-full accent-indigo-600" />
          </div>
          <Input label="Notes" value={formData.notes || ''} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} containerClassName="sm:col-span-2" />
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} title="Supprimer le lead" message="Ce lead sera définitivement supprimé." />
    </div>
  );
}
