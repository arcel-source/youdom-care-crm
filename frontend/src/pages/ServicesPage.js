import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Euro, Sun, Moon, Calendar } from 'lucide-react';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import TextArea from '../components/ui/TextArea';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatMoney } from '../utils/helpers';

const MOCK_SERVICES = [
  { id: 1, nom: 'Aide ménagère', description: 'Ménage, linge, courses et entretien du domicile', categorie: 'menage', tarifJour: 23.50, tarifNuit: null, tarifWE: 27.50, actif: true, unite: 'heure' },
  { id: 2, nom: 'Aide à la toilette', description: 'Aide à la toilette, habillage et soins d\'hygiène corporelle', categorie: 'soin', tarifJour: 28.00, tarifNuit: null, tarifWE: 33.00, actif: true, unite: 'heure' },
  { id: 3, nom: 'Aide aux repas', description: 'Préparation et aide à la prise des repas', categorie: 'repas', tarifJour: 22.00, tarifNuit: null, tarifWE: 26.00, actif: true, unite: 'heure' },
  { id: 4, nom: 'Garde de nuit', description: 'Présence et surveillance nocturne au domicile', categorie: 'garde', tarifJour: null, tarifNuit: 18.50, tarifWE: 22.00, actif: true, unite: 'heure' },
  { id: 5, nom: 'Sortie accompagnée', description: 'Accompagnement aux rendez-vous médicaux et courses', categorie: 'accompagnement', tarifJour: 25.00, tarifNuit: null, tarifWE: 30.00, actif: true, unite: 'heure' },
  { id: 6, nom: 'Portage de repas', description: 'Livraison de repas au domicile', categorie: 'repas', tarifJour: 8.50, tarifNuit: null, tarifWE: 10.00, actif: true, unite: 'repas' },
];

const CATEGORIE_OPTIONS = [
  { value: 'menage', label: 'Ménage' }, { value: 'soin', label: 'Soins' },
  { value: 'repas', label: 'Repas' }, { value: 'garde', label: 'Garde' },
  { value: 'accompagnement', label: 'Accompagnement' }, { value: 'autre', label: 'Autre' },
];

const CATEGORIE_VARIANTS = {
  menage: 'info', soin: 'success', repas: 'amber', garde: 'purple', accompagnement: 'cyan', autre: 'gray',
};

const UNITE_OPTIONS = [
  { value: 'heure', label: 'Heure' }, { value: 'journee', label: 'Journée' },
  { value: 'nuit', label: 'Nuit' }, { value: 'repas', label: 'Repas' }, { value: 'visite', label: 'Visite' },
];

const EMPTY_FORM = { nom: '', description: '', categorie: 'menage', tarifJour: '', tarifNuit: '', tarifWE: '', unite: 'heure', actif: true };

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => { setServices(MOCK_SERVICES); setLoading(false); }, 400);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const parseNum = v => v === '' || v === null ? null : parseFloat(v);
    const serviceData = {
      ...formData,
      tarifJour: parseNum(formData.tarifJour),
      tarifNuit: parseNum(formData.tarifNuit),
      tarifWE: parseNum(formData.tarifWE),
    };
    if (formData.id) {
      setServices(prev => prev.map(s => s.id === formData.id ? serviceData : s));
    } else {
      const newId = Math.max(...services.map(s => s.id), 0) + 1;
      setServices(prev => [...prev, { ...serviceData, id: newId }]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setServices(prev => prev.filter(s => s.id !== selectedId));
    setShowConfirm(false);
  };

  const handleToggleActif = (id) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, actif: !s.actif } : s));
  };

  if (loading) return <PageLoader text="Chargement des services..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Catalogue de services</h1>
          <p className="text-gray-500 text-sm">{services.filter(s => s.actif).length} service{services.filter(s => s.actif).length > 1 ? 's' : ''} actif{services.filter(s => s.actif).length > 1 ? 's' : ''}</p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>Nouveau service</Button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState icon="Briefcase" title="Aucun service" description="Créez votre catalogue de services." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map(service => (
            <div key={service.id} className={`bg-white rounded-xl border p-5 transition-all hover:shadow-sm ${service.actif ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{service.nom}</h3>
                    {!service.actif && <Badge variant="gray" size="xs">Inactif</Badge>}
                  </div>
                  <Badge variant={CATEGORIE_VARIANTS[service.categorie] || 'gray'} size="xs">
                    {CATEGORIE_OPTIONS.find(c => c.value === service.categorie)?.label || service.categorie}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setFormData({ ...service, tarifJour: service.tarifJour ?? '', tarifNuit: service.tarifNuit ?? '', tarifWE: service.tarifWE ?? '' }); setShowModal(true); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"><Edit2 size={14} /></button>
                  <button onClick={() => { setSelectedId(service.id); setShowConfirm(true); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>

              {service.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{service.description}</p>
              )}

              {/* Tarifs */}
              <div className="space-y-1.5">
                {service.tarifJour && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Sun size={13} className="text-amber-500" /> Jour
                    </div>
                    <span className="font-semibold text-gray-800">{formatMoney(service.tarifJour)}/{service.unite}</span>
                  </div>
                )}
                {service.tarifNuit && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Moon size={13} className="text-indigo-500" /> Nuit
                    </div>
                    <span className="font-semibold text-gray-800">{formatMoney(service.tarifNuit)}/{service.unite}</span>
                  </div>
                )}
                {service.tarifWE && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar size={13} className="text-green-500" /> Week-end
                    </div>
                    <span className="font-semibold text-gray-800">{formatMoney(service.tarifWE)}/{service.unite}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => handleToggleActif(service.id)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${service.actif ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${service.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-xs text-gray-500">{service.actif ? 'Actif' : 'Inactif'}</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? 'Modifier le service' : 'Nouveau service'} size="md"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button><Button loading={saving} onClick={handleSave}>{formData.id ? 'Enregistrer' : 'Créer'}</Button></>}>
        <div className="space-y-4">
          <Input label="Nom du service" value={formData.nom} onChange={e => setFormData(p => ({...p, nom: e.target.value}))} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Catégorie" value={formData.categorie} onChange={e => setFormData(p => ({...p, categorie: e.target.value}))} options={CATEGORIE_OPTIONS} />
            <Select label="Unité" value={formData.unite} onChange={e => setFormData(p => ({...p, unite: e.target.value}))} options={UNITE_OPTIONS} />
          </div>
          <TextArea label="Description" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} rows={2} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Tarif jour (€)" type="number" value={formData.tarifJour} onChange={e => setFormData(p => ({...p, tarifJour: e.target.value}))} min="0" step="0.50" placeholder="ex: 23.50" />
            <Input label="Tarif nuit (€)" type="number" value={formData.tarifNuit} onChange={e => setFormData(p => ({...p, tarifNuit: e.target.value}))} min="0" step="0.50" placeholder="—" />
            <Input label="Tarif WE (€)" type="number" value={formData.tarifWE} onChange={e => setFormData(p => ({...p, tarifWE: e.target.value}))} min="0" step="0.50" placeholder="ex: 27.50" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} title="Supprimer le service" message="Ce service sera supprimé du catalogue." />
    </div>
  );
}
