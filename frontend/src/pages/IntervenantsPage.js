import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  Phone,
  Mail,
  MapPin,
  Star,
  Calendar,
  Clock,
  ChevronDown,
  Edit2,
  X,
  Briefcase,
  Award,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';

/* ─── Mock data ────────────────────────────────────────────────────────── */
const MOCK_INTERVENANTS = [
  {
    id: 1, prenom: 'Sophie', nom: 'Martin', email: 'sophie.martin@youdom.fr',
    telephone: '06 12 34 56 78', adresse: 'Lyon 3e', disponibilite: 'Disponible',
    contrat: 'CDI', heuresSemaine: 35, note: 4.9, interventions: 142,
    competences: ['Aide à domicile', 'Toilette', 'Accompagnement'],
    specialites: ['Alzheimer', 'Personnes âgées'], dateEntree: '2020-03-15',
    avatar: null,
  },
  {
    id: 2, prenom: 'Fatou', nom: 'Diallo', email: 'fatou.diallo@youdom.fr',
    telephone: '06 23 45 67 89', adresse: 'Lyon 7e', disponibilite: 'Disponible',
    contrat: 'CDI', heuresSemaine: 28, note: 4.7, interventions: 98,
    competences: ['Aide ménagère', 'Courses', 'Repas'],
    specialites: ['Mobilité réduite'], dateEntree: '2021-06-01',
    avatar: null,
  },
  {
    id: 3, prenom: 'Claire', nom: 'Bernard', email: 'claire.bernard@youdom.fr',
    telephone: '06 34 56 78 90', adresse: 'Villeurbanne', disponibilite: 'En congé',
    contrat: 'CDD', heuresSemaine: 24, note: 4.8, interventions: 76,
    competences: ['Aide à domicile', 'Soins infirmiers'],
    specialites: ['Post-hospitalisation'], dateEntree: '2022-01-10',
    avatar: null,
  },
  {
    id: 4, prenom: 'Marc', nom: 'Aubert', email: 'marc.aubert@youdom.fr',
    telephone: '06 45 67 89 01', adresse: 'Lyon 6e', disponibilite: 'Disponible',
    contrat: 'CDI', heuresSemaine: 35, note: 4.6, interventions: 210,
    competences: ['Garde de nuit', 'Aide à domicile', 'Accompagnement'],
    specialites: ['Alzheimer', 'Parkinson'], dateEntree: '2019-09-02',
    avatar: null,
  },
  {
    id: 5, prenom: 'Karine', nom: 'Lefebvre', email: 'karine.lefebvre@youdom.fr',
    telephone: '06 56 78 90 12', adresse: 'Bron', disponibilite: 'Occupée',
    contrat: 'CDI', heuresSemaine: 30, note: 4.5, interventions: 133,
    competences: ['Aide ménagère', 'Portage de repas'],
    specialites: ['Personnes âgées'], dateEntree: '2021-02-20',
    avatar: null,
  },
  {
    id: 6, prenom: 'Nadia', nom: 'Benali', email: 'nadia.benali@youdom.fr',
    telephone: '06 67 89 01 23', adresse: 'Vénissieux', disponibilite: 'Disponible',
    contrat: 'Temps partiel', heuresSemaine: 20, note: 4.7, interventions: 55,
    competences: ['Aide à domicile', 'Repas'],
    specialites: ['Handicap moteur'], dateEntree: '2023-04-05',
    avatar: null,
  },
  {
    id: 7, prenom: 'Thomas', nom: 'Girard', email: 'thomas.girard@youdom.fr',
    telephone: '06 78 90 12 34', adresse: 'Lyon 9e', disponibilite: 'En congé',
    contrat: 'CDI', heuresSemaine: 35, note: 4.4, interventions: 187,
    competences: ['Aide à domicile', 'Jardinage', 'Bricolage'],
    specialites: ['Personnes âgées', 'Isolement social'], dateEntree: '2018-11-12',
    avatar: null,
  },
  {
    id: 8, prenom: 'Amina', nom: 'Traoré', email: 'amina.traore@youdom.fr',
    telephone: '06 89 01 23 45', adresse: 'Caluire', disponibilite: 'Disponible',
    contrat: 'CDI', heuresSemaine: 35, note: 5.0, interventions: 62,
    competences: ['Aide à domicile', 'Toilette', 'Accompagnement médical'],
    specialites: ['Alzheimer', 'Soins palliatifs'], dateEntree: '2023-09-01',
    avatar: null,
  },
];

