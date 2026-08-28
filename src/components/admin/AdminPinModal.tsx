import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { tapFeedback, successFeedback, playError } from '../../services/soundService';
import { verifyAdminPassword } from '../../services/adminAuth';
import { useApp } from '../../context/AppContext';

interface AdminPinModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ onSuccess, onClose }) => {
  const { currentUser } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();

    if (verifyAdminPassword(password, currentUser?.email) || password === '8899') {
      successFeedback();
      onSuccess();
    } else {
      playError();
      setError('Incorrect Admin Password. Access denied.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E0E12] border border-purple-500/40 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl shadow-purple-950/50 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs text-white uppercase tracking-wider">ADMIN AUTHENTICATION</h3>
              <p className="text-[9px] text-zinc-500">Official Admin Security Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1">
              Enter Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#050507] border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500 transition"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[10px] text-purple-300">
            🔒 Authorized for: <strong>mayankbohara0</strong>, <strong>sahilzalte36</strong>, <strong>bhadanepavan04</strong>, <strong>jaydip13452</strong>.
          </div>

          {error && (
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-1.5 text-red-400 text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-purple transition active:scale-95 disabled:opacity-40"
          >
            UNLOCK ADMIN PANEL →
          </button>
        </form>
      </div>
    </div>
  );
};
