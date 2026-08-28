import React from 'react';
import {
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Tournament } from '../../../types';

interface CollegeEsportsTabProps {
  onSelectTournament: (t: Tournament) => void;
  onOpenTeamModal: () => void;
}

export const CollegeEsportsTab: React.FC<CollegeEsportsTabProps> = ({
  onSelectTournament,
  onOpenTeamModal,
}) => {
  const { colleges, tournaments, currentUser } = useApp();
  const collegeTournaments = tournaments.filter((t: any) => t.isCollegeOnly);
  const userCollege = colleges.find((c: any) => c.id === currentUser.collegeId);

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* 1. College Esports Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/50 border border-cyan-500/40 space-y-3 shadow-glow-cyan">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-white tracking-wide">
              ALL-INDIA INTER-COLLEGE ESPORTS
            </h3>
            <p className="text-[11px] text-cyan-300">
              Verified campus championships & collegiate rankings 🇮🇳
            </p>
          </div>
        </div>

        {/* User's Verified Campus Status */}
        {userCollege ? (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={userCollege.logoUrl}
                alt={userCollege.name}
                className="w-10 h-10 rounded-lg object-cover border border-cyan-500/30"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-xs text-white">{userCollege.name}</h4>
                  <span className="text-cyan-400 text-xs font-bold" title="Verified Campus">✓</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {currentUser.collegeCourse} • Year {currentUser.collegeYear}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/30">
              VERIFIED
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Join with your College ID</h4>
              <p className="text-[11px] text-slate-400">Unlock inter-college championship brackets</p>
            </div>
            <button
              onClick={onOpenTeamModal}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
            >
              Verify Campus
            </button>
          </div>
        )}
      </div>

      {/* 2. College Championship Tournaments */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Active Collegiate Tournaments
        </h4>
        <div className="space-y-3">
          {collegeTournaments.map((t: any) => (
            <div
              key={t.id}
              onClick={() => onSelectTournament(t)}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center gap-3.5 group"
            >
              <img
                src={t.bannerUrl}
                alt={t.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-cyan-500/30"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                    🎓 College League
                  </span>
                  <span className="text-[10px] text-slate-400">{t.map}</span>
                </div>
                <h5 className="font-bold text-xs text-white truncate group-hover:text-cyan-400 transition">
                  {t.name}
                </h5>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{t.currentParticipants}/{t.maxParticipants} Squads</span>
                  <span className="text-cyan-400 font-bold">Register &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. College Standings & Points Table */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          National College Esports Leaderboard
        </h4>
        <div className="space-y-2">
          {colleges.map((col: any, idx: number) => (
            <div
              key={col.id}
              className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                  idx === 0
                    ? 'bg-amber-500 text-slate-950 shadow-glow-amber'
                    : idx === 1
                    ? 'bg-slate-300 text-slate-950'
                    : idx === 2
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  #{idx + 1}
                </span>
                <img
                  src={col.logoUrl}
                  alt={col.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                />
                <div>
                  <h5 className="font-bold text-xs text-white">{col.name}</h5>
                  <span className="text-[10px] text-slate-400">{col.city}, {col.state} • {col.activeTeamsCount} Squads</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-black text-cyan-400">{col.totalPoints} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
