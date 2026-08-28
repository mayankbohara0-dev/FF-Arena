import React from 'react';
import {
  Smartphone,
  LayoutDashboard,
  ShieldAlert,
  Award,
  Bell,
  UserCheck,
  Zap,
  Flame,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, ViewMode } from '../../types';

interface HeaderSwitcherProps {
  onOpenNotifications: () => void;
}

export const HeaderSwitcher: React.FC<HeaderSwitcherProps> = ({ onOpenNotifications }) => {
  const {
    viewMode,
    setViewMode,
    activeRole,
    setActiveRole,
    isMobileFrame,
    setIsMobileFrame,
    unreadNotifCount,
    currentUser,
  } = useApp();

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'PLAYER', label: 'Player', icon: '🎮' },
    { role: 'TEAM_CAPTAIN', label: 'Team Captain', icon: '👑' },
    { role: 'ORGANIZER', label: 'Tournament Organizer', icon: '🏆' },
    { role: 'MODERATOR', label: 'Moderator', icon: '🛡️' },
    { role: 'ADMIN', label: 'Platform Admin', icon: '⚡' },
    { role: 'SUPER_ADMIN', label: 'Super Admin', icon: '🌟' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0d15]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-glow-orange font-display font-black text-2xl text-white tracking-wider">
            FF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black tracking-wider text-xl text-white">
                FF <span className="text-orange-500">ARENA</span>
              </span>
              <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-500/30 uppercase tracking-widest">
                Esports India
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Compete. Rank. Build your esports identity.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setViewMode('MOBILE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'MOBILE'
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-glow-orange'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Player App</span>
          </button>

          <button
            onClick={() => setViewMode('ORGANIZER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'ORGANIZER'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-glow-amber'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>💻 Organizer Hub</span>
          </button>

          <button
            onClick={() => setViewMode('ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'ADMIN'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🛡️ Anti-Fraud & Admin</span>
          </button>

          <button
            onClick={() => setViewMode('CERT_VERIFY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'CERT_VERIFY'
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>📜 Verify Certificate</span>
          </button>
        </div>

        {/* Right Actions: Role Switcher, Frame Toggle, Notif Bell */}
        <div className="flex items-center gap-2">
          {/* Mobile frame toggle (active when viewing mobile) */}
          {viewMode === 'MOBILE' && (
            <button
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              title={isMobileFrame ? 'Expand to Full Width' : 'Show Phone Frame'}
              className="hidden lg:flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-400" />
              <span>{isMobileFrame ? 'Phone Frame: ON' : 'Phone Frame: OFF'}</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-orange-400" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Active User Mini Avatar */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-7 h-7 rounded-full object-cover border border-orange-500/60"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
