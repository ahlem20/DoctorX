import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Calendar, UserCheck, FileText, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function NotificationsDropdown() {
  const { t } = useTranslation('group2');
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 10 seconds for new internal notifications
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'arrival':
        return (
          <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg border border-emerald-100">
            <UserCheck className="h-4 w-4" />
          </div>
        );
      case 'prescription':
        return (
          <div className="p-2 bg-teal-50 text-teal-500 rounded-lg border border-teal-100">
            <FileText className="h-4 w-4" />
          </div>
        );
      case 'appointment':
        return (
          <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg border border-indigo-100">
            <Calendar className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">
            <AlertCircle className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition duration-200 cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
      >
        <Bell className={`h-4.5 w-4.5 text-slate-600 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-3 duration-250">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t('notifications.title')}</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {t('notifications.subtitle')}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  className={`flex gap-3.5 p-4 items-start transition-colors duration-150 cursor-pointer ${
                    notif.isRead ? 'hover:bg-slate-50/50' : 'bg-indigo-50/20 hover:bg-indigo-50/40'
                  }`}
                >
                  {getIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${notif.isRead ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {t('notifications.at')}{' '}
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="font-semibold text-sm">{t('notifications.emptyTitle')}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('notifications.emptySubtitle')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
