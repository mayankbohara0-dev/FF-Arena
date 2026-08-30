import React, { useState } from 'react';
import {
  Trophy,
  Crown,
  Flag,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ReportModal } from '../modals/ReportModal';
import { tapFeedback } from '../../../services/soundService';

export const RankingsTab: React.FC = () => {
  const { currentUser } = useApp();
  const [filterType, setFilterType] = useState<'GLOBAL' | 'FRIENDS' | 'REGION'>('GLOBAL');
  const [reportTarget, setReportTarget] = useState<{ gameName: string; gameUid: string } | null>(null);

  const top3 = [
    {
      rank: 2,
      name: 'GLK_ARJUN',
      uid: '772391024',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      kills: 760,
      won: '₹7,615',
      tier: 'Master 🔥',
    },
    {
      rank: 1,
      name: currentUser.gamerProfile?.gameName || currentUser.displayName || 'You',
      uid: currentUser.gamerProfile?.gameUid || '—',
      avatar: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      kills: currentUser.gamerProfile?.totalKills || 0,
      won: `₹${((currentUser.gamerProfile?.totalKills || 0) * 10).toLocaleString('en-IN')}`,
      tier: currentUser.gamerProfile?.tier ? `${currentUser.gamerProfile.tier} 👑` : 'Unranked',
      isYou: true,
    },
    {
      rank: 3,
      name: 'HYD_KABIR',
      uid: '662019481',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      kills: 620,
      won: '₹6,240',
      tier: 'Diamond 💎',
    },
  ];

  const restRankings = [
    { rank: 4,  name: 'CyberViper_FF',  uid: '881920344', kills: 540, xp: '18,650 XP', won: '₹5,400', tier: 'Diamond' },
    { rank: 5,  name: 'Neon_Shadow',    uid: '773829100', kills: 480, xp: '16,200 XP', won: '₹4,800', tier: 'Platinum' },
    { rank: 6,  name: 'Titan_Rex',      uid: '990182736', kills: 410, xp: '14,100 XP', won: '₹4,100', tier: 'Platinum' },
    { rank: 7,  name: 'Soul_Mortal99',  uid: '664738201', kills: 380, xp: '12,900 XP', won: '₹3,800', tier: 'Gold' },
    { rank: 8,  name: 'StormBreaker_FF',uid: '559012837', kills: 310, xp: '10,500 XP', won: '₹3,100', tier: 'Gold' },
    { rank: 9,  name: 'BLAZE_IND',      uid: '448901723', kills: 280, xp: '9,800 XP',  won: '₹2,800', tier: 'Silver' },
    { rank: 10, name: 'Phantom_X',      uid: '337823901', kills: 230, xp: '8,200 XP',  won: '₹2,300', tier: 'Silver' },
  ];

  return (
    <div className="space-y-4 pb-20 animate-fade-in">

      {/* Filter Switcher */}
      <div className="flex bg-[#0E0E12] p-1 rounded-2xl border border-zinc-800/80 max-w-xs mx-auto text-xs font-black">
        {(['GLOBAL', 'FRIENDS', 'REGION'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { tapFeedback(); setFilterType(tab); }}
            className={`flex-1 py-1.5 rounded-xl transition uppercase tracking-wider text-[10px] ${
              filterType === tab
                ? 'bg-[#FFE600] text-black shadow-glow-yellow-sm'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FortDice 3-Circle Podium */}
      <div className="p-4 rounded-3xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark">
        <div className="flex items-end justify-center gap-4 sm:gap-6 pt-2 pb-2">
          {/* #2 Left */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-zinc-600 overflow-hidden shadow-md">
                <img src={top3[0].avatar} alt={top3[0].name} className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-2 -right-1 w-5 h-5 rounded-full bg-zinc-700 text-white font-black text-[10px] flex items-center justify-center border border-zinc-500">2</span>
            </div>
            <span className="text-xs font-black text-white truncate max-w-[80px] text-center">{top3[0].name}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{top3[0].won}</span>
            <button
              onClick={() => { tapFeedback(); setReportTarget({ gameName: top3[0].name, gameUid: top3[0].uid }); }}
              className="mt-1 p-1 text-zinc-700 hover:text-red-400 transition"
              aria-label="Report player"
            >
              <Flag className="w-3 h-3" />
            </button>
          </div>

          {/* #1 Center */}
          <div className="flex flex-col items-center -mt-4">
            <Crown className="w-6 h-6 text-[#FFE600] animate-bounce mb-1 drop-shadow" />
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full border-2 border-[#FFE600] overflow-hidden shadow-glow-yellow">
                <img src={top3[1].avatar} alt={top3[1].name} className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-[#FFE600] text-black font-black text-xs flex items-center justify-center shadow-md">1</span>
            </div>
            <span className="text-xs font-black text-[#FFE600] truncate max-w-[100px] text-center">{top3[1].name} {top3[1].isYou ? '(YOU)' : ''}</span>
            <span className="text-[11px] text-white font-black font-mono">{top3[1].won}</span>
          </div>

          {/* #3 Right */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-amber-700 overflow-hidden shadow-md">
                <img src={top3[2].avatar} alt={top3[2].name} className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-2 -right-1 w-5 h-5 rounded-full bg-amber-800 text-white font-black text-[10px] flex items-center justify-center border border-amber-600">3</span>
            </div>
            <span className="text-xs font-black text-white truncate max-w-[80px] text-center">{top3[2].name}</span>
            <span className="text-[10px] text-zinc-400 font-mono">{top3[2].won}</span>
            <button
              onClick={() => { tapFeedback(); setReportTarget({ gameName: top3[2].name, gameUid: top3[2].uid }); }}
              className="mt-1 p-1 text-zinc-700 hover:text-red-400 transition"
              aria-label="Report player"
            >
              <Flag className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">TOP PERFORMERS</span>
          <span className="text-[10px] text-zinc-500 font-mono">PRIZE WON</span>
        </div>

        {restRankings.map((p) => (
          <div
            key={p.rank}
            className="p-3 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 flex items-center justify-between shadow-card-dark"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 font-mono font-black text-xs text-zinc-500 text-center">#{p.rank}</span>
              <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-300 font-black text-xs shrink-0">
                {p.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs text-white truncate">{p.name}</h5>
                <span className="text-[9px] text-zinc-500 font-mono">{p.xp} • {p.kills} kills</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono font-black text-xs text-[#FFE600]">{p.won}</span>
              {/* Report flag */}
              <button
                onClick={() => { tapFeedback(); setReportTarget({ gameName: p.name, gameUid: p.uid }); }}
                className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition"
                aria-label={`Report ${p.name}`}
              >
                <Flag className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          reportedGameName={reportTarget.gameName}
          reportedGameUid={reportTarget.gameUid}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};
