import React from 'react';
import {
  Trophy,
  Users,
  Swords,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Tournament, Match } from '../../../types';
import { tapFeedback } from '../../../services/soundService';

interface HomeTabProps {
  onSelectTournament: (t: Tournament) => void;
  onOpenSubmitResult: (m: Match) => void;
  onOpenTeamModal: () => void;
  onOpenCollegeTab: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onSelectTournament,
  onOpenSubmitResult,
  onOpenTeamModal,
  onOpenCollegeTab,
}) => {
  const { currentUser, tournaments, matches, setViewMode } = useApp();
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const featuredTourney = tournaments[0];
  const activeMatch = matches.find((m: any) => m.isRoomReleased) || matches[0];
  const safeWalletBalance = currentUser.walletBalance ?? 0;
  const safeWinningsBalance = currentUser.winningsBalance ?? 0;
  const gamerProfile = currentUser.gamerProfile;
  const winRate = gamerProfile && gamerProfile.totalMatches > 0 ? `${gamerProfile.winRate.toFixed(1)}%` : '0%';
  const combatXp = gamerProfile ? (gamerProfile.totalMatches * 100 + gamerProfile.totalKills * 50) : 0;
  const formattedXp = combatXp >= 1000 ? `${(combatXp / 1000).toFixed(1)}K` : `${combatXp}`;
  const rankLabel = gamerProfile?.rank && gamerProfile.rank > 0 ? `Rank #${gamerProfile.rank} Global` : (gamerProfile?.tier ? `${gamerProfile.tier} Tier` : 'Unranked');

  return (
    <div className="space-y-3.5 pb-20 animate-fade-in">
      
      {/* 1. FortDice-Inspired Minimal Performance Summary Card */}
      <div className="p-3.5 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">
            PERFORMANCE SUMMARY
          </span>
          <span className="text-[10px] font-black text-[#FFE600] tracking-wide">
            {rankLabel}
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-zinc-800/80 text-center">
          <div className="px-2">
            <span className="text-[9px] font-bold text-zinc-500 block">WIN RATE</span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">{winRate}</span>
          </div>
          <div className="px-2">
            <span className="text-[9px] font-bold text-zinc-500 block">COMBAT XP</span>
            <span className="text-sm font-black text-[#FFE600] font-mono mt-0.5 block">{formattedXp}</span>
          </div>
          <div className="px-2">
            <span className="text-[9px] font-bold text-zinc-500 block">WINNINGS</span>
            <span className="text-sm font-black text-[#FFE600] font-mono mt-0.5 block">₹{safeWinningsBalance.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* 2. Hero Elite Tournament Card (Minimal Yellow & Black) */}
      {featuredTourney ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              ELITE TOURNAMENTS
            </span>
            <button
              onClick={() => onSelectTournament(featuredTourney)}
              className="text-[10px] font-black text-[#FFE600] hover:underline"
            >
              VIEW ALL
            </button>
          </div>

          <div
            onClick={() => onSelectTournament(featuredTourney)}
            className="relative rounded-2xl overflow-hidden border border-[#FFE600]/30 bg-[#0E0E12] cursor-pointer group shadow-glow-yellow-sm transition hover:border-[#FFE600]/60"
          >
            <img
              src={featuredTourney.bannerUrl}
              alt={featuredTourney.name}
              className="w-full h-44 object-cover group-hover:scale-105 transition duration-500 brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-[#08080A]/60 to-transparent" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-[#FFE600] text-black shadow-glow-yellow-sm">
                ₹{featuredTourney.entryFee || 15} ENTRY
              </span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-black/70 text-white border border-zinc-700">
                ₹{featuredTourney.perKillReward || 10} / KILL
              </span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-black/70 text-[#FFE600] border border-zinc-700">
                +₹20 BOOYAH
              </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-display font-black text-base sm:text-lg text-white leading-tight">
                {featuredTourney.name}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Map: {featuredTourney.map} • {featuredTourney.maxParticipants || 48} Max Slots</p>

              <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-mono">
                  Slots: <strong className="text-[#FFE600]">{featuredTourney.currentParticipants}/{featuredTourney.maxParticipants || 48}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#FFE600] text-black font-black text-[10px] tracking-wider uppercase group-hover:bg-[#FFF066] transition">
                  REGISTER NOW →
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 shadow-card-dark text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center text-[#FFE600] mx-auto">
            <Trophy className="w-5 h-5" />
          </div>
          <h4 className="font-display font-black text-sm text-white">No Tournaments Live Right Now</h4>
          <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
            {isAdmin
              ? 'You are logged in as Admin. Publish a tournament now to open registrations for players!'
              : 'New 48-player custom room lobbies are scheduled regularly. Check back shortly!'}
          </p>
          {isAdmin && (
            <button
              onClick={() => { tapFeedback(); setViewMode('ADMIN'); }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs inline-flex items-center gap-1.5 shadow-glow-yellow-sm active:scale-95 transition"
            >
              <span>🛡️ Host Tournament Live</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Minimal Quick Action Tiles */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            if (tournaments[0]) {
              onSelectTournament(tournaments[0]);
            } else if (isAdmin) {
              setViewMode('ADMIN');
            }
          }}
          className="p-2.5 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 hover:border-[#FFE600]/40 flex flex-col items-center justify-center text-center transition group active:scale-95 shadow-card-dark"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] mb-1 group-hover:scale-110 transition">
            <Swords className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-white leading-tight">48P Matches</span>
        </button>

        <button
          onClick={() => onOpenSubmitResult(activeMatch)}
          className="p-2.5 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 hover:border-[#FFE600]/40 flex flex-col items-center justify-center text-center transition group active:scale-95 shadow-card-dark"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] mb-1 group-hover:scale-110 transition">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-white leading-tight">Submit Result</span>
        </button>

        <button
          onClick={onOpenTeamModal}
          className="p-2.5 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 hover:border-[#FFE600]/40 flex flex-col items-center justify-center text-center transition group active:scale-95 shadow-card-dark"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] mb-1 group-hover:scale-110 transition">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-white leading-tight">My Squad</span>
        </button>

        <button
          onClick={() => {
            const certBtn = document.querySelector('[aria-label="Verify Certificate"]') as HTMLElement;
            if (certBtn) certBtn.click();
            else setViewMode('CERT_VERIFY');
          }}
          className="p-2.5 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 hover:border-[#FFE600]/40 flex flex-col items-center justify-center text-center transition group active:scale-95 shadow-card-dark"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] mb-1 group-hover:scale-110 transition">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-white leading-tight">Certificates</span>
        </button>
      </div>

      {/* 4. Official 48-Player Matches List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            OFFICIAL MATCHES (48 SLOTS)
          </span>
          <span className="text-[10px] text-zinc-500">{tournaments.length} Active</span>
        </div>

        {tournaments.map((t: any) => {
          const maxSlots = t.maxParticipants || 48;
          const slotsPercent = Math.round((t.currentParticipants / maxSlots) * 100);
          return (
            <div
              key={t.id}
              onClick={() => onSelectTournament(t)}
              className="p-3 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 hover:border-[#FFE600]/40 cursor-pointer flex items-center justify-between transition shadow-card-dark group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={t.bannerUrl}
                  alt={t.name}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-[#FFE600] text-black">
                      ₹{t.entryFee || 15}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400">
                      ₹{t.perKillReward || 10}/kill
                    </span>
                    <span className="text-[9px] font-bold text-[#FFE600]">
                      +₹20 Booyah
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-white truncate">{t.name}</h5>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                    <span>Slots: <strong className="text-white font-mono">{t.currentParticipants}</strong>/{maxSlots}</span>
                    <span className="text-[#FFE600] font-bold">({slotsPercent}%)</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <span className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-black text-[10px] group-hover:bg-[#FFE600] group-hover:text-black group-hover:border-[#FFE600] inline-block transition">
                  JOIN ₹{t.entryFee || 15} →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
