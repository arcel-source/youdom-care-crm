import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import Badge from '../components/common/Badge';
import { StatusBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatDate, calculateAge, formatPhoneNumber, filterBySearch, getStatusVariant } from '../utils/helpers';
import { BENEFICIAIRE_STATUT_LABELS, TYPES_PUBLIC_LABELS, NIVEAUX_DEPENDANCE_LABELS } from '../utils/constants';

const MOCK_BENEFICIAIRES = [
  { id: 1, nom: 'Dupont', prenom: 'Marie', dateNaissance: '1942-03-15', typePublic: 'personnes_agees', niveauDependance: 'GIR3', intervenant: 'Claire Martin', statut: 'actif', telephone: '0612345678', email: 'marie.dupont@email.fr' },
  { id: 2, nom: 'Martin', prenom: 'Jean', dateNaissance: '1938-07-22', typePublic: 'personnes_agees', niveauDependance: 'GIR2', intervenant: 'Sophie Blanc', statut: 'actif', telephone: '0698765432', email: 'jean.martin@email.fr' },
  { id: 3, nom: 'Petit', prenom: 'Isabelle', dateNaissance: '1958-11-08', typePublic: 'handicap', niveauDependance: 'GIR4', intervenant: 'Marc Leroy', statut: 'actif', telephone: '0645678912', email: 'isabelle.petit@email.fr' },
  { id: 4, nom: 'Bernard', prenom: 'Paul', dateNaissance: '1945-06-30', typePublic: 'personnes_agees', niveauDependance: 'GIR5', intervenant: null, statut: 'en_attente', telephone: '0678901234', email: null },
  { id: 5, nom: 'Moreau', prenom: 'Lucie', dateNaissance: '1960-02-14', typePublic: 'maladie', niveauDependance: 'GIR3', intervenant: 'Claire Martin', statut: 'actif', telephone: '0623456789', email: 'lucie.moreau@email.fr' },
  { id: 6, nom: 'Simon', prenom: 'Robert', dateNaissance: '1950-09-25', typePublic: 'personnes_agees', niveauDependance: 'GIR1', intervenant: 'Sophie Blanc', statut: 'suspendu', telephone: '0689012345', email: null },
];

const TYPE_PUBLIC_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'personnes_agees', label: 'Personnes âgées' },
  { value: 'handicap', label: 'Handicap' },
  { value: 'maladie', label: 'Maladie' },
  { value: 'enfant', label: 'Enfant' },
  { value: 'autre', label: 'Autre' },
];

const NIVEAU_OPTIONS = [
  { value: '', label: 'Tous les niveaux' },
  { value: 'GIR1', label: 'GIR 1' },
  { value: 'GIR2', label: 'GIR 2' },
  { value: 'GIR3', label: 'GIR 3' },
  { value: 'GIR4', label: 'GIR 4' },
  { value: 'GIR5', label: 'GIR 5' },
  { value: 'GIR6', label: 'GIR 6' },
];

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'en_attente', label: 'En attente' },
];

const EMPTY_FORM = {
  prenom: '', nom: '', dateNaissance: '', telephone: '', email: '',
  typePublic: '', niveauDependance: '', adresse: '', statut: 'actif',
};

