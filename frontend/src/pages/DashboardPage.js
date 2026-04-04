import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, TrendingUp, AlertTriangle, ArrowRight,
  CheckCircle, Heart, Activity, Star, Calendar, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import { formatDate, formatMoney, getStatusVariant } from '../utils/helpers';
import { LEAD_STATUT_LABELS } from '../utils/constants';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ---- MOCK DATA ----

const MOCK_STATS = {
  beneficiairesActifs: 127,
  heuresMois: 1842,
  leadsEnCours: 23,
  incidentsOuverts: 4,
};

const MOCK_HEURES_MOIS = [
  { mois: 'Oct', heures: 1620 },
  { mois: 'Nov', heures: 1750 },
  { mois: 'Déc', heures: 1580 },
  { mois: 'Jan', heures: 1690 },
  { mois: 'Fév', heures: 1800 },
  { mois: 'Mar', heures: 1842 },
];

const MOCK_REVENUS = [
  { mois: 'Oct', revenus: 42000 },
  { mois: 'Nov', revenus: 45500 },
  { mois: 'Déc', revenus: 40000 },
  { mois: 'Jan', revenus: 44000 },
  { mois: 'Fév', revenus: 47000 },
  { mois: 'Mar', revenus: 48200 },
];

const MOCK_SERVICES = [
  { name: 'Aide ménagère', value: 38, color: '#0d9488' },
  { name: 'Aide toilette', value: 27, color: '#059669' },
  { name: 'Aide repas', value: 18, color: '#0891b2' },
  { name: 'Garde nuit', value: 10, color: '#7c3aed' },
  { name: 'Autres', value: 7, color: '#d97706' },
];

const MOCK_ALERTES = [
  { id: 1, type: 'apa', message: 'APA de Marie Dupont expire le 15/04/2026', urgence: 'high' },
  { id: 2, type: 'impaye', message: 'Facture F-2026-089 impayée depuis 45 jours (320 €)', urgence: 'high' },
  { id: 3, type: 'apa', message: 'Renouvellement droits PCH pour Jean Martin', urgence: 'medium' },
];

const MOCK_LEADS = [
  { id: 1, nom: 'Sophie Leclerc', source: 'prescripteur', statut: 'qualifie', score: 85, date: '2026-03-28' },
  { id: 2, nom: 'Robert Moreau', source: 'site_web', statut: 'contacte', score: 60, date: '2026-03-30' },
  { id: 3, nom: 'Isabelle Petit', source: 'hopital', statut: 'devis_envoye', score: 90, date: '2026-03-31' },
  { id: 4, nom: 'Paul Bernard', source: 'bouche_a_oreille', statut: 'nouveau', score: 40, date: '2026-04-01' },
];

const MOCK_INTERVENTIONS_TODAY = [
  { id: 1, heure: '09:00', beneficiaire: 'Marie Dupont', intervenant: 'Claire Martin', service: 'Aide ménagère', statut: 'en_cours' },
  { id: 2, heure: '10:30', beneficiaire: 'Jean Martin', intervenant: 'Sophie Blanc', service: 'Aide toilette', statut: 'planifiee' },
  { id: 3, heure: '12:00', beneficiaire: 'Lucie Moreau', intervenant: 'Marc Leroy', service: 'Aide repas', statut: 'planifiee' },
  { id: 4, heure: '14:00', beneficiaire: 'Isabelle Petit', intervenant: 'Claire Martin', service: 'Aide ménagère', statut: 'planifiee' },
];

