import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, X, Zap } from 'lucide-react';
import { booyahFeedback } from '../../services/soundService';

interface RoomUnlockToastProps {
  roomId: string;
  roomPassword: string;
  tournamentName: string;
  onDismiss: () => void;
}

export const RoomUnlockToast: React.FC<RoomUnlockToastProps> = ({
  roomId,
  roomPassword,
  tournamentName,
  onDismiss,
}) => {
  const [copiedField, setCopiedField] = useState<'id' | 'pass' | null>(null);
  const [progress, setProgress] = useState(100);
  const DURATION = 12000; // 12 seconds

  useEffect(() => {
    // Play sound on mount
    booyahFeedback();

    // Auto-dismiss countdown
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string, field: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 animate-slide-in-up">
      {/* Auto-dismiss progress bar */}
      <div className="h-0.5 bg-zinc-800">
        <div
          className="h-full bg-[#FFE600] transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-[#0A0A00] border-b border-[#FFE600]/40 px-4 py-3 shadow-glow-yellow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#FFE600] animate-pulse" />
            <span className="text-[10px] font-black text-[#FFE600] uppercase tracking-wider">
              🔓 ROOM UNLOCKED — 48/48 FULL!
            </span>
          </div>
          <button onClick={onDismiss} className="text-zinc-500 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[10px] text-zinc-400 mb-2 truncate">{tournamentName}</p>

        {/* Credentials row */}
        <div className="flex gap-2">
          {/* Room ID */}
          <button
            onClick={() => handleCopy(roomId, 'id')}
            className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-[#050507] border border-zinc-800 hover:border-[#FFE600]/50 transition active:scale-95"
          >
            <div className="text-left">
              <span className="text-[8px] font-bold text-zinc-500 block">ROOM ID</span>
              <span className="text-xs font-mono font-bold text-white">{roomId}</span>
            </div>
            {copiedField === 'id' ? (
              <Check className="w-3 h-3 text-[#FFE600]" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-500" />
            )}
          </button>

          {/* Password */}
          <button
            onClick={() => handleCopy(roomPassword, 'pass')}
            className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-[#050507] border border-zinc-800 hover:border-[#FFE600]/50 transition active:scale-95"
          >
            <div className="text-left">
              <span className="text-[8px] font-bold text-zinc-500 block">PASSWORD</span>
              <span className="text-xs font-mono font-bold text-[#FFE600]">{roomPassword}</span>
            </div>
            {copiedField === 'pass' ? (
              <Check className="w-3 h-3 text-[#FFE600]" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