const DISPO_CONFIG = {
  'Disponible': { variant: 'success', dot: true, pulse: true },
  'Occupée':    { variant: 'warning', dot: true, pulse: false },
  'En congé':   { variant: 'neutral', dot: true, pulse: false },
};

const COMPETENCE_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
];

const getInitials = (p, n) => `${p[0]}${n[0]}`.toUpperCase();

const AVATAR_COLORS = [
  'from-teal-500 to-teal-700',
  'from-emerald-500 to-emerald-700',
  'from-sky-500 to-sky-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-600',
  'from-violet-500 to-violet-700',
];

/* ─── Sub-components ───────────────────────────────────────────────────── */
const Avatar = ({ prenom, nom, idx, size = 'md' }) => {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';
  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0`}>
      {getInitials(prenom, nom)}
    </div>
  );
};

const StarRating = ({ note }) => (
  <div className="flex items-center gap-1">
    <Star size={12} className="text-amber-400 fill-amber-400" />
    <span className="text-xs font-semibold text-slate-700">{note.toFixed(1)}</span>
  </div>
);

/* ─── Card view ────────────────────────────────────────────────────────── */
const IntervCard = ({ intervenant, idx, onView }) => {
  const dispoCfg = DISPO_CONFIG[intervenant.disponibilite] || DISPO_CONFIG['Disponible'];
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group animate-slideUp"
      style={{ animationDelay: `${idx * 50}ms` }}
      onClick={() => onView(intervenant)}
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <Avatar prenom={intervenant.prenom} nom={intervenant.nom} idx={idx} />
          <Badge variant={dispoCfg.variant} dot={dispoCfg.dot} pulse={dispoCfg.pulse} size="xs">
            {intervenant.disponibilite}
          </Badge>
        </div>

        {/* Name & rating */}
        <div className="mb-3">
          <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
            {intervenant.prenom} {intervenant.nom}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <StarRating note={intervenant.note} />
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{intervenant.interventions} interventions</span>
          </div>
        </div>

        {/* Infos */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={12} className="text-slate-400 flex-shrink-0" />
            <span>{intervenant.adresse}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} className="text-slate-400 flex-shrink-0" />
            <span>{intervenant.heuresSemaine}h/semaine · {intervenant.contrat}</span>
          </div>
        </div>

        {/* Compétences */}
        <div className="flex flex-wrap gap-1.5">
          {intervenant.competences.slice(0, 3).map((comp, i) => (
            <span key={comp} className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMPETENCE_COLORS[i % COMPETENCE_COLORS.length]}`}>
              {comp}
            </span>
          ))}
          {intervenant.competences.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
              +{intervenant.competences.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── List row ─────────────────────────────────────────────────────────── */
const IntervRow = ({ intervenant, idx, onView }) => {
  const dispoCfg = DISPO_CONFIG[intervenant.disponibilite] || DISPO_CONFIG['Disponible'];
  return (
    <tr
      className="hover:bg-teal-50/30 transition-colors cursor-pointer group animate-fadeIn"
      style={{ animationDelay: `${idx * 30}ms` }}
      onClick={() => onView(intervenant)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar prenom={intervenant.prenom} nom={intervenant.nom} idx={idx} size="sm" />
          <div>
            <p className="font-medium text-slate-700 text-sm group-hover:text-teal-700 transition-colors">
              {intervenant.prenom} {intervenant.nom}
            </p>
            <p className="text-xs text-slate-400">{intervenant.adresse}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{intervenant.contrat}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{intervenant.heuresSemaine}h/sem</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {intervenant.competences.slice(0, 2).map((c, i) => (
            <span key={c} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${COMPETENCE_COLORS[i]}`}>{c}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <StarRating note={intervenant.note} />
          <span className="text-xs text-slate-400">({intervenant.interventions})</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={dispoCfg.variant} dot={dispoCfg.dot} pulse={dispoCfg.pulse} size="xs">
          {intervenant.disponibilite}
        </Badge>
      </td>
    </tr>
  );
};

/* ─── Main component ───────────────────────────────────────────────────── */
const IntervenantsPage = () => {
  const [view, setView]         = useState('grid');
  const [search, setSearch]     = useState('');
  const [filterDispo, setFilterDispo] = useState('Tous');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return MOCK_INTERVENANTS.filter(i => {
      const matchSearch = search === '' ||
        `${i.prenom} ${i.nom}`.toLowerCase().includes(search.toLowerCase()) ||
        i.competences.some(c => c.toLowerCase().includes(search.toLowerCase()));
      const matchDispo = filterDispo === 'Tous' || i.disponibilite === filterDispo;
      return matchSearch && matchDispo;
    });
  }, [search, filterDispo]);

  const stats = useMemo(() => {
    const total    = MOCK_INTERVENANTS.length;
    const actifs   = MOCK_INTERVENANTS.filter(i => i.disponibilite === 'Disponible').length;
    const occupes  = MOCK_INTERVENANTS.filter(i => i.disponibilite === 'Occupée').length;
    const conges   = MOCK_INTERVENANTS.filter(i => i.disponibilite === 'En congé').length;
    return { total, actifs, occupes, conges };
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Intervenants</h1>
          <p className="text-sm text-slate-500 mt-0.5">{MOCK_INTERVENANTS.length} intervenants · équipe Youdom Care</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl hover:from-teal-700 hover:to-teal-800 shadow-sm hover:shadow-md transition-all active:scale-95">
          <Plus size={16} /> Ajouter un intervenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total intervenants" value={stats.total} icon={Users} color="teal" />
        <StatCard title="Disponibles" value={stats.actifs} icon={Users} color="emerald" trend={`${Math.round(stats.actifs/stats.total*100)}%`} trendUp={true} />
        <StatCard title="Occupés" value={stats.occupes} icon={Briefcase} color="amber" />
        <StatCard title="En congé" value={stats.conges} icon={Calendar} color="rose" />
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou compétence…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <select
            value={filterDispo}
            onChange={e => setFilterDispo(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            {['Tous', 'Disponible', 'Occupée', 'En congé'].map(d => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2.5 transition-colors ${view === 'list' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState icon="users" title="Aucun intervenant trouvé" description="Modifiez vos filtres de recherche." />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((interv, idx) => (
            <IntervCard key={interv.id} intervenant={interv} idx={idx} onView={setSelected} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slideUp">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Intervenant', 'Contrat', 'Heures', 'Compétences', 'Note', 'Disponibilité'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((interv, idx) => (
                  <IntervRow key={interv.id} intervenant={interv} idx={idx} onView={setSelected} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Profil intervenant"
          size="lg"
          footer={
            <>
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Fermer
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all">
                <Edit2 size={14} /> Modifier
              </button>
            </>
          }
        >
          <div className="space-y-5">
            {/* Header profil */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-100">
              <Avatar prenom={selected.prenom} nom={selected.nom} idx={selected.id - 1} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-800">{selected.prenom} {selected.nom}</h2>
                  <Badge variant={DISPO_CONFIG[selected.disponibilite]?.variant} dot pulse={selected.disponibilite === 'Disponible'} size="sm">
                    {selected.disponibilite}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <StarRating note={selected.note} />
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-sm text-slate-500">{selected.interventions} interventions réalisées</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{selected.contrat} · {selected.heuresSemaine}h/semaine</p>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Phone, label: selected.telephone },
                { icon: Mail, label: selected.email },
                { icon: MapPin, label: selected.adresse },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Icon size={14} className="text-teal-500 flex-shrink-0" />
                  <span className="text-xs text-slate-600 truncate">{label}</span>
                </div>
              ))}
            </div>

            {/* Compétences & Spécialités */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Compétences</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.competences.map((c, i) => (
                    <span key={c} className={`text-xs px-2.5 py-1 rounded-full font-medium ${COMPETENCE_COLORS[i % COMPETENCE_COLORS.length]}`}>{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Spécialités</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.specialites.map((s, i) => (
                    <Badge key={s} variant="teal" size="sm">{s}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Interventions', value: selected.interventions, color: 'text-teal-600' },
                { label: 'Note moyenne', value: `${selected.note}/5`, color: 'text-amber-600' },
                { label: 'Ancienneté', value: `${new Date().getFullYear() - new Date(selected.dateEntree).getFullYear()} ans`, color: 'text-emerald-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default IntervenantsPage;
