import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, MapPin } from 'lucide-react';
import Modal from '../components/common/Modal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/common/LoadingSpinner';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

const SERVICE_COLORS = {
  'Aide ménagère': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-500', light: 'bg-teal-50' },
  'Aide toilette': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500', light: 'bg-blue-50' },
  'Aide repas': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', light: 'bg-amber-50' },
  'Garde nuit': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', dot: 'bg-violet-500', light: 'bg-violet-50' },
  'Sortie accompagnée': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', dot: 'bg-cyan-500', light: 'bg-cyan-50' },
  'Soins infirmiers': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500', light: 'bg-rose-50' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400', light: 'bg-slate-50' };

function generateWeekInterventions(weekStart) {
  const interventions = [];
  for (let d = 0; d < 7; d++) {
    const date = addDays(weekStart, d);
    if (d < 5) {
      interventions.push(
        { id: d * 10 + 1, date, heureDebut: '09:00', heureFin: '11:00', service: 'Aide ménagère', beneficiaire: 'Marie Dupont', intervenant: 'Claire Martin', statut: 'planifiee' },
        { id: d * 10 + 2, date, heureDebut: '08:30', heureFin: '09:30', service: 'Aide toilette', beneficiaire: 'Jean Martin', intervenant: 'Sophie Blanc', statut: 'planifiee' },
      );
    }
    if (d === 0 || d === 2) {
      interventions.push({ id: d * 10 + 3, date, heureDebut: '12:00', heureFin: '13:00', service: 'Aide repas', beneficiaire: 'Lucie Moreau', intervenant: 'Marc Leroy', statut: 'planifiee' });
    }
    if (d === 1) {
      interventions.push({ id: d * 10 + 4, date, heureDebut: '14:30', heureFin: '16:00', service: 'Sortie accompagnée', beneficiaire: 'Isabelle Petit', intervenant: 'Claire Martin', statut: 'planifiee' });
    }
    if (d === 3) {
      interventions.push({ id: d * 10 + 5, date, heureDebut: '20:00', heureFin: '08:00', service: 'Garde nuit', beneficiaire: 'Robert Simon', intervenant: 'Sophie Blanc', statut: 'planifiee' });
    }
  }
  return interventions;
}

const EMPTY_FORM = {
  date: '',
  heureDebut: '09:00',
  heureFin: '11:00',
  service: 'Aide ménagère',
  beneficiaire: '',
  intervenant: '',
};

