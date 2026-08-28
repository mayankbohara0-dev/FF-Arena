import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Copy,
  Check,
  Crown,
  Trophy,
  Share2,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { BadgePill } from '../../common/BadgePill';

interface TeamManagementModalProps {
  onClose: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ onClose }) => {
  const { currentUser, teams, colleges, createTeam, inviteToTeam } = useApp();
  const currentTeam = teams.find((t: any) => t.id === currentUser.teamId);

  const [isCreatingTeam, setIsCreatingTeam] = useState(!currentTeam);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !teamTag) return;
    await createTeam(teamName, teamTag, collegeId || undefined);
    setIsCreatingTeam(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim() || !currentTeam) return;
    const success = await inviteToTeam(currentTeam.id, inviteInput.trim());
    if (success) {
      setInviteInput('');
      alert(`Invited player "${inviteInput}" to roster!`);
    } else {
      alert('Roster is full (max 5 players).');
    }
  };

  const handleCopyInvite = () => {
    if (!currentTeam) return;
    navigator.clipboard.writeText(currentTeam.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white tracking-wide">
                {currentTeam && !isCreatingTeam ? 'SQUAD ROSTER & TEAM HUB' : 'CREATE ESPORTS SQUAD'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {currentTeam && !isCreatingTeam ? `Tag: [${currentTeam.tag}] | ${currentTeam.name}` : 'Free Fire Squad System'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {currentTeam && !isCreatingTeam ? (
            <div className="space-y-4">
              {/* Team Overview Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={currentTeam.logoUrl}
                    alt={currentTeam.name}
                    className="w-12 h-12 rounded-xl object-cover border border-orange-500/40"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-black text-base text-white">{currentTeam.name}</h4>
                      <BadgePill tier={currentTeam.tier} rating={currentTeam.rating} size="sm" />
                    </div>
                    <p className="text-xs text-slate-400">
                      {currentTeam.wins} Wins • {currentTeam.matchesPlayed} Matches
                    </p>
                  </div>
                </div>

                {/* Invite Code Box */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Squad Code</span>
                  <button
                    onClick={handleCopyInvite}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-mono font-bold border border-orange-500/30 transition"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span>{currentTeam.inviteCode}</span>
                  </button>
                </div>
              </div>

              {/* Roster List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active Roster ({currentTeam.members.length}/5)
                  </h5>
                  <span className="text-[11px] text-slate-500">4 Main + 1 Substitute</span>
                </div>
                <div className="space-y-2">
                  {currentTeam.members.map((member: any) => (
                    <div
                      key={member.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.displayName}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <span>{member.user.displayName}</span>
                            {member.role === 'CAPTAIN' && (
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            UID: {member.user.gamerProfile?.gameUid || '73910284'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.user.gamerProfile && (
                          <BadgePill tier={member.user.gamerProfile.tier} size="sm" />
                        )}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Member Input */}
              <form onSubmit={handleInvite} className="pt-2">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Invite Member by Free Fire UID or Gamer Tag
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 982347101 or HYPER_FRAGGER"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-glow-orange flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* CREATE TEAM FORM */
            <form onSubmit={handleCreateTeam} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Squad / Team Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vortex Gaming"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Clan Tag (2-4 Chars)
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="e.g. VRX"
                  value={teamTag}
                  onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  College Affiliation (Optional)
                </label>
                <select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">No College Affiliation (Open Squad)</option>
                  {colleges.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shortCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-orange flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Create Squad Roster</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
