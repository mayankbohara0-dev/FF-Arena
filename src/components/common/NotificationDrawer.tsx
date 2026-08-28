import React from 'react';
import { X, Bell, CheckCircle, ShieldAlert, Key, Trophy, Users, AlertCircle, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PushNotification } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllNotificationsRead, setViewMode } = useApp();

  if (!isOpen) return null;

  const getIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'ROOM_DETAILS':
      case 'ROOM_RELEASED':
        return <Key className="w-4 h-4 text-orange-400" />;
      case 'MATCH_START':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'RESULT_VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'WALLET_CREDIT':
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      case 'DISPUTE_UPDATE':
        return <AlertCircle className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-orange-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            <h2 className="font-display font-bold text-lg text-white tracking-wide">
              NOTIFICATIONS & ALERTS
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 transition"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.isRead && !n.read;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.type === 'ROOM_DETAILS' || n.type === 'ROOM_RELEASED' || n.type === 'RESULT_VERIFIED') {
                      setViewMode('MOBILE');
                    }
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isUnread
                      ? 'bg-slate-800/90 border-orange-500/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-300 leading-relaxed">{n.body}</p>
                      <span className="text-[10px] text-slate-500 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
