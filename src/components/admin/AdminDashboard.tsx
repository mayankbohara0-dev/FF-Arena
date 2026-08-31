import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  Search,
  PlusCircle,
  Trophy,
  Wallet,
  Send,
  Copy,
  Check,
  ShieldCheck,
  Download,
  MessageSquare,
  TrendingUp,
  IndianRupee,
  X,
  Key,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { tapFeedback, successFeedback } from '../../services/soundService';

interface WinnerPayout {
  id: string;
  tournamentName: string;
  playerName: string;
  gameName: string;
  gameUid: string;
  rank: number;
  kills: number;
  prizeAmount: number;
  upiId: string;
  status: 'PENDING' | 'PAID';
  timestamp: string;
}

type AdminTab = 'DASHBOARD' | 'PLAYERS' | 'TOURNAMENTS' | 'PAYOUTS' | 'FRAUD';

interface AdminDashboardProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, onTabChange }) => {
  const {
    tournaments,
    registrations,
    createTournament,
    updateMatchRoom,
    addNotification,
    setViewMode,
  } = useApp();

  const [isCreatingTourney, setIsCreatingTourney] = useState(false);

  // Full tournament creation form state
  const [tourneyName, setTourneyName] = useState('');
  const [tourneyDescription, setTourneyDescription] = useState('');
  const [tourneyMode, setTourneyMode] = useState<'Battle Royale' | 'Clash Squad' | 'Lone Wolf' | 'College'>('Battle Royale');
  const [tourneyMap, setTourneyMap] = useState<'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine' | 'NexTerra'>('Bermuda');
  const [tourneyTeamSize, setTourneyTeamSize] = useState<number>(1);
  const [tourneySlots, setTourneySlots] = useState<number>(48);
  const [tourneyEntryFee, setTourneyEntryFee] = useState<number>(15);
  const [tourneyKillReward, setTourneyKillReward] = useState<number>(10);
  const [tourneyRoomId, setTourneyRoomId] = useState<string>('');
  const [tourneyRoomPass, setTourneyRoomPass] = useState<string>('');
  const [isCollegeOnly, setIsCollegeOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');

  // Match Winners & Kill Bounty Payout Queue
  const [winnerPayouts, setWinnerPayouts] = useState<WinnerPayout[]>([]);

  // Anti-cheat reports
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);

