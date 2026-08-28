import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  Trophy,
  Users,
  Wallet,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Flame,
  ArrowDown,
  Lock,
} from 'lucide-react';
import { tapFeedback, successFeedback } from '../../services/soundService';

interface LandingPageProps {
  onEnterApp: () => void;
}

const GITHUB_RELEASE_APK = 'https://github.com/mayankbohara0-dev/FF-Arena/releases';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadApk = () => {
    tapFeedback();
    setDownloading(true);
    
    // Trigger APK download (tries direct asset first or redirects to GitHub Releases)
    const link = document.createElement('a');
    link.href = GITHUB_RELEASE_APK;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      successFeedback();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-[#FFE600] selection:text-black overflow-x-hidden font-sans">
      
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#050507]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFE600] flex items-center justify-center font-display font-black text-black text-lg shadow-glow-yellow-sm">
              FF
            </div>
            <div>
              <span className="font-display font-black text-lg text-white tracking-wider">
                FF <span className="text-[#FFE600]">ARENA</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.2 bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] text-[9px] font-bold rounded uppercase">
                India Esports
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { tapFeedback(); onEnterApp(); }}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition"
            >
              Open Web App 🎮
            </button>
            <button
              onClick={handleDownloadApk}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-xs uppercase tracking-wider shadow-glow-yellow transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download APK</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 max-w-6xl mx-auto text-center">
        {/* Glow behind hero */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] text-xs font-bold animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Android APK v1.0.0 is Now Live!</span>
          </div>

          {/* Heading */}
          <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight uppercase">
            PLAY 48-PLAYER FREE FIRE MATCHES. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFE600] via-yellow-200 to-amber-500">
              WIN REAL CASH VIA DIRECT UPI.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            ₹15 Entry Fee • ₹10 per Kill Bounty • +₹20 Booyah Bonus. Compete in daily battle royale customs with automatic Room ID unlock & instant 0% commission UPI withdrawals!
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={handleDownloadApk}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-sm tracking-wider uppercase shadow-glow-yellow transition active:scale-95 flex items-center justify-center gap-2.5"
            >
              <Download className="w-5 h-5" />
              <span>{downloading ? 'Starting Download...' : 'DOWNLOAD ANDROID APK (.APK)'}</span>
            </button>

            <button
              onClick={() => { tapFeedback(); onEnterApp(); }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-sm transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-[#FFE600]" />
              <span>Play in Browser (No Download)</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 font-mono">
            Android 8.0+ Required • 100% Free & Safe • Zero Ads
          </p>
        </div>
      </section>

      {/* Live Stats Bar */}
      <section className="border-y border-zinc-800/80 bg-[#09090D] py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="font-mono font-black text-2xl sm:text-3xl text-[#FFE600]">₹15</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase font-bold">Standard Entry Fee</div>
          </div>
          <div>
            <div className="font-mono font-black text-2xl sm:text-3xl text-white">₹10</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase font-bold">Per Kill Bounty</div>
          </div>
          <div>
            <div className="font-mono font-black text-2xl sm:text-3xl text-[#FFE600]">48</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase font-bold">Players Per Match</div>
          </div>
          <div>
            <div className="font-mono font-black text-2xl sm:text-3xl text-white">0%</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase font-bold">UPI Commission Fee</div>
          </div>
        </div>
      </section>

      {/* How to Install APK Guide */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FFE600]">QUICK 3-STEP SETUP</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-white">HOW TO INSTALL & PLAY</h2>
          <p className="text-xs sm:text-sm text-zinc-400">Install the official Android app in under 1 minute</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-[#0E0E12] border border-zinc-800 space-y-3 relative group hover:border-[#FFE600]/40 transition">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center font-mono font-black text-[#FFE600] text-lg">
              1
            </div>
            <h3 className="font-bold text-base text-white">Download APK</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tap the download button above. If Chrome prompts <em>"File might be harmful"</em>, tap <strong>Download anyway</strong> (it's 100% safe).
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-[#0E0E12] border border-zinc-800 space-y-3 relative group hover:border-[#FFE600]/40 transition">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center font-mono font-black text-[#FFE600] text-lg">
              2
            </div>
            <h3 className="font-bold text-base text-white">Install on Phone</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Open the downloaded file and tap <strong>Install</strong>. If prompted, toggle <em>"Allow from this source"</em>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-[#0E0E12] border border-zinc-800 space-y-3 relative group hover:border-[#FFE600]/40 transition">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center font-mono font-black text-[#FFE600] text-lg">
              3
            </div>
            <h3 className="font-bold text-base text-white">Log in & Win</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your email, type the 6-digit OTP, link your Free Fire UID, and join any active ₹15 tournament!
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto border-t border-zinc-800/80">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FFE600]">WHY PLAY ON FF ARENA</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-white">BUILT FOR REAL GAMERS</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-[#0E0E12] border border-zinc-800 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#FFE600]/10 text-[#FFE600] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Auto Room Unlock</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Room ID and Password automatically reveal on your screen the moment 48 players fill.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E0E12] border border-zinc-800 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#FFE600]/10 text-[#FFE600] shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">0% Fee Direct UPI</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Top-up and withdraw via Google Pay, PhonePe, Paytm, or BHIM with zero gateway deductions.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E0E12] border border-zinc-800 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#FFE600]/10 text-[#FFE600] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Anti-Cheat Sentinel</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Duplicate UID detection, emulator bans, and anti-fraud reporting keep matches 100% fair.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E0E12] border border-zinc-800 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#FFE600]/10 text-[#FFE600] shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Verified Certificates</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Get official cryptographic winner certificates for your gaming resume & portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-8 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#FFE600]/15 via-[#0E0E12] to-[#050507] border border-[#FFE600]/30 space-y-5 shadow-2xl">
          <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase">
            READY TO CLAIM YOUR FIRST BOOYAH?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Join thousands of Free Fire players competing in daily tournaments across India.
          </p>

          <div className="pt-2">
            <button
              onClick={handleDownloadApk}
              className="px-8 py-4 rounded-2xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-sm uppercase tracking-wider shadow-glow-yellow transition active:scale-95 inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD FF ARENA APK (FREE)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 px-4 sm:px-8 text-center text-xs text-zinc-500 space-y-2">
        <p>© 2026 FF Arena India. All rights reserved.</p>
        <p className="text-[10px] text-zinc-600 max-w-md mx-auto">
          Skill-based esports platform. Free Fire is a trademark of Garena International. FF Arena is an independent community platform.
        </p>
      </footer>
    </div>
  );
};
