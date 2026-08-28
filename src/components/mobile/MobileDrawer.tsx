import React from 'react';
import {
  X,
  Smartphone,
  LayoutDashboard,
  ShieldAlert,
  Award,
  Users,
  Trophy,
  Key,
  GraduationCap,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Download,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BadgePill } from '../common/BadgePill';
import { UserRole, ViewMode } from '../../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTeamModal: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onOpenTeamModal,
}) => {
  const {
    currentUser,
    viewMode,
    setViewMode,
    activeRole,
    setActiveRole,
    teams,
    colleges,
  } = useApp();

  if (!isOpen) return null;

  const currentTeam = teams.find((t: any) => t.id === currentUser.teamId);
  const currentCollege = colleges.find((c: any) => c.id === currentUser.collegeId);

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'PLAYER', label: 'Player', icon: '🎮' },
    { role: 'TEAM_CAPTAIN', label: 'Team Captain', icon: '👑' },
    { role: 'ORGANIZER', label: 'Organizer', icon: '🏆' },
    { role: 'MODERATOR', label: 'Moderator', icon: '🛡️' },
    { role: 'ADMIN', label: 'Admin', icon: '⚡' },
    { role: 'SUPER_ADMIN', label: 'Super Admin', icon: '🌟' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[320px] bg-[#0c101a] border-r border-slate-800 h-full flex flex-col shadow-2xl animate-slide-right select-none">
        {/* Drawer Header with Player Card */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-b from-orange-950/40 via-slate-900 to-[#0c101a] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-13 h-13 rounded-2xl object-cover border-2 border-orange-500 shadow-glow-orange"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-black text-base text-white truncate">
                {currentUser.displayName}
              </h3>
              <p className="text-[11px] font-mono text-orange-400 font-bold">
                IGN: {currentUser.gamerProfile?.gameName || 'VORTEX_REX'}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                {currentUser.gamerProfile && (
                  <BadgePill tier={currentUser.gamerProfile.tier} rating={currentUser.gamerProfile.rating} size="sm" showRating />
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>UID: <strong className="text-white">{currentUser.gamerProfile?.gameUid || '982347101'}</strong></span>
            <span className="text-orange-400 font-bold">Rank #{currentUser.gamerProfile?.rank || 42}</span>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs scrollbar-none">
          {/* 1. APP MODES */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">
              App Modes & Hubs
            </span>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setViewMode('MOBILE');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition ${
                  viewMode === 'MOBILE'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow-orange'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4" />
                  <span>📱 Player App (Mobile MVP)</span>
                </div>
                {viewMode === 'MOBILE' && <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded">ACTIVE</span>}
              </button>

              <button
                onClick={() => {
                  setViewMode('ORGANIZER');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition ${
                  viewMode === 'ORGANIZER'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-glow-amber'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>💻 Organizer Dashboard</span>
                </div>
                {viewMode === 'ORGANIZER' && <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded">ACTIVE</span>}
              </button>

              <button
                onClick={() => {
                  setViewMode('ADMIN');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition ${
                  viewMode === 'ADMIN'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>🛡️ Anti-Fraud & Admin Panel</span>
                </div>
                {viewMode === 'ADMIN' && <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded">ACTIVE</span>}
              </button>

              <button
                onClick={() => {
                  setViewMode('CERT_VERIFY');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition ${
                  viewMode === 'CERT_VERIFY'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-glow-cyan'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>📜 Verify Certificate Registry</span>
                </div>
                {viewMode === 'CERT_VERIFY' && <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded">ACTIVE</span>}
              </button>
            </div>
          </div>

          {/* 2. ROLE SWITCHER */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">
              Active User Role
            </span>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-orange-500"
              >
                {roles.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.icon} Role: {r.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 px-1">
                Permissions switch in real-time according to role.
              </p>
            </div>
          </div>

          {/* 3. QUICK SHORTCUTS */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">
              Squad & Campus
            </span>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenTeamModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 transition border border-slate-800/80"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-orange-400" />
                  <span>My Squad Roster ({currentTeam ? currentTeam.name : 'Create Squad'})</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {currentCollege && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">{currentCollege.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Verified College ID</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. COMPLIANCE & LEGAL NOTICE */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 text-orange-400 font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Compliance & Fair Play Notice</span>
            </div>
            <p>
              Free community esports tournaments only. Non-wagering model. Independent platform not officially affiliated with Garena.
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <span>FF Arena Android MVP</span>
          <span className="text-orange-400 font-bold">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
