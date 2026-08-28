import React, { useState } from 'react';
import {
  X,
  Key,
  Copy,
  Check,
  Lock,
  Upload,
  CreditCard,
  Zap,
  Trophy,
  Users,
} from 'lucide-react';
import { Tournament, Match } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { TournamentInstructionsModal } from './TournamentInstructionsModal';

interface TournamentDetailModalProps {
  tournament: Tournament;
  onClose: () => void;
  onOpenSubmitResult?: (match: Match) => void;
}

export const TournamentDetailModal: React.FC<TournamentDetailModalProps> = ({
  tournament,
  onClose,
  onOpenSubmitResult,
}) => {
  const {
    currentUser,
    registrations,
    payTournamentEntry,
    matches,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ROOM' | 'SCORING' | 'RULES' | 'PARTICIPANTS'>('OVERVIEW');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const tourneyMatches = matches.filter((m: any) => m.tournamentId === tournament.id);
  const activeMatch = tourneyMatches[0] || tournament.matches?.[0];

  const userRegistration = registrations.find(
    (r: any) => r.tournamentId === tournament.id && (r.userId === currentUser.id || (currentUser.teamId && r.teamId === currentUser.teamId))
  );
  const isRegistered = !!userRegistration;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmRegistration = async () => {
    setIsRegistering(true);
    const res = await payTournamentEntry(tournament.id);
    setIsRegistering(false);
    setShowInstructions(false);
    if (!res.success) {
      alert(res.message);
    } else {
      if (activeMatch?.isRoomReleased) {
        setActiveTab('ROOM');
      }
    }
  };

  const maxSlots = tournament.maxParticipants || 48;
  const entryFee = tournament.entryFee || 15;
  const perKill = tournament.perKillReward || 10;
  const safeBalance = currentUser.walletBalance ?? 125;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E0E12] border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up">
        
        {/* Banner & Header */}
        <div className="relative h-40 sm:h-48 w-full overflow-hidden shrink-0">
          <img
            src={tournament.bannerUrl}
            alt={tournament.name}
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 border border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-[#FFE600] text-black">
              ₹{entryFee} ENTRY
            </span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/80 text-white border border-zinc-700">
              ₹{perKill} / KILL
            </span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/80 text-[#FFE600] border border-zinc-700">
              +₹20 BOOYAH
            </span>
          </div>

          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-display font-black text-lg sm:text-xl text-white leading-tight">
              {tournament.name}
            </h2>
            <span className="text-[10px] font-mono text-zinc-400">
              Map: {tournament.map} • 48 Max Players
            </span>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-zinc-800 bg-[#08080A] px-3 text-xs font-bold shrink-0 overflow-x-auto scrollbar-none">
          {(['OVERVIEW', 'ROOM', 'SCORING', 'RULES', 'PARTICIPANTS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 whitespace-nowrap border-b-2 text-[10px] font-black tracking-wider transition ${
                activeTab === tab
                  ? 'border-[#FFE600] text-[#FFE600]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'OVERVIEW' ? 'OVERVIEW' : tab === 'ROOM' ? 'CUSTOM ROOM' : tab === 'SCORING' ? 'PRIZES' : tab === 'RULES' ? 'RULES' : `48 SLOTS (${tournament.currentParticipants}/48)`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-3">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#050507] p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-[8px] font-bold text-zinc-500 block uppercase">Entry Fee</span>
                  <span className="text-sm font-black text-[#FFE600] font-mono mt-0.5 block">₹{entryFee}</span>
                </div>
                <div className="bg-[#050507] p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-[8px] font-bold text-zinc-500 block uppercase">Per Kill</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">₹{perKill}</span>
                </div>
                <div className="bg-[#050507] p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-[8px] font-bold text-zinc-500 block uppercase">Booyah Bonus</span>
                  <span className="text-sm font-black text-[#FFE600] font-mono mt-0.5 block">+₹20</span>
                </div>
                <div className="bg-[#050507] p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-[8px] font-bold text-zinc-500 block uppercase">Slots</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">{tournament.currentParticipants}/48</span>
                </div>
              </div>

              {/* Slot Progress */}
              <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[10px] text-zinc-400 font-bold">48-Player Slot Fill</span>
                  <span className="text-[10px] text-[#FFE600] font-mono font-bold">
                    {Math.round((tournament.currentParticipants / maxSlots) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-[#FFE600] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (tournament.currentParticipants / maxSlots) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Prize table */}
              <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800 space-y-1.5">
                <span className="text-[9px] font-black uppercase text-[#FFE600] block">EXACT REWARD CALCULATION</span>
                <div className="text-[11px] text-zinc-300 space-y-1">
                  <div className="flex justify-between py-1 border-b border-zinc-800/80">
                    <span>🥇 1st Place (Booyah)</span>
                    <span className="font-mono font-bold text-[#FFE600]">₹10/Kill + ₹20 Extra</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/80">
                    <span>🥈 2nd Place</span>
                    <span className="font-mono font-bold text-white">₹10/Kill + ₹15 Extra</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/80">
                    <span>🥉 3rd Place</span>
                    <span className="font-mono font-bold text-white">₹10/Kill + ₹15 Extra</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>⚔️ 4th - 48th Placements</span>
                    <span className="font-mono font-bold text-zinc-400">₹10/Kill Only</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ROOM' && (
            <div className="p-4 rounded-xl bg-[#050507] border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white uppercase flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#FFE600]" />
                  CUSTOM ROOM DETAILS
                </span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                  activeMatch?.isRoomReleased
                    ? 'bg-[#FFE600]/20 text-[#FFE600] border border-[#FFE600]/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {activeMatch?.isRoomReleased ? '● ROOM UNLOCKED' : '🔒 WAITING FOR 48 PLAYERS'}
                </span>
              </div>

              {activeMatch?.isRoomReleased ? (
                <div className="space-y-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">Room ID</span>
                      <span className="font-mono font-bold text-white tracking-wider">{activeMatch.roomId}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(activeMatch.roomId || '8391047', 'room_id')}
                      className="px-2.5 py-1 rounded-md bg-[#FFE600]/10 text-[#FFE600] font-black text-[9px] border border-[#FFE600]/30"
                    >
                      {copiedField === 'room_id' ? 'COPIED' : 'COPY ID'}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">Password</span>
                      <span className="font-mono font-bold text-[#FFE600] tracking-wider">{activeMatch.roomPassword}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(activeMatch.roomPassword || 'arenaff2026', 'password')}
                      className="px-2.5 py-1 rounded-md bg-[#FFE600]/10 text-[#FFE600] font-black text-[9px] border border-[#FFE600]/30"
                    >
                      {copiedField === 'password' ? 'COPIED' : 'COPY PASS'}
                    </button>
                  </div>

                  {onOpenSubmitResult && activeMatch && (
                    <button
                      onClick={() => onOpenSubmitResult(activeMatch)}
                      className="w-full mt-2 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-[#FFE600]" />
                      <span>Submit Match Result (AI OCR)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-zinc-400">
                  <Lock className="w-6 h-6 text-[#FFE600] mx-auto mb-1 opacity-80" />
                  Credentials will unlock automatically when 48 players join.
                </div>
              )}
            </div>
          )}

          {activeTab === 'SCORING' && (
            <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
              <h4 className="font-bold text-[#FFE600] text-[10px] uppercase">Winnings Formula</h4>
              <p>• <strong>Total Cash Won</strong> = (Kills × ₹10) + Placement Bonus</p>
              <p>• 🥇 1st (Booyah): +₹20 Extra</p>
              <p>• 🥈 2nd & 🥉 3rd: +₹15 Extra</p>
              <p>• ⚔️ 4th - 48th: ₹10/kill bounty only</p>
            </div>
          )}

          {activeTab === 'RULES' && (
            <div className="space-y-2">
              {tournament.rules.map((rule, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#050507] border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#FFE600] text-black font-black text-[9px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PARTICIPANTS' && (
            <div className="space-y-2">
              {registrations
                .filter((r: any) => r.tournamentId === tournament.id)
                .map((reg: any, idx: number) => (
                  <div key={reg.id} className="p-2.5 rounded-xl bg-[#050507] border border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-500">#{reg.slotNumber || idx + 1}</span>
                      <span className="font-bold text-white">{reg.playerName}</span>
                    </div>
                    <span className="text-[9px] font-bold text-[#FFE600]">SLOT CONFIRMED</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-3.5 bg-[#08080A] border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {isRegistered ? (
              <span className="text-[#FFE600] font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Slot #{userRegistration?.slotNumber || 14}/48 Confirmed
              </span>
            ) : (
              <span>Balance: <strong className="text-[#FFE600] font-mono">₹{safeBalance.toFixed(0)}</strong></span>
            )}
          </div>

          {!isRegistered ? (
            <button
              onClick={() => setShowInstructions(true)}
              disabled={isRegistering || tournament.currentParticipants >= maxSlots}
              className="px-5 py-2 rounded-xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-xs tracking-wider uppercase transition active:scale-95 shadow-glow-yellow-sm"
            >
              {isRegistering ? 'Processing...' : `PAY ₹${entryFee} & JOIN`}
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('ROOM')}
              className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs"
            >
              VIEW ROOM CREDENTIALS
            </button>
          )}
        </div>
      </div>

      {/* Instructions & Payout Explanation Modal */}
      {showInstructions && (
        <TournamentInstructionsModal
          tournament={tournament}
          isProcessing={isRegistering}
          onConfirm={handleConfirmRegistration}
          onClose={() => setShowInstructions(false)}
        />
      )}
    </div>
  );
};
