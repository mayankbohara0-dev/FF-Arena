import React, { useState } from 'react';
import { X, Shield, Camera, CreditCard, CheckCircle2, Clock, Upload } from 'lucide-react';
import { tapFeedback, successFeedback } from '../../../services/soundService';

interface KYCModalProps {
  onVerified: () => void;
  onClose: () => void;
}

type KYCStep = 'INFO' | 'PAN' | 'SELFIE' | 'SUBMITTED';

export const KYCModal: React.FC<KYCModalProps> = ({ onVerified, onClose }) => {
  const [step, setStep] = useState<KYCStep>('INFO');
  const [panNumber, setPanNumber] = useState('');
  const [panUploaded, setPanUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  const handleSubmitKYC = () => {
    tapFeedback();
    setStep('SUBMITTED');
    // Mock approval after 2.5s
    setTimeout(() => {
      successFeedback();
      onVerified();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="bg-[#0E0E12] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-slide-in-up sm:animate-scale-up max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#0E0E12] z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FFE600]" />
            <h3 className="font-display font-black text-sm text-white uppercase">KYC VERIFICATION</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 'INFO' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#FFE600]/5 border border-[#FFE600]/20 space-y-1">
                <p className="text-xs font-black text-[#FFE600]">🔒 WITHDRAWAL &gt; ₹500 REQUIRES KYC</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  As per Indian regulations, withdrawals above ₹500 require PAN card verification. This is a one-time process.
                </p>
              </div>

              <div className="space-y-2 text-[11px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] flex items-center justify-center text-[9px] font-black">1</div>
                  <span>PAN Card number + photo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] flex items-center justify-center text-[9px] font-black">2</div>
                  <span>Selfie with PAN card</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] flex items-center justify-center text-[9px] font-black">3</div>
                  <span>Instant auto-verification</span>
                </div>
              </div>

              <button
                onClick={() => { tapFeedback(); setStep('PAN'); }}
                className="w-full py-3 rounded-2xl bg-[#FFE600] text-black font-black text-xs uppercase shadow-glow-yellow-sm active:scale-95 transition"
              >
                START KYC VERIFICATION →
              </button>
            </div>
          )}

          {step === 'PAN' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-xs font-black text-white uppercase">Step 1: PAN Card Details</h4>

              <div>
                <label className="text-[9px] font-bold text-zinc-500 block mb-1 uppercase">PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full bg-[#050507] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-[#FFE600] transition"
                />
              </div>

              {/* Mock upload area */}
              <button
                onClick={() => { tapFeedback(); setPanUploaded(true); }}
                className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 transition active:scale-95 ${
                  panUploaded
                    ? 'border-[#FFE600] bg-[#FFE600]/5'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {panUploaded ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-[#FFE600]" />
                    <span className="text-xs font-bold text-[#FFE600]">PAN Card Photo Uploaded</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-zinc-500" />
                    <span className="text-xs font-bold text-zinc-400">Tap to upload PAN card photo</span>
                    <span className="text-[10px] text-zinc-600">JPG, PNG up to 5MB</span>
                  </>
                )}
              </button>

              <button
                onClick={() => { tapFeedback(); setStep('SELFIE'); }}
                disabled={!panUploaded || panNumber.length < 10}
                className="w-full py-3 rounded-2xl bg-[#FFE600] text-black font-black text-xs uppercase shadow-glow-yellow-sm active:scale-95 transition disabled:opacity-50"
              >
                NEXT: SELFIE →
              </button>
            </div>
          )}

          {step === 'SELFIE' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-xs font-black text-white uppercase">Step 2: Selfie with PAN</h4>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Take a selfie holding your PAN card next to your face. Ensure both your face and the PAN card are clearly visible.
              </p>

              <button
                onClick={() => { tapFeedback(); setSelfieUploaded(true); }}
                className={`w-full py-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 transition active:scale-95 ${
                  selfieUploaded
                    ? 'border-[#FFE600] bg-[#FFE600]/5'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {selfieUploaded ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-[#FFE600]" />
                    <span className="text-xs font-bold text-[#FFE600]">Selfie Uploaded ✓</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-zinc-500" />
                    <span className="text-xs font-bold text-zinc-400">Tap to open camera / upload</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSubmitKYC}
                disabled={!selfieUploaded}
                className="w-full py-3 rounded-2xl bg-[#FFE600] text-black font-black text-xs uppercase shadow-glow-yellow-sm active:scale-95 transition disabled:opacity-50"
              >
                SUBMIT FOR VERIFICATION →
              </button>
            </div>
          )}

          {step === 'SUBMITTED' && (
            <div className="py-8 flex flex-col items-center gap-4 animate-fade-in text-center">
              <div className="w-14 h-14 rounded-full bg-[#FFE600]/20 border-2 border-[#FFE600] flex items-center justify-center shadow-glow-yellow animate-pulse-glow">
                <Clock className="w-7 h-7 text-[#FFE600] animate-spin" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white">VERIFYING KYC...</h4>
                <p className="text-[11px] text-zinc-400 mt-1">AI-powered instant verification in progress</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
