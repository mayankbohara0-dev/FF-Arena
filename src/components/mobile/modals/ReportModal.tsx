import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Send } from 'lucide-react';
import { tapFeedback, successFeedback } from '../../../services/soundService';

interface ReportModalProps {
  reportedGameName: string;
  reportedGameUid: string;
  onClose: () => void;
  onSubmit?: (reason: string, description: string) => void;
}

const REPORT_REASONS = [
  { id: 'emulator', label: '🤖 Emulator / PC Player', desc: 'Suspected to be playing on emulator violating rules' },
  { id: 'false_kills', label: '💀 False Kill Claims', desc: 'Submitted screenshot with wrong/fabricated kill count' },
  { id: 'wrong_placement', label: '📍 Wrong Placement', desc: 'Claimed a placement rank they did not achieve' },
  { id: 'cheating', label: '⚠️ Speed Hack / Wall Hack', desc: 'Using unauthorized third-party software' },
  { id: 'impersonation', label: '🎭 Account Impersonation', desc: 'Using another player\'s IGN or UID' },
  { id: 'other', label: '📝 Other', desc: 'Describe in the text field below' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  reportedGameName,
  reportedGameUid,
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    tapFeedback();
    setSubmitted(true);
    onSubmit?.(selectedReason, description);
    successFeedback();
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="bg-[#0E0E12] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-slide-in-up sm:animate-scale-up max-h-[88vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#0E0E12] z-10">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-400" />
            <h3 className="font-display font-black text-sm text-white">REPORT PLAYER</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              {/* Reported player */}
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-white">{reportedGameName}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">UID: {reportedGameUid}</p>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">
                  Select Reason
                </label>
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { tapFeedback(); setSelectedReason(r.id); }}
                    className={`w-full text-left p-3 rounded-xl border transition active:scale-95 ${
                      selectedReason === r.id
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-zinc-800 bg-[#050507] hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{r.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                  Additional Details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, timestamp, match details..."
                  rows={3}
                  className="w-full bg-[#050507] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedReason}
                className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                SUBMIT REPORT TO ADMIN
              </button>

              <p className="text-center text-[10px] text-zinc-600 leading-relaxed">
                False reports may result in account penalties. Admin review within 24 hours.
              </p>
            </form>
          ) : (
            <div className="py-10 flex flex-col items-center gap-4 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <Flag className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white">REPORT SUBMITTED</h4>
                <p className="text-[11px] text-zinc-400 mt-1">Admin team will review within 24 hours. Thank you for keeping FF Arena fair.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
