import React, { useState } from "react";
import {
  Download,
  Shield,
  Trophy,
  Zap,
  Smartphone,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  IndianRupee,
  Users,
  Key,
  Award,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  FileText,
  RefreshCw,
  Lock,
  X,
} from "lucide-react";
import { tapFeedback } from "../../services/soundService";

type ModalType = "NONE" | "PRIVACY" | "TERMS" | "REFUND";

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>("NONE");

  const toggleFaq = (index: number) => {
    tapFeedback();
    setActiveFaq(activeFaq === index ? null : index);
  };

  const openModal = (type: ModalType) => {
    tapFeedback();
    setActiveModal(type);
  };

  const handleDownloadApk = () => {
    tapFeedback();
    const link = document.createElement("a");
    link.href = "https://github.com/mayankbohara0-dev/FF-Arena/releases/download/v1.0.0/ff-arena-v1.0.apk";
    link.download = "ff-arena-v1.0.apk";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const faqs = [
    {
      q: "How do I join a 48-player match?",
      a: "Download the Android APK, install it on your device, register your Free Fire UID and UPI ID, choose any upcoming match (Bermuda, Kalahari, Purgatory), and pay the ₹15 entry fee. You will immediately be assigned a slot number from #1 to #48.",
    },
    {
      q: "When and where do I receive the Room ID and Password?",
      a: "The Custom Room ID and Password unlock automatically inside the Android app 15 minutes before the match start time, or as soon as all 48 player slots are booked. You will also get a real-time push notification.",
    },
    {
      q: "How are kill bounties and Booyah winnings calculated?",
      a: "You get ₹10 for every verified kill. If you win #1 (Booyah), you get (Kills × ₹10) + ₹20 extra cash bonus. 2nd and 3rd place get +₹15 extra cash bonus. Winnings can be withdrawn immediately to your UPI.",
    },
    {
      q: "How does AI screenshot verification work?",
      a: "After your match ends, take a screenshot of the Free Fire end-game scoreboard and upload it in the app. Our AI OCR engine automatically extracts your in-game name, kill count, and placement within 30 seconds.",
    },
    {
      q: "Are PC / Emulator players allowed?",
      a: "No. FF Arena is strictly a mobile-only esports platform. Our anti-cheat sentinel automatically detects and bans emulator accounts to guarantee 100% fair gameplay for mobile players.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-slate-100 selection:bg-[#FFE600] selection:text-black font-sans">

      {/* ── TOP NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-[#08080C]/90 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="FF Arena"
              className="w-11 h-11 object-contain drop-shadow-[0_0_12px_rgba(255,230,0,0.35)]"
            />
            <div>
              <span className="font-display font-black text-lg text-white tracking-wider block leading-none">
                FF ARENA
              </span>
              <span className="text-[9px] font-bold text-[#FFE600] tracking-widest uppercase">
                ESPORTS INDIA 🇮🇳
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-5 text-[11px] font-bold text-zinc-400">
            <button onClick={() => openModal('PRIVACY')} style={{minHeight: 'unset', minWidth: 'unset'}} className="h-auto py-1 hover:text-white transition">Privacy</button>
            <button onClick={() => openModal('TERMS')} style={{minHeight: 'unset', minWidth: 'unset'}} className="h-auto py-1 hover:text-white transition">Terms</button>
            <button onClick={() => openModal('REFUND')} style={{minHeight: 'unset', minWidth: 'unset'}} className="h-auto py-1 hover:text-white transition">Refund Policy</button>
            <a href="#contact" style={{minHeight: 'unset', minWidth: 'unset'}} className="h-auto py-1 hover:text-white transition">Contact</a>
          </div>

          {/* Nav Download Action */}
          <button
            onClick={handleDownloadApk}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-xs shadow-glow-yellow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download APK</span>
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FFE600]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] text-xs font-black uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OFFICIAL V1.0.0 ANDROID APK RELEASE</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight leading-[1.1]">
              Play Free Fire. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFE600] via-amber-300 to-yellow-500">
                Win ₹10 / Kill + ₹20 Booyah.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              India's dedicated esports battleground. Download the Android app for daily 48-player custom matches with ₹15 entry, auto-delivered room credentials, AI screenshot verification, and instant 1-tap UPI payouts.
            </p>

            {/* CTA Download Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={handleDownloadApk}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-base flex items-center justify-center gap-3 shadow-glow-yellow transition active:scale-95 cursor-pointer"
              >
                <Download className="w-6 h-6" />
                <div className="text-left leading-tight">
                  <span className="block text-xs uppercase tracking-wider font-bold text-zinc-800">DOWNLOAD FOR ANDROID</span>
                  <span className="block text-sm font-black">FF-Arena-v1.0.apk (~60 MB)</span>
                </div>
              </button>
            </div>

            {/* Security badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-4 text-xs font-bold text-zinc-400">
              <span className="flex items-center gap-1.5 text-green-400">
                <CheckCircle className="w-4 h-4" /> 100% Virus-Free & Safe
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Shield className="w-4 h-4 text-[#FFE600]" /> Mobile Only (No Emulators)
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <IndianRupee className="w-4 h-4 text-green-400" /> Instant UPI Payouts
              </span>
            </div>
          </div>

          {/* Right Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-[300px] sm:w-[340px] rounded-[44px] p-3 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black border-4 border-zinc-800 shadow-2xl shadow-yellow-500/10">
              {/* Screen */}
              <div className="rounded-[36px] bg-[#050507] overflow-hidden border border-zinc-800 p-4 space-y-4">
                {/* Header in phone */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="FF" className="w-8 h-8 object-contain" />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">FF ARENA</h4>
                      <span className="text-[8px] text-[#FFE600] font-mono">LIVE 48P MATCH</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold border border-green-500/30 animate-pulse">
                    ● REGISTRATION OPEN
                  </span>
                </div>

                {/* Match Card Preview */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-500/30 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-mono font-bold text-[#FFE600] uppercase">SOLO • BERMUDA</span>
                      <h5 className="font-bold text-xs text-white">India Champions Trophy</h5>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-[#FFE600] text-black font-black text-[10px]">₹15 ENTRY</span>
                  </div>

                  <div className="p-2 rounded-xl bg-black/60 border border-zinc-800 text-[10px] space-y-1">
                    <div className="flex justify-between text-zinc-300">
                      <span>Kill Bounty:</span>
                      <strong className="text-[#FFE600] font-mono">₹10 / Kill</strong>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Booyah Bonus:</span>
                      <strong className="text-green-400 font-mono">+₹20 Cash</strong>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                      <span>Slots Filled</span>
                      <span className="text-[#FFE600] font-bold">42 / 48 Booked</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="w-[88%] h-full bg-[#FFE600] rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Payout sample card */}
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">
                      ₹
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white">UPI Instant Transfer</p>
                      <p className="text-[8px] text-zinc-500 font-mono">GPay / PhonePe / Paytm</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-green-400">+₹100.00</span>
                </div>

                <button
                  onClick={handleDownloadApk}
                  className="w-full py-2.5 rounded-xl bg-[#FFE600] text-black font-black text-xs shadow-glow-yellow-sm transition active:scale-95 cursor-pointer"
                >
                  DOWNLOAD APP NOW →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REWARD BREAKDOWN SECTION ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#08080D] border-y border-zinc-800/80">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-[#FFE600] uppercase tracking-widest">TRANSPARENT PRIZE FORMULA</span>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white">
              Every Kill Earns Cash. Booyah Doubles It.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              No hidden deductions. Pure skill-based tournament rewards calculated automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-[#0E0E14] border border-[#FFE600]/40 space-y-3 relative shadow-glow-yellow-sm">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE600]/20 text-[#FFE600] flex items-center justify-center font-black text-lg">
                🥇
              </div>
              <h3 className="font-display font-black text-lg text-white">1st Place (Booyah)</h3>
              <p className="text-2xl font-black text-[#FFE600] font-mono">₹10 / Kill + ₹20</p>
              <p className="text-xs text-zinc-400">
                Example: 8 Kills = ₹80 + ₹20 Booyah = <strong className="text-white">₹100 Prize</strong>
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0E0E14] border border-amber-500/30 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-lg">
                🥈
              </div>
              <h3 className="font-display font-black text-lg text-white">2nd & 3rd Place</h3>
              <p className="text-2xl font-black text-amber-300 font-mono">₹10 / Kill + ₹15</p>
              <p className="text-xs text-zinc-400">
                Example: 5 Kills = ₹50 + ₹15 Podium = <strong className="text-white">₹65 Prize</strong>
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0E0E14] border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center font-black text-lg">
                ⚔️
              </div>
              <h3 className="font-display font-black text-lg text-white">4th to 48th Place</h3>
              <p className="text-2xl font-black text-zinc-200 font-mono">₹10 / Kill</p>
              <p className="text-xs text-zinc-400">
                Even without winning, every single kill you take pays out cash directly!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 KEY FEATURES ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-[#FFE600] uppercase tracking-widest">BUILT FOR TOURNAMENT WARRIORS</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
              Engineered for Seamless Competitive Play
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Key,
                title: "Auto Room Delivery",
                desc: "Custom Room ID & Password unlock automatically inside the app when lobby reaches 48 players.",
                badge: "15-Min Fast Rooms",
              },
              {
                icon: Zap,
                title: "AI OCR Scoreboard",
                desc: "Upload your match end screenshot. AI instantly scans kills, damage, and placement with 98%+ accuracy.",
                badge: "30-Sec Verification",
              },
              {
                icon: IndianRupee,
                title: "1-Tap UPI Payouts",
                desc: "Transfer winnings directly to your Google Pay, PhonePe, or Paytm UPI ID with zero withdrawal fees.",
                badge: "Direct UPI",
              },
              {
                icon: Shield,
                title: "Anti-Cheat Sentinel",
                desc: "Hardware and emulator detection ensures only genuine mobile touch players can enter lobbies.",
                badge: "Mobile Only",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="p-6 rounded-3xl bg-[#0B0B10] border border-zinc-800/80 hover:border-[#FFE600]/40 transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600]">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-400">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="font-display font-black text-base text-white">{feat.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO INSTALL (APK GUIDE) ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#08080D] border-t border-zinc-800/80">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-[#FFE600] uppercase tracking-widest">EASY 3-STEP SETUP</span>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white">
              How to Install the Android APK
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Download APK",
                desc: "Click the download button to save `ff-arena-v1.0.apk` (~60 MB) to your phone.",
              },
              {
                step: "02",
                title: "Allow Installation",
                desc: "When prompted by Android, enable 'Install unknown apps' or 'Allow from this source'.",
              },
              {
                step: "03",
                title: "Register & Play",
                desc: "Open FF Arena, verify your email, enter your Free Fire UID, and book your tournament slot!",
              },
            ].map((st) => (
              <div key={st.step} className="p-6 rounded-3xl bg-[#0E0E14] border border-zinc-800 space-y-3 relative">
                <span className="font-display font-black text-3xl text-[#FFE600]/30 block font-mono">{st.step}</span>
                <h3 className="font-display font-black text-base text-white">{st.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleDownloadApk}
              className="px-8 py-3.5 rounded-2xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-sm inline-flex items-center gap-2 shadow-glow-yellow transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD FF-ARENA-V1.0.APK NOW</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-[#FFE600] uppercase tracking-widest">GOT QUESTIONS?</span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#0B0B10] border border-zinc-800/80 overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-white"
                >
                  <span>{faq.q}</span>
                  {activeFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#FFE600] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </button>
                {activeFaq === idx && (
                  <div className="p-4 pt-0 text-xs text-zinc-400 border-t border-zinc-800/50 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section id="contact" className="py-20 px-4 sm:px-6 bg-[#08080D] border-t border-zinc-800/80">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-[#FFE600] uppercase tracking-widest">GET IN TOUCH</span>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white">Contact & Support</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Have a query, dispute, or payment issue? Reach out to us — we typically respond within 2–4 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <a
              href="mailto:support@ffarena.in"
              className="p-6 rounded-3xl bg-[#0B0B10] border border-zinc-800 hover:border-[#FFE600]/40 transition group space-y-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] group-hover:bg-[#FFE600]/20 transition">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Email Support</h3>
                <p className="text-xs text-[#FFE600] font-mono mt-0.5">support@ffarena.in</p>
                <p className="text-[10px] text-zinc-500 mt-1">Response within 2–4 hours</p>
              </div>
            </a>

            <a
              href="mailto:admin@ffarena.in"
              className="p-6 rounded-3xl bg-[#0B0B10] border border-zinc-800 hover:border-[#FFE600]/40 transition group space-y-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] group-hover:bg-[#FFE600]/20 transition">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Tournament Admin</h3>
                <p className="text-xs text-[#FFE600] font-mono mt-0.5">admin@ffarena.in</p>
                <p className="text-[10px] text-zinc-500 mt-1">Match disputes & prize issues</p>
              </div>
            </a>

            <div className="p-6 rounded-3xl bg-[#0B0B10] border border-zinc-800 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Business Address</h3>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  FF Arena Esports<br />
                  India 🇮🇳<br />
                  <span className="text-[10px] text-zinc-600">GST & PAN on file with Razorpay</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 sm:px-6 border-t border-zinc-800/80 bg-[#040406] text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <img src="/logo.png" alt="FF" className="w-7 h-7 object-contain" />
              <span className="font-display font-black text-white">FF ARENA</span>
              <span className="text-[10px] text-zinc-600">© 2026. All rights reserved.</span>
            </div>

            <div className="flex flex-wrap items-center gap-5 justify-center">
              <button onClick={() => openModal('PRIVACY')} className="hover:text-white transition flex items-center gap-1">
                <Lock className="w-3 h-3" /> Privacy Policy
              </button>
              <button onClick={() => openModal('TERMS')} className="hover:text-white transition flex items-center gap-1">
                <FileText className="w-3 h-3" /> Terms & Conditions
              </button>
              <button onClick={() => openModal('REFUND')} className="hover:text-white transition flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refund Policy
              </button>
              <a href="#contact" className="hover:text-white transition flex items-center gap-1">
                <Mail className="w-3 h-3" /> Contact
              </a>
              <a
                href="https://github.com/mayankbohara0-dev/FF-Arena"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition flex items-center gap-1"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="border-t border-zinc-800/60 pt-5 text-[10px] text-zinc-600 text-center space-y-1">
            <p>FF Arena is an independent esports platform and is not affiliated with Garena or Free Fire MAX. All trademarks belong to their respective owners.</p>
            <p>Payments are processed securely via Razorpay. Entry fees are non-refundable once a tournament slot is confirmed. Prize winnings are subject to result verification.</p>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL: PRIVACY POLICY                           */}
      {/* ════════════════════════════════════════════════ */}
      {activeModal === 'PRIVACY' && (
        <PolicyModal title="Privacy Policy" icon={<Lock className="w-5 h-5 text-[#FFE600]" />} onClose={() => setActiveModal('NONE')}>
          <p className="text-zinc-400 text-xs">Last updated: August 2026</p>
          <Section title="1. Information We Collect">
            <li>Email address and display name (for account creation)</li>
            <li>Free Fire UID and in-game name (for match registration)</li>
            <li>UPI ID (for prize payout transfers only)</li>
            <li>Match screenshots uploaded for result verification</li>
            <li>Device information and app usage analytics</li>
          </Section>
          <Section title="2. How We Use Your Information">
            <li>To create and manage your FF Arena account</li>
            <li>To process tournament registrations and payments</li>
            <li>To verify match results using AI OCR</li>
            <li>To transfer prize winnings to your UPI ID</li>
            <li>To send match notifications and updates</li>
          </Section>
          <Section title="3. Data Sharing">
            <p className="text-zinc-400 text-xs leading-relaxed">We do not sell or share your personal data with third parties, except with payment processors (Razorpay) for processing transactions, as required by law, or to prevent fraud.</p>
          </Section>
          <Section title="4. Data Security">
            <p className="text-zinc-400 text-xs leading-relaxed">Your data is stored securely using Supabase (PostgreSQL with Row-Level Security). UPI IDs are only used for prize transfers and are never stored in plain-text logs.</p>
          </Section>
          <Section title="5. Your Rights">
            <li>Request deletion of your account and associated data</li>
            <li>Update your personal information from the Profile tab</li>
            <li>Contact us at support@ffarena.in for any data requests</li>
          </Section>
          <Section title="6. Contact">
            <p className="text-zinc-400 text-xs">For privacy concerns: <span className="text-[#FFE600]">support@ffarena.in</span></p>
          </Section>
        </PolicyModal>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL: TERMS & CONDITIONS                       */}
      {/* ════════════════════════════════════════════════ */}
      {activeModal === 'TERMS' && (
        <PolicyModal title="Terms & Conditions" icon={<FileText className="w-5 h-5 text-[#FFE600]" />} onClose={() => setActiveModal('NONE')}>
          <p className="text-zinc-400 text-xs">Last updated: August 2026</p>
          <Section title="1. Eligibility">
            <li>You must be 18 years or older to use FF Arena.</li>
            <li>You must own a valid Free Fire MAX account on a mobile device.</li>
            <li>PC emulator players are strictly prohibited and will be permanently banned.</li>
          </Section>
          <Section title="2. Tournament Entry">
            <li>Entry fees are collected securely via UPI / Razorpay payment gateway.</li>
            <li>Each entry fee pays for one tournament slot (#1 to #48).</li>
            <li>Slots are allocated on a first-come, first-served basis.</li>
            <li>Maximum 48 players per tournament — no additional entries accepted once full.</li>
          </Section>
          <Section title="3. Match Rules">
            <li>Players must join the custom room using the Room ID and Password provided in the app.</li>
            <li>Match results must be submitted via screenshot within 30 minutes of match end.</li>
            <li>Screenshots are verified by AI OCR; fraudulent submissions will result in permanent ban.</li>
            <li>FF Arena administrators have the final authority on all result disputes.</li>
          </Section>
          <Section title="4. Prize Winnings">
            <li>Prizes are calculated as: (Kills × ₹10) + Placement Bonus (₹20 for 1st, ₹15 for 2nd/3rd).</li>
            <li>Winnings are credited to your FF Arena wallet after admin verification.</li>
            <li>Withdrawals are transferred to your registered UPI ID within 24 hours of request.</li>
          </Section>
          <Section title="5. Prohibited Conduct">
            <li>Using emulators, hacks, aimbots, or any cheat software.</li>
            <li>Submitting fake or edited screenshots.</li>
            <li>Account sharing or playing on behalf of another player.</li>
            <li>Abusing or harassing FF Arena staff or other players.</li>
          </Section>
          <Section title="6. Account Termination">
            <p className="text-zinc-400 text-xs leading-relaxed">FF Arena reserves the right to suspend or permanently ban any account found in violation of these terms without prior notice. Entry fees are non-refundable upon ban.</p>
          </Section>
          <Section title="7. Governing Law">
            <p className="text-zinc-400 text-xs leading-relaxed">These terms are governed by the laws of India. Any disputes will be subject to jurisdiction in India.</p>
          </Section>
        </PolicyModal>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* MODAL: REFUND POLICY                            */}
      {/* ════════════════════════════════════════════════ */}
      {activeModal === 'REFUND' && (
        <PolicyModal title="Refund & Cancellation Policy" icon={<RefreshCw className="w-5 h-5 text-[#FFE600]" />} onClose={() => setActiveModal('NONE')}>
          <p className="text-zinc-400 text-xs">Last updated: August 2026 — As required by RBI Payment Gateway Guidelines</p>
          <Section title="1. Entry Fee Refunds">
            <p className="text-zinc-400 text-xs leading-relaxed mb-2">Tournament entry fees are <strong className="text-white">generally non-refundable</strong> once a slot has been confirmed. However, refunds will be issued in the following cases:</p>
            <li>FF Arena cancels the tournament before it begins — <strong className="text-white">100% refund</strong></li>
            <li>Technical failure on our platform prevents match from starting — <strong className="text-white">100% refund</strong></li>
            <li>Duplicate payment due to payment gateway error — <strong className="text-white">100% refund</strong></li>
          </Section>
          <Section title="2. Non-Refundable Situations">
            <li>Player does not join the custom room in time</li>
            <li>Player is disqualified for rule violations or cheating</li>
            <li>Player's device / internet issues during the match</li>
            <li>Player voluntarily withdraws after slot confirmation</li>
          </Section>
          <Section title="3. Refund Process">
            <li>Refund requests must be emailed to <span className="text-[#FFE600]">support@ffarena.in</span> within 48 hours of the tournament.</li>
            <li>Approved refunds will be credited back to the original payment method (UPI / bank account) within <strong className="text-white">5–7 business days</strong>.</li>
            <li>Razorpay processing fees (if any) may be deducted from the refund amount.</li>
          </Section>
          <Section title="4. Prize Withdrawal">
            <li>Prize winnings in your FF Arena wallet can be withdrawn at any time (minimum ₹1, no maximum limit).</li>
            <li>Withdrawals are processed to your UPI ID within 24 hours of request.</li>
            <li>FF Arena does not charge any withdrawal fees.</li>
          </Section>
          <Section title="5. Payment Disputes">
            <p className="text-zinc-400 text-xs leading-relaxed">For any payment discrepancies or failed transaction queries, contact us at <span className="text-[#FFE600]">support@ffarena.in</span> with your transaction ID and payment screenshot. We will resolve all payment disputes within 72 hours.</p>
          </Section>
          <Section title="6. Contact for Refunds">
            <p className="text-zinc-400 text-xs">📧 <span className="text-[#FFE600]">support@ffarena.in</span></p>
            <p className="text-zinc-400 text-xs mt-1">Please include: Your registered email, Transaction ID / UTR, Tournament name, and reason for refund request.</p>
          </Section>
        </PolicyModal>
      )}
    </div>
  );
};

/* ─── Reusable Policy Modal Wrapper ─── */
const PolicyModal: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, icon, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
    <div className="bg-[#0A0A0F] border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center">
            {icon}
          </div>
          <h2 className="font-display font-black text-base text-white uppercase tracking-wider">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Body */}
      <div className="overflow-y-auto p-6 space-y-5 flex-1">
        {children}
      </div>
      {/* Footer */}
      <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#FFE600] text-black font-black text-xs uppercase tracking-wider transition active:scale-95"
        >
          I Understand — Close
        </button>
      </div>
    </div>
  </div>
);

/* ─── Reusable Section inside policy modals ─── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h3 className="font-black text-xs text-[#FFE600] uppercase tracking-wider">{title}</h3>
    <ul className="space-y-1.5 list-none">
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && child.type === 'li' ? (
          <li className="flex items-start gap-2 text-xs text-zinc-400">
            <span className="text-[#FFE600] mt-0.5 shrink-0">•</span>
            {(child.props as any).children}
          </li>
        ) : child
      )}
    </ul>
  </div>
);