export default function BeneficiairesPage() {
  const navigate = useNavigate();
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const PAGE_SIZE = 10;

  useEffect(() => {
    setTimeout(() => {
      setBeneficiaires(MOCK_BENEFICIAIRES);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = beneficiaires
    .filter(b => !filterType || b.typePublic === filterType)
    .filter(b => !filterNiveau || b.niveauDependance === filterNiveau)
    .filter(b => !filterStatut || b.statut === filterStatut)
    .filter(b => filterBySearch([b], search, ['nom', 'prenom', 'email', 'telephone']).length > 0);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const validate = () => {
    const errs = {};
    if (!formData.prenom.trim()) errs.prenom = 'Prénom requis';
    if (!formData.nom.trim()) errs.nom = 'Nom requis';
    if (!formData.dateNaissance) errs.dateNaissance = 'Date de naissance requise';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const newId = Math.max(...beneficiaires.map(b => b.id), 0) + 1;
    setBeneficiaires(prev => [{ ...formData, id: newId }, ...prev]);
    setSaving(false);
    setShowModal(false);
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setBeneficiaires(prev => prev.filter(b => b.id !== selectedId));
    setShowConfirm(false);
    setSelectedId(null);
  };

  if (loading) return <PageLoader text="Chargement des bénéficiaires..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bénéficiaires</h1>
          <p className="text-gray-500 text-sm">{filtered.length} bénéficiaire{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setErrors({}); setShowModal(true); }}>
          Nouveau bénéficiaire
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Select
            options={TYPE_PUBLIC_OPTIONS}
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
            placeholder="Type de public"
          />
          <Select
            options={NIVEAU_OPTIONS}
            value={filterNiveau}
            onChange={e => { setFilterNiveau(e.target.value); setCurrentPage(1); }}
            placeholder="Niveau GIR"
          />
          <Select
            options={STATUT_OPTIONS}
            value={filterStatut}
            onChange={e => { setFilterStatut(e.target.value); setCurrentPage(1); }}
            placeholder="Statut"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState icon="Users" title="Aucun bénéficiaire trouvé" description="Modifiez vos filtres ou ajoutez un nouveau bénéficiaire." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Âge</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Niveau</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Intervenant</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-semibold">{b.prenom[0]}{b.nom[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{b.prenom} {b.nom}</p>
                            <p className="text-xs text-gray-400">{formatPhoneNumber(b.telephone)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{calculateAge(b.dateNaissance)} ans</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-600">{TYPES_PUBLIC_LABELS[b.typePublic] || b.typePublic}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge variant="info" size="xs">{b.niveauDependance}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-gray-600">
                        {b.intervenant || <span className="text-gray-400 italic">Non assigné</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.statut} label={BENEFICIAIRE_STATUT_LABELS[b.statut]} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/beneficiaires/${b.id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Voir le détail"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => { setFormData({ ...b }); setShowModal(true); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => { setSelectedId(b.id); setShowConfirm(true); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal création/édition */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={formData.id ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button loading={saving} onClick={handleSave}>{formData.id ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Prénom" value={formData.prenom} onChange={e => setFormData(p => ({...p, prenom: e.target.value}))} error={errors.prenom} required />
          <Input label="Nom" value={formData.nom} onChange={e => setFormData(p => ({...p, nom: e.target.value}))} error={errors.nom} required />
          <Input label="Date de naissance" type="date" value={formData.dateNaissance} onChange={e => setFormData(p => ({...p, dateNaissance: e.target.value}))} error={errors.dateNaissance} required />
          <Input label="Téléphone" type="tel" value={formData.telephone} onChange={e => setFormData(p => ({...p, telephone: e.target.value}))} />
          <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData(p => ({...p, email: e.target.value}))} containerClassName="sm:col-span-2" />
          <Select label="Type de public" value={formData.typePublic} onChange={e => setFormData(p => ({...p, typePublic: e.target.value}))} options={TYPE_PUBLIC_OPTIONS.slice(1)} placeholder="Sélectionner..." />
          <Select label="Niveau de dépendance" value={formData.niveauDependance} onChange={e => setFormData(p => ({...p, niveauDependance: e.target.value}))} options={NIVEAU_OPTIONS.slice(1)} placeholder="Sélectionner..." />
          <Input label="Adresse" value={formData.adresse || ''} onChange={e => setFormData(p => ({...p, adresse: e.target.value}))} containerClassName="sm:col-span-2" />
          <Select label="Statut" value={formData.statut} onChange={e => setFormData(p => ({...p, statut: e.target.value}))} options={STATUT_OPTIONS.slice(1)} />
        </div>
      </Modal>

      {/* Confirmation suppression */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Supprimer le bénéficiaire"
        message="Cette action est irréversible. Toutes les données associées à ce bénéficiaire seront supprimées."
      />
    </div>
  );
}