export default function PlanningPage() {
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [interventions, setInterventions] = useState([]);
  const [filterBenef, setFilterBenef] = useState('');
  const [filterInterv, setFilterInterv] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedInterv, setSelectedInterv] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setInterventions(generateWeekInterventions(weekStart));
      setLoading(false);
    }, 400);
  }, [weekStart]);

  const prevWeek = () => setWeekStart(w => addDays(w, -7));
  const nextWeek = () => setWeekStart(w => addDays(w, 7));
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const filtered = interventions.filter(i =>
    (!filterBenef || i.beneficiaire.toLowerCase().includes(filterBenef.toLowerCase())) &&
    (!filterInterv || i.intervenant.toLowerCase().includes(filterInterv.toLowerCase()))
  );

  const getDayInterventions = (date) =>
    filtered.filter(i => isSameDay(new Date(i.date), date));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const newId = Math.max(...interventions.map(i => i.id), 0) + 1;
    setInterventions(prev => [...prev, {
      ...formData,
      id: newId,
      date: new Date(formData.date),
      statut: 'planifiee',
    }]);
    setSaving(false);
    setShowModal(false);
    setFormData(EMPTY_FORM);
  };

  const weekLabel = `Semaine du ${format(weekStart, 'd MMM', { locale: fr })} au ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}`;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (loading) return <PageLoader text="Chargement du planning..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Planning</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} intervention{filtered.length > 1 ? 's' : ''} cette semaine
          </p>
        </div>
        <Button icon={Plus} onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}>
          Nouvelle intervention
        </Button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
              Aujourd'hui
            </button>
            <button onClick={nextWeek} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
              <ChevronRight size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-700 ml-1">{weekLabel}</span>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Filtrer bénéficiaire..."
              value={filterBenef}
              onChange={e => setFilterBenef(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-all"
            />
            <input
              type="text"
              placeholder="Filtrer intervenant..."
              value={filterInterv}
              onChange={e => setFilterInterv(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {days.map((day, i) => {
            const today = isToday(day);
            return (
              <div
                key={i}
                className={`text-center py-3 border-r border-slate-100 last:border-r-0 transition-colors
                  ${today ? 'bg-teal-50' : ''}`}
              >
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{dayNames[i]}</p>
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mx-auto mt-1 transition-colors
                  ${today ? 'bg-teal-600 text-white font-bold' : 'text-slate-700 font-semibold hover:bg-slate-100'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day columns */}
        <div className="grid grid-cols-7 min-h-80">
          {days.map((day, i) => {
            const dayIntervs = getDayInterventions(day);
            const today = isToday(day);

            return (
              <div
                key={i}
                className={`border-r border-slate-100 last:border-r-0 p-1.5 space-y-1.5 min-h-32 transition-colors
                  ${today ? 'bg-teal-50/30' : ''}`}
              >
                {dayIntervs.length === 0 && (
                  <div className="text-center text-xs text-slate-300 py-8 flex items-center justify-center h-full">
                    <span className="text-slate-200">—</span>
                  </div>
                )}
                {dayIntervs.map(interv => {
                  const colors = SERVICE_COLORS[interv.service] || DEFAULT_COLOR;
                  return (
                    <div
                      key={interv.id}
                      onClick={() => setSelectedInterv(interv)}
                      className={`${colors.bg} ${colors.text} ${colors.border} border rounded-xl px-2 py-1.5 text-xs cursor-pointer
                                  hover:opacity-80 transition-all hover:shadow-sm group`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                        <span className="font-bold truncate">{interv.heureDebut}</span>
                        <span className="text-xs opacity-60">–{interv.heureFin}</span>
                      </div>
                      <p className="font-semibold truncate">{interv.service}</p>
                      <p className="truncate opacity-70 flex items-center gap-0.5">
                        <User size={9} className="flex-shrink-0" />
                        {interv.beneficiaire}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Légende des services</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(SERVICE_COLORS).map(([service, colors]) => (
            <div key={service} className={`flex items-center gap-1.5 text-xs ${colors.text} ${colors.bg} px-2.5 py-1 rounded-full border ${colors.border}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
              {service}
            </div>
          ))}
        </div>
      </div>

      {/* Intervention detail modal */}
      {selectedInterv && (
        <Modal
          isOpen={!!selectedInterv}
          onClose={() => setSelectedInterv(null)}
          title="Détail de l'intervention"
          size="sm"
        >
          {(() => {
            const colors = SERVICE_COLORS[selectedInterv.service] || DEFAULT_COLOR;
            return (
              <div className="space-y-3">
                <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
                    <span className={`font-bold text-base ${colors.text}`}>{selectedInterv.service}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock size={14} className="text-slate-400" />
                      <span className="font-semibold">{selectedInterv.heureDebut} – {selectedInterv.heureFin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <User size={14} className="text-slate-400" />
                      <span>Bénéficiaire : <strong>{selectedInterv.beneficiaire}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <User size={14} className="text-emerald-500" />
                      <span>Intervenant : <strong>{selectedInterv.intervenant}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{format(new Date(selectedInterv.date), "EEEE d MMMM yyyy", { locale: fr })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Planifiée
                  </span>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* New intervention modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouvelle intervention"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button loading={saving} onClick={handleSave}>Créer</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
            required
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Heure début"
            type="time"
            value={formData.heureDebut}
            onChange={e => setFormData(p => ({ ...p, heureDebut: e.target.value }))}
          />
          <Input
            label="Heure fin"
            type="time"
            value={formData.heureFin}
            onChange={e => setFormData(p => ({ ...p, heureFin: e.target.value }))}
          />
          <Select
            label="Type de service"
            value={formData.service}
            onChange={e => setFormData(p => ({ ...p, service: e.target.value }))}
            options={Object.keys(SERVICE_COLORS).map(s => ({ value: s, label: s }))}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Bénéficiaire"
            value={formData.beneficiaire}
            onChange={e => setFormData(p => ({ ...p, beneficiaire: e.target.value }))}
            placeholder="Nom du bénéficiaire"
          />
          <Input
            label="Intervenant"
            value={formData.intervenant}
            onChange={e => setFormData(p => ({ ...p, intervenant: e.target.value }))}
            placeholder="Nom de l'intervenant"
          />
        </div>
      </Modal>
    </div>
  );
}
