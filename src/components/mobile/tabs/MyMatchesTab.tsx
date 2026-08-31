import React, { useState } from 'react';
import {
  Gamepad2,
  Key,
  Copy,
  Check,
  Upload,
  Lock,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Tournament, Match } from '../../../types';
import { tapFeedback } from '../../../services/soundService';

interface MyMatchesTabProps {
  onSelectTournament: (t: Tournament) => void;
  onOpenSubmitResult: (m: Match) => void;
  onNavigateToTourneys: () => void;
}

export const MyMatchesTab: React.FC<MyMatchesTabProps> = ({
  onSelectTournament,
  onOpenSubmitResult,
  onNavigateToTourneys,
}) => {
  const { currentUser, tournaments, registrations, matches } = useApp();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldKey: string) => {
    tapFeedback();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Find all tournaments user is registered for
  const userRegistrations = registrations.filter(
    (r) => r.userId === currentUser.id || (currentUser.teamId && r.teamId === currentUser.teamId)
  );

  const registeredTournamentIds = new Set(userRegistrations.map((r) => r.tournamentId));
  const myTournaments = tournaments.filter((t) => registeredTournamentIds.has(t.id));

  // Find next open tournament of same mode for quick re-join
  const getNextMatch = (t: Tournament) => {
    return tournaments.find(
      (ot) =>
        ot.id !== t.id &&
        !registeredTournamentIds.has(ot.id) &&
        (ot as any).matchMode === (t as any).matchMode &&
        ot.status === 'Registration Open'
    ) || tournaments.find((ot) => ot.id !== t.id && ot.status === 'Registration Open');
  };


  return (
    <div className="space-y-3.5 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="font-display font-black text-xs text-white uppercase tracking-wider">MY JOINED MATCHES</h3>
          <span className="text-[10px] text-zinc-500">
            {myTournaments.length} Registered Tournament{myTournaments.length === 1 ? '' : 's'}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-[#FFE600]">
          UID: {currentUser.gamerProfile?.gameUid || 'Not Set'}
        </span>
      </div>

      {myTournaments.length === 0 ? (
        <div className="text-center py-12 bg-[#0E0E12] rounded-2xl border border-zinc-800/80 p-6 space-y-3 shadow-card-dark">
          <Gamepad2 className="w-10 h-10 mx-auto text-zinc-600 opacity-60" />
          <h4 className="font-bold text-xs text-white uppercase">No Joined Tournaments</h4>
          <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Join any 48-player tournament with ₹15 entry fee to receive your slot number and unlock its Custom Room ID & Password.
          </p>
          <button
            onClick={onNavigateToTourneys}
            className="px-4 py-2 rounded-xl bg-[#FFE600] text-black font-black text-[10px] tracking-wider uppercase transition active:scale-95 inline-block mt-1 shadow-glow-yellow-sm"
          >
            EXPLORE 48P TOURNAMENTS →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myTournaments.map((t) => {
            const reg = userRegistrations.find((r) => r.tournamentId === t.id);
            const tourneyMatch = matches.find((m) => m.tournamentId === t.id) || matches[0];
            const roomId = t.roomId || tourneyMatch?.roomId;
            const roomPassword = t.roomPassword || tourneyMatch?.roomPassword;
            const isRoomUnlocked = Boolean(roomId || tourneyMatch?.isRoomReleased || t.currentParticipants >= (t.maxParticipants || 48));

            return (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 space-y-3 shadow-card-dark"
              >
                {/* Header & Slot Number */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.bannerUrl}
                      alt={t.name}
                      className="w-12 h-12 rounded-xl object-cover border border-zinc-800"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white">{t.name}</h4>
                      <p className="text-[10px] text-zinc-400">
                        Map: {t.map} • Format: {t.format} • Paid ₹{t.entryFee} Entry
                      </p>
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/30 text-center shrink-0">
                    <span className="text-[8px] font-black uppercase text-[#FFE600] block">YOUR SLOT</span>
                    <span className="text-sm font-mono font-black text-white">#{reg?.slotNumber || 1}</span>
                  </div>
                </div>

                {/* Specific Custom Room Credentials Box */}
                <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300 flex items-center gap-1.5 text-[10px] uppercase">
                      <Key className="w-3 h-3 text-[#FFE600]" />
                      CUSTOM ROOM CREDENTIALS
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      isRoomUnlocked
                        ? 'bg-[#FFE600]/20 text-[#FFE600] border border-[#FFE600]/40'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {isRoomUnlocked ? '● ROOM UNLOCKED' : `WAITING FOR 48 PLAYERS (${t.currentParticipants}/48)`}
                    </span>
                  </div>
                                {isRoomUnlocked ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="p-2 rounded-lg bg-[#0E0E12] border border-zinc-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[8px] text-zinc-500 block uppercase font-bold">Custom Room ID</span>
                          <span className="font-mono font-bold text-white tracking-wider text-sm">
                            {roomId || '8391047'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(roomId || '8391047', `room-${t.id}`)}
                          className="px-2.5 py-1 rounded-md bg-[#FFE600]/10 hover:bg-[#FFE600]/20 text-[#FFE600] font-black text-[9px] flex items-center gap-1 border border-[#FFE600]/30 active:scale-95 transition"
                        >
                          {copiedField === `room-${t.id}` ? <Check className="w-3 h-3 text-[#FFE600]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === `room-${t.id}` ? '✓ COPIED' : 'COPY ID'}</span>
                        </button>
                      </div>

                      <div className="p-2 rounded-lg bg-[#0E0E12] border border-zinc-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[8px] text-zinc-500 block uppercase font-bold">Room Password</span>
                          <span className="font-mono font-bold text-[#FFE600] tracking-wider text-sm">
                            {roomPassword || 'arenaff2026'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(roomPassword || 'arenaff2026', `pass-${t.id}`)}
                          className="px-2.5 py-1 rounded-md bg-[#FFE600]/10 hover:bg-[#FFE600]/20 text-[#FFE600] font-black text-[9px] flex items-center gap-1 border border-[#FFE600]/30 active:scale-95 transition"
                        >
                          {copiedField === `pass-${t.id}` ? <Check className="w-3 h-3 text-[#FFE600]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === `pass-${t.id}` ? '✓ COPIED' : 'COPY PASS'}</span>
                        </button>
                      </div>

                      <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[9px] text-purple-200">
                        ⚡ Enter Room ID & Password in Free Fire MAX → Custom Room to join slot #{reg?.slotNumber || 1}!
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-xs text-zinc-400 space-y-1">
                      <Lock className="w-5 h-5 text-[#FFE600] mx-auto opacity-70" />
                      <p className="text-[10px] text-zinc-400">Admin will release Custom Room ID & Password before match start.</p>
                    </div>
                  )}
                </div>

                {/* Submit Result Trigger */}
                <button
                  onClick={() => { tapFeedback(); onOpenSubmitResult(tourneyMatch); }}
                  className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-[11px] flex items-center justify-center gap-2 border border-zinc-800 transition active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5 text-[#FFE600]" />
                  <span>Submit Kills for this Match (AI OCR)</span>
                </button>

                {/* Quick Re-join: next open tournament of same mode */}
                {(() => {
                  const next = getNextMatch(t);
                  if (!next) return null;
                  return (
                    <button
                      onClick={() => { tapFeedback(); onSelectTournament(next); }}
                      className="w-full py-2 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] font-black text-[10px] flex items-center justify-center gap-2 transition active:scale-95 hover:bg-[#FFE600]/20"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>JOIN NEXT {(t as any).matchMode || 'SOLO'} MATCH →</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