  const handleAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourneyName.trim()) return;
    tapFeedback();
    setIsSubmitting(true);
    await createTournament({
      name: tourneyName.trim(),
      description: tourneyDescription.trim() || `Official Admin ${tourneySlots}-player ${tourneyMode} match. ₹${tourneyEntryFee} entry, ₹${tourneyKillReward}/kill.`,
      mode: tourneyMode,
      map: tourneyMap,
      teamSize: tourneyTeamSize,
      maxParticipants: tourneySlots,
      entryFee: tourneyEntryFee,
      perKillReward: tourneyKillReward,
      rewardDescription: `🏆 ₹${tourneyKillReward}/Kill + ₹20 Booyah Bonus`,
      isCollegeOnly,
      roomId: tourneyRoomId.trim() || undefined,
      roomPassword: tourneyRoomPass.trim() || undefined,
      scoringSystem: {
        placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
        killPoint: 1,
      },
    });
    setIsSubmitting(false);
    setIsCreatingTourney(false);
    // Reset form
    setTourneyName('');
    setTourneyDescription('');
    setTourneyMode('Battle Royale');
    setTourneyMap('Bermuda');
    setTourneyTeamSize(1);
    setTourneySlots(48);
    setTourneyEntryFee(15);
    setTourneyKillReward(10);
    setTourneyRoomId('');
    setTourneyRoomPass('');
    setIsCollegeOnly(false);
    successFeedback();
    onTabChange('TOURNAMENTS');
  };

  // 1-Tap Pay Winner on GPay / PhonePe / Paytm
  const handlePayViaUpi = (winner: WinnerPayout) => {
    tapFeedback();
    const upiUri = `upi://pay?pa=${winner.upiId}&pn=${encodeURIComponent(winner.playerName)}&am=${winner.prizeAmount}&cu=INR&tn=${encodeURIComponent(`FF Arena Prize: ${winner.tournamentName}`)}`;
    window.location.href = upiUri;
  };

  const handleCopyUpi = (id: string, upiId: string) => {
    tapFeedback();
    navigator.clipboard.writeText(upiId);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkPaid = (id: string, winner: WinnerPayout) => {
    tapFeedback();
    setWinnerPayouts((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'PAID' } : w))
    );
    successFeedback();
    addNotification(
      '🏆 Prize Money Sent via UPI!',
      `Admin sent ₹${winner.prizeAmount} directly to your UPI ID ${winner.upiId} for ${winner.tournamentName}.`,
      'WALLET_CREDIT'
    );
  };

  const pendingCount = winnerPayouts.filter((w) => w.status === 'PENDING').length;
  const totalPendingAmount = winnerPayouts
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + w.prizeAmount, 0);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5 animate-fade-in text-slate-200">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
              🛡️ ADMIN GOVERNANCE PORTAL
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-wide">FF Arena Control Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage players, matches, payouts and room credentials.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { tapFeedback(); setViewMode('MOBILE'); }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:text-white text-xs font-bold transition active:scale-95"
          >
            ← Player View
          </button>
          <button
            onClick={() => { tapFeedback(); setIsCreatingTourney(true); onTabChange('TOURNAMENTS'); }}
            className="px-4 py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs flex items-center gap-1.5 shadow-glow-yellow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Match</span>
          </button>
        </div>
      </div>

      {/* Live Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { label: 'Total Players', value: registrations.length, icon: Users, color: 'text-[#FFE600]', bg: 'bg-[#FFE600]/10 border-[#FFE600]/20' },
          { label: 'Fees Collected', value: `₹${registrations.length * 15}`, icon: IndianRupee, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Pending Payouts', value: `₹${totalPendingAmount}`, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Active Matches', value: tournaments.filter(t => t.status === 'Registration Open' || t.status === 'Live').length, icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`p-3 sm:p-3.5 rounded-2xl border ${stat.bg} flex items-center gap-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
            <div>
              <p className={`text-base font-black font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <div>
                <h3 className="font-display font-black text-lg text-white">Admin Quick Actions</h3>
                <p className="text-xs text-slate-400">Manage tournament publishing, room credentials, and prize distributions.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => { tapFeedback(); setIsCreatingTourney(true); onTabChange('TOURNAMENTS'); }}
                className="p-3 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/30 text-left space-y-1 active:scale-95 transition hover:bg-[#FFE600]/20"
              >
                <Trophy className="w-4 h-4 text-[#FFE600]" />
                <p className="text-xs font-black text-white">Host Tournament</p>
                <p className="text-[9px] text-slate-400">Publish custom lobby</p>
              </button>
              <button
                onClick={() => { tapFeedback(); onTabChange('PLAYERS'); }}
                className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-left space-y-1 active:scale-95 transition hover:bg-blue-500/20"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <p className="text-xs font-black text-white">Manage Players</p>
                <p className="text-[9px] text-slate-400">{registrations.length} registered</p>
              </button>
              <button
                onClick={() => { tapFeedback(); onTabChange('PAYOUTS'); }}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-1 active:scale-95 transition hover:bg-amber-500/20"
              >
                <IndianRupee className="w-4 h-4 text-amber-400" />
                <p className="text-xs font-black text-white">UPI Payouts</p>
                <p className="text-[9px] text-slate-400">{pendingCount} pending</p>
              </button>
              <button
                onClick={() => { tapFeedback(); onTabChange('FRAUD'); }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-left space-y-1 active:scale-95 transition hover:bg-red-500/20"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <p className="text-xs font-black text-white">Anti-Cheat</p>
                <p className="text-[9px] text-slate-400">Sentinel security</p>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300">RECENT TOURNAMENTS ({tournaments.length})</h4>
              <button
                onClick={() => { tapFeedback(); onTabChange('TOURNAMENTS'); }}
                className="text-[11px] font-bold text-purple-400 hover:text-purple-300"
              >
                View All →
              </button>
            </div>

            {tournaments.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-300">No Tournaments Published Yet</p>
                <p className="text-xs text-slate-500 mt-0.5">Click the button below to create and launch your first match!</p>
                <button
                  onClick={() => { tapFeedback(); setIsCreatingTourney(true); onTabChange('TOURNAMENTS'); }}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-purple transition active:scale-95"
                >
                  + Create First Tournament
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tournaments.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-white">{t.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {t.map} • {t.mode} • {t.currentParticipants}/{t.maxParticipants} slots filled
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PLAYERS TAB: Registered Players & CSV Export ── */}
      {activeTab === 'PLAYERS' && (
        <div className="space-y-4 animate-fade-in">
          {/* Search + summary */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-white">ALL REGISTERED PLAYERS</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {registrations.length > 0
                    ? `${registrations.length} player${registrations.length > 1 ? 's' : ''} registered across ${tournaments.length} tournament${tournaments.length > 1 ? 's' : ''}`
                    : 'No players registered yet.'}
                </p>
              </div>
            </div>
            {/* Global search */}
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by player name, IGN, or UID..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="flex-1 bg-transparent text-white text-xs focus:outline-none placeholder:text-slate-600"
              />
              {playerSearch && (
                <button onClick={() => setPlayerSearch('')} className="text-slate-500 hover:text-white text-xs">✕</button>
              )}
            </div>
          </div>

          {tournaments.map((t) => {
            const tRegs = registrations
              .filter((r) => r.tournamentId === t.id)
              .filter((r) => {
                if (!playerSearch.trim()) return true;
                const q = playerSearch.toLowerCase();
                return (
                  r.playerName?.toLowerCase().includes(q) ||
                  r.gameUid?.toLowerCase().includes(q) ||
                  r.teamName?.toLowerCase().includes(q) ||
                  r.email?.toLowerCase().includes(q)
                );
              });
            const maxSlots = t.maxParticipants || 48;
            const fillPct = Math.min(100, Math.round((t.currentParticipants / maxSlots) * 100));

            const handleCsvExport = () => {
              tapFeedback();
              const allRegs = registrations.filter((r) => r.tournamentId === t.id);
              const header = 'Slot,Player Name,IGN/Team,FF UID,UPI ID,Email,Registered At';
              const rows = allRegs.map((r, i) =>
                [
                  r.slotNumber || i + 1,
                  r.playerName || '',
                  r.teamName || r.playerName || '',
                  r.gameUid || '',
                  r.upiId || '',
                  r.email || '',
                  r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN') : '',
                ].join(',')
              );
              const csv = [header, ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${t.name.replace(/\s+/g, '_')}_players.csv`;
              a.click();
            };

            return (
              <div key={t.id} className="space-y-3">
                {/* Tournament header with progress */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#FFE600] uppercase tracking-wider">{t.map}</span>
                      <h5 className="font-bold text-sm text-white">{t.name}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      {tRegs.length > 0 && (
                        <button
                          onClick={handleCsvExport}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold transition"
                        >
                          <Download className="w-3 h-3" />
                          CSV
                        </button>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                        {t.currentParticipants} / {maxSlots}
                      </span>
                    </div>
                  </div>

                  {/* Slot fill progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          fillPct >= 100 ? 'bg-green-400' : fillPct >= 75 ? 'bg-[#FFE600]' : 'bg-purple-500'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono">
                      {fillPct >= 100 ? '✅ FULL — Room credentials unlocked' : `${fillPct}% filled — ${maxSlots - t.currentParticipants} slots remaining`}
                    </p>
                  </div>
                </div>

                {tRegs.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 text-center">
                    {playerSearch ? 'No players match your search in this tournament' : 'No registrations yet'}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Slot</th>
                          <th className="px-3 py-2 text-left">Player</th>
                          <th className="px-3 py-2 text-left">FF UID</th>
                          <th className="px-3 py-2 text-left">UPI ID</th>
                          <th className="px-3 py-2 text-left">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tRegs.map((r, idx) => (
                          <tr key={r.id} className="bg-slate-950 hover:bg-slate-900 transition">
                            <td className="px-3 py-2 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 rounded bg-[#FFE600]/10 text-[#FFE600] font-mono font-bold text-[10px]">
                                #{r.slotNumber || idx + 1}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <p className="text-white font-bold">{r.playerName || 'Unknown'}</p>
                              <p className="text-[9px] text-slate-500 font-mono">{r.email || ''}</p>
                            </td>
                            <td className="px-3 py-2 text-slate-300 font-mono">{r.gameUid || '—'}</td>
                            <td className="px-3 py-2">
                              {r.upiId ? (
                                <span className="text-green-400 font-mono text-[10px]">{r.upiId}</span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">Not set</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">
                              {r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {tournaments.length === 0 && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No tournaments created yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TOURNAMENTS TAB: Create + Room Manager ── */}
      {activeTab === 'TOURNAMENTS' && (
        <div className="space-y-4 animate-fade-in">
          {/* Create Tournament Panel */}
          {isCreatingTourney ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/50 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-black text-base text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-purple-400" />
                  PUBLISH NEW TOURNAMENT
                </h4>
                <button onClick={() => setIsCreatingTourney(false)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminCreate} className="space-y-3">
                {/* Tournament Name */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Tournament Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bermuda 48-Player Cash Blitz #7"
                    value={tourneyName}
                    onChange={(e) => setTourneyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Description / Rules (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the match format, rules, anti-cheat policy..."
                    value={tourneyDescription}
                    onChange={(e) => setTourneyDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Mode + Map */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Mode</label>
                    <select
                      value={tourneyMode}
                      onChange={(e: any) => setTourneyMode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Battle Royale">Battle Royale</option>
                      <option value="Clash Squad">Clash Squad</option>
                      <option value="Lone Wolf">Lone Wolf</option>
                      <option value="College">College</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Map</label>
                    <select
                      value={tourneyMap}
                      onChange={(e: any) => setTourneyMap(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Bermuda">Bermuda</option>
                      <option value="Purgatory">Purgatory</option>
                      <option value="Kalahari">Kalahari</option>
                      <option value="Alpine">Alpine</option>
                      <option value="NexTerra">NexTerra</option>
                    </select>
                  </div>
                </div>

                {/* Team Size + Max Slots */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Team Size</label>
                    <select
                      value={tourneyTeamSize}
                      onChange={(e) => setTourneyTeamSize(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value={1}>1 Player (Solo)</option>
                      <option value={2}>2 Players (Duo)</option>
                      <option value={4}>4 Players (Squad)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Max Player Slots</label>
                    <input
                      type="number"
                      min={2}
                      max={200}
                      value={tourneySlots}
                      onChange={(e) => setTourneySlots(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Entry Fee + Kill Reward */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Entry Fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={tourneyEntryFee}
                      onChange={(e) => setTourneyEntryFee(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Per Kill Reward (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={tourneyKillReward}
                      onChange={(e) => setTourneyKillReward(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Custom Room ID & Password (Revealed to players after payment) */}
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-purple-300 font-bold flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#FFE600]" />
                      CUSTOM ROOM CREDENTIALS (REVEALED AFTER PAYMENT)
                    </label>
                  </div>
                  <p className="text-[9px] text-slate-400">
                    ⚡ Players will automatically receive these credentials immediately after paying their entry fee.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Custom Room ID (e.g. 8391047)"
                        value={tourneyRoomId}
                        onChange={(e) => setTourneyRoomId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Room Password (e.g. arenaff2026)"
                        value={tourneyRoomPass}
                        onChange={(e) => setTourneyRoomPass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-orange-300 font-mono font-bold focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* College Only Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollegeOnly}
                    onChange={(e) => setIsCollegeOnly(e.target.checked)}
                    className="w-3.5 h-3.5 accent-purple-500"
                  />
                  <span className="text-[10px] text-slate-300 font-bold">College players only (requires verified college ID)</span>
                </label>

                {/* Prize preview */}
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[10px] text-purple-200 space-y-0.5">
                  <p>⚡ <strong>Prize Structure:</strong> ₹{tourneyKillReward}/Kill + ₹20 Booyah Bonus (1st) + ₹15 (2nd &amp; 3rd)</p>
                  <p>💰 <strong>Entry Revenue:</strong> {tourneySlots} slots × ₹{tourneyEntryFee} = ₹{tourneySlots * tourneyEntryFee} total</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTourney(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !tourneyName.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Publishing...' : '🚀 Publish Tournament Live'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => { tapFeedback(); setIsCreatingTourney(true); }}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-purple-500/40 text-purple-400 hover:border-purple-400 hover:bg-purple-950/20 transition flex items-center justify-center gap-2 text-sm font-bold active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              Create New Tournament
            </button>
          )}

          {/* Tournament & Room Credential Manager List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">ACTIVE MATCHES & CUSTOM ROOMS ({tournaments.length})</h4>
            {tournaments.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No tournaments created yet. Use the button above to publish one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tournaments.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black text-[#FFE600] uppercase tracking-wider">{t.map} • {t.mode}</span>
                        <h5 className="font-bold text-sm text-white">{t.name}</h5>
                        <p className="text-[9px] text-slate-500">₹{t.entryFee} entry • ₹{t.perKillReward}/kill • {t.teamSize === 1 ? 'Solo' : t.teamSize === 2 ? 'Duo' : 'Squad'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                        {t.currentParticipants} / {t.maxParticipants}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Key className="w-3 h-3 text-purple-400" />
                        SET CUSTOM ROOM CREDENTIALS:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Room ID"
                          defaultValue=""
                          id={`room-${t.id}`}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold placeholder:text-slate-600"
                        />
                        <input
                          type="text"
                          placeholder="Password"
                          defaultValue=""
                          id={`pass-${t.id}`}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-orange-300 font-mono font-bold placeholder:text-slate-600"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const rId = (document.getElementById(`room-${t.id}`) as HTMLInputElement)?.value;
                            const rPass = (document.getElementById(`pass-${t.id}`) as HTMLInputElement)?.value;
                            if (!rId || !rPass) { alert('Please enter both Room ID and Password before publishing.'); return; }
                            updateMatchRoom(`match-${t.id}`, rId, rPass, new Date().toISOString(), true);
                            successFeedback();
                            addNotification(
                              '🔐 Room Credentials Published!',
                              `Room ID: ${rId} | Password: ${rPass} broadcast to all players of ${t.name}!`,
                              'ROOM_DETAILS'
                            );
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs uppercase shadow-glow-yellow-sm transition active:scale-95"
                        >
                          🚀 Publish Credentials
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            tapFeedback();
                            const rId = (document.getElementById(`room-${t.id}`) as HTMLInputElement)?.value || '—';
                            const rPass = (document.getElementById(`pass-${t.id}`) as HTMLInputElement)?.value || '—';
                            const msg = encodeURIComponent(
                              `🎮 *FF Arena Room Ready!*\n\n🏆 *${t.name}*\n\n🔑 Room ID: *${rId}*\n🔒 Password: *${rPass}*\n\nMap: ${t.map} | ${t.currentParticipants}/${t.maxParticipants} Players\n\nJoin now! 🔥\n— FF Arena Admin`
                            );
                            window.open(`https://wa.me/?text=${msg}`, '_blank');
                          }}
                          className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WA
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAYOUTS TAB: Instant 1-Tap Winner UPI Payouts ── */}
      {activeTab === 'PAYOUTS' && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-white">INSTANT 1-TAP WINNER UPI PAYOUTS</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact reward formula: <strong>Kills × ₹10</strong> + <strong>₹20 Booyah (#1)</strong> / <strong>₹15 Podium (#2, #3)</strong>.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">TOTAL TO PAY</span>
                <span className="text-lg font-black text-[#FFE600] font-mono">₹{totalPendingAmount}.00</span>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 font-black text-xs border border-purple-500/30">
                {pendingCount} Pending
              </span>
            </div>
          </div>

          {/* Winner Payout Cards */}
          {winnerPayouts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
              <h5 className="font-bold text-white text-sm">No Pending Payouts</h5>
              <p className="text-xs text-slate-400">All winner rewards have been cleared or no matches have completed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {winnerPayouts.map((w) => (
                <div
                  key={w.id}
                  className={`p-4 rounded-2xl border space-y-3 shadow-md transition ${
                    w.status === 'PAID'
                      ? 'bg-slate-950 border-slate-800 opacity-60'
                      : 'bg-slate-900 border-zinc-700 hover:border-[#FFE600]/40'
                  }`}
                >
                  {/* Top Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                          w.rank === 1
                            ? 'bg-[#FFE600] text-black shadow-glow-yellow-sm'
                            : w.rank === 2 || w.rank === 3
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {w.rank === 1 ? '🏆 1ST BOOYAH' : w.rank === 2 ? '🥈 2ND PLACE' : w.rank === 3 ? '🥉 3RD PLACE' : `#${w.rank} FRAGGER`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{w.timestamp}</span>
                      </div>

                      <h5 className="font-black text-base text-white">{w.playerName}</h5>
                      <div className="text-xs font-mono text-[#FFE600] font-bold">
                        IGN: {w.gameName} • UID: {w.gameUid}
                      </div>
                    </div>

                    {/* Calculated Prize Pill */}
                    <div className="text-right">
                      <span className="text-xl font-black text-[#FFE600] font-mono block">₹{w.prizeAmount}.00</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {w.kills} Kills (₹{w.kills * 10}) {w.rank === 1 ? '+ ₹20' : w.rank <= 3 ? '+ ₹15' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Player's UPI Details Box */}
                  <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase block">PLAYER'S RECEIVING UPI ID</span>
                      <span className="font-mono text-xs font-bold text-white select-all block truncate">{w.upiId}</span>
                    </div>
                    <button
                      onClick={() => handleCopyUpi(w.id, w.upiId)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-300 flex items-center gap-1 shrink-0"
                    >
                      {copiedId === w.id ? <Check className="w-3 h-3 text-[#FFE600]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === w.id ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  {w.status === 'PENDING' ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePayViaUpi(w)}
                        className="flex-1 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-glow-yellow-sm active:scale-95 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>⚡ Pay ₹{w.prizeAmount} via GPay/PhonePe</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(w.id, w)}
                        className="px-3.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark Paid</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      <span>✓ ₹{w.prizeAmount} Transferred via UPI & Player Notified</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FRAUD TAB: Anti-Cheat Sentinel ── */}
      {activeTab === 'FRAUD' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-sm text-white">AUTOMATED FRAUD & SUSPICIOUS PLAYERS LIST</h4>
            <p className="text-xs text-slate-400">Review accounts flagged by the platform anti-cheat engine.</p>
          </div>

          {fraudAlerts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-green-400 mx-auto" />
              <h5 className="font-bold text-white text-sm">Sentinel Active & Clean</h5>
              <p className="text-xs text-slate-400">No suspicious activities, duplicate UIDs, or emulator flags detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fraudAlerts.map((fa) => (
                <div key={fa.id} className="p-4 rounded-2xl bg-slate-900 border border-red-500/30 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                        {fa.severity} SEVERITY
                      </span>
                      <h5 className="font-bold text-xs text-white">{fa.title}</h5>
                    </div>
                    <p className="text-xs text-slate-400">{fa.details}</p>
                    <span className="text-[10px] font-mono text-slate-500 block">{fa.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        tapFeedback();
                        alert('Player account temporarily suspended from joining tournaments.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
                    >
                      Ban Player
                    </button>
                    <button
                      onClick={() => {
                        tapFeedback();
                        setFraudAlerts((prev) => prev.filter((a) => a.id !== fa.id));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
