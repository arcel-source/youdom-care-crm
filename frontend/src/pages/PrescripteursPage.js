import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Mail, Building2, MapPin } from 'lucide-react';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatPhoneNumber, filterBySearch } from '../utils/helpers';

const MOCK_PRESCRIPTEURS = [
  { id: 1, nom: 'CHU de Lyon', type: 'hopital', contact: 'Dr. Marie Leclerc', telephone: '0472345678', email: 'assistante.sociale@chu-lyon.fr', adresse: '5 pl. d\'Arsonval, 69003 Lyon', leadsEnvoyes: 12, leadsConverti: 8 },
  { id: 2, nom: 'CCAS Paris 12', type: 'ccas', contact: 'Sophie Martin', telephone: '0143456789', email: 'ccas12@paris.fr', adresse: '130 av. Daumesnil, 75012 Paris', leadsEnvoyes: 7, leadsConverti: 5 },
  { id: 3, nom: 'Cabinet Dr. Petit', type: 'medecin', contact: 'Dr. Jean Petit', telephone: '0145678901', email: 'dr.petit@cabinet.fr', adresse: '45 rue de la Paix, 75001 Paris', leadsEnvoyes: 4, leadsConverti: 3 },
  { id: 4, nom: 'Association Bien Vieillir', type: 'association', contact: 'Anne Dupont', telephone: '0156789012', email: 'contact@bienvieillir.fr', adresse: '23 bd Voltaire, 75011 Paris', leadsEnvoyes: 3, leadsConverti: 1 },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'hopital', label: 'Hôpital / Clinique' },
  { value: 'ccas', label: 'CCAS / CIAS' },
  { value: 'medecin', label: 'Médecin / Cabinet médical' },
  { value: 'association', label: 'Association' },
  { value: 'mutuelle', label: 'Mutuelle / Assurance' },
  { value: 'autre', label: 'Autre' },
];

const TYPE_LABELS = {
  hopital: 'Hôpital', ccas: 'CCAS', medecin: 'Médecin', association: 'Association', mutuelle: 'Mutuelle', autre: 'Autre',
};

const TYPE_VARIANTS = {
  hopital: 'danger', ccas: 'info', medecin: 'success', association: 'purple', mutuelle: 'cyan', autre: 'gray',
};

const EMPTY_FORM = { nom: '', type: 'hopital', contact: '', telephone: '', email: '', adresse: '' };

export default function PrescripteursPage() {
  const [prescripteurs, setPrescripteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => { setPrescripteurs(MOCK_PRESCRIPTEURS); setLoading(false); }, 400);
  }, []);

  const filtered = prescripteurs
    .filter(p => !filterType || p.type === filterType)
    .filter(p => filterBySearch([p], search, ['nom', 'contact', 'email', 'adresse']).length > 0);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    if (formData.id) {
      setPrescripteurs(prev => prev.map(p => p.id === formData.id ? formData : p));
    } else {
      const newId = Math.max(...prescripteurs.map(p => p.id), 0) + 1;
      setPrescripteurs(prev => [{ ...formData, id: newId, leadsEnvoyes: 0, leadsConverti: 0 }, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setPrescripteurs(prev => prev.filter(p => p.id !== selectedId));
    setShowConfirm(false);
  };

  if (loading) return <PageLoader text="Chargement des prescripteurs..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prescripteurs & Partenaires</h1>
          <p className="text-gray-500 text-sm">{filtered.length} partenaire{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>Nouveau partenaire</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Select options={TYPE_OPTIONS} value={filterType} onChange={e => setFilterType(e.target.value)} />
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState icon="Building2" title="Aucun prescripteur trouvé" description="Ajoutez vos partenaires et prescripteurs." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{p.nom}</h3>
                    <Badge variant={TYPE_VARIANTS[p.type] || 'gray'} size="xs">{TYPE_LABELS[p.type] || p.type}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setFormData({...p}); setShowModal(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"><Edit2 size={14} /></button>
                  <button onClick={() => { setSelectedId(p.id); setShowConfirm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                {p.contact && <p className="font-medium text-gray-700">{p.contact}</p>}
                {p.telephone && (
                  <div className="flex items-center gap-1.5"><Phone size={11} className="text-gray-400" />{formatPhoneNumber(p.telephone)}</div>
                )}
                {p.email && (
                  <div className="flex items-center gap-1.5"><Mail size={11} className="text-gray-400" /><span className="truncate">{p.email}</span></div>
                )}
                {p.adresse && (
                  <div className="flex items-start gap-1.5"><MapPin size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />{p.adresse}</div>
                )}
              </div>

              <div className="flex gap-4 pt-3 border-t border-gray-100 text-xs">
                <div className="text-center">
                  <p className="font-bold text-lg text-gray-800">{p.leadsEnvoyes}</p>
                  <p className="text-gray-400">Leads envoyés</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-green-700">{p.leadsConverti}</p>
                  <p className="text-gray-400">Convertis</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-indigo-700">
                    {p.leadsEnvoyes ? Math.round((p.leadsConverti / p.leadsEnvoyes) * 100) : 0}%
                  </p>
                  <p className="text-gray-400">Taux conv.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? 'Modifier le partenaire' : 'Nouveau partenaire'} size="md"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button><Button loading={saving} onClick={handleSave}>{formData.id ? 'Enregistrer' : 'Créer'}</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nom de l'organisation" value={formData.nom} onChange={e => setFormData(p => ({...p, nom: e.target.value}))} required containerClassName="sm:col-span-2" />
          <Select label="Type" value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value}))} options={TYPE_OPTIONS.slice(1)} />
          <Input label="Contact référent" value={formData.contact} onChange={e => setFormData(p => ({...p, contact: e.target.value}))} />
          <Input label="Téléphone" type="tel" value={formData.telephone} onChange={e => setFormData(p => ({...p, telephone: e.target.value}))} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
          <Input label="Adresse" value={formData.adresse} onChange={e => setFormData(p => ({...p, adresse: e.target.value}))} containerClassName="sm:col-span-2" />
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} title="Supprimer le partenaire" message="Ce partenaire sera définitivement supprimé." />
    </div>
  );
}
