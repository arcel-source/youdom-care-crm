import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, User, Calendar, FileText, AlertTriangle, Edit2 } from 'lucide-react';
import Badge from '../components/common/Badge';
import { StatusBadge } from '../components/common/Badge';
import { PageLoader } from '../components/common/LoadingSpinner';
import Button from '../components/ui/Button';
import { formatDate, calculateAge, formatPhoneNumber, formatMoney } from '../utils/helpers';
import { BENEFICIAIRE_STATUT_LABELS, TYPES_PUBLIC_LABELS, NIVEAUX_DEPENDANCE_LABELS, TYPES_AIDES_LABELS } from '../utils/constants';

const MOCK_BENEFICIAIRE = {
  id: 1,
  nom: 'Dupont', prenom: 'Marie', dateNaissance: '1942-03-15',
  telephone: '0612345678', email: 'marie.dupont@email.fr',
  adresse: '12 rue des Lilas, 75012 Paris',
  typePublic: 'personnes_agees', niveauDependance: 'GIR3', statut: 'actif',
  intervenant: 'Claire Martin',
  aides: [
    { type: 'APA', montantMensuel: 850, dateDebut: '2023-01-01', dateFin: '2026-04-15', financeur: 'Conseil Départemental' },
  ],
  notes: 'Bénéficiaire très agréable. Préférence pour les interventions le matin avant 10h.',
};

const MOCK_INTERVENTIONS = [
  { id: 1, date: '2026-04-01', heureDebut: '09:00', heureFin: '11:00', service: 'Aide ménagère', intervenant: 'Claire Martin', statut: 'terminee' },
  { id: 2, date: '2026-04-03', heureDebut: '08:30', heureFin: '09:30', service: 'Aide toilette', intervenant: 'Claire Martin', statut: 'terminee' },
  { id: 3, date: '2026-04-05', heureDebut: '09:00', heureFin: '11:00', service: 'Aide ménagère', intervenant: 'Claire Martin', statut: 'planifiee' },
  { id: 4, date: '2026-04-08', heureDebut: '08:30', heureFin: '09:30', service: 'Aide toilette', intervenant: 'Claire Martin', statut: 'planifiee' },
];

const MOCK_INCIDENTS = [
  { id: 1, date: '2026-03-15', type: 'reclamation', description: 'Arrivée en retard de 30 minutes', statut: 'resolu' },
];

const MOCK_DOCUMENTS = [
  { id: 1, nom: 'Formulaire APA', type: 'PDF', date: '2023-01-10' },
  { id: 2, nom: 'Ordonnance médicale', type: 'PDF', date: '2025-12-01' },
];

const TABS = ['Informations', 'Planning', 'Incidents', 'Documents'];

export default function BeneficiaireDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [beneficiaire, setBeneficiaire] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setBeneficiaire(MOCK_BENEFICIAIRE);
      setInterventions(MOCK_INTERVENTIONS);
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) return <PageLoader text="Chargement du bénéficiaire..." />;
  if (!beneficiaire) return <div className="text-center py-16 text-gray-500">Bénéficiaire introuvable.</div>;

  const age = calculateAge(beneficiaire.dateNaissance);
  const aideEnAlerte = beneficiaire.aides?.filter(a => {
    if (!a.dateFin) return false;
    const fin = new Date(a.dateFin);
    const now = new Date();
    const diff = (fin - now) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  });

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{beneficiaire.prenom} {beneficiaire.nom}</h1>
          <p className="text-gray-500 text-sm">{age} ans • {TYPES_PUBLIC_LABELS[beneficiaire.typePublic]}</p>
        </div>
        <StatusBadge status={beneficiaire.statut} label={BENEFICIAIRE_STATUT_LABELS[beneficiaire.statut]} />
        <Button variant="secondary" icon={Edit2} size="sm">Modifier</Button>
      </div>

      {/* Alert APA/PCH */}
      {aideEnAlerte?.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Droits à renouveler</p>
            {aideEnAlerte.map(a => (
              <p key={a.type} className="text-sm text-amber-700">{a.type} expire le {formatDate(a.dateFin)}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sidebar infos */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-indigo-600 text-xl font-bold">{beneficiaire.prenom[0]}{beneficiaire.nom[0]}</span>
              </div>
              <h3 className="font-semibold text-gray-800">{beneficiaire.prenom} {beneficiaire.nom}</h3>
              <p className="text-gray-500 text-sm">{age} ans</p>
              <p className="text-gray-400 text-xs">Né(e) le {formatDate(beneficiaire.dateNaissance)}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                {formatPhoneNumber(beneficiaire.telephone)}
              </div>
              {beneficiaire.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{beneficiaire.email}</span>
                </div>
              )}
              {beneficiaire.adresse && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  {beneficiaire.adresse}
                </div>
              )}
            </div>
          </div>

          {/* Aides */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-3">Aides financières</h4>
            {beneficiaire.aides?.map((aide, i) => (
              <div key={i} className="p-3 bg-indigo-50 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-indigo-700">{aide.type}</span>
                  <span className="font-semibold text-gray-800">{formatMoney(aide.montantMensuel)}/mois</span>
                </div>
                <p className="text-xs text-gray-500">Du {formatDate(aide.dateDebut)} au {formatDate(aide.dateFin)}</p>
                <p className="text-xs text-gray-500">Financeur : {aide.financeur}</p>
              </div>
            ))}
          </div>

          {/* Intervenant */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Intervenant référent</h4>
            {beneficiaire.intervenant ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User size={14} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">{beneficiaire.intervenant}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun intervenant assigné</p>
            )}
          </div>
        </div>

        {/* Main tabs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${activeTab === i ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Tab 0: Informations */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium mb-1">Type de public</p>
                    <p className="text-sm text-gray-700">{TYPES_PUBLIC_LABELS[beneficiaire.typePublic] || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium mb-1">Niveau de dépendance</p>
                    <Badge variant="info">{NIVEAUX_DEPENDANCE_LABELS[beneficiaire.niveauDependance] || beneficiaire.niveauDependance}</Badge>
                  </div>
                </div>
                {beneficiaire.notes && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium mb-1">Notes</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{beneficiaire.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 1: Planning */}
            {activeTab === 1 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3 text-sm">Interventions récentes et à venir</h4>
                <div className="space-y-2">
                  {interventions.map((interv) => (
                    <div key={interv.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className="text-center flex-shrink-0">
                        <p className="text-xs text-gray-400">{formatDate(interv.date).split('/').slice(0, 2).join('/')}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{interv.service}</p>
                        <p className="text-xs text-gray-500">{interv.heureDebut} – {interv.heureFin} • {interv.intervenant}</p>
                      </div>
                      <Badge variant={interv.statut === 'terminee' ? 'success' : interv.statut === 'planifiee' ? 'info' : 'gray'} size="xs">
                        {interv.statut === 'terminee' ? 'Terminée' : interv.statut === 'planifiee' ? 'Planifiée' : interv.statut}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Incidents */}
            {activeTab === 2 && (
              <div>
                {MOCK_INCIDENTS.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Aucun incident</p>
                ) : (
                  <div className="space-y-3">
                    {MOCK_INCIDENTS.map(inc => (
                      <div key={inc.id} className="p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{inc.type}</span>
                          <Badge variant={inc.statut === 'resolu' ? 'success' : 'danger'} size="xs">{inc.statut}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(inc.date)} — {inc.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Documents */}
            {activeTab === 3 && (
              <div>
                <div className="space-y-2">
                  {MOCK_DOCUMENTS.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{doc.nom}</p>
                        <p className="text-xs text-gray-400">{doc.type} • {formatDate(doc.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
