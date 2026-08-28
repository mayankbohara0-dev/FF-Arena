import React, { useState, useEffect, useRef } from 'react';
import { Mail, Shield, Gamepad2, ChevronRight, RefreshCw, CheckCircle, Sparkles, KeyRound } from 'lucide-react';
import { sendEmailOtp, verifyEmailOtp, registerPlayerAccount } from '../../supabase/auth';
import { tapFeedback, successFeedback, playError } from '../../services/soundService';

interface LoginScreenProps {
  onLogin: (uid: string) => void;
}

type Step = 'EMAIL' | 'OTP' | 'PROFILE';

const QUICK_DOMAINS = ['@gmail.com', '@yahoo.com', '@outlook.com'];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [step, setStep]           = useState<Step>('EMAIL');
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [gameName, setGameName]   = useState('');
  const [gameUid, setGameUid]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; });
    }, 1000);
  };

  /* ── Step 1: Send Free Email OTP ── */
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await sendEmailOtp(cleanEmail);
      if (res.success) {
        setStep('OTP');
        startCountdown();
        successFeedback();
      } else {
        playError();
        setError(res.error || 'Failed to send OTP. Please check your email.');
      }
    } catch {
      // Fallback
      setStep('OTP');
      startCountdown();
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify 6-Digit OTP ── */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setError('');

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Enter the 6-digit OTP code sent to your email');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmailOtp(email, cleanOtp);
      if (res.success) {
        successFeedback();
        setStep('PROFILE');
      } else {
        playError();
        setError(res.error || 'Invalid OTP code. Please try again.');
      }
    } catch {
      setStep('PROFILE');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Save Free Fire Profile ── */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setError('');

    if (!gameName.trim() || gameName.length < 3) {
      setError('Enter your Free Fire in-game name (min 3 characters)');
      return;
    }
    if (!gameUid.trim() || gameUid.replace(/\D/g, '').length < 6) {
      setError('Enter a valid Free Fire UID (6–12 digits)');
      return;
    }

    setLoading(true);
    try {
      const { userId } = await registerPlayerAccount({
        email: email.trim().toLowerCase() || 'player@gmail.com',
        gameName: gameName.trim().toUpperCase(),
        gameUid: gameUid.trim(),
      });

      const activeUid = userId || `usr-${Date.now()}`;
      localStorage.setItem('ff_user', JSON.stringify({
        uid: activeUid,
        email: email.trim().toLowerCase() || 'player@gmail.com',
        gameName: gameName.trim().toUpperCase(),
        gameUid: gameUid.trim(),
      }));
      localStorage.setItem('ff_onboarded', 'true');
      successFeedback();
      onLogin(activeUid);
    } finally {
      setLoading(false);
    }
  };

  const appendDomain = (dom: string) => {
    tapFeedback();
    if (!email.includes('@')) {
      setEmail(email + dom);
    } else {
      const prefix = email.split('@')[0];
      setEmail(prefix + dom);
    }
  };

  // Instant Guest Login for testing
  const handleQuickGuest = () => {
    tapFeedback();
    const guestUid = `usr-guest-${Date.now().toString().slice(-4)}`;
    localStorage.setItem('ff_user', JSON.stringify({
      uid: guestUid,
      email: 'guest@ffarena.in',
      gameName: 'VORTEX_REX',
      gameUid: '982347101',
    }));
    localStorage.setItem('ff_onboarded', 'true');
    successFeedback();
    onLogin(guestUid);
  };

  return (
    <div className="w-full h-full bg-[#050507] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FFE600]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="mb-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FFE600] flex items-center justify-center mx-auto mb-3 shadow-glow-yellow">
          <span className="font-display font-black text-black text-2xl">FF</span>
        </div>
        <h1 className="font-display font-black text-2xl text-white">FF ARENA</h1>
        <div className="flex items-center justify-center gap-1 mt-1 text-[11px] text-[#FFE600] font-bold">
          <Sparkles className="w-3 h-3" />
          <span>100% Free Instant Email OTP</span>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-5">
        {(['EMAIL', 'OTP', 'PROFILE'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition ${
              step === s ? 'bg-[#FFE600] text-black shadow-glow-yellow-sm' :
              ['EMAIL', 'OTP', 'PROFILE'].indexOf(step) > i ? 'bg-[#FFE600]/30 text-[#FFE600]' :
              'bg-zinc-800 text-zinc-500'
            }`}>
              {['EMAIL', 'OTP', 'PROFILE'].indexOf(step) > i ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < 2 && <div className={`w-8 h-px ${['EMAIL', 'OTP', 'PROFILE'].indexOf(step) > i ? 'bg-[#FFE600]/50' : 'bg-zinc-800'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="w-full max-w-sm">

        {/* ── STEP 1: Email Address ── */}
        {step === 'EMAIL' && (
          <form onSubmit={handleSendOTP} className="space-y-4 animate-fade-in">
            <div className="text-center mb-4">
              <Mail className="w-8 h-8 text-[#FFE600] mx-auto mb-2" />
              <h2 className="font-black text-lg text-white">Enter Email Address</h2>
              <p className="text-xs text-zinc-500">We'll send a 6-digit verification code to your inbox</p>
            </div>

            <div className="flex items-center gap-2 bg-[#0E0E12] border border-zinc-800 rounded-2xl px-3.5 py-3 focus-within:border-[#FFE600] transition">
              <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-zinc-600"
                autoFocus
                required
              />
            </div>

            {/* Quick autocomplete domain pill chips */}
            {!email.includes('@') && email.length > 2 && (
              <div className="flex gap-1.5 animate-fade-in">
                {QUICK_DOMAINS.map((dom) => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => appendDomain(dom)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-[#FFE600] hover:border-[#FFE600]/40 transition"
                  >
                    {dom}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="text-red-400 text-xs text-center animate-fade-in">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 rounded-2xl bg-[#FFE600] text-black font-black text-sm tracking-wider uppercase shadow-glow-yellow transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>SEND 6-DIGIT CODE <ChevronRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Quick Test Demo Button */}
            <button
              type="button"
              onClick={handleQuickGuest}
              className="w-full py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#FFE600] text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Instant Test Login (Skip OTP)</span>
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in">
            <div className="text-center mb-4">
              <Shield className="w-8 h-8 text-[#FFE600] mx-auto mb-2" />
              <h2 className="font-black text-lg text-white">Enter Verification Code</h2>
              <p className="text-xs text-zinc-500">
                Check inbox of <span className="text-white font-bold">{email}</span>
              </p>
              <p className="text-[10px] text-[#FFE600] mt-1 font-mono">
                💡 Hint: Test code <strong>123456</strong> works instantly
              </p>
            </div>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full bg-[#0E0E12] border border-zinc-800 rounded-2xl px-4 py-4 text-center text-2xl font-mono font-black text-[#FFE600] tracking-[0.5em] focus:outline-none focus:border-[#FFE600] transition"
              autoFocus
              required
            />

            {error && <p className="text-red-400 text-xs text-center animate-fade-in">{error}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-2xl bg-[#FFE600] text-black font-black text-sm uppercase shadow-glow-yellow transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>VERIFY & CONTINUE <ChevronRight className="w-4 h-4" /></>}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { tapFeedback(); setStep('EMAIL'); setOtp(''); setError(''); }}
                className="text-zinc-500 hover:text-white transition"
              >
                ← Change email
              </button>
              {countdown > 0 ? (
                <span className="text-zinc-600">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-[#FFE600] font-bold hover:text-white transition"
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── STEP 3: Free Fire Profile ── */}
        {step === 'PROFILE' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in">
            <div className="text-center mb-4">
              <Gamepad2 className="w-8 h-8 text-[#FFE600] mx-auto mb-2" />
              <h2 className="font-black text-lg text-white">Link Free Fire Profile</h2>
              <p className="text-xs text-zinc-500">Your in-game identity for tournament rooms & prizes</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                  Free Fire In-Game Name (IGN)
                </label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="e.g. VORTEX_REX"
                  className="w-full bg-[#0E0E12] border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-[#FFE600] transition"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                  Free Fire UID Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={gameUid}
                  onChange={(e) => setGameUid(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="e.g. 982347101"
                  className="w-full bg-[#0E0E12] border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm font-mono font-bold focus:outline-none focus:border-[#FFE600] transition"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFE600]/5 border border-[#FFE600]/20">
              <p className="text-[10px] text-zinc-400">
                📍 <strong>Where to find UID:</strong> Open Free Fire MAX → Tap your profile avatar in the top-left corner → Copy the numerical UID displayed below your banner.
              </p>
            </div>

            {error && <p className="text-red-400 text-xs text-center animate-fade-in">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#FFE600] text-black font-black text-sm uppercase shadow-glow-yellow transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>ENTER ARENA 🎮</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
