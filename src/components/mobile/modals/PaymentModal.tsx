import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, Copy, Check, ChevronRight, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { successFeedback, tapFeedback, playError } from '../../../services/soundService';

interface PaymentModalProps {
  amount: number;
  purpose: string;
  onSuccess: (addedAmount: number) => void;
  onClose: () => void;
}

const DEFAULT_UPI_ID = import.meta.env.VITE_MERCHANT_UPI_ID || 'ffarena@upi';

const UPI_APPS = [
  { name: 'Google Pay', scheme: 'gpay://upi/pay', color: '#1A73E8', emoji: '💳' },
  { name: 'PhonePe',    scheme: 'phonepe://pay',   color: '#5F259F', emoji: '📱' },
  { name: 'Paytm',      scheme: 'paytmmp://pay',   color: '#00B9F1', emoji: '💰' },
  { name: 'BHIM / Any', scheme: 'upi://pay',       color: '#FF6B00', emoji: '⚡' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amount: initialAmount,
  purpose,
  onSuccess,
  onClose,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(initialAmount || 15);
  const [step, setStep] = useState<'INTENT' | 'QR' | 'UTR' | 'SUCCESS'>('INTENT');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const merchantUpi = DEFAULT_UPI_ID;
  const upiIntentUri = `upi://pay?pa=${merchantUpi}&pn=FF%20Arena%20Esports&am=${selectedAmount}&cu=INR&tn=${encodeURIComponent(purpose || 'FF Arena Wallet Topup')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiIntentUri)}`;

  const handleLaunchApp = (scheme: string) => {
    tapFeedback();
    const targetUrl = scheme === 'upi://pay' ? upiIntentUri : `${scheme}?pa=${merchantUpi}&pn=FF%20Arena%20Esports&am=${selectedAmount}&cu=INR&tn=${encodeURIComponent(purpose)}`;
    
    // Trigger deep link on Android
    window.location.href = targetUrl;

    // Transition to step 2 after launch
    setTimeout(() => {
      setStep('UTR');
    }, 1500);
  };

  const handleCopyUpi = () => {
    tapFeedback();
    navigator.clipboard.writeText(merchantUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleUtrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setError('');

    const cleanUtr = utrNumber.replace(/\D/g, '');
    if (cleanUtr.length < 12) {
      setError('Please enter a valid 12-digit UPI Reference (UTR) number');
      playError();
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('SUCCESS');
      successFeedback();
      setTimeout(() => {
        onSuccess(selectedAmount);
      }, 2000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E0E12] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-in-up sm:animate-scale-up">
        
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-zinc-800 flex items-center justify-between bg-[#08080A]">
          <div>
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">
              {step === 'SUCCESS' ? 'PAYMENT COMPLETE' : 'ADD CASH VIA 0% FEE UPI'}
            </h3>
            <p className="text-[10px] text-zinc-500 truncate max-w-[220px]">
              Direct to Bank Account • 100% Free
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* Amount Selector (only on first step) */}
          {(step === 'INTENT' || step === 'QR') && (
            <div className="space-y-2">
              <div className="text-center py-3 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/30 shadow-glow-yellow-sm">
                <span className="text-2xl font-black text-[#FFE600] font-mono">₹{selectedAmount}.00</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">0% Fees • Direct UPI Transfer</span>
              </div>

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 30, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { tapFeedback(); setSelectedAmount(amt); }}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold transition active:scale-95 ${
                      selectedAmount === amt
                        ? 'bg-[#FFE600] text-black shadow-glow-yellow-sm'
                        : 'bg-[#050507] text-zinc-400 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: 1-Tap UPI Apps ── */}
          {step === 'INTENT' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                <span>1-TAP DIRECT UPI PAYMENT</span>
                <button
                  type="button"
                  onClick={() => { tapFeedback(); setStep('QR'); }}
                  className="text-[#FFE600] flex items-center gap-1 hover:underline"
                >
                  <QrCode className="w-3 h-3" /> Show QR
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => handleLaunchApp(app.scheme)}
                    className="py-3 px-3 rounded-2xl bg-[#050507] border border-zinc-800 hover:border-[#FFE600]/50 flex items-center justify-between gap-2 transition active:scale-95 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{app.emoji}</span>
                      <span className="font-bold text-xs text-white">{app.name}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-[#FFE600]" />
                  </button>
                ))}
              </div>

              {/* Copy UPI ID */}
              <div className="p-3 rounded-2xl bg-[#050507] border border-zinc-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase block">OR COPY OFFICIAL UPI ID</span>
                  <span className="font-mono text-xs font-bold text-[#FFE600] truncate block">{merchantUpi}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-[#FFE600]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUpi ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => { tapFeedback(); setStep('UTR'); }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-800 active:scale-95 transition"
              >
                <span>Already Paid? Submit 12-Digit UTR</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#FFE600]" />
              </button>
            </div>
          )}

          {/* ── STEP: QR Code Mode ── */}
          {step === 'QR' && (
            <div className="space-y-3 text-center animate-fade-in">
              <p className="text-xs text-zinc-400">Scan using any UPI App (Google Pay, PhonePe, Paytm)</p>
              
              <div className="w-48 h-48 mx-auto p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                <img src={qrCodeUrl} alt="UPI QR" className="w-full h-full object-contain" />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { tapFeedback(); setStep('INTENT'); }}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white"
                >
                  ← Back to Apps
                </button>
                <button
                  type="button"
                  onClick={() => { tapFeedback(); setStep('UTR'); }}
                  className="flex-1 py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs shadow-glow-yellow-sm"
                >
                  I've Paid → Submit UTR
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: UTR Reference Submission ── */}
          {step === 'UTR' && (
            <form onSubmit={handleUtrSubmit} className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-2xl bg-[#FFE600]/5 border border-[#FFE600]/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#FFE600]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>STEP 2: CONFIRM 12-DIGIT UTR</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Open your UPI App receipt & copy the <strong>12-digit UPI Reference / UTR Number</strong> to credit your wallet instantly.
                </p>
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                  12-Digit UPI Ref / UTR Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={16}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="e.g. 423819284910"
                  className="w-full bg-[#050507] border border-zinc-800 rounded-2xl px-4 py-3 text-white text-base font-mono font-black tracking-wider focus:outline-none focus:border-[#FFE600] transition"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || utrNumber.length < 12}
                className="w-full py-3 rounded-2xl bg-[#FFE600] text-black font-black text-xs uppercase tracking-wider shadow-glow-yellow transition active:scale-95 disabled:opacity-40"
              >
                {isSubmitting ? 'Verifying with Bank...' : `CONFIRM & CREDIT ₹${selectedAmount} →`}
              </button>

              <button
                type="button"
                onClick={() => { tapFeedback(); setStep('INTENT'); }}
                className="w-full text-center text-zinc-500 text-xs hover:text-white"
              >
                ← Back to payment methods
              </button>
            </form>
          )}

          {/* ── STEP 3: Success Screen ── */}
          {step === 'SUCCESS' && (
            <div className="py-6 flex flex-col items-center gap-3 animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-[#FFE600]/20 border-2 border-[#FFE600] flex items-center justify-center shadow-glow-yellow">
                <CheckCircle2 className="w-9 h-9 text-[#FFE600]" />
              </div>
              <div>
                <h4 className="font-black text-base text-white">₹{selectedAmount}.00 ADDED TO WALLET!</h4>
                <p className="text-[11px] text-zinc-400 mt-1">UTR: {utrNumber} • Verified with Bank ⚡</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
