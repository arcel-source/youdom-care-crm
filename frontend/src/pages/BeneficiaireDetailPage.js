import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Users,
  Edit2,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  Heart,
  Activity,
  User,
  Home,
  Paperclip,
  Star,
} from 'lucide-react';
import Badge from '../components/common/Badge';

/* ─── Mock data ────────────────────────────────────────────────────────── */
const MOCK_BENEFICIAIRES = {
  1: {
    id: 1, prenom: 'Marie', nom: 'Dupont', age: 82, dateNaissance: '1942-03-14',
    adresse: '12 rue des Lilas, Lyon 3e', telephone: '04 72 11 22 33',
    email: 'marie.dupont@email.fr', statut: 'Actif', niveau: 'GIR 2',
    pathologies: ['Alzheimer léger', 'Hypertension'],
    intervenante: 'Sophie Martin', heuresHebdo: 21,
    dateDebut: '2021-04-12', plan: 'APA',
    urgenceNom: 'Pierre Dupont', urgenceLien: 'Fils', urgenceTel: '06 80 90 10 20',
    noteCoord: 'Bénéficiaire coopérative. Préfère les interventions le matin. Allergie au lactose.',
    famille: [
      { nom: 'Pierre Dupont', lien: 'Fils', telephone: '06 80 90 10 20', email: 'pierre.dupont@email.fr', contact_urgence: true },
      { nom: 'Isabelle Moreau', lien: 'Fille', telephone: '06 55 44 33 22', email: 'isa.moreau@email.fr', contact_urgence: false },
    ],
    interventions: [
      { id: 101, date: '2024-03-28', heure: '09:00', duree: '3h', type: 'Aide à domicile', intervenant: 'Sophie Martin', statut: 'Réalisée', note: 'RAS, bonne humeur.' },
      { id: 102, date: '2024-03-26', heure: '09:00', duree: '3h', type: 'Aide à domicile', intervenant: 'Sophie Martin', statut: 'Réalisée', note: 'Légère agitation en fin de séance.' },
      { id: 103, date: '2024-03-25', heure: '14:00', duree: '1h30', type: 'Accompagnement médical', intervenant: 'Karine Lefebvre', statut: 'Réalisée', note: 'Consultation Dr Favier, tout va bien.' },
      { id: 104, date: '2024-03-22', heure: '09:00', duree: '3h', type: 'Aide à domicile', intervenant: 'Sophie Martin', statut: 'Annulée', note: 'Bénéficiaire chez sa fille.' },
      { id: 105, date: '2024-03-20', heure: '09:00', duree: '3h', type: 'Aide à domicile', intervenant: 'Sophie Martin', statut: 'Réalisée', note: 'Ménage + repas réalisés.' },
      { id: 106, date: '2024-04-02', heure: '09:00', duree: '3h', type: 'Aide à domicile', intervenant: 'Sophie Martin', statut: 'Planifiée', note: '' },
    ],
    documents: [
      { id: 1, nom: 'Plan d\'aide APA 2024.pdf', type: 'Plan aide', taille: '245 Ko', date: '2024-01-10', icone: 'pdf' },
      { id: 2, nom: 'Ordonnance Dr Favier mars 2024.pdf', type: 'Médical', taille: '128 Ko', date: '2024-03-25', icone: 'pdf' },
      { id: 3, nom: 'Contrat de prestation.pdf', type: 'Contrat', taille: '380 Ko', date: '2021-04-12', icone: 'pdf' },
      { id: 4, nom: 'Fiche de liaison sanitaire.docx', type: 'Sanitaire', taille: '92 Ko', date: '2024-02-01', icone: 'doc' },
      { id: 5, nom: 'Attestation CAF 2024.pdf', type: 'Administratif', taille: '156 Ko', date: '2024-01-15', icone: 'pdf' },
    ],
  },
};

/* ─── Configs ──────────────────────────────────────────────────────────── */
const INTERV_STATUT = {
  'Réalisée':  { variant: 'success', icon: CheckCircle },
  'Planifiée': { variant: 'teal',    icon: Clock },
  'Annulée':   { variant: 'neutral', icon: XCircle },
  'Incident':  { variant: 'danger',  icon: AlertCircle },
};

const DOC_COLORS = {
  pdf: 'bg-rose-100 text-rose-600',
  doc: 'bg-sky-100 text-sky-600',
};

const TABS = [
  { id: 'infos',        label: 'Informations', icon: User },
  { id: 'interventions',label: 'Interventions', icon: Activity },
  { id: 'documents',    label: 'Documents',    icon: FileText },
  { id: 'famille',      label: 'Famille',      icon: Users },
];

const NIVEAU_COLOR = {
  'GIR 1': 'danger', 'GIR 2': 'danger', 'GIR 3': 'warning',
  'GIR 4': 'warning', 'GIR 5': 'info',  'GIR 6': 'neutral',
};

