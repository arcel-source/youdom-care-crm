import React, { useState } from 'react';
import { User, Lock, Bell, Palette, LogOut, Save, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../utils/helpers';

const TABS = [
  { key: 'profile', label: 'Profil', icon: User },
  { key: 'securite', label: 'Sécurité', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'apparence', label: 'Apparence', icon: Palette },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: '',
    role: user?.role || 'utilisateur',
  });

  // Password form
  const [pwForm, setPwForm] = useState({ actuel: '', nouveau: '', confirmer: '' });
  const [showPw, setShowPw] = useState({ actuel: false, nouveau: false, confirmer: false });
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    alertesApa: true, facturesRetard: true, nouveauxLeads: true, planningChangements: true,
    emailResume: true, emailFrequence: 'quotidien',
  });

  const handleSaveProfile = async () => {
    setSaved(false);
    await new Promise(r => setTimeout(r, 600));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSavePassword = async () => {
    if (pwForm.nouveau !== pwForm.confirmer) { setPwError('Les mots de passe ne correspondent pas.'); return; }
    if (pwForm.nouveau.length < 8) { setPwError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setPwError('');
    setSavingPw(true);
    await new Promise(r => setTimeout(r, 600));
    setSavingPw(false);
    setPwForm({ actuel: '', nouveau: '', confirmer: '' });
    alert('Mot de passe modifié avec succès.');
  };

  const handleLogout = async () => {
    await logout();
  };

  const PwInput = ({ label, field }) => (
    <div className="relative">
      <Input
        label={label}
        type={showPw[field] ? 'text' : 'password'}
        value={pwForm[field]}
        onChange={e => setPwForm(p => ({...p, [field]: e.target.value}))}
        suffix={
          <button type="button" onClick={() => setShowPw(p => ({...p, [field]: !p[field]}))}>
            {showPw[field] ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
      />
    </div>
  );

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-500 text-sm">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-2 space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === tab.key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}
                  `}>
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
            <div className="border-t border-gray-100 pt-1 mt-1">
              <button onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profil */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-gray-800 mb-4">Mon profil</h2>
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{getInitials(`${user?.prenom || ''} ${user?.nom || ''}`)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user?.prenom} {user?.nom}</p>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                    <p className="text-xs text-indigo-600 mt-1 capitalize">{user?.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Prénom" value={profileForm.prenom} onChange={e => setProfileForm(p => ({...p, prenom: e.target.value}))} />
                  <Input label="Nom" value={profileForm.nom} onChange={e => setProfileForm(p => ({...p, nom: e.target.value}))} />
                  <Input label="Email" type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({...p, email: e.target.value}))} containerClassName="sm:col-span-2" />
                  <Input label="Téléphone" type="tel" value={profileForm.telephone} onChange={e => setProfileForm(p => ({...p, telephone: e.target.value}))} />
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <Button icon={Save} onClick={handleSaveProfile}>Enregistrer</Button>
                  {saved && <span className="text-sm text-green-600 font-medium">✓ Modifications enregistrées</span>}
                </div>
              </div>
            </div>
          )}

          {/* Sécurité */}
          {activeTab === 'securite' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-gray-800 mb-1">Changer le mot de passe</h2>
                <p className="text-sm text-gray-500 mb-4">Votre mot de passe doit contenir au moins 8 caractères.</p>
                {pwError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{pwError}</div>
                )}
                <div className="space-y-4 max-w-sm">
                  <PwInput label="Mot de passe actuel" field="actuel" />
                  <PwInput label="Nouveau mot de passe" field="nouveau" />
                  <PwInput label="Confirmer le nouveau mot de passe" field="confirmer" />
                  <Button onClick={handleSavePassword} loading={savingPw}>Modifier le mot de passe</Button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-medium text-gray-700 mb-3">Sessions actives</h3>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Session actuelle</p>
                    <p className="text-green-600 text-xs">Connecté maintenant</p>
                  </div>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Préférences de notifications</h2>
              <div className="space-y-4">
                {[
                  { key: 'alertesApa', label: 'Alertes APA/PCH expirant bientôt', desc: 'Notification 30 jours avant expiration' },
                  { key: 'facturesRetard', label: 'Factures en retard', desc: 'Alerte après dépassement d\'échéance' },
                  { key: 'nouveauxLeads', label: 'Nouveaux leads', desc: 'Notification à chaque nouveau prospect' },
                  { key: 'planningChangements', label: 'Changements de planning', desc: 'Annulations et modifications d\'interventions' },
                  { key: 'emailResume', label: 'Résumé par email', desc: 'Rapport d\'activité par email' },
                ].map(pref => (
                  <div key={pref.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{pref.label}</p>
                      <p className="text-xs text-gray-400">{pref.desc}</p>
                    </div>
                    <div
                      onClick={() => setNotifPrefs(p => ({...p, [pref.key]: !p[pref.key]}))}
                      className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${notifPrefs[pref.key] ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifPrefs[pref.key] ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                ))}

                {notifPrefs.emailResume && (
                  <div className="ml-4">
                    <Select label="Fréquence des emails" value={notifPrefs.emailFrequence}
                      onChange={e => setNotifPrefs(p => ({...p, emailFrequence: e.target.value}))}
                      options={[{ value: 'quotidien', label: 'Quotidien' }, { value: 'hebdomadaire', label: 'Hebdomadaire' }, { value: 'mensuel', label: 'Mensuel' }]} />
                  </div>
                )}

                <Button icon={Save} onClick={() => alert('Préférences enregistrées.')}>Enregistrer les préférences</Button>
              </div>
            </div>
          )}

          {/* Apparence */}
          {activeTab === 'apparence' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Apparence</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Thème</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'clair', label: 'Clair', colors: ['bg-white', 'bg-gray-100', 'bg-indigo-600'] },
                      { key: 'sombre', label: 'Sombre (bientôt)', colors: ['bg-gray-900', 'bg-gray-800', 'bg-indigo-500'], disabled: true },
                      { key: 'auto', label: 'Auto', colors: ['bg-gray-100', 'bg-gray-200', 'bg-indigo-400'], disabled: true },
                    ].map(theme => (
                      <div key={theme.key} className={`border-2 rounded-xl p-3 cursor-pointer transition-colors ${theme.disabled ? 'opacity-50 cursor-not-allowed' : theme.key === 'clair' ? 'border-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex gap-1 mb-2">
                          {theme.colors.map((c, i) => <div key={i} className={`flex-1 h-5 rounded ${c}`} />)}
                        </div>
                        <p className="text-xs text-center text-gray-600 font-medium">{theme.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Langue</p>
                  <Select value="fr" options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English (bientôt)' }]} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout confirm */}
      <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Déconnexion" size="sm"
        footer={<><Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>Annuler</Button><Button variant="danger" onClick={handleLogout}>Déconnexion</Button></>}>
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <LogOut size={20} className="text-red-600" />
          </div>
          <p className="text-gray-600 text-sm">Êtes-vous sûr de vouloir vous déconnecter de Youdom Care CRM ?</p>
        </div>
      </Modal>
    </div>
  );
}
