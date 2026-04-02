import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Mail, Award } from 'lucide-react';
import Badge from '../components/common/Badge';
import { StatusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/common/EmptyState';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatPhoneNumber, filterBySearch } from '../utils/helpers';

const MOCK_INTERVENANTS = [
  {
    id: 1, nom: 'Martin', prenom: 'Claire', telephone: '0612345670', email: 'claire.martin@youdomcare.fr',
    statut: 'actif', competences: ['Aide toilette', 'Aide ménagère', 'Aide repas'],
    disponibilites: 'Lun-Ven 8h-18h', contrat: 'CDI', heuresMois: 151,
  },
  {
    id: 2, nom: 'Blanc', prenom: 'Sophie', telephone: '0698765434', email: 'sophie.blanc@youdomcare.fr',
    statut: 'actif', competences: ['Garde nuit', 'Aide toilette'],
    disponibilites: 'Lun-Sam 20h-8h', contrat: 'CDI', heuresMois: 120,
  },
  {
    id: 3, nom: 'Leroy', prenom: 'Marc', telephone: '0645678914', email: 'marc.leroy@youdomcare.fr',
    statut: 'actif', competences: ['Aide ménagère', 'Portage repas', 'Sortie accompagnée'],
    disponibilites: 'Lun-Ven 9h-17h', contrat: 'CDD', heuresMois: 80,
  },
  {
    id: 4, nom: 'Dubois', prenom: 'Anne', telephone: '0678901235', email: null,
    statut: 'inactif', competences: ['Aide toilette'],
    disponibilites: 'Non définie', contrat: 'Intérim', heuresMois: 0,
  },
];

const COMPETENCES_OPTIONS = [
  'Aide toilette', 'Aide ménagère', 'Aide repas', 'Garde nuit',
  'Sortie accompagnée', 'Portage repas', 'Aide administrative', 'Soins infirmiers',
];

const STATUT_OPTIONS = [
  { value: 'actif', label: 'Actif' }, { value: 'inactif', label: 'Inactif' }, { value: 'suspendu', label: 'Suspendu' },
];

const CONTRAT_OPTIONS = [
  { value: 'CDI', label: 'CDI' }, { value: 'CDD', label: 'CDD' }, { value: 'Intérim', label: 'Intérim' },
];

const EMPTY_FORM = { prenom: '', nom: '', telephone: '', email: '', statut: 'actif', competences: [], disponibilites: '', contrat: 'CDI' };

export default function IntervenantsPage() {
  const [intervenants, setIntervenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(null);

  useEffect(() => {
    setTimeout(() => { setIntervenants(MOCK_INTERVENANTS); setLoading(false); }, 400);
  }, []);

  const filtered = filterBySearch(intervenants, search, ['nom', 'prenom', 'email', 'telephone']);

  const toggleCompetence = (comp) => {
    setFormData(p => ({
      ...p,
      competences: p.competences.includes(comp)
        ? p.competences.filter(c => c !== comp)
        : [...p.competences, comp],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    if (formData.id) {
      setIntervenants(prev => prev.map(i => i.id === formData.id ? formData : i));
    } else {
      const newId = Math.max(...intervenants.map(i => i.id), 0) + 1;
      setIntervenants(prev => [{ ...formData, id: newId, heuresMois: 0 }, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 400));
    setIntervenants(prev => prev.filter(i => i.id !== selectedId));
    setShowConfirm(false);
  };

  if (loading) return <PageLoader text="Chargement des intervenants..." />;

  const detail = showDetail ? intervenants.find(i => i.id === showDetail) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Intervenants</h1>
          <p className="text-gray-500 text-sm">{filtered.length} intervenant{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>Nouvel intervenant</Button>
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
          <EmptyState icon="UserCheck" title="Aucun intervenant trouvé" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Intervenant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Compétences</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Disponibilités</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">H/mois</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(interv => (
                  <tr key={interv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-xs font-semibold">{interv.prenom[0]}{interv.nom[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{interv.prenom} {interv.nom}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {interv.telephone && <span className="flex items-center gap-1"><Phone size={10} />{formatPhoneNumber(interv.telephone)}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {interv.competences.slice(0, 2).map(c => (
                          <span key={c} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                        {interv.competences.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{interv.competences.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600 text-xs">{interv.disponibilites}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="font-semibold text-gray-700">{interv.heuresMois}h</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={interv.statut} label={interv.statut === 'actif' ? 'Actif' : interv.statut === 'inactif' ? 'Inactif' : 'Suspendu'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowDetail(interv.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Détail"><Award size={15} /></button>
                        <button onClick={() => { setFormData({...interv}); setShowModal(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit2 size={15} /></button>
                        <button onClick={() => { setSelectedId(interv.id); setShowConfirm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
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
      <Modal isOpen={!!detail} onClose={() => setShowDetail(null)} title={detail ? `${detail.prenom} ${detail.nom}` : ''} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-400 mb-1">Contrat</p><p className="font-medium">{detail.contrat}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Heures/mois</p><p className="font-medium">{detail.heuresMois}h</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Disponibilités</p><p className="font-medium">{detail.disponibilites}</p></div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Compétences</p>
              <div className="flex flex-wrap gap-2">
                {detail.competences.map(c => <Badge key={c} variant="primary">{c}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Contact</p>
              {detail.email && <p className="text-sm text-gray-700 flex items-center gap-1"><Mail size={13} />{detail.email}</p>}
              {detail.telephone && <p className="text-sm text-gray-700 flex items-center gap-1"><Phone size={13} />{formatPhoneNumber(detail.telephone)}</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* Form modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? 'Modifier l\'intervenant' : 'Nouvel intervenant'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button><Button loading={saving} onClick={handleSave}>{formData.id ? 'Enregistrer' : 'Créer'}</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Prénom" value={formData.prenom} onChange={e => setFormData(p => ({...p, prenom: e.target.value}))} required />
            <Input label="Nom" value={formData.nom} onChange={e => setFormData(p => ({...p, nom: e.target.value}))} required />
            <Input label="Téléphone" type="tel" value={formData.telephone} onChange={e => setFormData(p => ({...p, telephone: e.target.value}))} />
            <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
            <Select label="Statut" value={formData.statut} onChange={e => setFormData(p => ({...p, statut: e.target.value}))} options={STATUT_OPTIONS} />
            <Select label="Contrat" value={formData.contrat} onChange={e => setFormData(p => ({...p, contrat: e.target.value}))} options={CONTRAT_OPTIONS} />
            <Input label="Disponibilités" value={formData.disponibilites} onChange={e => setFormData(p => ({...p, disponibilites: e.target.value}))} containerClassName="sm:col-span-2" placeholder="Ex: Lun-Ven 8h-18h" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Compétences</p>
            <div className="flex flex-wrap gap-2">
              {COMPETENCES_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => toggleCompetence(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${formData.competences?.includes(c) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-indigo-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} title="Supprimer l'intervenant" message="Cette action supprimera définitivement l'intervenant et ses données." />
    </div>
  );
}
