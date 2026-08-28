import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react';
import { tapFeedback, successFeedback, playError } from '../../services/soundService';

interface AdminPinModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const ADMIN_MASTER_PIN = import.meta.env.VITE_ADMIN_PIN || '8899';

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();

    if (pin === ADMIN_MASTER_PIN) {
      successFeedback();
      onSuccess();
    } else {
      playError();
      setError('Incorrect Admin Security PIN. Access denied.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E0E12] border border-purple-500/40 rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl shadow-purple-950/50 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs text-white uppercase tracking-wider">ADMIN SECURITY</h3>
              <p className="text-[9px] text-zinc-500">Restricted Access Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1">
              Enter 4-Digit Admin PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              className="w-full bg-[#050507] border border-zinc-800 rounded-xl px-4 py-3 text-center text-2xl font-mono font-black text-purple-400 tracking-[0.5em] focus:outline-none focus:border-purple-500 transition"
              autoFocus
              required
            />
          </div>

          <p className="text-[10px] text-zinc-500 text-center">
            Default Master PIN: <strong className="text-purple-400 font-mono">8899</strong>
          </p>

          {error && (
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-1.5 text-red-400 text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-purple transition active:scale-95 disabled:opacity-40"
          >
            UNLOCK ADMIN PANEL →
          </button>
        </form>
      </div>
    </div>
  );
};
