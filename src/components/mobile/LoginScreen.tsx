import React, { useState, useEffect, useRef } from "react";
import { Mail, Shield, Gamepad2, ChevronRight, RefreshCw, CheckCircle, Sparkles, Lock } from "lucide-react";
import { sendEmailOtp, verifyEmailOtp, registerPlayerAccount } from "../../supabase/auth";
import { tapFeedback, successFeedback, playError } from "../../services/soundService";
import { OFFICIAL_ADMINS, verifyAdminPassword } from "../../services/adminAuth";

interface LoginScreenProps {
  onLogin: () => void;
}

type Step = "EMAIL" | "ADMIN_PASSWORD" | "OTP" | "PROFILE";

const QUICK_DOMAINS = ["@gmail.com", "@yahoo.com", "@outlook.com"];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [step, setStep]           = useState<Step>("EMAIL");
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [gameName, setGameName]   = useState("");
  const [gameUid, setGameUid]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    if (OFFICIAL_ADMINS[cleanEmail]) {
      successFeedback();
      setStep("ADMIN_PASSWORD");
      return;
    }

    setLoading(true);
    try {
      const res = await sendEmailOtp(cleanEmail);
      if (res.success) {
        setStep("OTP");
        startCountdown();
        successFeedback();
      } else {
        playError();
        setError(res.error || "Failed to send OTP. Please check your email.");
      }
    } catch {
      setStep("OTP");
      startCountdown();
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!verifyAdminPassword(adminPass, cleanEmail)) {
      playError();
      setError("Incorrect admin password. Access denied.");
      setAdminPass("");
      return;
    }

    const adminInfo = OFFICIAL_ADMINS[cleanEmail];
    const adminUid = `admin-${cleanEmail.split("@")[0]}`;

    localStorage.setItem("ff_user", JSON.stringify({ uid: adminUid, email: cleanEmail, gameName: adminInfo.name, gameUid: "ADMIN" }));
    localStorage.setItem("ff_arena_user", JSON.stringify({
      id: adminUid,
      email: cleanEmail,
      username: adminInfo.name.toLowerCase().replace(/\s+/g, "_"),
      displayName: adminInfo.name,
      role: adminInfo.role,
      status: "Active",
      gamerProfile: {
        id: `gp-${adminUid}`,
        userId: adminUid,
        gameUid: "ADMIN",
        gameName: adminInfo.name.toUpperCase().replace(/\s+/g, "_"),
        region: "IND",
        rating: 9999,
        tier: "Grandmaster",
        rank: 1,
        totalMatches: 0,
        totalTournaments: 0,
        totalWins: 0,
        top3Finishes: 0,
        top10Finishes: 0,
        totalKills: 0,
        avgKills: 0,
        avgPlacement: 0,
        winRate: 0,
        headshotRate: 0,
        verified: true,
      },
      walletBalance: 0,
      winningsBalance: 0,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem("ff_onboarded", "true");
    window.dispatchEvent(new Event('storage'));
    successFeedback();
    onLogin();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setError("");

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Enter the 6-digit OTP code sent to your email");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmailOtp(email, cleanOtp);
      if (res.success) {
        successFeedback();
        setStep("PROFILE");
      } else {
        playError();
        setError(res.error || "Invalid OTP code. Please try again.");
      }
    } catch {
      setStep("PROFILE");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setError("");

    if (!gameName.trim() || gameName.length < 3) {
      setError("Enter your Free Fire in-game name (min 3 characters)");
      return;
    }
    if (!gameUid.trim() || gameUid.replace(/\D/g, "").length < 6) {
      setError("Enter a valid Free Fire UID (6-12 digits)");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase() || "player@gmail.com";
      const cleanGameName = gameName.trim().toUpperCase();
      const cleanGameUid = gameUid.trim();

      const { userId } = await registerPlayerAccount({ email: cleanEmail, gameName: cleanGameName, gameUid: cleanGameUid });
      const activeUid = userId || `usr-${Date.now()}`;

      localStorage.setItem("ff_user", JSON.stringify({ uid: activeUid, email: cleanEmail, gameName: cleanGameName, gameUid: cleanGameUid }));
      localStorage.setItem("ff_arena_user", JSON.stringify({
        id: activeUid,
        email: cleanEmail,
        username: cleanGameName.toLowerCase().replace(/\s+/g, "_"),
        displayName: cleanGameName,
        gamerProfile: {
          id: `gp-${activeUid}`,
          userId: activeUid,
          gameUid: cleanGameUid,
          gameName: cleanGameName,
          region: "IND",
          rating: 1200,
          tier: "Gold",
          rank: 0,
          totalMatches: 0,
          totalTournaments: 0,
          totalWins: 0,
          top3Finishes: 0,
          top10Finishes: 0,
          totalKills: 0,
          avgKills: 0,
          avgPlacement: 0,
          winRate: 0,
          headshotRate: 0,
          verified: false,
        },
        walletBalance: 0,
        winningsBalance: 0,
        role: "PLAYER",
        status: "Active",
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem("ff_onboarded", "true");
      window.dispatchEvent(new Event('storage'));
      successFeedback();
      onLogin();
    } finally {
      setLoading(false);
    }
  };

  const appendDomain = (dom: string) => {
    tapFeedback();
    if (!email.includes("@")) {
      setEmail(email + dom);
    } else {
      setEmail(email.split("@")[0] + dom);
    }
  };

  const isAdminFlow = step === "ADMIN_PASSWORD";
  const indicatorSteps: Step[] = isAdminFlow ? ["EMAIL", "ADMIN_PASSWORD"] : ["EMAIL", "OTP", "PROFILE"];

  return (
    <div className="w-full h-full bg-[#050507] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FFE600]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-5 text-center">
        <img
          src="/logo.png"
          alt="FF Arena Logo"
          className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-[0_0_16px_rgba(255,230,0,0.4)]"
        />
        <h1 className="font-display font-black text-2xl text-white">FF ARENA</h1>
        <div className="flex items-center justify-center gap-1 mt-1 text-[11px] text-[#FFE600] font-bold">
          <Sparkles className="w-3 h-3" />
          <span>{isAdminFlow ? "Admin Secure Portal" : "100% Free Instant Email OTP"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {indicatorSteps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition ${
              step === s
                ? isAdminFlow ? "bg-purple-500 text-white" : "bg-[#FFE600] text-black shadow-glow-yellow-sm"
                : indicatorSteps.indexOf(step) > i ? "bg-[#FFE600]/30 text-[#FFE600]" : "bg-zinc-800 text-zinc-500"
            }`}>
              {indicatorSteps.indexOf(step) > i ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < indicatorSteps.length - 1 && (
              <div className={`w-8 h-px ${indicatorSteps.indexOf(step) > i ? "bg-[#FFE600]/50" : "bg-zinc-800"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="w-full max-w-sm">

        {step === "EMAIL" && (
          <form onSubmit={handleSendOTP} className="space-y-4 animate-fade-in">
            <div className="text-center mb-4">
              <Mail className="w-8 h-8 text-[#FFE600] mx-auto mb-2" />
              <h2 className="font-black text-lg text-white">Enter Email Address</h2>
              <p className="text-xs text-zinc-500">We will send a 6-digit verification code to your inbox</p>
            </div>

            <div className="flex items-center gap-2 bg-[#0E0E12] border border-zinc-800 rounded-2xl px-3.5 py-3 focus-within:border-[#FFE600] transition">
              <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-zinc-600"
                autoFocus
                required
              />
            </div>

            {!email.includes("@") && email.length > 2 && (
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
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>CONTINUE <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {step === "ADMIN_PASSWORD" && (
          <form onSubmit={handleAdminLogin} className="space-y-4 animate-fade-in">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="font-black text-lg text-white">Admin Secure Login</h2>
              <p className="text-xs text-zinc-500">Signing in as <span className="text-purple-400 font-bold">{email}</span></p>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[10px] text-purple-300">
              Admin Portal — Enter your private admin password to continue
            </div>

            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Enter admin password..."
              className="w-full bg-[#0E0E12] border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm font-mono font-bold focus:outline-none focus:border-purple-500 transition"
              autoFocus
              required
            />

            {error && <p className="text-red-400 text-xs text-center animate-fade-in">{error}</p>}

            <button
              type="submit"
              disabled={!adminPass.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm uppercase tracking-wider transition active:scale-95 disabled:opacity-40"
            >
              UNLOCK ADMIN PANEL
            </button>

            <button
              type="button"
              onClick={() => { tapFeedback(); setStep("EMAIL"); setAdminPass(""); setError(""); }}
              className="w-full text-center text-xs text-zinc-500 hover:text-white transition"
            >
              Change email
            </button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in">
            <div className="text-center mb-4">
              <Shield className="w-8 h-8 text-[#FFE600] mx-auto mb-2" />
              <h2 className="font-black text-lg text-white">Enter Verification Code</h2>
              <p className="text-xs text-zinc-500">Check inbox of <span className="text-white font-bold">{email}</span></p>
            </div>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>VERIFY AND CONTINUE <ChevronRight className="w-4 h-4" /></>}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { tapFeedback(); setStep("EMAIL"); setOtp(""); setError(""); }}
                className="text-zinc-500 hover:text-white transition"
              >
                Change email
              </button>
              {countdown > 0 ? (
                <span className="text-zinc-600">Resend in {countdown}s</span>
              ) : (
                <button type="button" onClick={handleSendOTP} className="text-[#FFE600] font-bold hover:text-white transition">
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}

        {step === "PROFILE" && (
          <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in">
            <div className="text-center mb-4">
              <Gamepad2 className="w-8 h-8 text-[#FFE600] mx-auto mb-2" />
              <h2 className="font-black text-lg text-white">Link Free Fire Profile</h2>
              <p className="text-xs text-zinc-500">Your in-game identity for tournament rooms and prizes</p>
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
                  onChange={(e) => setGameUid(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="e.g. 982347101"
                  className="w-full bg-[#0E0E12] border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm font-mono font-bold focus:outline-none focus:border-[#FFE600] transition"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFE600]/5 border border-[#FFE600]/20">
              <p className="text-[10px] text-zinc-400">
                Where to find UID: Open Free Fire MAX, tap your profile avatar in the top-left corner, copy the numerical UID displayed below your banner.
              </p>
            </div>

            {error && <p className="text-red-400 text-xs text-center animate-fade-in">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#FFE600] text-black font-black text-sm uppercase shadow-glow-yellow transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "ENTER ARENA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
