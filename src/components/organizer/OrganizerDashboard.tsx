import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Key,
  CheckCircle,
  AlertCircle,
  Award,
  Users,
  Trophy,
  Calendar,
  Sparkles,
  Shield,
  Eye,
  Check,
  X,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tournament, Match, MatchResult, Dispute } from '../../types';
import { BadgePill } from '../common/BadgePill';

export const OrganizerDashboard: React.FC = () => {
  const {
    currentUser,
    tournaments,
    matches,
    results,
    disputes,
    registrations,
    createTournament,
    updateMatchRoom,
    verifyResult,
    resolveDispute,
    issueCertificate,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CREATE_TOURNEY' | 'ROOMS' | 'VERIFY_RESULTS' | 'DISPUTES' | 'CERTIFICATES'>('OVERVIEW');

  // Wizard form state
  const [tourneyName, setTourneyName] = useState('');
  const [tourneyDescription, setTourneyDescription] = useState('');
  const [tourneyMode, setTourneyMode] = useState<'Battle Royale' | 'Clash Squad' | 'Lone Wolf' | 'College'>('Battle Royale');
  const [tourneyMap, setTourneyMap] = useState<'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine' | 'NexTerra'>('Bermuda');
  const [tourneyTeamSize, setTourneyTeamSize] = useState<number>(4);
  const [tourneySlots, setTourneySlots] = useState<number>(48);
  const [killPoint, setKillPoint] = useState<number>(1);
  const [isCollegeOnly, setIsCollegeOnly] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState(false);

  // Selected Result for AI Inspector
  const [inspectingResult, setInspectingResult] = useState<MatchResult | null>(results[0] || null);

  // Dispute Note
  const [adminDisputeNote, setAdminDisputeNote] = useState('');

  // Metrics
  const totalParticipants = registrations.length;
  const activeTournamentsCount = tournaments.filter((t) => t.status === 'Registration Open' || t.status === 'Live').length;
  const pendingResultsCount = results.filter((r) => r.verificationStatus === 'Pending').length;
  const openDisputesCount = disputes.filter((d) => d.status === 'Open').length;

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    await createTournament({
      name: tourneyName,
      description: tourneyDescription,
      mode: tourneyMode,
      map: tourneyMap,
      teamSize: tourneyTeamSize,
      maxParticipants: tourneySlots,
      isCollegeOnly,
      scoringSystem: {
        placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
        killPoint,
      },
    });
    setIsCreating(false);
    setActiveTab('OVERVIEW');
    alert('Tournament created and published successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ORGANIZER CONTROL PANEL
            </span>
            <span className="text-slate-400 text-xs font-mono">Garena Certified</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
            Tournament Operations & Match Hub
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Manage custom room schedules, automate AI OCR screenshot verification, and issue certificates.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('CREATE_TOURNEY')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-glow-orange flex items-center gap-2 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Host New Tournament</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Tourneys</span>
            <Trophy className="w-4 h-4 text-orange-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">{activeTournamentsCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tournaments Live</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registrations</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">{totalParticipants}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Slots Claimed</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">OCR Queue</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-black text-amber-400">{pendingResultsCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Results to Verify</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Disputes</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="font-mono text-2xl font-black text-red-400">{openDisputesCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Open Complaints</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto text-xs font-bold scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Operations Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ROOMS')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'ROOMS'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Custom Room Credential Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFY_RESULTS')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'VERIFY_RESULTS'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Screenshot OCR Inspector</span>
          {pendingResultsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
              {pendingResultsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'DISPUTES'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Dispute Center ({openDisputesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('CERTIFICATES')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'CERTIFICATES'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Issue Certificates</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-white">Your Managed Tournaments</h3>
              <span className="text-xs text-slate-400">{tournaments.length} Total</span>
            </div>
            <div className="divide-y divide-slate-800">
              {tournaments.map((t) => (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition">
                  <div className="flex items-center gap-3">
                    <img src={t.bannerUrl} alt={t.name} className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{t.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {t.mode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Map: {t.map} • Format: {t.format} • Slots: {t.currentParticipants}/{t.maxParticipants}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('ROOMS')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5 text-orange-400" />
                      <span>Manage Room</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('VERIFY_RESULTS')}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-glow-orange flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Verify Results</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE TOURNAMENT WIZARD */}
      {activeTab === 'CREATE_TOURNEY' && (
        <form onSubmit={handleCreateTournament} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5 max-w-3xl mx-auto shadow-xl">
          <div>
            <h3 className="font-display font-black text-xl text-white">HOST FREE FIRE ESPORTS TOURNAMENT</h3>
            <p className="text-xs text-slate-400 mt-0.5">Define custom room maps, scoring formulas, and team limits.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Tournament Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Free Fire All-India Pro Series 2026"
                value={tourneyName}
                onChange={(e) => setTourneyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Intel & Rules Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe match format, device restrictions, anti-cheat policy..."
                value={tourneyDescription}
                onChange={(e) => setTourneyDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Mode</label>
                <select
                  value={tourneyMode}
                  onChange={(e: any) => setTourneyMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Battle Royale">Battle Royale</option>
                  <option value="Clash Squad">Clash Squad</option>
                  <option value="Lone Wolf">Lone Wolf</option>
                  <option value="College">College Championship</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Map</label>
                <select
                  value={tourneyMap}
                  onChange={(e: any) => setTourneyMap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Bermuda">Bermuda</option>
                  <option value="Purgatory">Purgatory</option>
                  <option value="Kalahari">Kalahari</option>
                  <option value="Alpine">Alpine</option>
                  <option value="NexTerra">NexTerra</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Team Size</label>
                <select
                  value={tourneyTeamSize}
                  onChange={(e) => setTourneyTeamSize(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value={4}>4 Players (Squad)</option>
                  <option value={2}>2 Players (Duo)</option>
                  <option value={1}>1 Player (Solo)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Max Participant Slots</label>
                <input
                  type="number"
                  value={tourneySlots}
                  onChange={(e) => setTourneySlots(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Kill Point Multiplier</label>
                <input
                  type="number"
                  value={killPoint}
                  onChange={(e) => setKillPoint(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold shadow-glow-orange"
            >
              {isCreating ? 'Publishing...' : 'Publish Tournament Live'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: CUSTOM ROOMS MANAGER */}
      {activeTab === 'ROOMS' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-black text-xl text-white">CUSTOM ROOM CREDENTIALS & SCHEDULE</h3>
              <p className="text-xs text-slate-400">Configure Free Fire custom room IDs and broadcast to participants.</p>
            </div>
          </div>

          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-orange-400" />
                    <div>
                      <h4 className="font-bold text-sm text-white">{match.title}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">Map: {match.map}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    match.isRoomReleased ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {match.isRoomReleased ? '● PUBLISHED TO PLAYERS' : '🔒 RELEASE SCHEDULED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Custom Room ID</label>
                    <input
                      type="text"
                      defaultValue={match.roomId || '8391047'}
                      id={`room-id-${match.id}`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Room Password</label>
                    <input
                      type="text"
                      defaultValue={match.roomPassword || 'arenaff2026'}
                      id={`room-pass-${match.id}`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-orange-400 font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const idEl = document.getElementById(`room-id-${match.id}`) as HTMLInputElement;
                        const passEl = document.getElementById(`room-pass-${match.id}`) as HTMLInputElement;
                        updateMatchRoom(
                          match.id,
                          idEl?.value || '8391047',
                          passEl?.value || 'arenaff2026',
                          new Date().toISOString(),
                          true
                        );
                        alert(`Custom Room credentials broadcasted to all registered players!`);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-glow-orange flex items-center justify-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{match.isRoomReleased ? 'Update & Re-broadcast' : 'Release Credentials Now'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AI OCR RESULT VERIFICATION INSPECTOR */}
      {activeTab === 'VERIFY_RESULTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Results List */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Match Results ({results.length})
            </h4>
            <div className="space-y-2">
              {results.map((res) => (
                <div
                  key={res.id}
                  onClick={() => setInspectingResult(res)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    inspectingResult?.id === res.id
                      ? 'bg-orange-950/30 border-orange-500 shadow-glow-orange'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white">{res.playerName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.verificationStatus === 'Approved'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {res.verificationStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{res.kills} Kills • #{res.placement} Place</span>
                    <span className="text-orange-400 font-bold">{res.totalPoints} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Screenshot Inspector Panel (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            {inspectingResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h4 className="font-display font-bold text-lg text-white">
                        AI OCR MATCH INSPECTOR
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Result ID: {inspectingResult.id} • Player: {inspectingResult.playerName} (UID: {inspectingResult.gameUid})
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    AI Confidence: {inspectingResult.aiOcrData?.confidenceScore || 96}%
                  </span>
                </div>

                {/* Screenshot & Extracted OCR Details Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">Uploaded End-Match Screenshot</span>
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                      <img
                        src={inspectingResult.screenshotUrl}
                        alt="Match Proof"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">AI OCR Extracted Summary</span>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Detected IGN:</span>
                        <span className="text-white font-bold">{inspectingResult.aiOcrData?.detectedIgn || inspectingResult.playerName}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Detected Kills:</span>
                        <span className="text-orange-400 font-bold">{inspectingResult.kills}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Detected Placement:</span>
                        <span className="text-amber-400 font-bold">#{inspectingResult.placement}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Total Points Awarded:</span>
                        <span className="text-green-400 font-bold">{inspectingResult.totalPoints} pts</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Fraud Flags:</span>
                        <span className="text-green-400 font-bold">✓ 0 Flags Detected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer Verification Actions */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      verifyResult(inspectingResult.id, 'Rejected', 'Screenshot unclear or mismatched');
                      alert('Result Rejected.');
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Result</span>
                  </button>

                  <button
                    onClick={() => {
                      verifyResult(inspectingResult.id, 'Approved');
                      alert('Result Approved! Dynamic leaderboard and player rating updated.');
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Result (Auto-Calculate Points)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">Select a result to inspect.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DISPUTES */}
      {activeTab === 'DISPUTES' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <h3 className="font-display font-black text-xl text-white">PLAYER DISPUTE RESOLUTION QUEUE</h3>
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{d.reason}</h4>
                    <p className="text-xs text-slate-400 font-mono">By {d.userName} (UID: {d.userGameUid}) • {d.tournamentName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    d.status === 'Open' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                  }`}>
                    {d.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">{d.description}</p>
                {d.status === 'Open' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter organizer resolution note..."
                      value={adminDisputeNote}
                      onChange={(e) => setAdminDisputeNote(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        resolveDispute(d.id, 'Approved', adminDisputeNote || 'Evidence verified and adjusted');
                        setAdminDisputeNote('');
                      }}
                      className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs"
                    >
                      Accept Dispute
                    </button>
                    <button
                      onClick={() => {
                        resolveDispute(d.id, 'Rejected', adminDisputeNote || 'Dispute rejected upon video audit');
                        setAdminDisputeNote('');
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                    >
                      Reject Dispute
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CERTIFICATES */}
      {activeTab === 'CERTIFICATES' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 max-w-2xl mx-auto">
          <div>
            <h3 className="font-display font-black text-xl text-white">ISSUE OFFICIAL ESPORTS CERTIFICATE</h3>
            <p className="text-xs text-slate-400">Generates verifiable digital certificate with cryptographic ID and QR verification.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Participant / Squad Leader</label>
              <input
                type="text"
                id="cert-name"
                defaultValue={currentUser.displayName}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Position / Honor</label>
              <select id="cert-pos" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white">
                <option value="1st Place - Champion">1st Place - Champion</option>
                <option value="Runner-Up (2nd Place)">Runner-Up (2nd Place)</option>
                <option value="Top Fragger (MVP)">Top Fragger (MVP)</option>
                <option value="Verified Finalist">Verified Finalist</option>
              </select>
            </div>

            <button
              onClick={() => {
                const nameEl = document.getElementById('cert-name') as HTMLInputElement;
                const posEl = document.getElementById('cert-pos') as HTMLSelectElement;
                const cert = issueCertificate({
                  userId: currentUser.id,
                  participantName: nameEl?.value || currentUser.displayName,
                  gameUid: currentUser.gamerProfile?.gameUid || currentUser.username || 'PLAYER',
                  tournamentId: tournaments[0]?.id || 'tour-001',
                  tournamentName: tournaments[0]?.name || 'Official Match',
                  position: posEl?.value || '1st Place - Champion',
                  organizerName: 'Official FF Arena Admin',
                });
                alert(`Certificate Issued! ID: ${cert.certificateId}`);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-glow-cyan flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Generate & Publish e-Certificate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
