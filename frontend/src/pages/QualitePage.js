import React, { useState, useMemo } from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  ThumbsUp,
  ChevronDown,
  Shield,
  MessageSquare,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import Badge from '../components/common/Badge';

/* ─── Mock data ────────────────────────────────────────────────────────── */
const SATISFACTION_DATA = [
  { mois: 'Oct', satisfaits: 87, neutres: 9, insatisfaits: 4 },
  { mois: 'Nov', satisfaits: 89, neutres: 8, insatisfaits: 3 },
  { mois: 'Déc', satisfaits: 84, neutres: 11, insatisfaits: 5 },
  { mois: 'Jan', satisfaits: 91, neutres: 7, insatisfaits: 2 },
  { mois: 'Fév', satisfaits: 88, neutres: 9, insatisfaits: 3 },
  { mois: 'Mar', satisfaits: 93, neutres: 5, insatisfaits: 2 },
];

const NPS_EVOLUTION = [
  { mois: 'Oct', nps: 52 },
  { mois: 'Nov', nps: 58 },
  { mois: 'Déc', nps: 49 },
  { mois: 'Jan', nps: 63 },
  { mois: 'Fév', nps: 61 },
  { mois: 'Mar', nps: 68 },
];

const INCIDENTS = [
  { id: 1, date: '2024-03-28', type: 'Retard intervenant', beneficiaire: 'Marie Dupont', gravite: 'Faible', statut: 'Résolu', description: 'Intervenant en retard de 25 min suite à embouteillages. Bénéficiaire prévenue.', resolution: 'Contact téléphonique, excuses présentées.' },
  { id: 2, date: '2024-03-22', type: 'Réclamation qualité', beneficiaire: 'Jean Leroy', gravite: 'Moyenne', statut: 'En cours', description: 'Bénéficiaire insatisfait du ménage réalisé.', resolution: '' },
  { id: 3, date: '2024-03-15', type: 'Absence non signalée', beneficiaire: 'Simone Moreau', gravite: 'Élevée', statut: 'Résolu', description: 'Intervenant absent sans prévenir. Remplacement organisé en urgence.', resolution: 'Entretien disciplinaire. Procédure de remplacement renforcée.' },
  { id: 4, date: '2024-03-08', type: 'Accident domestique', beneficiaire: 'André Petit', gravite: 'Faible', statut: 'Résolu', description: 'Chute légère du bénéficiaire lors du transfert. Pas de blessure.', resolution: 'Déclaration accident, révision protocole transfert.' },
  { id: 5, date: '2024-02-28', type: 'Retard intervenant', beneficiaire: 'Yvette Garnier', gravite: 'Faible', statut: 'Résolu', description: 'Retard de 15 min, bénéficiaire informé.', resolution: 'Replanification du créneau.' },
  { id: 6, date: '2024-02-14', type: 'Réclamation qualité', beneficiaire: 'Roger Blanc', gravite: 'Moyenne', statut: 'Résolu', description: 'Repas non conforme au régime alimentaire prescrit.', resolution: 'Information transmise au prestataire repas, régime renforcé.' },
];

const GRAVITE_CONFIG = {
  'Faible':  { variant: 'success' },
  'Moyenne': { variant: 'warning' },
  'Élevée':  { variant: 'danger' },
};

const STATUT_CONFIG = {
  'Résolu':   { variant: 'success', icon: CheckCircle },
  'En cours': { variant: 'warning', icon: Clock },
};

const PERIODES = ['3 derniers mois', '6 derniers mois', '12 derniers mois'];

