import React, { useRef } from 'react';
import { X, Share2, Download, Trophy, Zap, Wallet } from 'lucide-react';
import { tapFeedback } from '../../../services/soundService';

interface ReceiptModalProps {
  playerName: string;
  gameName: string;
  kills: number;
  placement: number;
  tournamentName: string;
  matchDate?: string;
  onClose: () => void;
}

const PLACEMENT_EMOJI = (p: number) =>
  p === 1 ? '🥇' : p === 2 ? '🥈' : p === 3 ? '🥉' : `#${p}`;

const PLACEMENT_BONUS = (p: number) =>
  p === 1 ? 20 : p === 2 || p === 3 ? 15 : 0;

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  playerName,
  gameName,
  kills,
  placement,
  tournamentName,
  matchDate,
  onClose,
}) => {
  const killEarnings = kills * 10;
  const placementBonus = PLACEMENT_BONUS(placement);
  const totalWon = killEarnings + placementBonus;
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleShare = () => {
    tapFeedback();
    const text = `🏆 ${gameName} | FF Arena Match Receipt\n\n` +
      `🎯 Kills: ${kills} × ₹10 = ₹${killEarnings}\n` +
      `${PLACEMENT_EMOJI(placement)} Placement Bonus: ₹${placementBonus}\n` +
      `💰 TOTAL WON: ₹${totalWon}\n\n` +
      `Tournament: ${tournamentName}\n` +
      `👉 Join FF Arena: ffarena.gg`;

    if (navigator.share) {
      navigator.share({ title: 'FF Arena Match Receipt', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Receipt copied! Share it anywhere.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0E0E12] border border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl animate-scale-up overflow-hidden">
        {/* Yellow receipt header */}
        <div className="bg-[#FFE600] px-5 py-5 text-black text-center relative">
          <div className="absolute top-3 right-3">
            <button onClick={onClose} className="p-1 text-black/60 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Trophy className="w-8 h-8 mx-auto mb-1" />
          <h3 className="font-display font-black text-xl tracking-wider">MATCH RECEIPT</h3>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-0.5">
            FF Arena — Verified by AI OCR
          </p>
        </div>

        {/* Dashed separator (receipt style) */}
        <div className="flex items-center px-5 py-2">
          <div className="flex-1 border-t-2 border-dashed border-zinc-700" />
          <div className="mx-2 w-4 h-4 rounded-full bg-[#050507] border-2 border-zinc-700" />
          <div className="flex-1 border-t-2 border-dashed border-zinc-700" />
        </div>

        {/* Receipt body */}
        <div ref={receiptRef} className="px-5 pb-2 space-y-3">
          {/* Player info */}
          <div className="text-center">
            <p className="font-black text-white text-base">{gameName}</p>
            <p className="text-[10px] text-zinc-500">{playerName}</p>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
              <span className="text-zinc-400">Tournament</span>
              <span className="text-white font-bold text-right max-w-[55%] truncate">{tournamentName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
              <span className="text-zinc-400">Date</span>
              <span className="text-white font-mono">{matchDate || new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
              <span className="text-zinc-400">Placement</span>
              <span className="text-white font-bold">{PLACEMENT_EMOJI(placement)} Place {placement}/48</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
              <span className="text-zinc-400 flex items-center gap-1"><Zap className="w-3 h-3 text-[#FFE600]" />Kills × ₹10</span>
              <span className="text-white font-mono font-bold">{kills} kills = ₹{killEarnings}</span>
            </div>
            {placementBonus > 0 && (
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Placement Bonus</span>
                <span className="text-[#FFE600] font-mono font-bold">+₹{placementBonus}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="py-3 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/30 text-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase">TOTAL CREDITED TO WALLET</p>
            <p className="font-display font-black text-3xl text-[#FFE600] mt-0.5">₹{totalWon}.00</p>
          </div>

          <div className="flex items-center justify-center gap-1 py-1">
            <Wallet className="w-3 h-3 text-zinc-600" />
            <p className="text-[10px] text-zinc-600">Available for instant UPI withdrawal</p>
          </div>
        </div>

        {/* Dashed separator bottom */}
        <div className="flex items-center px-5 py-2">
          <div className="flex-1 border-t-2 border-dashed border-zinc-700" />
          <div className="mx-2 w-4 h-4 rounded-full bg-[#050507] border-2 border-zinc-700" />
          <div className="flex-1 border-t-2 border-dashed border-zinc-700" />
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 grid grid-cols-2 gap-2">
          <button
            onClick={handleShare}
            className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FFE600]" />
            Share
          </button>
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl bg-[#FFE600] text-black font-black text-xs active:scale-95 transition shadow-glow-yellow-sm"
          >
            DONE ✓
          </button>
        </div>
      </div>
    </div>
  );
};
