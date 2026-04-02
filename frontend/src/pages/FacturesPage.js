import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatCard from '../components/common/StatCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/common/EmptyState';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatDate, formatMoney, filterBySearch, getStatusVariant } from '../utils/helpers';
import { FACTURE_STATUT_LABELS } from '../utils/constants';

const MOCK_FACTURES = [
  { id: 1, reference: 'FAC-2026-001', beneficiaire: 'Marie Dupont', statut: 'payee', montantTotal: 850, montantPaye: 850, dateEmission: '2026-03-01', dateEcheance: '2026-03-31', ventilation: [{ financeur: 'APA', montant: 680 }, { financeur: 'Particulier', montant: 170 }] },
  { id: 2, reference: 'FAC-2026-002', beneficiaire: 'Jean Martin', statut: 'envoyee', montantTotal: 1200, montantPaye: 0, dateEmission: '2026-03-05', dateEcheance: '2026-04-05', ventilation: [{ financeur: 'PCH', montant: 1000 }, { financeur: 'Particulier', montant: 200 }] },
  { id: 3, reference: 'FAC-2026-003', beneficiaire: 'Isabelle Petit', statut: 'en_retard', montantTotal: 320, montantPaye: 0, dateEmission: '2026-02-01', dateEcheance: '2026-02-28', ventilation: [{ financeur: 'Particulier', montant: 320 }] },
  { id: 4, reference: 'FAC-2026-004', beneficiaire: 'Lucie Moreau', statut: 'emise', montantTotal: 600, montantPaye: 0, dateEmission: '2026-04-01', dateEcheance: '2026-04-30', ventilation: [{ financeur: 'APA', montant: 480 }, { financeur: 'Mutuelle', montant: 120 }] },
];

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' }, { value: 'emise', label: 'Émise' },
  { value: 'envoyee', label: 'Envoyée' }, { value: 'payee', label: 'Payée' },
  { value: 'en_retard', label: 'En retard' }, { value: 'annulee', label: 'Annulée' },
];

export default function FacturesPage() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setTimeout(() => { setFactures(MOCK_FACTURES); setLoading(false); }, 400);
  }, []);

  const filtered = factures
    .filter(f => !filterStatut || f.statut === filterStatut)
    .filter(f => filterBySearch([f], search, ['reference', 'beneficiaire']).length > 0);

  const totalEmis = factures.reduce((s, f) => s + f.montantTotal, 0);
  const totalPaye = factures.reduce((s, f) => s + f.montantPaye, 0);
  const totalImpaye = totalEmis - totalPaye;
  const nbRetard = factures.filter(f => f.statut === 'en_retard').length;

  const handleMarkPaid = (id) => {
    setFactures(prev => prev.map(f => f.id === id ? { ...f, statut: 'payee', montantPaye: f.montantTotal } : f));
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setFactures(prev => prev.filter(f => f.id !== selectedId));
    setShowConfirm(false);
  };

  const detail = showDetail ? factures.find(f => f.id === showDetail) : null;

  if (loading) return <PageLoader text="Chargement des factures..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Factures</h1>
        <p className="text-gray-500 text-sm">{filtered.length} facture{filtered.length > 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total émis" value={formatMoney(totalEmis)} icon="Receipt" color="indigo" />
        <StatCard title="Encaissé" value={formatMoney(totalPaye)} icon="CheckCircle" color="green" />
        <StatCard title="Impayé" value={formatMoney(totalImpaye)} icon="AlertCircle" color="amber" />
        <StatCard title="En retard" value={nbRetard} icon="Clock" color="red" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Select options={STATUT_OPTIONS} value={filterStatut} onChange={e => setFilterStatut(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon="Receipt" title="Aucune facture trouvée" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Bénéficiaire</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Montant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Émission</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Échéance</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(f => (
                  <tr key={f.id} className={`hover:bg-gray-50 ${f.statut === 'en_retard' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{f.reference}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{f.beneficiaire}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {f.statut === 'en_retard' && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
                        <Badge variant={getStatusVariant(f.statut)} size="xs">{FACTURE_STATUT_LABELS[f.statut]}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-semibold text-gray-700">{formatMoney(f.montantTotal)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{formatDate(f.dateEmission)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{formatDate(f.dateEcheance)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowDetail(f.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"><Eye size={15} /></button>
                        {['emise', 'envoyee', 'en_retard'].includes(f.statut) && (
                          <button onClick={() => handleMarkPaid(f.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50" title="Marquer payée"><CheckCircle size={15} /></button>
                        )}
                        <button onClick={() => { setSelectedId(f.id); setShowConfirm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
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
      <Modal isOpen={!!detail} onClose={() => setShowDetail(null)} title={detail ? `Facture ${detail.reference}` : ''} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400 mb-1">Bénéficiaire</p><p className="font-medium">{detail.beneficiaire}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Statut</p><Badge variant={getStatusVariant(detail.statut)}>{FACTURE_STATUT_LABELS[detail.statut]}</Badge></div>
              <div><p className="text-xs text-gray-400 mb-1">Montant total</p><p className="font-bold text-xl text-gray-800">{formatMoney(detail.montantTotal)}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Encaissé</p><p className="font-bold text-xl text-green-700">{formatMoney(detail.montantPaye)}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Date émission</p><p>{formatDate(detail.dateEmission)}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Échéance</p><p>{formatDate(detail.dateEcheance)}</p></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Ventilation financeurs</p>
              <div className="space-y-2">
                {detail.ventilation.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-700">{v.financeur}</span>
                    <span className="font-semibold text-gray-800">{formatMoney(v.montant)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} title="Supprimer la facture" message="Cette facture sera définitivement supprimée." />
    </div>
  );
}
