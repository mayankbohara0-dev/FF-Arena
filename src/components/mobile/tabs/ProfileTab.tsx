import React, { useState } from 'react';
import { Trophy, Copy, Check, Download, BarChart2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { tapFeedback } from '../../../services/soundService';

// Simple SVG line chart for kills history
const KillsChart: React.FC<{ data: number[] }> = ({ data }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const W = 280;
  const H = 72;
  const pad = 10;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - (v / max) * (H - pad * 2);
    return `${x},${y}`;
  });
  const polyline = points.join(' ');
  // Area fill: add bottom corners
  const areaPoints = `${pad},${H - pad} ${polyline} ${W - pad},${H - pad}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" aria-label="Kills chart">
      {/* Area fill */}
      <polygon points={areaPoints} fill="rgba(255,230,0,0.08)" />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#FFE600"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dots */}
      {points.map((p, i) => {
        const [x, y] = p.split(',').map(Number);
        return (
          <circle key={i} cx={x} cy={y} r="3" fill="#FFE600" stroke="#050507" strokeWidth="1.5" />
        );
      })}
    </svg>
  );
};

export const ProfileTab: React.FC = () => {
  const { currentUser, achievements } = useApp();
  const [copied, setCopied] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  const handleCopyUid = () => {
    tapFeedback();
    navigator.clipboard.writeText(currentUser.gamerProfile?.gameUid || '982347101');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock kills history for last 10 matches
  const killsHistory = [3, 7, 5, 9, 2, 11, 8, 6, 4, 8];

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* 1. Profile Card */}
      <div className="p-5 rounded-3xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark flex flex-col items-center text-center">
        {/* Glowing Avatar */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full border-2 border-[#FFE600] overflow-hidden shadow-glow-yellow p-0.5">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-[#FFE600] text-black font-black text-[9px] uppercase shadow-md">PRO</span>
        </div>

        <h2 className="font-display font-black text-lg text-white">
          {currentUser.gamerProfile?.gameName || 'VORTEX_REX'}
        </h2>
        <p className="text-[10px] font-bold text-[#FFE600] tracking-widest uppercase mt-0.5">
          ELITE SCOUT • ROGUE SYNDICATE
        </p>

        <button
          onClick={handleCopyUid}
          className="mt-2.5 px-3 py-1 rounded-xl bg-[#050507] border border-zinc-800 text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 hover:border-[#FFE600] transition"
        >
          <span>UID: {currentUser.gamerProfile?.gameUid || '982347101'}</span>
          {copied ? <Check className="w-3 h-3 text-[#FFE600]" /> : <Copy className="w-3 h-3" />}
        </button>

        {/* Core Metrics */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800/80 w-full pt-4 mt-4 border-t border-zinc-800/80">
          <div>
            <span className="text-base font-black text-white font-mono block">1,240</span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">MATCHES</span>
          </div>
          <div>
            <span className="text-base font-black text-[#FFE600] font-mono block">68%</span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">WIN RATE</span>
          </div>
          <div>
            <span className="text-base font-black text-white font-mono block">4.2</span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">K/D RATIO</span>
          </div>
        </div>
      </div>

      {/* 2. Kills History Chart */}
      <div className="p-4 rounded-3xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#FFE600]" />
            <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">KILLS — LAST 10 MATCHES</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">avg {(killsHistory.reduce((a, b) => a + b, 0) / killsHistory.length).toFixed(1)} kills</span>
        </div>

        <KillsChart data={killsHistory} />

        {/* Match labels */}
        <div className="flex justify-between px-2">
          {killsHistory.map((k, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-mono font-bold text-[#FFE600]">{k}</span>
              <span className="text-[7px] text-zinc-700">M{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Achievements */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">ACHIEVEMENTS</span>
          <span className="text-[10px] text-zinc-500 font-mono">{achievements.length} UNLOCKED</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="p-3 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 flex items-center gap-2.5 shadow-card-dark"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center text-[#FFE600] shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs text-white truncate">{ach.title}</h5>
                <span className="text-[9px] text-zinc-500 block truncate">{ach.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Settings / PWA Install */}
      <div className="p-4 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 space-y-3">
        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">APP SETTINGS</span>

        <button
          onClick={() => { tapFeedback(); localStorage.removeItem('ff_onboarded'); localStorage.removeItem('ff_user'); window.location.reload(); }}
          className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs flex items-center gap-2 px-3 hover:text-white transition active:scale-95"
        >
          <span>🔄</span>
          <span>Reset Onboarding & Login</span>
        </button>

        <button
          onClick={() => {
            tapFeedback();
            if (navigator.share) {
              navigator.share({ title: 'FF Arena', text: 'Join me on FF Arena — India\'s #1 Free Fire tournament platform!', url: 'https://ffarena.gg' });
            }
          }}
          className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs flex items-center gap-2 px-3 hover:text-white transition active:scale-95"
        >
          <span>📤</span>
          <span>Share FF Arena App</span>
        </button>
      </div>
    </div>
  );
};