const MOCK_ACTIVITE = [
  { id: 1, type: 'lead', message: 'Nouveau lead : Isabelle Petit (hopital)', time: 'Il y a 5 min', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 2, type: 'interv', message: 'Intervention terminée : Marie Dupont', time: 'Il y a 23 min', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 3, type: 'beneficiaire', message: 'Nouveau bénéficiaire ajouté : Paul Bernard', time: 'Il y a 1h', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 4, type: 'qualite', message: 'Incident signalé par famille Martin', time: 'Il y a 2h', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
];

const MOCK_TOP_INTERVENANTS = [
  { nom: 'Claire Martin', heures: 151, satisfaction: 4.8, interventions: 68 },
  { nom: 'Sophie Blanc', heures: 120, satisfaction: 4.6, interventions: 54 },
  { nom: 'Marc Leroy', heures: 80, satisfaction: 4.5, interventions: 36 },
];

// ---- CUSTOM TOOLTIP ----
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }} className="font-medium">
            {prefix}{p.value?.toLocaleString('fr-FR')}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const STATUT_INTERV_CONFIG = {
  en_cours: { label: 'En cours', bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500 animate-pulse' },
  planifiee: { label: 'Planifiée', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  terminee: { label: 'Terminée', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(MOCK_STATS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-72 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Welcome header */}
      <div className="flex items-start justify-between animate-fadeIn">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart size={18} className="text-rose-400 animate-heartbeat" />
            <span className="text-sm text-slate-500 capitalize">{todayLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bonjour, bonne journée 👋</h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="text-teal-600 font-semibold">{stats.beneficiairesActifs}</span> bénéficiaires actifs ·{' '}
            <span className="text-emerald-600 font-semibold">{MOCK_INTERVENTIONS_TODAY.length}</span> interventions aujourd'hui
          </p>
        </div>
        <button
          onClick={() => navigate('/planning')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <Calendar size={15} />
          Planning du jour
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="animate-fadeIn stagger-1">
          <StatCard
            title="Bénéficiaires actifs"
            value={stats.beneficiairesActifs}
            icon="Users"
            color="teal"
            trend={5}
            trendLabel="vs mois dernier"
          />
        </div>
        <div className="animate-fadeIn stagger-2">
          <StatCard
            title="Heures ce mois"
            value={stats.heuresMois.toLocaleString('fr-FR')}
            icon="Clock"
            color="emerald"
            trend={2.4}
            trendLabel="vs mois dernier"
          />
        </div>
        <div className="animate-fadeIn stagger-3">
          <StatCard
            title="Leads en cours"
            value={stats.leadsEnCours}
            icon="TrendingUp"
            color="amber"
            trend={12}
            trendLabel="ce mois"
          />
        </div>
        <div className="animate-fadeIn stagger-4">
          <StatCard
            title="Incidents ouverts"
            value={stats.incidentsOuverts}
            icon="AlertTriangle"
            color="rose"
            trend={-1}
            trendLabel="vs semaine"
          />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart - Heures */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fadeIn stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Heures d'intervention</h3>
              <p className="text-xs text-slate-400 mt-0.5">6 derniers mois</p>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
              +2.4% vs mars
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_HEURES_MOIS}>
              <defs>
                <linearGradient id="heuresGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip suffix=" h" />} />
              <Area
                type="monotone"
                dataKey="heures"
                stroke="#0d9488"
                strokeWidth={2.5}
                fill="url(#heuresGrad)"
                dot={{ fill: '#0d9488', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#0d9488' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Services */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fadeIn stagger-3">
          <div className="mb-3">
            <h3 className="font-semibold text-slate-800">Services</h3>
            <p className="text-xs text-slate-400 mt-0.5">Répartition ce mois</p>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={MOCK_SERVICES}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {MOCK_SERVICES.map((entry, index) => (
                  <Cell key={index} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Part']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-1">
            {MOCK_SERVICES.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="flex-1 truncate">{s.name}</span>
                <span className="font-semibold text-slate-800">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart - Revenus */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fadeIn stagger-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Revenus</h3>
              <p className="text-xs text-slate-400 mt-0.5">6 derniers mois (€)</p>
            </div>
            <Zap size={15} className="text-amber-500" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_REVENUS} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`${v.toLocaleString('fr-FR')} €`, 'Revenus']} />
              <Bar dataKey="revenus" fill="#0d9488" radius={[6, 6, 0, 0]}>
                {MOCK_REVENUS.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={index === MOCK_REVENUS.length - 1 ? '#0d9488' : '#99f6e4'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Interventions aujourd'hui */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fadeIn stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Interventions du jour</h3>
              <p className="text-xs text-slate-400 mt-0.5">{MOCK_INTERVENTIONS_TODAY.length} prévues</p>
            </div>
            <button
              onClick={() => navigate('/planning')}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Planning <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2.5">
            {MOCK_INTERVENTIONS_TODAY.map((interv) => {
              const cfg = STATUT_INTERV_CONFIG[interv.statut] || STATUT_INTERV_CONFIG.planifiee;
              return (
                <div key={interv.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 text-center w-12">
                    <span className="text-sm font-bold text-slate-700">{interv.heure}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{interv.beneficiaire}</p>
                    <p className="text-xs text-slate-400 truncate">{interv.service} · {interv.intervenant}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alertes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fadeIn stagger-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Alertes urgentes</h3>
            <span className="bg-rose-100 text-rose-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {MOCK_ALERTES.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {MOCK_ALERTES.map((alerte) => (
              <div
                key={alerte.id}
                className={`flex items-start gap-2.5 p-3 rounded-xl border
                  ${alerte.urgence === 'high'
                    ? 'bg-rose-50 border-rose-100'
                    : 'bg-amber-50 border-amber-100'
                  }`}
              >
                <AlertTriangle
                  size={14}
                  className={`mt-0.5 flex-shrink-0 ${alerte.urgence === 'high' ? 'text-rose-500' : 'text-amber-500'}`}
                />
                <p className="text-xs text-slate-700 leading-relaxed">{alerte.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers leads */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fadeIn stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Derniers leads</h3>
              <p className="text-xs text-slate-400 mt-0.5">{MOCK_LEADS.length} en cours</p>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_LEADS.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate('/leads')}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-teal-700 text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #ccfbf1, #a7f3d0)' }}>
                  {lead.nom.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{lead.nom}</p>
                  <p className="text-xs text-slate-400">{formatDate(lead.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant={getStatusVariant(lead.statut)} size="xs">
                    {LEAD_STATUT_LABELS[lead.statut] || lead.statut}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-10 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${lead.score}%`, background: 'linear-gradient(90deg, #0d9488, #059669)' }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{lead.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fadeIn stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Activité récente</h3>
            <Activity size={15} className="text-slate-400" />
          </div>

          {/* Top intervenants */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Top intervenants</p>
            {MOCK_TOP_INTERVENANTS.map((interv, i) => (
              <div key={interv.nom} className="flex items-center gap-2.5 mb-2">
                <span className="text-xs font-bold text-slate-400 w-4 flex-shrink-0">#{i + 1}</span>
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                  {interv.nom.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{interv.nom}</p>
                  <p className="text-xs text-slate-400">{interv.heures}h · {interv.interventions} interv.</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-slate-700">{interv.satisfaction}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Flux</p>
          <div className="space-y-2">
            {MOCK_ACTIVITE.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div className={`w-6 h-6 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon size={11} className={item.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">{item.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
