import React, { useState } from 'react';
import { X, AlertCircle, Shield, Upload, Check } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface DisputeModalProps {
  resultId: string;
  onClose: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({ resultId, onClose }) => {
  const { createDispute, results } = useApp();
  const result = results.find((r: any) => r.id === resultId);

  const [reason, setReason] = useState<string>('Kill count recorded lower than in-game summary');
  const [description, setDescription] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>(
    result?.screenshotUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disputeReasons = [
    'Kill count recorded lower than in-game summary',
    'Placement error in leaderboard calculation',
    'Opponent suspected of emulator usage / illegal config',
    'Teaming or uncompetitive gameplay detected',
    'Room connection / server disconnect issue',
    'Other rule violation',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe the issue in detail.');
      return;
    }
    setIsSubmitting(true);
    await createDispute(resultId, reason, description, evidenceUrl);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white tracking-wide">
                REPORT MATCH DISPUTE
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Official Resolution Process | Ticket ID: DISP-{Date.now().toString().slice(-4)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Select Dispute Category
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            >
              {disputeReasons.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Describe Issue & Match Timestamp
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact round number, player names, and timestamp in video/screenshot evidence..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Evidence Screenshot / Video URL
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Shield className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <span>
              Disputes are reviewed by certified tournament moderators. False disputes with fabricated evidence may result in rating penalties.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold shadow-glow-orange flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Submit Dispute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