/* ─── Avatar ───────────────────────────────────────────────────────────── */
const Avatar = ({ prenom, nom, size = 'xl' }) => {
  const sizeClass = size === 'xl' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0`}>
      {prenom[0]}{nom[0]}
    </div>
  );
};

/* ─── Info row ─────────────────────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <Icon size={15} className="text-teal-500 flex-shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
    </div>
  </div>
);

/* ─── Main component ───────────────────────────────────────────────────── */
const BeneficiaireDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('infos');

  const benef = MOCK_BENEFICIAIRES[id] || MOCK_BENEFICIAIRES[1];

  const interventionsParStatut = benef.interventions.reduce((acc, i) => {
    acc[i.statut] = (acc[i.statut] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Retour aux bénéficiaires
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-teal-600 to-teal-800 relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
            <div className="border-4 border-white rounded-2xl shadow-md">
              <Avatar prenom={benef.prenom} nom={benef.nom} size="xl" />
            </div>
            <div className="flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800">{benef.prenom} {benef.nom}</h1>
                <Badge variant="success" dot size="sm">{benef.statut}</Badge>
                <Badge variant={NIVEAU_COLOR[benef.niveau] || 'info'} size="sm">{benef.niveau}</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">{benef.age} ans · {benef.plan} · {benef.heuresHebdo}h/semaine</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all">
              <Edit2 size={14} /> Modifier
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Interventions réalisées', value: interventionsParStatut['Réalisée'] || 0, color: 'text-teal-600' },
              { label: 'Planifiées', value: interventionsParStatut['Planifiée'] || 0, color: 'text-emerald-600' },
              { label: 'Annulées ce mois', value: interventionsParStatut['Annulée'] || 0, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-100 shadow-sm rounded-2xl p-1.5 overflow-x-auto">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${tab === tabId ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fadeIn" key={tab}>

        {/* ─ Informations ─ */}
        {tab === 'infos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* Coordonnées */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Coordonnées</h3>
                <InfoRow icon={MapPin}   label="Adresse"         value={benef.adresse} />
                <InfoRow icon={Phone}    label="Téléphone"       value={benef.telephone} />
                <InfoRow icon={Mail}     label="Email"           value={benef.email} />
                <InfoRow icon={Calendar} label="Date de naissance" value={`${benef.dateNaissance} (${benef.age} ans)`} />
              </div>

              {/* Prise en charge */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Prise en charge</h3>
                <InfoRow icon={Heart}    label="Pathologies"     value={benef.pathologies.join(', ')} />
                <InfoRow icon={User}     label="Intervenante"    value={benef.intervenante} />
                <InfoRow icon={Home}     label="Plan d'aide"     value={benef.plan} />
                <InfoRow icon={Clock}    label="Heures/semaine"  value={`${benef.heuresHebdo}h`} />
                <InfoRow icon={Calendar} label="Début de prise en charge" value={benef.dateDebut} />
              </div>

              {/* Note coordinatrice */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Note de la coordinatrice</h3>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm text-amber-800">{benef.noteCoord}</p>
                </div>
              </div>
            </div>

            {/* Urgence */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 self-start">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-500" />
                Contact d'urgence
              </h3>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <p className="font-semibold text-slate-800">{benef.urgenceNom}</p>
                <p className="text-xs text-slate-500 mb-3">{benef.urgenceLien}</p>
                <a href={`tel:${benef.urgenceTel}`} className="flex items-center gap-2 text-sm text-rose-700 font-medium hover:text-rose-800">
                  <Phone size={14} /> {benef.urgenceTel}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ─ Interventions ─ */}
        {tab === 'interventions' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-5">Historique des interventions</h3>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
              <div className="space-y-4 pl-10">
                {benef.interventions
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((interv, idx) => {
                    const cfg = INTERV_STATUT[interv.statut] || INTERV_STATUT['Réalisée'];
                    const Icon = cfg.icon;
                    return (
                      <div key={interv.id} className="relative animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                        {/* Timeline dot */}
                        <div className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${interv.statut === 'Réalisée' ? 'bg-teal-500' : interv.statut === 'Planifiée' ? 'bg-emerald-400' : 'bg-slate-300'}`} />

                        <div className={`rounded-xl border p-4 ${interv.statut === 'Planifiée' ? 'border-teal-100 bg-teal-50/40' : interv.statut === 'Annulée' ? 'border-slate-100 bg-slate-50/50 opacity-70' : 'border-slate-100 bg-white'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-700">{interv.type}</span>
                              <Badge variant={cfg.variant} size="xs" dot>{interv.statut}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Calendar size={11} />{interv.date}</span>
                              <span className="flex items-center gap-1"><Clock size={11} />{interv.heure} · {interv.duree}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            <span className="font-medium text-slate-600">Intervenant(e) :</span> {interv.intervenant}
                          </p>
                          {interv.note && (
                            <p className="text-xs text-slate-500 mt-1 italic">"{interv.note}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ─ Documents ─ */}
        {tab === 'documents' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-700">Documents ({benef.documents.length})</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl hover:bg-teal-100 transition-all">
                <Paperclip size={14} /> Ajouter
              </button>
            </div>

            <div className="space-y-2">
              {benef.documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-teal-100 transition-all group animate-fadeIn"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${DOC_COLORS[doc.icone] || DOC_COLORS.pdf}`}>
                    {doc.icone.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{doc.nom}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{doc.type}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{doc.taille}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{doc.date}</span>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all">
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─ Famille ─ */}
        {tab === 'famille' && (
          <div className="space-y-4">
            {benef.famille.map((membre, idx) => (
              <div
                key={membre.nom}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-slideUp"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {membre.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800">{membre.nom}</p>
                    <Badge variant="neutral" size="xs">{membre.lien}</Badge>
                    {membre.contact_urgence && <Badge variant="danger" size="xs" dot>Urgence</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <a href={`tel:${membre.telephone}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors">
                      <Phone size={13} /> {membre.telephone}
                    </a>
                    <a href={`mailto:${membre.email}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors">
                      <Mail size={13} /> {membre.email}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
                    <Phone size={15} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
                    <Mail size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BeneficiaireDetailPage;
