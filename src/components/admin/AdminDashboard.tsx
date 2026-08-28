import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  AlertTriangle,
  Flame,
  Search,
  Lock,
  Unlock,
  UserCheck,
  Activity,
  FileText,
  Check,
  X,
  PlusCircle,
  Key,
  Trophy,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { tapFeedback, booyahFeedback } from '../../services/soundService';

export const AdminDashboard: React.FC = () => {
  const { currentUser, tournaments, createTournament, updateMatchRoom, matches } = useApp();
  const [activeTab, setActiveTab] = useState<'TOURNAMENTS' | 'FRAUD' | 'USERS' | 'ANALYTICS'>('TOURNAMENTS');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin New Tournament State
  const [isCreatingTourney, setIsCreatingTourney] = useState(false);
  const [tourneyName, setTourneyName] = useState('Bermuda 48-Player Blitz #201');
  const [tourneyMap, setTourneyMap] = useState<'Bermuda' | 'Purgatory' | 'Kalahari'>('Bermuda');
  const [roomIdInput, setRoomIdInput] = useState('9812401');
  const [roomPassInput, setRoomPassInput] = useState('adminff88');

  // Sample Fraud Detection Alerts
  const [fraudAlerts, setFraudAlerts] = useState([
    {
      id: 'fa-1',
      type: 'DUPLICATE_UID',
      severity: 'HIGH',
      title: 'Duplicate Free Fire UID Detected',
      details: 'Player "Speedy_FF" registered with UID 982347101, which is already bound to "Aman Sharma (VORTEX_REX)".',
      status: 'PENDING',
      timestamp: '10m ago',
    },
    {
      id: 'fa-2',
      type: 'ABNORMAL_KILLS',
      severity: 'MEDIUM',
      title: 'Abnormal Frag Spike (> 25 Kills)',
      details: 'Account "ProSniper99" submitted 28 kills in Bermuda Solo match. Flagged for emulator / config file check.',
      status: 'INVESTIGATING',
      timestamp: '35m ago',
    },
    {
      id: 'fa-3',
      type: 'SCREENSHOT_HASH_CLASH',
      severity: 'HIGH',
      title: 'Identical Screenshot Evidence Re-used',
      details: 'Screenshot hash matched an existing approved result from Tournament #142.',
      status: 'BLOCKED',
      timestamp: '2h ago',
    },
  ]);

  const handleAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTournament({
      name: tourneyName,
      map: tourneyMap,
      entryFee: 15,
      perKillReward: 10,
      maxParticipants: 48,
      rewardDescription: '🏆 ₹10/Kill + ₹20 Booyah Extra + ₹15 (2nd/3rd)',
    });
    setIsCreatingTourney(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Admin Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
              🛡️ OFFICIAL ADMIN CONTROL PANEL
            </span>
            <span className="text-slate-400 text-xs font-mono">Full Tournament & Room Authority</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
            Admin Tournament & Room Governance
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Only Admins can create and publish 48-player tournaments, set Custom Room credentials, and manage anti-cheat flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingTourney(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-purple transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create 48P Match</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-bold gap-4">
        <button
          onClick={() => setActiveTab('TOURNAMENTS')}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'TOURNAMENTS'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>48-Player Tournaments & Custom Rooms ({tournaments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FRAUD')}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'FRAUD'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Anti-Cheat & Fraud Sentinel ({fraudAlerts.length})</span>
        </button>
      </div>

      {/* TAB 1: TOURNAMENT CREATOR & ROOM MANAGER */}
      {activeTab === 'TOURNAMENTS' && (
        <div className="space-y-6">
          {/* Create Modal if Open */}
          {isCreatingTourney && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/50 space-y-4 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-purple-400" />
                  Admin: Publish Official 48-Player Tournament
                </h4>
                <button
                  onClick={() => setIsCreatingTourney(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdminCreate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Tournament Title</label>
                    <input
                      type="text"
                      value={tourneyName}
                      onChange={(e) => setTourneyName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Map</label>
                    <select
                      value={tourneyMap}
                      onChange={(e: any) => setTourneyMap(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                    >
                      <option value="Bermuda">Bermuda</option>
                      <option value="Purgatory">Purgatory</option>
                      <option value="Kalahari">Kalahari</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200">
                  ⚡ <strong>Admin Rules Enforced:</strong> 48 Slots Max | ₹15 Entry Fee | ₹10/Kill Bounty | +₹20 Booyah Bonus | +₹15 2nd & 3rd Place Bonus.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  Publish 48-Player Tournament As Admin 🚀
                </button>
              </form>
            </div>
          )}

          {/* Tournament & Room Credential Manager List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">ACTIVE 48-PLAYER MATCHES & CUSTOM ROOMS</h4>
            
            {tournaments.map((t) => {
              const match = matches.find((m) => m.tournamentId === t.id) || matches[0];
              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={t.bannerUrl}
                      alt={t.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-900/80 text-purple-200 border border-purple-500/30">
                          ADMIN HOSTED
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-600 text-white">
                          ₹{t.entryFee} ENTRY
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Slots: <strong>{t.currentParticipants} / {t.maxParticipants || 48}</strong>
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-white">{t.name}</h5>
                      <p className="text-xs text-slate-400">
                        Room ID: <strong className="text-white font-mono">{match?.roomId || '8391047'}</strong> | Pass: <strong className="text-orange-400 font-mono">{match?.roomPassword || 'arenaff2026'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        const newRoom = prompt('Enter Custom Room ID:', match?.roomId || '8391047');
                        const newPass = prompt('Enter Custom Room Password:', match?.roomPassword || 'arenaff2026');
                        if (newRoom && newPass) {
                          updateMatchRoom(match.id, newRoom, newPass, new Date().toISOString(), true);
                          alert(`Custom Room credentials updated for ${t.name}!`);
                        }
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <Key className="w-3.5 h-3.5 text-orange-400" />
                      <span>Edit Room ID / Pass</span>
                    </button>

                    <button
                      onClick={() => { tapFeedback();
                        updateMatchRoom(match.id, match.roomId || '8391047', match.roomPassword || 'arenaff2026', new Date().toISOString(), true);
                        alert(`Custom Room credentials released to all 48 players!`);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-md transition"
                    >
                      {match?.isRoomReleased ? '● Credentials Unlocked' : 'Release Room'}
                    </button>

                    {/* PUBLISH ROOM NOW — shown when lobby is full */}
                    {t.currentParticipants >= (t.maxParticipants || 48) && (
                      <button
                        onClick={() => {
                          booyahFeedback();
                          updateMatchRoom(match.id, match?.roomId || '8391047', match?.roomPassword || 'arenaff2026', new Date().toISOString(), true);
                          alert(`🟡 ROOM PUBLISHED! All 48 players can now see credentials.`);
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#FFE600] hover:bg-[#FFF066] text-black text-xs font-black shadow-glow-yellow-sm transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        📡 PUBLISH ROOM NOW
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ANTI-CHEAT SENTINEL */}
      {activeTab === 'FRAUD' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {fraudAlerts.map((fa) => (
              <div
                key={fa.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-500 text-white">
                        {fa.severity} SEVERITY
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{fa.timestamp}</span>
                    </div>
                    <h5 className="font-bold text-xs text-white">{fa.title}</h5>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{fa.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => alert(`Fraud flag ${fa.id} marked as resolved.`)}
                    className="px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30 transition"
                  >
                    Clear Flag
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
