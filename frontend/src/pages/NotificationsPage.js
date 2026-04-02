import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Calendar, FileText, CheckCheck, Trash2 } from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/common/EmptyState';
import { PageLoader } from '../components/common/LoadingSpinner';
import { formatDateTime } from '../utils/helpers';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'alerte', titre: 'Droits APA expirés', message: 'Les droits APA de Marie Dupont expirent dans 13 jours. Pensez à faire la demande de renouvellement.', date: '2026-04-02T10:30:00', lue: false },
  { id: 2, type: 'impaye', titre: 'Facture en retard', message: 'La facture FAC-2026-003 d\'Isabelle Petit est en retard de paiement depuis 33 jours (320 €).', date: '2026-04-02T09:15:00', lue: false },
  { id: 3, type: 'planning', titre: 'Intervention annulée', message: 'Claire Martin ne peut pas intervenir le 03/04/2026 chez Jean Martin. Intervention à reprogrammer.', date: '2026-04-01T16:45:00', lue: false },
  { id: 4, type: 'lead', titre: 'Nouveau lead', message: 'Paul Bernard a soumis une demande de service via le site web. Score estimé : 40/100.', date: '2026-04-01T14:20:00', lue: true },
  { id: 5, type: 'qualite', titre: 'Nouveau ticket qualité', message: 'Un ticket de réclamation a été ouvert pour Jean Martin : "Qualité du ménage insuffisante".', date: '2026-03-22T11:00:00', lue: true },
  { id: 6, type: 'info', titre: 'Rapport mensuel disponible', message: 'Le rapport d\'activité de mars 2026 est disponible. 1 842 heures d\'intervention réalisées.', date: '2026-04-01T08:00:00', lue: true },
];

const TYPE_CONFIG = {
  alerte: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', variant: 'danger', label: 'Alerte' },
  impaye: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', variant: 'warning', label: 'Impayé' },
  planning: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', variant: 'info', label: 'Planning' },
  lead: { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50', variant: 'primary', label: 'Lead' },
  qualite: { icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50', variant: 'purple', label: 'Qualité' },
  info: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50', variant: 'gray', label: 'Info' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'

  useEffect(() => {
    setTimeout(() => { setNotifications(MOCK_NOTIFICATIONS); setLoading(false); }, 400);
  }, []);

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.lue;
    if (filter === 'read') return n.lue;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
  const deleteNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  if (loading) return <PageLoader text="Chargement des notifications..." />;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-500 text-sm">
            {unreadCount > 0 ? (
              <><span className="font-medium text-indigo-600">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span> sur {notifications.length}</>
            ) : (
              `${notifications.length} notification${notifications.length > 1 ? 's' : ''}`
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" icon={CheckCheck} onClick={markAllRead} size="sm">
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden w-fit">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'unread', label: `Non lues (${unreadCount})` },
          { key: 'read', label: 'Lues' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm transition-colors ${filter === f.key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste notifications */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200">
            <EmptyState icon="Bell" title="Aucune notification" description="Vous êtes à jour !" />
          </div>
        ) : (
          filtered
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(notif => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-xl border ${notif.lue ? 'border-gray-200' : 'border-indigo-200'} p-4 flex gap-4 transition-all hover:shadow-sm`}
                >
                  <div className={`${config.bg} p-2.5 rounded-xl flex-shrink-0 h-fit`}>
                    <Icon size={18} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className={`font-medium text-sm ${notif.lue ? 'text-gray-700' : 'text-gray-900'}`}>{notif.titre}</h3>
                      {!notif.lue && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1 flex-shrink-0" />}
                      <Badge variant={config.variant} size="xs">{config.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDateTime(notif.date)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!notif.lue && (
                      <button onClick={() => markRead(notif.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Marquer comme lu">
                        <CheckCheck size={15} />
                      </button>
                    )}
                    <button onClick={() => deleteNotif(notif.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
