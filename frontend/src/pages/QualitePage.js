import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, Star } from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatCard from '../components/common/StatCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import TextArea from '../components/ui/TextArea';
import EmptyState from '../components/common/EmptyState';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatDate, filterBySearch, getStatusVariant } from '../utils/helpers';
import { QUALITE_STATUT_LABELS, QUALITE_TYPE_LABELS } from '../utils/constants';

const MOCK_TICKETS = [
  { id: 1, reference: 'INC-001', type: 'incident', titre: 'Intervenant absent sans prévenir', beneficiaire: 'Marie Dupont', statut: 'resolu', priorite: 'haute', date: '2026-03-15', description: 'L\'intervenant n\'est pas venu à l\'intervention planifiée du 15/03.', satisfaction: null },
  { id: 2, reference: 'REC-001', type: 'reclamation', titre: 'Qualité du ménage insuffisante', beneficiaire: 'Jean Martin', statut: 'en_cours', priorite: 'moyenne', date: '2026-03-22', description: 'La famille signale que le ménage n\'est pas effectué correctement.', satisfaction: null },
  { id: 3, reference: 'SUG-001', type: 'suggestion', titre: 'Proposition horaires flexibles', beneficiaire: 'Isabelle Petit', statut: 'ouvert', priorite: 'basse', date: '2026-03-28', description: 'Demande de pouvoir choisir les horaires d\'intervention.', satisfaction: null },
  { id: 4, reference: 'FEL-001', type: 'felicitation', titre: 'Très satisfait de Claire Martin', beneficiaire: 'Lucie Moreau', statut: 'ferme', priorite: 'basse', date: '2026-03-30', description: 'Félicitations pour la qualité du travail de l\'intervenante.', satisfaction: 5 },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'incident', label: 'Incident' }, { value: 'reclamation', label: 'Réclamation' },
  { value: 'suggestion', label: 'Suggestion' }, { value: 'felicitation', label: 'Félicitation' },
];

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ouvert', label: 'Ouvert' }, { value: 'en_cours', label: 'En cours' },
  { value: 'resolu', label: 'Résolu' }, { value: 'ferme', label: 'Fermé' },
];

const PRIORITE_OPTIONS = [
  { value: 'haute', label: 'Haute' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'basse', label: 'Basse' },
];

const EMPTY_FORM = { titre: '', type: 'incident', beneficiaire: '', priorite: 'moyenne', statut: 'ouvert', description: '' };

export default function QualitePage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => { setTickets(MOCK_TICKETS); setLoading(false); }, 400);
  }, []);

  const filtered = tickets
    .filter(t => !filterType || t.type === filterType)
    .filter(t => !filterStatut || t.statut === filterStatut)
    .filter(t => filterBySearch([t], search, ['titre', 'beneficiaire', 'reference']).length > 0);

  const totalOuverts = tickets.filter(t => t.statut === 'ouvert').length;
  const totalResolus = tickets.filter(t => ['resolu', 'ferme'].includes(t.statut)).length;
  const avgSat = tickets.filter(t => t.satisfaction).reduce((s, t, _, arr) => s + t.satisfaction / arr.length, 0);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const newId = Math.max(...tickets.map(t => t.id), 0) + 1;
    const prefixMap = { incident: 'INC', reclamation: 'REC', suggestion: 'SUG', felicitation: 'FEL' };
    const prefix = prefixMap[formData.type] || 'TKT';
    const newRef = `${prefix}-${String(newId).padStart(3, '0')}`;
    setTickets(prev => [{ ...formData, id: newId, reference: newRef, date: new Date().toISOString().split('T')[0], satisfaction: null }, ...prev]);
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setTickets(prev => prev.filter(t => t.id !== selectedId));
    setShowConfirm(false);
  };

  const getPrioriteVariant = (p) => ({ haute: 'danger', moyenne: 'warning', basse: 'gray' }[p] || 'gray');
  const getTypeVariant = (t) => ({ incident: 'danger', reclamation: 'warning', suggestion: 'info', felicitation: 'success' }[t] || 'gray');

  const detail = showDetail ? tickets.find(t => t.id === showDetail) : null;

  if (loading) return <PageLoader text="Chargement des tickets qualité..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Qualité</h1>
          <p className="text-gray-500 text-sm">{filtered.length} ticket{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>Nouveau ticket</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total tickets" value={tickets.length} icon="Star" color="indigo" />
        <StatCard title="Ouverts" value={totalOuverts} icon="AlertCircle" color="red" />
        <StatCard title="Résolus" value={totalResolus} icon="CheckCircle" color="green" />
        <div className="bg-amber-50 rounded-xl p-5 flex items-start gap-4">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
            <Star size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Satisfaction</p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={16} className={n <= Math.round(avgSat) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{avgSat.toFixed(1)}/5</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Select options={TYPE_OPTIONS} value={filterType} onChange={e => setFilterType(e.target.value)} />
          <Select options={STATUT_OPTIONS} value={filterStatut} onChange={e => setFilterStatut(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon="Star" title="Aucun ticket qualité" description="Créez votre premier ticket pour suivre la qualité de service." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Titre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Bénéficiaire</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Priorité</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.reference}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{t.titre}</td>
                    <td className="px-4 py-3"><Badge variant={getTypeVariant(t.type)} size="xs">{QUALITE_TYPE_LABELS[t.type]}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">{t.beneficiaire}</td>
                    <td className="px-4 py-3"><Badge variant={getStatusVariant(t.statut)} size="xs">{QUALITE_STATUT_LABELS[t.statut]}</Badge></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Badge variant={getPrioriteVariant(t.priorite)} size="xs">{t.priorite}</Badge></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowDetail(t.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"><Eye size={15} /></button>
                        <button onClick={() => { setSelectedId(t.id); setShowConfirm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!detail} onClose={() => setShowDetail(null)} title={detail ? detail.titre : ''} size="md">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex gap-2 flex-wrap">
              <Badge variant={getTypeVariant(detail.type)}>{QUALITE_TYPE_LABELS[detail.type]}</Badge>
              <Badge variant={getStatusVariant(detail.statut)}>{QUALITE_STATUT_LABELS[detail.statut]}</Badge>
              <Badge variant={getPrioriteVariant(detail.priorite)}>Priorité {detail.priorite}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-400 mb-0.5">Bénéficiaire</p><p className="font-medium">{detail.beneficiaire}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Date</p><p>{formatDate(detail.date)}</p></div>
            </div>
            <div><p className="text-xs text-gray-400 mb-1">Description</p><p className="bg-gray-50 p-3 rounded-lg text-gray-700">{detail.description}</p></div>
            {detail.satisfaction && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Satisfaction</p>
                <div className="flex">{[1,2,3,4,5].map(n => <Star key={n} size={18} className={n <= detail.satisfaction ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />)}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau ticket qualité" size="md"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button><Button loading={saving} onClick={handleSave}>Créer</Button></>}>
        <div className="space-y-4">
          <Input label="Titre" value={formData.titre} onChange={e => setFormData(p => ({...p, titre: e.target.value}))} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value}))} options={TYPE_OPTIONS.slice(1)} />
            <Select label="Priorité" value={formData.priorite} onChange={e => setFormData(p => ({...p, priorite: e.target.value}))} options={PRIORITE_OPTIONS} />
          </div>
          <Input label="Bénéficiaire concerné" value={formData.beneficiaire} onChange={e => setFormData(p => ({...p, beneficiaire: e.target.value}))} />
          <TextArea label="Description" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} rows={4} maxLength={500} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} title="Supprimer le ticket" message="Ce ticket qualité sera définitivement supprimé." />
    </div>
  );
}
