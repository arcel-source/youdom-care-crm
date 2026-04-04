import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit2, Trash2, LayoutGrid, List, MapPin, Phone, Filter } from 'lucide-react';
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
  { id: 1, nom: 'Dupont', prenom: 'Marie', dateNaissance: '1942-03-15', typePublic: 'personnes_agees', niveauDependance: 'GIR3', intervenant: 'Claire Martin', statut: 'actif', telephone: '0612345678', email: 'marie.dupont@email.fr', services: ['Aide ménagère', 'Aide toilette'], adresse: 'Paris 12e' },
  { id: 2, nom: 'Martin', prenom: 'Jean', dateNaissance: '1938-07-22', typePublic: 'personnes_agees', niveauDependance: 'GIR2', intervenant: 'Sophie Blanc', statut: 'actif', telephone: '0698765432', email: 'jean.martin@email.fr', services: ['Garde nuit', 'Aide toilette'], adresse: 'Paris 15e' },
  { id: 3, nom: 'Petit', prenom: 'Isabelle', dateNaissance: '1958-11-08', typePublic: 'handicap', niveauDependance: 'GIR4', intervenant: 'Marc Leroy', statut: 'actif', telephone: '0645678912', email: 'isabelle.petit@email.fr', services: ['Aide ménagère'], adresse: 'Lyon 3e' },
  { id: 4, nom: 'Bernard', prenom: 'Paul', dateNaissance: '1945-06-30', typePublic: 'personnes_agees', niveauDependance: 'GIR5', intervenant: null, statut: 'en_attente', telephone: '0678901234', email: null, services: [], adresse: 'Marseille' },
  { id: 5, nom: 'Moreau', prenom: 'Lucie', dateNaissance: '1960-02-14', typePublic: 'maladie', niveauDependance: 'GIR3', intervenant: 'Claire Martin', statut: 'actif', telephone: '0623456789', email: 'lucie.moreau@email.fr', services: ['Aide repas', 'Sortie accompagnée'], adresse: 'Paris 11e' },
  { id: 6, nom: 'Simon', prenom: 'Robert', dateNaissance: '1950-09-25', typePublic: 'personnes_agees', niveauDependance: 'GIR1', intervenant: 'Sophie Blanc', statut: 'suspendu', telephone: '0689012345', email: null, services: ['Aide toilette', 'Garde nuit', 'Aide repas'], adresse: 'Bordeaux' },
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
  { value: '', label: 'Tous niveaux GIR' },
  { value: 'GIR1', label: 'GIR 1 (très dépendant)' },
  { value: 'GIR2', label: 'GIR 2' },
  { value: 'GIR3', label: 'GIR 3' },
  { value: 'GIR4', label: 'GIR 4' },
  { value: 'GIR5', label: 'GIR 5' },
  { value: 'GIR6', label: 'GIR 6 (autonome)' },
];

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'en_attente', label: 'En attente' },
];

const SERVICE_COLORS = {
  'Aide ménagère': 'bg-teal-100 text-teal-700',
  'Aide toilette': 'bg-blue-100 text-blue-700',
  'Aide repas': 'bg-amber-100 text-amber-700',
  'Garde nuit': 'bg-violet-100 text-violet-700',
  'Sortie accompagnée': 'bg-cyan-100 text-cyan-700',
  'default': 'bg-slate-100 text-slate-600',
};

const EMPTY_FORM = {
  prenom: '', nom: '', dateNaissance: '', telephone: '', email: '',
  typePublic: '', niveauDependance: '', adresse: '', statut: 'actif', services: [],
};

