import React from 'react';
import {
  X,
  Smartphone,
  ShieldAlert,
  Award,
  Users,
  GraduationCap,
  Shield,
  ChevronRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BadgePill } from '../common/BadgePill';
import { isWhitelistedAdmin } from '../../services/adminAuth';
import { tapFeedback } from '../../services/soundService';

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
    setActiveRole,
    teams,
    colleges,
    logout,
  } = useApp();

  if (!isOpen) return null;

  const currentTeam = teams.find((t: any) => t.id === currentUser.teamId);
  const currentCollege = colleges.find((c: any) => c.id === currentUser.collegeId);
  const isAdmin = isWhitelistedAdmin(currentUser.email);

  const handleAdminClick = () => {
    tapFeedback();
    setActiveRole('ADMIN');
    setViewMode('ADMIN');
    onClose();
  };

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
              className="w-13 h-13 rounded-2xl object-cover border-2 border-[#FFE600] shadow-glow-yellow-sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-base text-white truncate">
                  {currentUser.displayName}
                </h3>
                {isAdmin && (
                  <span className="px-1.5 py-0.2 text-[8px] font-black bg-purple-500 text-white rounded font-mono">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#FFE600] font-bold">
                IGN: {currentUser.gamerProfile?.gameName || currentUser.displayName || 'Player'}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                {currentUser.gamerProfile && (
                  <BadgePill tier={currentUser.gamerProfile.tier} rating={currentUser.gamerProfile.rating} size="sm" showRating />
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>UID: <strong className="text-white">{currentUser.gamerProfile?.gameUid || 'Not Set'}</strong></span>
            <span className="text-[#FFE600] font-bold">{currentUser.gamerProfile?.rank ? `Rank #${currentUser.gamerProfile.rank}` : 'Unranked'}</span>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs scrollbar-none">
          {/* 1. APP NAVIGATION */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">
              Navigation
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setViewMode('MOBILE');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition ${
                  viewMode === 'MOBILE'
                    ? 'bg-[#FFE600] text-black shadow-glow-yellow-sm'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4" />
                  <span>📱 Player Tournament App</span>
                </div>
                {viewMode === 'MOBILE' && <span className="text-[9px] font-mono font-black bg-black/20 px-1.5 py-0.5 rounded">ACTIVE</span>}
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
                  <span>📜 Verify Winner Certificates</span>
                </div>
                {viewMode === 'CERT_VERIFY' && <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded">ACTIVE</span>}
              </button>

              {/* ADMIN ACCESS: Only visible to whitelisted admin emails */}
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition border border-purple-500/40 ${
                    viewMode === 'ADMIN'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple'
                      : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    <span>🛡️ Admin Panel & Winner Payouts</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 2. SQUAD & CAMPUS */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">
              Squad & Campus
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenTeamModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 transition border border-slate-800/80"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#FFE600]" />
                  <span>My Squad Roster ({currentTeam ? currentTeam.name : 'Create Squad'})</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                onClick={() => {
                  tapFeedback();
                  window.open('https://github.com/mayankbohara0-dev/FF-Arena/releases/download/v1.0.0/ff-arena-v1.0.apk', '_blank');
                }}
                className="w-full p-2.5 rounded-xl bg-[#FFE600]/10 hover:bg-[#FFE600]/20 border border-[#FFE600]/30 flex items-center justify-between transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-[#FFE600]" />
                  <div>
                    <span className="font-bold text-white text-xs block">Download Android APK</span>
                    <span className="text-[9px] text-[#FFE600] font-mono">v1.0.0 • 100% Virus-Free (10 MB)</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#FFE600]" />
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

          {/* 3. COMPLIANCE & LEGAL NOTICE */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 text-[#FFE600] font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Fair Play & Compliance</span>
            </div>
            <p>
              Community esports tournaments platform. Non-wagering skill-based competition. Independent from Garena.
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <img src="/logo.png" alt="FF" className="w-5 h-5 object-contain" />
            <span>FF Arena</span>
            <span className="text-[#FFE600] font-bold">v1.0.0</span>
          </div>
          <button
            onClick={() => {
              tapFeedback();
              onClose();
              logout();
            }}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 font-bold text-[10px] hover:bg-red-950/60 transition cursor-pointer"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
