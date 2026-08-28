import React, { useState } from 'react';
import {
  X,
  Trophy,
  ShieldCheck,
  Zap,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Gamepad2,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Tournament } from '../../../types';
import { tapFeedback, successFeedback } from '../../../services/soundService';

interface TournamentInstructionsModalProps {
  tournament: Tournament;
  onConfirm: () => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export const TournamentInstructionsModal: React.FC<TournamentInstructionsModalProps> = ({
  tournament,
  onConfirm,
  onClose,
  isProcessing = false,
}) => {
  const [agreed, setAgreed] = useState(true);

  const entryFee = tournament.entryFee || 15;
  const perKill = tournament.perKillReward || 10;

  const handleProceed = () => {
    tapFeedback();
    if (!agreed) return;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E0E12] border border-[#FFE600]/40 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-in-up sm:animate-scale-up">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-[#08080A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center text-[#FFE600]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs text-white uppercase tracking-wider">
                MATCH RULES & HOW YOU GET PAID
              </h3>
              <p className="text-[9px] text-zinc-400">Read carefully before paying entry fee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* Tournament Overview Pill */}
          <div className="p-3 rounded-2xl bg-[#050507] border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black text-[#FFE600] uppercase block">{tournament.map} • 48 SLOTS</span>
              <h4 className="font-black text-sm text-white">{tournament.name}</h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-zinc-500 uppercase block">ENTRY FEE</span>
              <span className="text-sm font-mono font-black text-[#FFE600]">₹{entryFee}.00</span>
            </div>
          </div>

          {/* 4 Steps: How Match & Payments Work */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block px-1">
              HOW THE TOURNAMENT & PAYOUTS WORK:
            </span>

            {/* Step 1: Room Unlock */}
            <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-black text-white shrink-0">
                1
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="font-bold text-white block">Custom Room ID & Password</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  When 48/48 players join or the host starts the match, the Free Fire Room ID and Password will automatically unlock on your screen with an audio alert.
                </p>
              </div>
            </div>

            {/* Step 2: Battle */}
            <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-black text-white shrink-0">
                2
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="font-bold text-white block">Play in Free Fire MAX</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Join the custom room with your registered Free Fire IGN & UID. Play fairly—emulators & cheats are strictly banned!
                </p>
              </div>
            </div>

            {/* Step 3: Prize Formula */}
            <div className="p-3 rounded-xl bg-[#FFE600]/5 border border-[#FFE600]/30 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#FFE600] flex items-center justify-center text-xs font-black text-black shrink-0">
                3
              </div>
              <div className="space-y-1 min-w-0">
                <span className="font-black text-[#FFE600] block">Official Prize Calculation</span>
                <div className="space-y-1 text-[11px] text-zinc-300 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans text-zinc-400">🎯 Each Kill:</span>
                    <strong className="text-white">₹{perKill} / kill</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-zinc-400">🏆 1st Place (Booyah):</span>
                    <strong className="text-[#FFE600]">+₹20 Bonus</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-zinc-400">🥈 2nd & 3rd Place:</span>
                    <strong className="text-amber-400">+₹15 Bonus</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Instant UPI Payout */}
            <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/40 flex items-center justify-center text-xs font-black text-green-400 shrink-0">
                4
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="font-bold text-white block">Submit Score → Receive Money via UPI</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  After match ends, tap <strong className="text-white">"Submit Score"</strong>, enter your kills, rank, and <strong className="text-[#FFE600]">Receiving UPI ID</strong> (GPay/PhonePe/Paytm). Admin transfers your winnings straight to your bank!
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => { tapFeedback(); setAgreed(e.target.checked); }}
              className="w-4 h-4 rounded text-[#FFE600] focus:ring-0 accent-[#FFE600]"
            />
            <span className="text-[11px] text-zinc-300 font-bold">
              I understand the tournament rules and direct UPI prize payout process.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#08080A] border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleProceed}
            disabled={!agreed || isProcessing}
            className="flex-1 py-3 rounded-xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-xs tracking-wider uppercase shadow-glow-yellow transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <span>{isProcessing ? 'Confirming Slot...' : `CONFIRM & PAY ₹${entryFee}`}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
