import React, { useState } from 'react';
import {
  User,
  Building2,
  Bell,
  Lock,
  Plug,
  Save,
  Camera,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ChevronRight,
  Smartphone,
  Mail,
  MessageSquare,
  Globe,
  Database,
  Key,
} from 'lucide-react';

/* ─── Toggle Switch ────────────────────────────────────────────────────── */
const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-400 ${enabled ? 'bg-teal-600' : 'bg-slate-200'}`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

/* ─── Field group ──────────────────────────────────────────────────────── */
const FieldGroup = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = ({ type = 'text', value, onChange, placeholder, disabled, icon: Icon }) => (
  <div className="relative">
    {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
    />
  </div>
);

/* ─── Section card ─────────────────────────────────────────────────────── */
const Section = ({ title, description, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-slideUp">
    <div className="mb-5 pb-4 border-b border-slate-100">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    </div>
    {children}
  </div>
);

/* ─── Integration Card ─────────────────────────────────────────────────── */
const IntegCard = ({ icon: Icon, name, desc, connected, color }) => {
  const [active, setActive] = useState(connected);
  return (
    <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={`text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">{name}</p>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => setActive(a => !a)}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
      >
        {active ? 'Connecté' : 'Connecter'}
      </button>
    </div>
  );
};

/* ─── Tabs ─────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'profil',        label: 'Profil',        icon: User },
  { id: 'entreprise',    label: 'Entreprise',     icon: Building2 },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'securite',      label: 'Sécurité',       icon: Lock },
  { id: 'integrations',  label: 'Intégrations',   icon: Plug },
];

/* ─── Main component ───────────────────────────────────────────────────── */
const SettingsPage = () => {
  const [tab, setTab] = useState('profil');
  const [saved, setSaved] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  /* Profil state */
  const [profil, setProfil] = useState({
    prenom: 'Arcel', nom: 'Admin', email: 'admin@youdom-care.fr',
    telephone: '04 72 00 00 00', poste: 'Responsable qualité', langue: 'Français',
  });

  /* Entreprise state */
  const [entreprise, setEntreprise] = useState({
    nom: 'Youdom Care', siret: '123 456 789 00012', adresse: '45 rue de la République',
    ville: 'Lyon', codePostal: '69003', telephone: '04 72 00 10 00', email: 'contact@youdom-care.fr',
    siteWeb: 'www.youdom-care.fr',
  });

  /* Notif state */
  const [notifs, setNotifs] = useState({
    email_nouvelles_missions: true,
    email_rapports_hebdo: true,
    email_alertes_incidents: true,
    email_factures: false,
    sms_alertes_urgentes: true,
    sms_rappels_rdv: false,
    app_nouvelles_missions: true,
    app_messages: true,
    app_rapports: false,
  });

  /* Sécurité state */
  const [securite, setSecurite] = useState({
    mdp_actuel: '', mdp_nouveau: '', mdp_confirmation: '',
    double_auth: true, sessions_auto: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setNotif = (key) => (val) => setNotifs(p => ({ ...p, [key]: val }));
  const setSecurite_ = (key) => (val) => setSecurite(p => ({ ...p, [key]: val }));

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Paramètres</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez votre compte et vos préférences</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all active:scale-95 ${saved ? 'bg-emerald-100 text-emerald-700' : 'text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-sm hover:shadow-md'}`}
        >
          {saved ? <><Check size={16} /> Enregistré</> : <><Save size={16} /> Enregistrer</>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex flex-row lg:flex-col gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-2 lg:w-52 lg:self-start overflow-x-auto lg:overflow-visible">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 lg:w-full ${tab === id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ─ Profil ─ */}
          {tab === 'profil' && (
            <>
              <Section title="Photo de profil" description="Votre avatar visible dans l'application.">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
                    {profil.prenom[0]}{profil.nom[0]}
                  </div>
                  <div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-all">
                      <Camera size={14} /> Changer la photo
                    </button>
                    <p className="text-xs text-slate-400 mt-1.5">JPG ou PNG, max 2 MB</p>
                  </div>
                </div>
              </Section>

              <Section title="Informations personnelles" description="Vos coordonnées de contact.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="Prénom">
                    <Input value={profil.prenom} onChange={e => setProfil(p => ({ ...p, prenom: e.target.value }))} placeholder="Votre prénom" />
                  </FieldGroup>
                  <FieldGroup label="Nom">
                    <Input value={profil.nom} onChange={e => setProfil(p => ({ ...p, nom: e.target.value }))} placeholder="Votre nom" />
                  </FieldGroup>
                  <FieldGroup label="Email professionnel">
                    <Input type="email" icon={Mail} value={profil.email} onChange={e => setProfil(p => ({ ...p, email: e.target.value }))} placeholder="votre@email.fr" />
                  </FieldGroup>
                  <FieldGroup label="Téléphone">
                    <Input type="tel" value={profil.telephone} onChange={e => setProfil(p => ({ ...p, telephone: e.target.value }))} placeholder="0X XX XX XX XX" />
                  </FieldGroup>
                  <FieldGroup label="Poste">
                    <Input value={profil.poste} onChange={e => setProfil(p => ({ ...p, poste: e.target.value }))} placeholder="Votre poste" />
                  </FieldGroup>
                  <FieldGroup label="Langue">
                    <select value={profil.langue} onChange={e => setProfil(p => ({ ...p, langue: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                      <option>Français</option>
                      <option>English</option>
                    </select>
                  </FieldGroup>
                </div>
              </Section>
            </>
          )}

          {/* ─ Entreprise ─ */}
          {tab === 'entreprise' && (
            <Section title="Informations de l'organisme" description="Données légales et coordonnées de votre structure.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Raison sociale">
                  <Input value={entreprise.nom} onChange={e => setEntreprise(p => ({ ...p, nom: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="SIRET">
                  <Input value={entreprise.siret} onChange={e => setEntreprise(p => ({ ...p, siret: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Adresse">
                  <Input value={entreprise.adresse} onChange={e => setEntreprise(p => ({ ...p, adresse: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Ville">
                  <Input value={entreprise.ville} onChange={e => setEntreprise(p => ({ ...p, ville: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Code postal">
                  <Input value={entreprise.codePostal} onChange={e => setEntreprise(p => ({ ...p, codePostal: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Téléphone">
                  <Input value={entreprise.telephone} onChange={e => setEntreprise(p => ({ ...p, telephone: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Email contact">
                  <Input type="email" icon={Mail} value={entreprise.email} onChange={e => setEntreprise(p => ({ ...p, email: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Site web">
                  <Input icon={Globe} value={entreprise.siteWeb} onChange={e => setEntreprise(p => ({ ...p, siteWeb: e.target.value }))} placeholder="www.votre-site.fr" />
                </FieldGroup>
              </div>
            </Section>
          )}

          {/* ─ Notifications ─ */}
          {tab === 'notifications' && (
            <>
              <Section title="Notifications par email" description="Choisissez ce que vous recevez par email.">
                <div className="divide-y divide-slate-50">
                  <Toggle enabled={notifs.email_nouvelles_missions} onChange={setNotif('email_nouvelles_missions')} label="Nouvelles missions" description="Vous êtes alerté quand une mission est assignée." />
                  <Toggle enabled={notifs.email_rapports_hebdo} onChange={setNotif('email_rapports_hebdo')} label="Rapports hebdomadaires" description="Récapitulatif d'activité chaque lundi matin." />
                  <Toggle enabled={notifs.email_alertes_incidents} onChange={setNotif('email_alertes_incidents')} label="Alertes incidents" description="Incidents déclarés par les intervenants." />
                  <Toggle enabled={notifs.email_factures} onChange={setNotif('email_factures')} label="Factures et paiements" description="Nouvelles factures et confirmations de paiement." />
                </div>
              </Section>

              <Section title="Notifications SMS" description="Alertes urgentes par SMS.">
                <div className="divide-y divide-slate-50">
                  <Toggle enabled={notifs.sms_alertes_urgentes} onChange={setNotif('sms_alertes_urgentes')} label="Alertes urgentes" description="Incidents critiques uniquement." />
                  <Toggle enabled={notifs.sms_rappels_rdv} onChange={setNotif('sms_rappels_rdv')} label="Rappels de rendez-vous" description="Rappel 24h avant chaque intervention." />
                </div>
              </Section>

              <Section title="Notifications in-app" description="Notifications dans l'interface.">
                <div className="divide-y divide-slate-50">
                  <Toggle enabled={notifs.app_nouvelles_missions} onChange={setNotif('app_nouvelles_missions')} label="Nouvelles missions" description="Notification temps réel." />
                  <Toggle enabled={notifs.app_messages} onChange={setNotif('app_messages')} label="Messages" description="Nouveaux messages de l'équipe." />
                  <Toggle enabled={notifs.app_rapports} onChange={setNotif('app_rapports')} label="Rapports disponibles" description="Quand un nouveau rapport est généré." />
                </div>
              </Section>
            </>
          )}

          {/* ─ Sécurité ─ */}
          {tab === 'securite' && (
            <>
              <Section title="Modifier le mot de passe" description="Utilisez un mot de passe fort d'au moins 12 caractères.">
                <div className="space-y-4">
                  <FieldGroup label="Mot de passe actuel">
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={securite.mdp_actuel}
                        onChange={e => setSecurite(p => ({ ...p, mdp_actuel: e.target.value }))}
                        placeholder="••••••••••"
                        className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                      <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Nouveau mot de passe">
                    <Input type="password" value={securite.mdp_nouveau} onChange={e => setSecurite(p => ({ ...p, mdp_nouveau: e.target.value }))} placeholder="••••••••••" />
                  </FieldGroup>
                  <FieldGroup label="Confirmer le nouveau mot de passe">
                    <Input type="password" value={securite.mdp_confirmation} onChange={e => setSecurite(p => ({ ...p, mdp_confirmation: e.target.value }))} placeholder="••••••••••" />
                  </FieldGroup>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all">
                    Changer le mot de passe
                  </button>
                </div>
              </Section>

              <Section title="Sécurité avancée" description="Options de protection supplémentaires.">
                <div className="divide-y divide-slate-50">
                  <Toggle enabled={securite.double_auth} onChange={setSecurite_('double_auth')} label="Authentification à deux facteurs" description="SMS ou application d'authentification." />
                  <Toggle enabled={securite.sessions_auto} onChange={setSecurite_('sessions_auto')} label="Déconnexion automatique" description="Se déconnecter après 30 min d'inactivité." />
                </div>
              </Section>

              <Section title="Sessions actives" description="Appareils connectés à votre compte.">
                {[
                  { device: 'MacBook Pro · Chrome', location: 'Lyon, France', current: true },
                  { device: 'iPhone 14 · Safari', location: 'Lyon, France', current: false },
                ].map(({ device, location, current }) => (
                  <div key={device} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <Smartphone size={16} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{device}</p>
                        <p className="text-xs text-slate-400">{location}</p>
                      </div>
                    </div>
                    {current ? (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Session actuelle</span>
                    ) : (
                      <button className="text-xs text-rose-600 hover:text-rose-700 font-medium">Révoquer</button>
                    )}
                  </div>
                ))}
              </Section>
            </>
          )}

          {/* ─ Intégrations ─ */}
          {tab === 'integrations' && (
            <Section title="Services connectés" description="Intégrez des outils tiers à Youdom Care.">
              <div className="space-y-3">
                <IntegCard icon={Mail}     name="Messagerie SMTP"     desc="Envoi d'emails automatiques"   connected={true}  color="teal" />
                <IntegCard icon={Database} name="Export comptable"    desc="Synchronisation avec Sage"     connected={false} color="amber" />
                <IntegCard icon={Globe}    name="API Telemedecine"    desc="Téléconsultations intégrées"   connected={false} color="sky" />
                <IntegCard icon={Key}      name="SSO Entreprise"      desc="Authentification centralisée"  connected={true}  color="violet" />
                <IntegCard icon={MessageSquare} name="SMS Avanced"   desc="Notifications SMS pro"         connected={true}  color="emerald" />
              </div>

              <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Clé API requise</p>
                  <p className="text-xs text-amber-600 mt-0.5">Certaines intégrations nécessitent une clé API. Contactez votre administrateur système.</p>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
