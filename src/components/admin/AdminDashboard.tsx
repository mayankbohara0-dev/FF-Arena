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
  ArrowUpRight,
  ExternalLink,
  DollarSign,
  Wallet,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { tapFeedback, booyahFeedback, successFeedback } from '../../services/soundService';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    tournaments,
    createTournament,
    updateMatchRoom,
    matches,
    walletTransactions,
    addNotification,
    setViewMode,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'TOURNAMENTS' | 'PAYOUTS' | 'FRAUD'>('TOURNAMENTS');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin New Tournament State
  const [isCreatingTourney, setIsCreatingTourney] = useState(false);
  const [tourneyName, setTourneyName] = useState('Bermuda 48-Player Blitz #201');
  const [tourneyMap, setTourneyMap] = useState<'Bermuda' | 'Purgatory' | 'Kalahari'>('Bermuda');
  const [roomIdInput, setRoomIdInput] = useState('9812401');
  const [roomPassInput, setRoomPassInput] = useState('adminff88');

  // Pending Player Payout Requests
  const [payouts, setPayouts] = useState([
    {
      id: 'po-1',
      playerName: 'Aman Sharma',
      gameName: 'VORTEX_REX',
      gameUid: '982347101',
      amount: 85,
      upiId: 'aman@okaxis',
      status: 'PENDING',
      timestamp: '15m ago',
      matchTitle: 'Bermuda 48P Flash Blitz',
    },
    {
      id: 'po-2',
      playerName: 'Rohit Kumar',
      gameName: 'SHADOW_SNIPER',
      gameUid: '871920391',
      amount: 45,
      upiId: 'rohit@ybl',
      status: 'PENDING',
      timestamp: '42m ago',
      matchTitle: 'Purgatory Duo Warfare',
    },
  ]);

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
  ]);

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

  // 1-Tap Pay Player via UPI (Opens Admin's GPay/PhonePe)
  const handlePayViaUpi = (payout: typeof payouts[0]) => {
    tapFeedback();
    const upiUri = `upi://pay?pa=${payout.upiId}&pn=${encodeURIComponent(payout.playerName)}&am=${payout.amount}&cu=INR&tn=${encodeURIComponent('FF Arena Winnings Payout')}`;
    window.location.href = upiUri;
  };

  const handleMarkPaid = (payoutId: string, payout: typeof payouts[0]) => {
    tapFeedback();
    setPayouts((prev) =>
      prev.map((p) => (p.id === payoutId ? { ...p, status: 'PAID' } : p))
    );
    successFeedback();
    addNotification(
      'Withdrawal Approved! 💸',
      `Admin approved and paid ₹${payout.amount} to your UPI ID ${payout.upiId}.`,
      'WALLET_CREDIT'
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in text-slate-200">
      {/* Admin Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
              🛡️ OFFICIAL ADMIN GOVERNANCE
            </span>
            <span className="text-slate-400 text-xs font-mono">Master Authority</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
            Admin Management & Payout Portal
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Create 48-player matches, broadcast room credentials, and process player winnings UPI payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { tapFeedback(); setViewMode('MOBILE'); }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:text-white text-xs font-bold transition"
          >
            ← Back to Player App
          </button>
          <button
            onClick={() => { tapFeedback(); setIsCreatingTourney(true); }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-glow-purple transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create 48P Match</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-bold gap-4">
        <button
          onClick={() => { tapFeedback(); setActiveTab('TOURNAMENTS'); }}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'TOURNAMENTS'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>48-Player Matches & Custom Rooms ({tournaments.length})</span>
        </button>

        <button
          onClick={() => { tapFeedback(); setActiveTab('PAYOUTS'); }}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'PAYOUTS'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Player Winnings & UPI Payouts ({payouts.filter((p) => p.status === 'PENDING').length})</span>
        </button>

        <button
          onClick={() => { tapFeedback(); setActiveTab('FRAUD'); }}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'FRAUD'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Anti-Cheat Sentinel ({fraudAlerts.length})</span>
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
                  Publish Official 48-Player Tournament
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider">{t.map} • 48 SLOTS</span>
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

                    <button
                      type="button"
                      onClick={() => {
                        const rId = (document.getElementById(`room-${t.id}`) as HTMLInputElement)?.value || '8391047';
                        const rPass = (document.getElementById(`pass-${t.id}`) as HTMLInputElement)?.value || 'arenaff2026';
                        updateMatchRoom(`match-${t.id}`, rId, rPass, new Date().toISOString(), true);
                        successFeedback();
                        alert(`Custom Room Credentials (ID: ${rId} | Pass: ${rPass}) broadcast to all 48 players!`);
                      }}
                      className="w-full py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs uppercase shadow-glow-yellow-sm transition active:scale-95"
                    >
                      🚀 PUBLISH ROOM CREDENTIALS NOW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYER WINNINGS & UPI PAYOUTS */}
      {activeTab === 'PAYOUTS' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-white">PLAYER WINNINGS WITHDRAWAL REQUESTS</h4>
              <p className="text-xs text-slate-400">
                Players earned prize money from kills (₹10/kill) and podium finishes. Transfer via UPI and mark paid.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs">
              {payouts.filter((p) => p.status === 'PENDING').length} Pending Requests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payouts.map((po) => (
              <div key={po.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-white">{po.playerName}</h5>
                    <span className="text-[10px] font-mono text-purple-400">IGN: {po.gameName} (UID: {po.gameUid})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#FFE600] font-mono">₹{po.amount}.00</span>
                    <span className={`text-[9px] font-bold block ${po.status === 'PAID' ? 'text-green-400' : 'text-amber-400'}`}>
                      {po.status === 'PAID' ? '✓ TRANSFERRED' : '⏳ PENDING'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">PLAYER'S RECEIVING UPI ID</span>
                    <span className="font-mono text-xs font-bold text-white select-all">{po.upiId}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(po.upiId);
                      tapFeedback();
                      alert(`Copied UPI ID: ${po.upiId}`);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
                  >
                    Copy
                  </button>
                </div>

                {po.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePayViaUpi(po)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>1-Tap Pay via GPay / PhonePe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(po.id, po)}
                      className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Paid</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-bold text-center">
                    ✓ Payout Completed & Player Notified
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ANTI-CHEAT SENTINEL */}
      {activeTab === 'FRAUD' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-sm text-white">AUTOMATED FRAUD & SUSPICIOUS PLAYERS LIST</h4>
            <p className="text-xs text-slate-400">Review suspicious accounts flagged by the platform anti-cheat engine.</p>
          </div>

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
        </div>
      )}
    </div>
  );
};
