import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Flag,
  Users,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ReportModal } from '../modals/ReportModal';
import { tapFeedback } from '../../../services/soundService';
import { fetchLeaderboard } from '../../../supabase/api';

interface LeaderboardPlayer {
  rank: number;
  name: string;
  uid: string;
  avatar: string;
  kills: number;
  won: string;
  tier: string;
  xp?: string;
  isYou?: boolean;
}

export const RankingsTab: React.FC = () => {
  const { currentUser, registrations, results } = useApp();
  const [filterType, setFilterType] = useState<'GLOBAL' | 'FRIENDS' | 'REGION'>('GLOBAL');
  const [reportTarget, setReportTarget] = useState<{ gameName: string; gameUid: string } | null>(null);
  const [dbPlayers, setDbPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      if (data && data.length > 0) {
        setDbPlayers(data);
      }
    });
  }, []);

  // Build dynamic leaderboard
  const currentUserKills = currentUser.gamerProfile?.totalKills || 0;
  const currentUserWinnings = (currentUser.winningsBalance ?? 0);
  const currentUserName = currentUser.gamerProfile?.gameName || currentUser.displayName || 'Player';
  const currentUserUid = currentUser.gamerProfile?.gameUid || 'Not Linked';
  const currentUserTier = currentUser.gamerProfile?.tier || 'Bronze';

  // Merge Supabase profiles + current user if not already in DB
  const rawList = [...dbPlayers];
  const userInList = rawList.find(
    (p) => p.user_id === currentUser.id || p.game_uid === currentUserUid
  );

  if (!userInList && currentUser.id !== 'usr-default') {
    rawList.push({
      user_id: currentUser.id,
      game_name: currentUserName,
      game_uid: currentUserUid,
      total_kills: currentUserKills,
      total_wins: currentUser.gamerProfile?.totalWins || 0,
      rating: currentUser.gamerProfile?.rating || 1000,
      tier: currentUserTier,
    });
  }

  // Sort by rating / kills
  rawList.sort((a, b) => (b.total_kills || b.rating || 0) - (a.total_kills || a.rating || 0));

  const players: LeaderboardPlayer[] = rawList.map((p, idx) => {
    const isYou = p.user_id === currentUser.id || p.game_uid === currentUserUid;
    const kills = isYou ? currentUserKills : (p.total_kills || 0);
    const won = isYou ? `₹${currentUserWinnings.toFixed(0)}` : `₹${(kills * 10).toLocaleString('en-IN')}`;
    const tierName = p.tier || 'Bronze';
    return {
      rank: idx + 1,
      name: isYou ? currentUserName : (p.game_name || 'Player'),
      uid: isYou ? currentUserUid : (p.game_uid || '—'),
      avatar: isYou
        ? (currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
        : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
      kills,
      won,
      tier: tierName,
      xp: `${((p.total_matches || 0) * 100 + kills * 50).toLocaleString('en-IN')} XP`,
      isYou,
    };
  });

  // Top 3 for podium
  const top1 = players[0] || {
    rank: 1,
    name: currentUserName,
    uid: currentUserUid,
    avatar: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    kills: currentUserKills,
    won: `₹${currentUserWinnings.toFixed(0)}`,
    tier: `${currentUserTier} 👑`,
    isYou: true,
  };

  const top2 = players[1] || null;
  const top3 = players[2] || null;
  const restRankings = players.slice(3);

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

      {/* Podium */}
      <div className="p-4 rounded-3xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark">
        <div className="flex items-end justify-center gap-4 sm:gap-6 pt-2 pb-2">
          {/* #2 Left */}
          {top2 ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-full border-2 border-zinc-600 overflow-hidden shadow-md">
                  <img src={top2.avatar} alt={top2.name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-2 -right-1 w-5 h-5 rounded-full bg-zinc-700 text-white font-black text-[10px] flex items-center justify-center border border-zinc-500">2</span>
              </div>
              <span className="text-xs font-black text-white truncate max-w-[80px] text-center">{top2.name} {top2.isYou ? '(YOU)' : ''}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{top2.won}</span>
              {!top2.isYou && (
                <button
                  onClick={() => { tapFeedback(); setReportTarget({ gameName: top2.name, gameUid: top2.uid }); }}
                  className="mt-1 p-1 text-zinc-700 hover:text-red-400 transition"
                  aria-label="Report player"
                >
                  <Flag className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-40">
              <div className="w-12 h-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs font-bold mb-2">#2</div>
              <span className="text-[10px] text-zinc-600 font-bold">Unclaimed</span>
            </div>
          )}

          {/* #1 Center */}
          <div className="flex flex-col items-center -mt-4">
            <Crown className="w-6 h-6 text-[#FFE600] animate-bounce mb-1 drop-shadow" />
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full border-2 border-[#FFE600] overflow-hidden shadow-glow-yellow">
                <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-[#FFE600] text-black font-black text-xs flex items-center justify-center shadow-md">1</span>
            </div>
            <span className="text-xs font-black text-[#FFE600] truncate max-w-[110px] text-center">
              {top1.name} {top1.isYou ? '(YOU)' : ''}
            </span>
            <span className="text-[11px] text-white font-black font-mono">{top1.won}</span>
          </div>

          {/* #3 Right */}
          {top3 ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-full border-2 border-amber-700 overflow-hidden shadow-md">
                  <img src={top3.avatar} alt={top3.name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-2 -right-1 w-5 h-5 rounded-full bg-amber-800 text-white font-black text-[10px] flex items-center justify-center border border-amber-600">3</span>
              </div>
              <span className="text-xs font-black text-white truncate max-w-[80px] text-center">{top3.name} {top3.isYou ? '(YOU)' : ''}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{top3.won}</span>
              {!top3.isYou && (
                <button
                  onClick={() => { tapFeedback(); setReportTarget({ gameName: top3.name, gameUid: top3.uid }); }}
                  className="mt-1 p-1 text-zinc-700 hover:text-red-400 transition"
                  aria-label="Report player"
                >
                  <Flag className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-40">
              <div className="w-12 h-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs font-bold mb-2">#3</div>
              <span className="text-[10px] text-zinc-600 font-bold">Unclaimed</span>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
            NATIONAL LEADERBOARD
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">PRIZE WON</span>
        </div>

        {restRankings.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 text-center space-y-1">
            <Sparkles className="w-5 h-5 text-[#FFE600] mx-auto" />
            <h5 className="font-bold text-xs text-white">Season 1 Active Competition</h5>
            <p className="text-[10px] text-zinc-500">
              Play 48-player tournament matches to earn kill bounties, gain combat MMR, and rank up on the national leaderboard!
            </p>
          </div>
        ) : (
          restRankings.map((p) => (
            <div
              key={p.rank}
              className={`p-3 rounded-2xl bg-[#0E0E12] border flex items-center justify-between shadow-card-dark ${
                p.isYou ? 'border-[#FFE600]/40 bg-[#FFE600]/5' : 'border-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono font-black text-xs text-zinc-500 text-center">#{p.rank}</span>
                <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-300 font-black text-xs shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs text-white truncate">
                    {p.name} {p.isYou ? <span className="text-[#FFE600] text-[10px] font-black">(YOU)</span> : ''}
                  </h5>
                  <span className="text-[9px] text-zinc-500 font-mono">{p.xp} • {p.kills} kills</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-black text-xs text-[#FFE600]">{p.won}</span>
                {!p.isYou && (
                  <button
                    onClick={() => { tapFeedback(); setReportTarget({ gameName: p.name, gameUid: p.uid }); }}
                    className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition"
                    aria-label={`Report ${p.name}`}
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
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