function BeneficiaireAvatar({ prenom, nom, size = 'md' }) {
  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  const colors = [
    'from-teal-400 to-teal-600', 'from-emerald-400 to-emerald-600',
    'from-cyan-400 to-cyan-600', 'from-blue-400 to-blue-600',
    'from-violet-400 to-violet-600',
  ];
  const idx = (prenom?.charCodeAt(0) || 0) % colors.length;
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';

  return (
    <div className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 bg-gradient-to-br shadow-sm ${sizeClass} ${colors[idx]}`}>
      {initials}
    </div>
  );
}

export default function BeneficiairesPage() {
  const navigate = useNavigate();
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [showFilters, setShowFilters] = useState(false);
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
    setBeneficiaires(prev => [{ ...formData, id: newId, services: [] }, ...prev]);
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

  // Counts
  const actifs = beneficiaires.filter(b => b.statut === 'actif').length;
  const enAttente = beneficiaires.filter(b => b.statut === 'en_attente').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bénéficiaires</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''} ·{' '}
            <span className="text-emerald-600 font-semibold">{actifs} actifs</span>
            {enAttente > 0 && (
              <> · <span className="text-amber-600 font-semibold">{enAttente} en attente</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${viewMode === 'table' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={13} /> Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${viewMode === 'cards' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={13} /> Cartes
            </button>
          </div>
          <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setErrors({}); setShowModal(true); }}>
            Nouveau bénéficiaire
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors
              ${showFilters ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Filter size={14} /> Filtres
            {(filterType || filterNiveau || filterStatut) && (
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100 animate-fadeIn">
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
        )}
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {paginated.length === 0 ? (
            <EmptyState icon="Users" title="Aucun bénéficiaire trouvé" description="Modifiez vos filtres ou ajoutez un nouveau bénéficiaire." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bénéficiaire</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Âge / GIR</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Services</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Intervenant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((b) => (
                      <tr key={b.id} className="hover:bg-teal-50/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <BeneficiaireAvatar prenom={b.prenom} nom={b.nom} />
                            <div>
                              <p className="font-semibold text-slate-800">{b.prenom} {b.nom}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Phone size={10} /> {formatPhoneNumber(b.telephone)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700">{calculateAge(b.dateNaissance)} ans</p>
                          <span className="text-xs font-semibold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md">{b.niveauDependance}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-slate-600 text-xs">{TYPES_PUBLIC_LABELS[b.typePublic] || b.typePublic}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(b.services || []).slice(0, 2).map(s => (
                              <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SERVICE_COLORS[s] || SERVICE_COLORS.default}`}>
                                {s}
                              </span>
                            ))}
                            {(b.services || []).length > 2 && (
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">+{b.services.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {b.intervenant ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                                {b.intervenant.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-sm text-slate-600">{b.intervenant}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Non assigné</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.statut} label={BENEFICIAIRE_STATUT_LABELS[b.statut]} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/beneficiaires/${b.id}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Voir le détail"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => { setFormData({ ...b }); setShowModal(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => { setSelectedId(b.id); setShowConfirm(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Supprimer"
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
              <div className="px-4 py-3 border-t border-slate-100">
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
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div>
          {paginated.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <EmptyState icon="Users" title="Aucun bénéficiaire trouvé" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                {paginated.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/beneficiaires/${b.id}`)}
                  >
                    {/* Card header */}
                    <div className="p-4 flex items-start gap-3">
                      <BeneficiaireAvatar prenom={b.prenom} nom={b.nom} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-800 text-base">{b.prenom} {b.nom}</p>
                            <p className="text-sm text-slate-500">{calculateAge(b.dateNaissance)} ans · {b.niveauDependance}</p>
                          </div>
                          <StatusBadge status={b.statut} label={BENEFICIAIRE_STATUT_LABELS[b.statut]} />
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="px-4 pb-3 space-y-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 pt-3 text-sm text-slate-600">
                        <Phone size={12} className="text-slate-400 flex-shrink-0" />
                        <span>{formatPhoneNumber(b.telephone)}</span>
                      </div>
                      {b.adresse && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{b.adresse}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        {TYPES_PUBLIC_LABELS[b.typePublic] || b.typePublic}
                      </div>
                    </div>

                    {/* Services tags */}
                    {(b.services || []).length > 0 && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1">
                        {b.services.map(s => (
                          <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SERVICE_COLORS[s] || SERVICE_COLORS.default}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      {b.intervenant ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                            {b.intervenant.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-xs text-slate-500">{b.intervenant}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Non assigné</span>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); setFormData({ ...b }); setShowModal(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedId(b.id); setShowConfirm(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-3">
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
      )}

      {/* Modal */}
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
          <Input label="Prénom" value={formData.prenom} onChange={e => setFormData(p => ({ ...p, prenom: e.target.value }))} error={errors.prenom} required />
          <Input label="Nom" value={formData.nom} onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))} error={errors.nom} required />
          <Input label="Date de naissance" type="date" value={formData.dateNaissance} onChange={e => setFormData(p => ({ ...p, dateNaissance: e.target.value }))} error={errors.dateNaissance} required />
          <Input label="Téléphone" type="tel" value={formData.telephone} onChange={e => setFormData(p => ({ ...p, telephone: e.target.value }))} />
          <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} containerClassName="sm:col-span-2" />
          <Select label="Type de public" value={formData.typePublic} onChange={e => setFormData(p => ({ ...p, typePublic: e.target.value }))} options={TYPE_PUBLIC_OPTIONS.slice(1)} placeholder="Sélectionner..." />
          <Select label="Niveau de dépendance" value={formData.niveauDependance} onChange={e => setFormData(p => ({ ...p, niveauDependance: e.target.value }))} options={NIVEAU_OPTIONS.slice(1)} placeholder="Sélectionner..." />
          <Input label="Adresse" value={formData.adresse || ''} onChange={e => setFormData(p => ({ ...p, adresse: e.target.value }))} containerClassName="sm:col-span-2" />
          <Select label="Statut" value={formData.statut} onChange={e => setFormData(p => ({ ...p, statut: e.target.value }))} options={STATUT_OPTIONS.slice(1)} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Supprimer le bénéficiaire"
        message="Cette action est irréversible. Toutes les données associées seront supprimées."
      />
    </div>
  );
}
