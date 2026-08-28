import React, { useState } from 'react';
import { X, Trophy, Sparkles, CheckCircle2, Award, Swords, ChevronRight, Wallet } from 'lucide-react';
import { Match, MatchResult } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { ReceiptModal } from './ReceiptModal';
import { tapFeedback, successFeedback, booyahFeedback } from '../../../services/soundService';

interface MatchSubmissionModalProps {
  match: Match;
  onClose: () => void;
}

export const MatchSubmissionModal: React.FC<MatchSubmissionModalProps> = ({ match, onClose }) => {
  const { submitMatchResult, currentUser } = useApp();
  const [kills, setKills] = useState<number>(5);
  const [placement, setPlacement] = useState<number>(1);
  const [playerUpi, setPlayerUpi] = useState<string>(() => localStorage.getItem('ff_player_upi') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<MatchResult | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Exact prize rules: ₹10/kill + ₹20 extra for 1st (Booyah) + ₹15 extra for 2nd & 3rd
  const killPrize = kills * 10;
  const placementBonus = placement === 1 ? 20 : (placement === 2 || placement === 3) ? 15 : 0;
  const totalWon = killPrize + placementBonus;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();

    if (playerUpi.trim()) {
      localStorage.setItem('ff_player_upi', playerUpi.trim());
    }

    setIsSubmitting(true);

    try {
      const res = await submitMatchResult({
        matchId: match.id,
        tournamentId: match.tournamentId,
        kills: Number(kills),
        placement: Number(placement),
        screenshotUrl: playerUpi.trim() || '',
      });

      setSubmittedResult(res);
      if (placement === 1) {
        booyahFeedback();
      } else {
        successFeedback();
      }
      setShowReceipt(true);
    } catch (err) {
      console.error('Result submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show receipt modal after success
  if (showReceipt && submittedResult) {
    return (
      <ReceiptModal
        playerName={currentUser.displayName}
        gameName={currentUser.gamerProfile?.gameName || 'VORTEX_REX'}
        kills={submittedResult.kills}
        placement={submittedResult.placement}
        tournamentName={match.title}
        onClose={() => { onClose(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E0E12] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-in-up sm:animate-scale-up">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-[#08080A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FFE600]" />
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">
              CLAIM MATCH PRIZE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Match info banner */}
            <div className="p-3 rounded-2xl bg-[#050507] border border-zinc-800 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-zinc-500 uppercase block">MATCH</span>
                <span className="text-xs font-black text-white truncate block">{match.title}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-zinc-500 uppercase block">BOUNTY</span>
                <span className="text-xs font-mono font-black text-[#FFE600]">₹10 / Kill</span>
              </div>
            </div>

            {/* Placement Rank Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>PLACEMENT RANK (1–48)</span>
                {placement === 1 && <span className="text-[#FFE600] font-black flex items-center gap-1">🏆 BOOYAH (+₹20 BONUS)</span>}
                {(placement === 2 || placement === 3) && <span className="text-amber-400 font-bold">🥈 PODIUM (+₹15 BONUS)</span>}
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { tapFeedback(); setPlacement((p) => Math.max(1, p - 1)); }}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold text-white active:scale-95 flex items-center justify-center shrink-0"
                >
                  -
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={placement}
                    onChange={(e) => {
                      tapFeedback();
                      const val = Number(e.target.value);
                      setPlacement(Math.max(1, Math.min(48, val || 1)));
                    }}
                    className="w-full bg-[#050507] border border-zinc-800 rounded-xl py-2.5 px-3 text-center text-lg text-[#FFE600] font-mono font-black focus:outline-none focus:border-[#FFE600]"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">#</span>
                </div>
                <button
                  type="button"
                  onClick={() => { tapFeedback(); setPlacement((p) => Math.min(48, p + 1)); }}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold text-white active:scale-95 flex items-center justify-center shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Kills Count Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>TOTAL KILLS ({kills} × ₹10)</span>
                <span className="text-[#FFE600] font-mono font-bold">₹{killPrize}</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { tapFeedback(); setKills((k) => Math.max(0, k - 1)); }}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold text-white active:scale-95 flex items-center justify-center shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="47"
                  value={kills}
                  onChange={(e) => {
                    tapFeedback();
                    const val = Number(e.target.value);
                    setKills(Math.max(0, Math.min(47, val || 0)));
                  }}
                  className="flex-1 bg-[#050507] border border-zinc-800 rounded-xl py-2.5 px-3 text-center text-lg text-white font-mono font-black focus:outline-none focus:border-[#FFE600]"
                  required
                />
                <button
                  type="button"
                  onClick={() => { tapFeedback(); setKills((k) => Math.min(47, k + 1)); }}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold text-white active:scale-95 flex items-center justify-center shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Player's Receiving UPI ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                YOUR RECEIVING UPI ID (FOR DIRECT MONEY TRANSFER)
              </label>
              <div className="flex items-center gap-2 bg-[#050507] border border-zinc-800 rounded-xl px-3 py-2.5 focus-within:border-[#FFE600] transition">
                <Wallet className="w-4 h-4 text-[#FFE600] shrink-0" />
                <input
                  type="text"
                  value={playerUpi}
                  onChange={(e) => {
                    setPlayerUpi(e.target.value);
                    localStorage.setItem('ff_player_upi', e.target.value);
                  }}
                  placeholder="e.g. 9876543210@paytm or name@okaxis"
                  className="w-full bg-transparent text-xs text-white font-mono font-bold focus:outline-none placeholder:text-zinc-600"
                  required
                />
              </div>
              <span className="text-[9px] text-zinc-500 block">
                ⚡ Admin sends your ₹{totalWon} prize directly to this UPI ID.
              </span>
            </div>

            {/* Live Cash Reward Preview Card */}
            <div className="p-3.5 rounded-2xl bg-[#050507] border border-[#FFE600]/30 space-y-2 shadow-glow-yellow-sm">
              <span className="text-[9px] font-black uppercase text-[#FFE600] tracking-wider block">
                INSTANT REWARD BREAKDOWN
              </span>
              
              <div className="text-xs text-zinc-300 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-sans">Kill Bounty ({kills} × ₹10):</span>
                  <span className="font-bold text-white">₹{killPrize}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-sans">Placement Bonus:</span>
                  <span className="font-bold text-[#FFE600]">
                    {placementBonus > 0 ? `+₹${placementBonus}.00` : '₹0.00'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-sans font-black">
                  <span className="text-white">TOTAL PAYOUT:</span>
                  <span className="font-mono text-[#FFE600]">₹{totalWon}.00</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !playerUpi.trim()}
              className="w-full py-3 rounded-2xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-xs tracking-wider uppercase shadow-glow-yellow transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? 'Sending Request...' : `CLAIM ₹${totalWon} WINNINGS NOW`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
