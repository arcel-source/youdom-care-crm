import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/helpers';

const SERVICE_COLORS = {
  'Aide ménagère': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Aide toilette': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'Aide repas': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  'Garde nuit': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'Sortie accompagnée': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
};

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function generateWeekInterventions(weekStart) {
  const interventions = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + d);
    if (d < 5) {
      interventions.push(
        { id: d * 10 + 1, date: new Date(date), heureDebut: '09:00', heureFin: '11:00', service: 'Aide ménagère', beneficiaire: 'Marie Dupont', intervenant: 'Claire Martin', statut: 'planifiee' },
        { id: d * 10 + 2, date: new Date(date), heureDebut: '08:30', heureFin: '09:30', service: 'Aide toilette', beneficiaire: 'Jean Martin', intervenant: 'Sophie Blanc', statut: 'planifiee' },
      );
    }
    if (d === 0 || d === 2) {
      interventions.push({ id: d * 10 + 3, date: new Date(date), heureDebut: '12:00', heureFin: '13:00', service: 'Aide repas', beneficiaire: 'Lucie Moreau', intervenant: 'Marc Leroy', statut: 'planifiee' });
    }
  }
  return interventions;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const EMPTY_FORM = { date: '', heureDebut: '09:00', heureFin: '11:00', service: 'Aide ménagère', beneficiaire: '', intervenant: '' };

export default function PlanningPage() {
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [interventions, setInterventions] = useState([]);
  const [viewMode, setViewMode] = useState('semaine');
  const [filterBenef, setFilterBenef] = useState('');
  const [filterInterv, setFilterInterv] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setInterventions(generateWeekInterventions(weekStart));
      setLoading(false);
    }, 400);
  }, [weekStart]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const todayWeek = () => setWeekStart(getMonday(new Date()));

  const filtered = interventions.filter(i =>
    (!filterBenef || i.beneficiaire.toLowerCase().includes(filterBenef.toLowerCase())) &&
    (!filterInterv || i.intervenant.toLowerCase().includes(filterInterv.toLowerCase()))
  );

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const newId = Math.max(...interventions.map(i => i.id), 0) + 1;
    setInterventions(prev => [...prev, { ...formData, id: newId, date: new Date(formData.date), statut: 'planifiee' }]);
    setSaving(false);
    setShowModal(false);
  };

  const weekLabel = () => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return `${formatDate(weekStart)} – ${formatDate(end)}`;
  };

  const getDayInterventions = (dayIndex) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayIndex);
    return filtered.filter(i => {
      const d = new Date(i.date);
      return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
    });
  };

  const isToday = (dayIndex) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayIndex);
    const today = new Date();
    return day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth() && day.getDate() === today.getDate();
  };

  if (loading) return <PageLoader text="Chargement du planning..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planning</h1>
          <p className="text-gray-500 text-sm">{filtered.length} intervention{filtered.length > 1 ? 's' : ''} cette semaine</p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>Nouvelle intervention</Button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Navigation semaine */}
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={todayWeek} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">Aujourd'hui</button>
            <button onClick={nextWeek} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"><ChevronRight size={16} /></button>
            <span className="text-sm font-medium text-gray-700 ml-2">{weekLabel()}</span>
          </div>
          <div className="flex gap-3 flex-1">
            <input type="text" placeholder="Filtrer bénéficiaire..." value={filterBenef} onChange={e => setFilterBenef(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="text" placeholder="Filtrer intervenant..." value={filterInterv} onChange={e => setFilterInterv(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {/* Calendrier semaine */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {JOURS.map((jour, i) => {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            return (
              <div key={jour} className={`text-center py-3 border-r border-gray-100 last:border-r-0 ${isToday(i) ? 'bg-indigo-50' : ''}`}>
                <p className="text-xs text-gray-400 uppercase font-medium">{jour}</p>
                <p className={`text-lg font-semibold mt-0.5 ${isToday(i) ? 'text-indigo-600' : 'text-gray-700'}`}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-64">
          {JOURS.map((_, i) => {
            const dayIntervs = getDayInterventions(i);
            return (
              <div key={i} className={`border-r border-gray-100 last:border-r-0 p-2 space-y-1 min-h-32 ${isToday(i) ? 'bg-indigo-50/40' : ''}`}>
                {dayIntervs.map(interv => {
                  const colors = SERVICE_COLORS[interv.service] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
                  return (
                    <div key={interv.id} className={`${colors.bg} ${colors.text} ${colors.border} border rounded p-1.5 text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
                      <p className="font-semibold truncate">{interv.heureDebut} - {interv.heureFin}</p>
                      <p className="truncate">{interv.service}</p>
                      <p className="truncate text-xs opacity-70">{interv.beneficiaire}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(SERVICE_COLORS).map(([service, colors]) => (
          <div key={service} className={`flex items-center gap-1.5 text-xs ${colors.text}`}>
            <span className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`} />
            {service}
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle intervention" size="md"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button><Button loading={saving} onClick={handleSave}>Créer</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date" type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} required containerClassName="sm:col-span-2" />
          <Input label="Heure début" type="time" value={formData.heureDebut} onChange={e => setFormData(p => ({...p, heureDebut: e.target.value}))} />
          <Input label="Heure fin" type="time" value={formData.heureFin} onChange={e => setFormData(p => ({...p, heureFin: e.target.value}))} />
          <Select label="Service" value={formData.service} onChange={e => setFormData(p => ({...p, service: e.target.value}))}
            options={Object.keys(SERVICE_COLORS).map(s => ({ value: s, label: s }))} containerClassName="sm:col-span-2" />
          <Input label="Bénéficiaire" value={formData.beneficiaire} onChange={e => setFormData(p => ({...p, beneficiaire: e.target.value}))} placeholder="Nom du bénéficiaire" />
          <Input label="Intervenant" value={formData.intervenant} onChange={e => setFormData(p => ({...p, intervenant: e.target.value}))} placeholder="Nom de l'intervenant" />
        </div>
      </Modal>
    </div>
  );
}
