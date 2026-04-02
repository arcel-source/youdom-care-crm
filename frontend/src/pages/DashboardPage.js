import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, TrendingUp, AlertTriangle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatDate, formatMoney, getStatusVariant } from '../utils/helpers';
import { LEAD_STATUT_LABELS } from '../utils/constants';

// Mock data pour le dashboard
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

const MOCK_SERVICES = [
  { name: 'Aide ménagère', value: 38, color: '#6366f1' },
  { name: 'Aide toilette', value: 27, color: '#8b5cf6' },
  { name: 'Aide repas', value: 18, color: '#06b6d4' },
  { name: 'Garde nuit', value: 10, color: '#f59e0b' },
  { name: 'Autres', value: 7, color: '#10b981' },
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

// Mini barchart SVG
function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.heures));
  const chartH = 120;
  const barW = 30;
  const gap = 10;
  const totalW = data.length * (barW + gap);

  return (
    <div className="overflow-x-auto">
      <svg width={totalW} height={chartH + 40} className="overflow-visible">
        {data.map((d, i) => {
          const barH = (d.heures / maxVal) * chartH;
          const x = i * (barW + gap);
          const y = chartH - barH;
          return (
            <g key={d.mois}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill="#6366f1"
                fillOpacity={i === data.length - 1 ? 1 : 0.5}
              />
              <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize="11" fill="#6b7280">
                {d.mois}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#4338ca" fontWeight="600">
                {d.heures}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Mini donut chart
function DonutChart({ data }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 50;
  const strokeW = 24;

  const total = data.reduce((s, d) => s + d.value, 0);
  let cumul = 0;

  const arcs = data.map((d) => {
    const start = (cumul / total) * 2 * Math.PI - Math.PI / 2;
    cumul += d.value;
    const end = (cumul / total) * 2 * Math.PI - Math.PI / 2;
    const lx = cx + r * Math.cos(start);
    const ly = cy + r * Math.sin(start);
    const ex = cx + r * Math.cos(end);
    const ey = cy + r * Math.sin(end);
    const largeArc = d.value / total > 0.5 ? 1 : 0;
    return { ...d, path: `M ${lx} ${ly} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}` };
  });

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={size} height={size}>
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={arc.path}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeW}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#374151">
          100%
        </text>
      </svg>
      <div className="flex flex-col gap-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            {d.name} <span className="font-semibold text-gray-800">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(MOCK_STATS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader text="Chargement du tableau de bord..." />;

  const conversionRate = Math.round((MOCK_LEADS.filter(l => l.statut === 'gagne').length / MOCK_LEADS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de l'activité — Avril 2026</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Bénéficiaires actifs" value={stats.beneficiairesActifs} icon="Users" color="indigo" trend={5} trendLabel="vs mois dernier" />
        <StatCard title="Heures ce mois" value={stats.heuresMois.toLocaleString('fr-FR')} icon="Clock" color="green" trend={2.4} trendLabel="vs mois dernier" />
        <StatCard title="Leads en cours" value={stats.leadsEnCours} icon="TrendingUp" color="amber" trend={12} trendLabel="ce mois" />
        <StatCard title="Incidents ouverts" value={stats.incidentsOuverts} icon="AlertTriangle" color="red" trendLabel="2 en attente" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heures par mois */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Heures d'intervention</h3>
              <p className="text-xs text-gray-400">6 derniers mois</p>
            </div>
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">+2.4% vs mars</span>
          </div>
          <BarChart data={MOCK_HEURES_MOIS} />
        </div>

        {/* Services répartition */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800">Services</h3>
            <p className="text-xs text-gray-400">Répartition ce mois</p>
          </div>
          <DonutChart data={MOCK_SERVICES} />
        </div>
      </div>

      {/* Alertes + Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alertes urgentes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Alertes urgentes</h3>
            <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">{MOCK_ALERTES.length}</span>
          </div>
          <div className="space-y-3">
            {MOCK_ALERTES.map((alerte) => (
              <div key={alerte.id} className={`flex items-start gap-3 p-3 rounded-lg ${alerte.urgence === 'high' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                <AlertTriangle size={16} className={alerte.urgence === 'high' ? 'text-red-500 mt-0.5 flex-shrink-0' : 'text-amber-500 mt-0.5 flex-shrink-0'} />
                <p className="text-sm text-gray-700">{alerte.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers leads */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Derniers leads</h3>
              <p className="text-xs text-gray-400">Taux de conversion : <span className="font-semibold text-gray-700">--</span></p>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_LEADS.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/leads')}>
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 text-xs font-semibold">{lead.nom.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{lead.nom}</p>
                  <p className="text-xs text-gray-400">{formatDate(lead.date)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">Score : <span className="font-medium">{lead.score}</span></span>
                  <Badge variant={getStatusVariant(lead.statut)} size="xs">
                    {LEAD_STATUT_LABELS[lead.statut] || lead.statut}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
