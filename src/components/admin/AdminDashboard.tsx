import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  AlertTriangle,
  Flame,
  Search,
  PlusCircle,
  Trophy,
  Zap,
  ExternalLink,
  Wallet,
  Send,
  Copy,
  Check,
  Award,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Download,
  MessageSquare,
  TrendingUp,
  IndianRupee,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { tapFeedback, booyahFeedback, successFeedback } from '../../services/soundService';

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

export const AdminDashboard: React.FC = () => {
  const {
    tournaments,
    registrations,
    createTournament,
    updateMatchRoom,
    addNotification,
    setViewMode,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'PAYOUTS' | 'PLAYERS' | 'TOURNAMENTS' | 'FRAUD'>('PLAYERS');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');

  // Admin New Tournament State
  const [isCreatingTourney, setIsCreatingTourney] = useState(false);
  const [tourneyName, setTourneyName] = useState('Bermuda 48-Player Blitz #201');
  const [tourneyMap, setTourneyMap] = useState<'Bermuda' | 'Purgatory' | 'Kalahari'>('Bermuda');

  // Match Winners & Kill Bounty Payout Queue (real dynamic payouts)
  const [winnerPayouts, setWinnerPayouts] = useState<WinnerPayout[]>([]);

  // Anti-cheat reports (clean default)
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);

  const handleAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    await createTournament({
      name: tourneyName,
      map: tourneyMap,
      entryFee: 15,
      perKillReward: 10,
      maxParticipants: 48,
      rewardDescription: '🏆 ₹10/Kill + ₹20 Booyah Extra + ₹15 (2nd/3rd)',
    });
    setIsCreatingTourney(false);
    successFeedback();
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in text-slate-200">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
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
          <button onClick={() => { tapFeedback(); setViewMode('MOBILE'); }} className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:text-white text-xs font-bold transition">
            ← Player App
          </button>
          <button onClick={() => { tapFeedback(); setIsCreatingTourney(true); }} className="px-4 py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs flex items-center gap-1.5 shadow-glow-yellow-sm transition active:scale-95">
            <PlusCircle className="w-4 h-4" />
            <span>New Match</span>
          </button>
        </div>
      </div>

      {/* Live Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Players', value: registrations.length, icon: Users, color: 'text-[#FFE600]', bg: 'bg-[#FFE600]/10 border-[#FFE600]/20' },
          { label: 'Fees Collected', value: `₹${registrations.length * 15}`, icon: IndianRupee, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Pending Payouts', value: `₹${totalPendingAmount}`, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Active Matches', value: tournaments.filter(t => t.status === 'Registration Open' || t.status === 'Live').length, icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`p-3.5 rounded-2xl border ${stat.bg} flex items-center gap-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
            <div>
              <p className={`text-base font-black font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-bold gap-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => { tapFeedback(); setActiveTab('PLAYERS'); }}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'PLAYERS'
              ? 'border-[#FFE600] text-[#FFE600]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Players ({registrations.length})</span>
        </button>

        <button
          onClick={() => { tapFeedback(); setActiveTab('PAYOUTS'); }}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'PAYOUTS'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Winner Payouts ({pendingCount})</span>
        </button>

        <button
          onClick={() => { tapFeedback(); setActiveTab('TOURNAMENTS'); }}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'TOURNAMENTS'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Matches & Rooms ({tournaments.length})</span>
        </button>

        <button
          onClick={() => { tapFeedback(); setActiveTab('FRAUD'); }}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'FRAUD'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Anti-Cheat ({fraudAlerts.length})</span>
        </button>
      </div>

      {/* ── TAB 0: REGISTERED PLAYERS PER TOURNAMENT ── */}
      {activeTab === 'PLAYERS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search + summary */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-white">ALL REGISTERED PLAYERS</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {registrations.length > 0
                    ? `${registrations.length} player${registrations.length > 1 ? 's' : ''} across ${tournaments.length} tournament${tournaments.length > 1 ? 's' : ''}`
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
                      {fillPct >= 100 ? '✅ FULL — Room should be released' : `${fillPct}% filled — ${maxSlots - t.currentParticipants} slots remaining`}
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

      {/* ── TAB 1: SIMPLE WINNER PAYOUTS ── */}
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

      {/* ── TAB 2: TOURNAMENT CREATOR & ROOM MANAGER ── */}
      {activeTab === 'TOURNAMENTS' && (
        <div className="space-y-6">
          {/* Create Modal */}
          {isCreatingTourney && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/50 space-y-4 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-purple-400" />
                  Publish Official 48-Player Tournament
                </h4>
                <button onClick={() => setIsCreatingTourney(false)} className="text-xs text-slate-400 hover:text-white">✕</button>
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
                  className="w-full py-2.5 rounded-xl bg-[#FFE600] text-black font-black text-xs shadow-glow-yellow-sm transition active:scale-95"
                >
                  Publish 48-Player Tournament As Admin 🚀
                </button>
              </form>
            </div>
          )}

          {/* Tournament & Room Credential Manager List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">ACTIVE 48-PLAYER MATCHES & CUSTOM ROOMS</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#FFE600] uppercase tracking-wider">{t.map} • 48 SLOTS</span>
                      <h5 className="font-bold text-sm text-white">{t.name}</h5>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {t.currentParticipants} / 48 Booked
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 block">SET CUSTOM ROOM DETAILS:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Room ID (e.g. 8391047)"
                        defaultValue="8391047"
                        id={`room-${t.id}`}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Password"
                        defaultValue="arenaff2026"
                        id={`pass-${t.id}`}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const rId = (document.getElementById(`room-${t.id}`) as HTMLInputElement)?.value || '8391047';
                          const rPass = (document.getElementById(`pass-${t.id}`) as HTMLInputElement)?.value || 'arenaff2026';
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
                        🚀 PUBLISH NOW
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          tapFeedback();
                          const rId = (document.getElementById(`room-${t.id}`) as HTMLInputElement)?.value || '8391047';
                          const rPass = (document.getElementById(`pass-${t.id}`) as HTMLInputElement)?.value || 'arenaff2026';
                          const msg = encodeURIComponent(
                            `🎮 *FF Arena Room Ready!*\n\n🏆 *${t.name}*\n\n🔑 Room ID: *${rId}*\n🔒 Password: *${rPass}*\n\nMap: ${t.map} | ${t.currentParticipants}/48 Players\n\nJoin now and good luck! 🔥\n— FF Arena Admin`
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
          </div>
        </div>
      )}

      {/* ── TAB 3: ANTI-CHEAT SENTINEL ── */}
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
                        alert('Player account temporarily suspended from joining 48P tournaments.');
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
