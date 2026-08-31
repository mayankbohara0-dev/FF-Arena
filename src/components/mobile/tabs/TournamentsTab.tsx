import React, { useState } from 'react';
import {
  Search,
  Trophy,
  MapPin,
  Clock,
  Users,
  User,
  Swords,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Tournament } from '../../../types';
import { useCountdown } from '../../../hooks/useCountdown';
import { tapFeedback } from '../../../services/soundService';

interface TournamentsTabProps {
  onSelectTournament: (t: Tournament) => void;
}

const MODE_CONFIG = {
  SOLO: { label: '🤺 SOLO', icon: User, color: 'text-[#FFE600] bg-[#FFE600]/10 border-[#FFE600]/30', dot: '#FFE600' },
  DUO:  { label: '👥 DUO',  icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', dot: '#60A5FA' },
  SQUAD:{ label: '🛡️ SQUAD', icon: Swords, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', dot: '#A78BFA' },
};

type ModeFilter = 'ALL' | 'SOLO' | 'DUO' | 'SQUAD' | 'COLLEGE';

const FILTER_PILLS: { label: string; value: ModeFilter; emoji: string }[] = [
  { label: 'All', value: 'ALL', emoji: '⚡' },
  { label: 'Solo', value: 'SOLO', emoji: '🤺' },
  { label: 'Duo', value: 'DUO', emoji: '👥' },
  { label: 'Squad', value: 'SQUAD', emoji: '🛡️' },
  { label: 'College', value: 'COLLEGE', emoji: '🎓' },
];

// Inline countdown badge using the hook
const CountdownBadge: React.FC<{ startTime: string; status: string }> = ({ startTime, status }) => {
  const { formatted, expired } = useCountdown(startTime);
  if (status === 'Live') {
    return <span className="flex items-center gap-1 text-[#FFE600] font-black animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-[#FFE600]" />LIVE NOW</span>;
  }
  if (expired) {
    return <span className="text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />Started</span>;
  }
  return <span className="text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3 text-[#FFE600]" />{formatted}</span>;
};

export const TournamentsTab: React.FC<TournamentsTabProps> = ({ onSelectTournament }) => {
  const { tournaments, currentUser, setViewMode } = useApp();
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredTournaments = tournaments.filter((t: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.mode.toLowerCase().includes(q) ||
      t.map.toLowerCase().includes(q) ||
      (t.matchMode && t.matchMode.toLowerCase().includes(q));

    const matchesMode =
      modeFilter === 'ALL' ||
      (modeFilter === 'COLLEGE' ? t.isCollegeOnly :
       modeFilter === 'SOLO' ? t.matchMode === 'SOLO' :
       modeFilter === 'DUO' ? t.matchMode === 'DUO' :
       modeFilter === 'SQUAD' ? t.matchMode === 'SQUAD' : true);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'OPEN' && t.status === 'Registration Open') ||
      (statusFilter === 'LIVE' && t.status === 'Live') ||
      (statusFilter === 'COMPLETED' && t.status === 'Completed');

    return matchesSearch && matchesMode && matchesStatus;
  });

  const modeLabel = (t: any) => {
    const mode = t.matchMode as keyof typeof MODE_CONFIG;
    return MODE_CONFIG[mode] || MODE_CONFIG['SOLO'];
  };

  const slotLabel = (t: any) => {
    if (t.matchMode === 'DUO') return `${t.currentParticipants / 2 || t.currentParticipants}/${t.maxParticipants / 2} Teams`;
    if (t.matchMode === 'SQUAD') return `${Math.ceil(t.currentParticipants / 4)}/${Math.ceil(t.maxParticipants / 4)} Squads`;
    return `${t.currentParticipants}/${t.maxParticipants} Players`;
  };

  const openCount = tournaments.filter((t: any) => t.status === 'Registration Open').length;
  const liveCount = tournaments.filter((t: any) => t.status === 'Live').length;

  return (
    <div className="space-y-3 pb-24 animate-fade-in">
      {/* 1. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tournaments, maps, modes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0E0E12] border border-zinc-800/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFE600] transition shadow-card-dark"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs w-5 h-5 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Mode Filter Pills — SOLO / DUO / SQUAD / COLLEGE */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-0.5 px-0.5">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setModeFilter(pill.value)}
            className={`px-3 py-1.5 rounded-2xl text-[11px] font-black tracking-wide whitespace-nowrap border transition active:scale-95 ${
              modeFilter === pill.value
                ? 'bg-[#FFE600] text-black border-[#FFE600] shadow-glow-yellow-sm'
                : 'bg-[#0E0E12] text-zinc-400 border-zinc-800/80 hover:text-white hover:border-zinc-700'
            }`}
          >
            {pill.emoji} {pill.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 3. Status Sub-tabs */}
      <div className="flex border-b border-zinc-900 text-[11px] font-bold overflow-x-auto scrollbar-none">
        {[
          { key: 'ALL', label: `All (${tournaments.length})` },
          { key: 'OPEN', label: `Open (${openCount})` },
          { key: 'LIVE', label: `⚡ Live (${liveCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-2 border-b-2 whitespace-nowrap transition ${
              statusFilter === key
                ? 'border-[#FFE600] text-[#FFE600]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 4. Tournament Cards */}
      <div className="space-y-3">
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-10 bg-[#0E0E12] rounded-2xl border border-zinc-800/80 p-6 space-y-2">
            <Trophy className="w-9 h-9 mx-auto text-zinc-600 opacity-50" />
            <h4 className="text-xs font-bold text-white">No tournaments scheduled</h4>
            <p className="text-[11px] text-zinc-500">
              {isAdmin ? 'You are logged in as Admin. Create and publish a match now!' : 'New tournaments will appear here once published by organizers.'}
            </p>
            {isAdmin && (
              <button
                onClick={() => { tapFeedback(); setViewMode('ADMIN'); }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs inline-flex items-center gap-1.5 shadow-glow-yellow-sm active:scale-95 transition"
              >
                <span>🛡️ Host Tournament</span>
              </button>
            )}
          </div>
        ) : (
          filteredTournaments.map((t: any) => {
            const maxSlots = t.maxParticipants || 48;
            const slotsPercent = Math.min(100, Math.round((t.currentParticipants / maxSlots) * 100));
            const modeInfo = modeLabel(t);

            return (
              <div
                key={t.id}
                onClick={() => onSelectTournament(t)}
                className="bg-[#0E0E12] rounded-2xl border border-zinc-800/80 hover:border-[#FFE600]/40 overflow-hidden cursor-pointer group transition shadow-card-dark active:scale-[0.98]"
              >
                {/* Banner */}
                <div className="relative h-28 sm:h-32 w-full overflow-hidden">
                  <img
                    src={t.bannerUrl}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/30 to-transparent" />

                  {/* Top-left: Mode + Entry badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1">
                    {/* Match Mode Badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${modeInfo.color}`}>
                      {modeInfo.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-[#FFE600] text-black">
                      ₹{t.entryFee}
                      {t.matchMode === 'DUO' ? '/team' : t.matchMode === 'SQUAD' ? '/squad' : '/entry'}
                    </span>
                  </div>

                  {/* Top-right: Status */}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                    t.status === 'Live'
                      ? 'bg-[#FFE600] text-black animate-pulse'
                      : 'bg-black/70 text-zinc-300 border border-zinc-700'
                  }`}>
                    {t.status}
                  </span>

                  {/* Bottom info */}
                  <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-zinc-300">
                    <span className="flex items-center gap-1 font-bold">
                      <MapPin className="w-3 h-3 text-[#FFE600]" />
                      {t.map}
                    </span>
                    <span className="text-zinc-400">
                      {t.isCollegeOnly ? '🎓 College Only' : `by ${t.organizerName.split(' ').slice(-2).join(' ')}`}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3 space-y-2">
                  <h4 className="font-display font-black text-sm text-white leading-tight group-hover:text-[#FFE600] transition line-clamp-1">
                    {t.name}
                  </h4>

                  {/* Team size info row */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#FFE600] font-bold">
                      ₹{t.perKillReward || 10}/kill
                      {t.matchMode === 'DUO' || t.matchMode === 'SQUAD' ? '/player' : ''}
                      {' '}+ ₹20 Booyah
                    </span>
                    <span className="font-mono text-zinc-400">{slotLabel(t)}</span>
                  </div>

                  {/* Slot fill bar */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${slotsPercent}%`,
                        background: slotsPercent >= 90 ? '#EF4444' : slotsPercent >= 60 ? '#F59E0B' : '#FFE600',
                      }}
                    />
                  </div>

                  {/* Footer: countdown + CTA */}
                  <div className="pt-0.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                    <CountdownBadge startTime={t.startTime} status={t.status} />
                    <span className="text-[#FFE600] font-black group-hover:translate-x-1 transition">
                      {t.matchMode === 'SQUAD' ? 'JOIN SQUAD →' : t.matchMode === 'DUO' ? 'JOIN DUO →' : 'JOIN SOLO →'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
