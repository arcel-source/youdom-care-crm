import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Mail } from 'lucide-react';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/common/EmptyState';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatPhoneNumber, filterBySearch } from '../utils/helpers';

const MOCK_FAMILLES = [
  { id: 1, nom: 'Dupont', prenom: 'Pierre', relation: 'fils', beneficiaires: ['Marie Dupont'], telephone: '0612345679', email: 'pierre.dupont@email.fr' },
  { id: 2, nom: 'Martin', prenom: 'Sylvie', relation: 'fille', beneficiaires: ['Jean Martin'], telephone: '0698765433', email: 'sylvie.martin@email.fr' },
  { id: 3, nom: 'Petit', prenom: 'Marc', relation: 'frère', beneficiaires: ['Isabelle Petit'], telephone: '0645678913', email: null },
];

const RELATION_OPTIONS = [
  { value: 'fils', label: 'Fils' }, { value: 'fille', label: 'Fille' },
  { value: 'frère', label: 'Frère' }, { value: 'sœur', label: 'Sœur' },
  { value: 'époux', label: 'Époux/Épouse' }, { value: 'autre', label: 'Autre' },
];

const EMPTY_FORM = { prenom: '', nom: '', relation: '', telephone: '', email: '' };

export default function FamillesPage() {
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => { setFamilles(MOCK_FAMILLES); setLoading(false); }, 400);
  }, []);

  const filtered = filterBySearch(familles, search, ['nom', 'prenom', 'email', 'telephone']);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    if (formData.id) {
      setFamilles(prev => prev.map(f => f.id === formData.id ? formData : f));
    } else {
      const newId = Math.max(...familles.map(f => f.id), 0) + 1;
      setFamilles(prev => [{ ...formData, id: newId, beneficiaires: [] }, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setFamilles(prev => prev.filter(f => f.id !== selectedId));
    setShowConfirm(false);
  };

  if (loading) return <PageLoader text="Chargement des familles..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Familles</h1>
          <p className="text-gray-500 text-sm">{filtered.length} contact{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>Nouveau contact</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon="Heart" title="Aucune famille trouvée" description="Ajoutez les contacts familiaux de vos bénéficiaires." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Relation</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Bénéficiaires liés</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contact</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-pink-600 text-xs font-semibold">{f.prenom[0]}{f.nom[0]}</span>
                        </div>
                        <p className="font-medium text-gray-800">{f.prenom} {f.nom}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600 capitalize">{f.relation}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {f.beneficiaires.map(b => (
                          <span key={b} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{b}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone size={11} className="text-gray-400" /> {formatPhoneNumber(f.telephone)}
                        </div>
                        {f.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail size={11} className="text-gray-400" /> {f.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setFormData({...f}); setShowModal(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit2 size={15} /></button>
                        <button onClick={() => { setSelectedId(f.id); setShowConfirm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? 'Modifier le contact' : 'Nouveau contact famille'}
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button><Button loading={saving} onClick={handleSave}>{formData.id ? 'Enregistrer' : 'Créer'}</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Prénom" value={formData.prenom} onChange={e => setFormData(p => ({...p, prenom: e.target.value}))} required />
          <Input label="Nom" value={formData.nom} onChange={e => setFormData(p => ({...p, nom: e.target.value}))} required />
          <Select label="Relation" value={formData.relation} onChange={e => setFormData(p => ({...p, relation: e.target.value}))} options={RELATION_OPTIONS} />
          <Input label="Téléphone" type="tel" value={formData.telephone} onChange={e => setFormData(p => ({...p, telephone: e.target.value}))} />
          <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData(p => ({...p, email: e.target.value}))} containerClassName="sm:col-span-2" />
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} title="Supprimer le contact" message="Êtes-vous sûr de vouloir supprimer ce contact famille ?" />
    </div>
  );
}
