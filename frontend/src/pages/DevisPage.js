import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, Send, FileText } from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/common/EmptyState';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatDate, formatMoney, filterBySearch, getStatusVariant } from '../utils/helpers';
import { DEVIS_STATUT_LABELS } from '../utils/constants';

const MOCK_DEVIS = [
  { id: 1, reference: 'DEV-2026-001', lead: 'Sophie Leclerc', statut: 'envoye', montantHT: 1200, montantTTC: 1200, dateCreation: '2026-03-25', dateEnvoi: '2026-03-26', dateExpiration: '2026-04-26', services: ['Aide ménagère', 'Aide toilette'] },
  { id: 2, reference: 'DEV-2026-002', lead: 'Isabelle Petit', statut: 'accepte', montantHT: 2100, montantTTC: 2100, dateCreation: '2026-03-28', dateEnvoi: '2026-03-29', dateExpiration: '2026-04-29', services: ['Garde nuit'] },
  { id: 3, reference: 'DEV-2026-003', lead: 'Robert Moreau', statut: 'brouillon', montantHT: 800, montantTTC: 800, dateCreation: '2026-04-01', dateEnvoi: null, dateExpiration: null, services: ['Aide ménagère'] },
];

const STATUT_OPTIONS = [
  { value: 'brouillon', label: 'Brouillon' }, { value: 'envoye', label: 'Envoyé' },
  { value: 'accepte', label: 'Accepté' }, { value: 'refuse', label: 'Refusé' }, { value: 'expire', label: 'Expiré' },
];

const EMPTY_FORM = { lead: '', statut: 'brouillon', montantHT: '', services: [], notes: '' };

export default function DevisPage() {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => { setDevis(MOCK_DEVIS); setLoading(false); }, 400);
  }, []);

  const filtered = filterBySearch(devis, search, ['reference', 'lead']);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const newId = Math.max(...devis.map(d => d.id), 0) + 1;
    const newRef = `DEV-2026-${String(newId).padStart(3, '0')}`;
    setDevis(prev => [{ ...formData, id: newId, reference: newRef, montantTTC: parseFloat(formData.montantHT) || 0, dateCreation: new Date().toISOString().split('T')[0], dateEnvoi: null, dateExpiration: null }, ...prev]);
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setDevis(prev => prev.filter(d => d.id !== selectedId));
    setShowConfirm(false);
  };

  const handleSend = (id) => {
    setDevis(prev => prev.map(d => d.id === id ? { ...d, statut: 'envoye', dateEnvoi: new Date().toISOString().split('T')[0] } : d));
  };

  const detail = showDetail ? devis.find(d => d.id === showDetail) : null;

  if (loading) return <PageLoader text="Chargement des devis..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Devis</h1>
          <p className="text-gray-500 text-sm">{filtered.length} devis</p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>Nouveau devis</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', val: devis.length, color: 'bg-gray-50 text-gray-700' },
          { label: 'En attente', val: devis.filter(d => d.statut === 'envoye').length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Acceptés', val: devis.filter(d => d.statut === 'accepte').length, color: 'bg-green-50 text-green-700' },
          { label: 'CA potentiel', val: formatMoney(devis.filter(d => ['envoye', 'brouillon'].includes(d.statut)).reduce((s, d) => s + d.montantTTC, 0)), color: 'bg-indigo-50 text-indigo-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{s.val}</p>
            <p className="text-sm opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon="FileText" title="Aucun devis trouvé" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Montant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date création</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date envoi</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.reference}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.lead}</td>
                    <td className="px-4 py-3"><Badge variant={getStatusVariant(d.statut)} size="xs">{DEVIS_STATUT_LABELS[d.statut]}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell font-semibold text-gray-700">{formatMoney(d.montantTTC)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{formatDate(d.dateCreation)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{d.dateEnvoi ? formatDate(d.dateEnvoi) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowDetail(d.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Eye size={15} /></button>
                        {d.statut === 'brouillon' && (
                          <button onClick={() => handleSend(d.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Envoyer"><Send size={15} /></button>
                        )}
                        <button onClick={() => { setSelectedId(d.id); setShowConfirm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!detail} onClose={() => setShowDetail(null)} title={detail ? `Devis ${detail.reference}` : ''} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400 mb-1">Lead</p><p className="font-medium">{detail.lead}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Statut</p><Badge variant={getStatusVariant(detail.statut)}>{DEVIS_STATUT_LABELS[detail.statut]}</Badge></div>
              <div><p className="text-xs text-gray-400 mb-1">Montant TTC</p><p className="font-bold text-xl text-gray-800">{formatMoney(detail.montantTTC)}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Créé le</p><p>{formatDate(detail.dateCreation)}</p></div>
              {detail.dateEnvoi && <div><p className="text-xs text-gray-400 mb-1">Envoyé le</p><p>{formatDate(detail.dateEnvoi)}</p></div>}
              {detail.dateExpiration && <div><p className="text-xs text-gray-400 mb-1">Expire le</p><p>{formatDate(detail.dateExpiration)}</p></div>}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Services inclus</p>
              <div className="flex flex-wrap gap-2">
                {detail.services.map(s => <Badge key={s} variant="primary">{s}</Badge>)}
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
              <FileText size={16} className="text-gray-400" />
              Aperçu PDF disponible après envoi au client
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau devis" size="md"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button><Button loading={saving} onClick={handleSave}>Créer</Button></>}>
        <div className="space-y-4">
          <Input label="Lead / Prospect" value={formData.lead} onChange={e => setFormData(p => ({...p, lead: e.target.value}))} required />
          <Input label="Montant HT (€)" type="number" value={formData.montantHT} onChange={e => setFormData(p => ({...p, montantHT: e.target.value}))} min="0" step="0.01" />
          <Select label="Statut initial" value={formData.statut} onChange={e => setFormData(p => ({...p, statut: e.target.value}))} options={STATUT_OPTIONS} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} title="Supprimer le devis" message="Ce devis sera définitivement supprimé." />
    </div>
  );
}