/* ─── NPS Gauge ────────────────────────────────────────────────────────── */
const NPSGauge = ({ score }) => {
  const clamp    = Math.max(-100, Math.min(100, score));
  const pct      = (clamp + 100) / 200;
  const angle    = pct * 180 - 90;
  const r        = 70;
  const cx       = 90;
  const cy       = 90;
  const startX   = cx - r;
  const endX     = cx + r;

  const npsColor = score >= 50 ? '#10b981' : score >= 0 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Track */}
        <path d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`} fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
        {/* Zones */}
        <path d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`} fill="none" stroke="#fde68a" strokeWidth="16" strokeLinecap="round" opacity="0.5" />
        <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${endX} ${cy}`} fill="none" stroke="#6ee7b7" strokeWidth="16" strokeLinecap="round" opacity="0.5" />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + (r - 8) * Math.cos((angle - 90) * Math.PI / 180)}
          y2={cy + (r - 8) * Math.sin((angle - 90) * Math.PI / 180)}
          stroke={npsColor} strokeWidth="3" strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
        <circle cx={cx} cy={cy} r="5" fill={npsColor} />
        {/* Labels */}
        <text x="18" y="95" fontSize="10" fill="#94a3b8" textAnchor="middle">-100</text>
        <text x="90" y="20" fontSize="10" fill="#94a3b8" textAnchor="middle">0</text>
        <text x="162" y="95" fontSize="10" fill="#94a3b8" textAnchor="middle">+100</text>
      </svg>
      <div className="text-center -mt-2">
        <p className="text-4xl font-bold" style={{ color: npsColor }}>{score}</p>
        <p className="text-xs text-slate-500 mt-1">Score NPS</p>
      </div>
    </div>
  );
};

/* ─── KPI Card ─────────────────────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, sub, color }) => {
  const colorMap = {
    teal:    'from-teal-500 to-teal-600 bg-teal-50',
    emerald: 'from-emerald-500 to-emerald-600 bg-emerald-50',
    amber:   'from-amber-500 to-amber-600 bg-amber-50',
    rose:    'from-rose-500 to-rose-600 bg-rose-50',
  };
  const [grad, bg] = (colorMap[color] || colorMap.teal).split(' ');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 animate-slideUp">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

/* ─── Custom tooltip ───────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 shadow-lg rounded-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.stroke }} />
          <span className="text-slate-500">{p.name} :</span>
          <span className="font-semibold text-slate-700">{p.value}{p.name === 'NPS' ? '' : '%'}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Main ─────────────────────────────────────────────────────────────── */
const QualitePage = () => {
  const [periode, setPeriode] = useState('6 derniers mois');

  const currentNPS = NPS_EVOLUTION[NPS_EVOLUTION.length - 1].nps;
  const prevNPS    = NPS_EVOLUTION[NPS_EVOLUTION.length - 2].nps;
  const npsDelta   = currentNPS - prevNPS;

  const incidentsOuverts = INCIDENTS.filter(i => i.statut === 'En cours').length;

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Qualité de service</h1>
          <p className="text-sm text-slate-500 mt-0.5">Indicateurs de satisfaction et suivi des incidents</p>
        </div>
        <div className="relative">
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            {PERIODES.map(p => <option key={p}>{p}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={ThumbsUp}      label="Taux de satisfaction" value="91%"   sub="+4pts vs mois dernier" color="teal" />
        <KpiCard icon={Clock}         label="Temps de réponse moy" value="2h14"  sub="Réclamations clients"   color="amber" />
        <KpiCard icon={Shield}        label="Taux de conformité"   value="98.2%" sub="Procédures internes"    color="emerald" />
        <KpiCard icon={AlertTriangle} label="Incidents ouverts"    value={incidentsOuverts} sub={`${INCIDENTS.length} au total`} color="rose" />
      </div>

      {/* NPS + Évolution */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* NPS Score */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4 self-start">
            <Star size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-700">Net Promoter Score</h2>
          </div>
          <NPSGauge score={currentNPS} />
          <div className="flex items-center gap-2 mt-4">
            {npsDelta >= 0 ? (
              <TrendingUp size={16} className="text-emerald-500" />
            ) : (
              <TrendingDown size={16} className="text-rose-500" />
            )}
            <span className={`text-sm font-semibold ${npsDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {npsDelta >= 0 ? '+' : ''}{npsDelta} pts vs mois dernier
            </span>
          </div>
          <div className="mt-4 w-full grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Promoteurs', value: '68%', color: 'text-emerald-600' },
              { label: 'Passifs',    value: '18%', color: 'text-amber-600' },
              { label: 'Détracteurs', value: '14%', color: 'text-rose-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-2">
                <p className={`text-sm font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* NPS évolution */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-teal-500" />
            <h2 className="text-sm font-semibold text-slate-700">Évolution NPS</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={NPS_EVOLUTION} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="nps" name="NPS" stroke="#0d9488" strokeWidth={2.5} dot={{ fill: '#0d9488', r: 4 }} activeDot={{ r: 6, fill: '#0d9488' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Satisfaction breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-slideUp">
        <div className="flex items-center gap-2 mb-5">
          <Star size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-700">Répartition satisfaction mensuelle</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={SATISFACTION_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={18} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Bar dataKey="satisfaits"    name="Satisfaits"    fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="neutres"       name="Neutres"       fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="insatisfaits"  name="Insatisfaits"  fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Incidents timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-slideUp">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">Incidents récents</h2>
          </div>
          <Badge variant="warning" dot size="sm">{incidentsOuverts} ouvert{incidentsOuverts > 1 ? 's' : ''}</Badge>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />

          <div className="space-y-5 pl-10">
            {INCIDENTS.map((incident, idx) => {
              const graviteCfg = GRAVITE_CONFIG[incident.gravite] || GRAVITE_CONFIG['Faible'];
              const statutCfg  = STATUT_CONFIG[incident.statut] || STATUT_CONFIG['Résolu'];
              const StatutIcon = statutCfg.icon;
              return (
                <div key={incident.id} className="relative animate-fadeIn" style={{ animationDelay: `${idx * 60}ms` }}>
                  {/* Dot */}
                  <div className={`absolute -left-6 top-0 w-3 h-3 rounded-full border-2 border-white ${incident.statut === 'En cours' ? 'bg-amber-400' : 'bg-emerald-400'} shadow-sm`} />

                  <div className={`rounded-xl border p-4 ${incident.statut === 'En cours' ? 'border-amber-100 bg-amber-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-700">{incident.type}</span>
                        <Badge variant={graviteCfg.variant} size="xs">{incident.gravite}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statutCfg.variant} dot size="xs">{incident.statut}</Badge>
                        <span className="text-xs text-slate-400">{incident.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">
                      <span className="font-medium text-slate-600">Bénéficiaire :</span> {incident.beneficiaire}
                    </p>
                    <p className="text-xs text-slate-600">{incident.description}</p>
                    {incident.resolution && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-700">{incident.resolution}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualitePage;
