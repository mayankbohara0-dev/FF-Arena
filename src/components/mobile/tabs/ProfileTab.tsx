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
  const { currentUser, achievements, logout } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopyUid = () => {
    tapFeedback();
    navigator.clipboard.writeText(currentUser.gamerProfile?.gameUid || '982347101');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kills history for completed matches
  const totalMatches = currentUser.gamerProfile?.totalMatches || 0;
  const killsHistory = totalMatches > 0 ? [currentUser.gamerProfile?.avgKills || 0] : [];

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* 1. Profile Card */}
      <div className="p-5 rounded-3xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark flex flex-col items-center text-center">
        {/* Glowing Avatar */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full border-2 border-[#FFE600] overflow-hidden shadow-glow-yellow p-0.5">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.displayName}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-[#FFE600] text-black font-black text-[9px] uppercase shadow-md">
            {currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' ? 'ADMIN' : 'PLAYER'}
          </span>
        </div>

        <h2 className="font-display font-black text-lg text-white">
          {currentUser.gamerProfile?.gameName || currentUser.displayName || 'Player'}
        </h2>
        <p className="text-[10px] font-bold text-[#FFE600] tracking-widest uppercase mt-0.5">
          {currentUser.gamerProfile?.tier ? `${currentUser.gamerProfile.tier.toUpperCase()} TIER` : 'FREE FIRE MAX COMPETITOR'}
        </p>

        <button
          onClick={handleCopyUid}
          className="mt-2.5 px-3 py-1 rounded-xl bg-[#050507] border border-zinc-800 text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 hover:border-[#FFE600] transition"
        >
          <span>UID: {currentUser.gamerProfile?.gameUid || 'Not Linked'}</span>
          {copied ? <Check className="w-3 h-3 text-[#FFE600]" /> : <Copy className="w-3 h-3" />}
        </button>

        {/* Core Metrics */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800/80 w-full pt-4 mt-4 border-t border-zinc-800/80">
          <div>
            <span className="text-base font-black text-white font-mono block">{currentUser.gamerProfile?.totalMatches ?? 0}</span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">MATCHES</span>
          </div>
          <div>
            <span className="text-base font-black text-[#FFE600] font-mono block">
              {currentUser.gamerProfile ? `${currentUser.gamerProfile.winRate.toFixed(0)}%` : '0%'}
            </span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">WIN RATE</span>
          </div>
          <div>
            <span className="text-base font-black text-white font-mono block">
              {currentUser.gamerProfile ? currentUser.gamerProfile.avgKills.toFixed(1) : '0.0'}
            </span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">AVG KILLS</span>
          </div>
        </div>
      </div>

      {/* 2. Kills History Chart */}
      {killsHistory.length > 0 ? (
        <div className="p-4 rounded-3xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#FFE600]" />
              <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">KILLS HISTORY</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">avg {(killsHistory.reduce((a, b) => a + b, 0) / killsHistory.length).toFixed(1)} kills</span>
          </div>

          <KillsChart data={killsHistory} />
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark text-center space-y-1">
          <BarChart2 className="w-5 h-5 text-zinc-600 mx-auto" />
          <h5 className="font-bold text-xs text-white">Performance Analytics</h5>
          <p className="text-[10px] text-zinc-500">Kills and match charts will appear here as you play official matches.</p>
        </div>
      )}


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

      {/* 4. Settings */}
      <div className="p-4 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 space-y-3">
        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">ACCOUNT</span>

        {/* UPI ID display */}
        {currentUser.upiId && (
          <div className="p-3 rounded-xl bg-[#050507] border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase block">Prize UPI ID</span>
              <span className="text-xs font-mono text-white">{currentUser.upiId}</span>
            </div>
            <span className="text-[9px] text-green-400 font-bold">✓ SET</span>
          </div>
        )}

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

        <button
          onClick={() => {
            tapFeedback();
            logout();
          }}
          className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 px-3 hover:bg-red-950/60 transition active:scale-95 cursor-pointer"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
