import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  RefreshCw,
  X,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trophy,
  Swords,
  User,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import type { MatchResultDocument, MatchResultStatus } from '../../types';
import {
  subscribeAllMatchResults,
  approveMatchResultTransaction,
  rejectMatchResultTransaction,
  correctMatchResultTransaction,
  calculateOfficialScore,
} from '../../firebase/matchResultService';
import { useAuth } from '../../context/AuthContext';
import { isEmailAdmin } from '../../firebase/authService';

interface MatchResultVerificationPanelProps {
  adminUid: string;
  showToast?: (msg: string) => void;
  onClose?: () => void;
}

const REJECTION_PRESETS = [
  'Screenshot does not match match result',
  'Wrong placement claimed',
  'Wrong kill count claimed',
  'Unclear / blurry / cropped screenshot',
  'Duplicate submission reference',
  'Suspected forged/edited image',
  'Other',
];

export const MatchResultVerificationPanel: React.FC<MatchResultVerificationPanelProps> = ({
  adminUid,
  showToast,
  onClose,
}) => {
  const { user: authUser, firebaseUser } = useAuth();
  const currentEmail = authUser?.email || firebaseUser?.email || '';
  const isAuthorizedAdmin = isEmailAdmin(currentEmail) || authUser?.role === 'admin';

  const [results, setResults] = useState<MatchResultDocument[]>([]);
  const [filter, setFilter] = useState<'ALL' | MatchResultStatus>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  const [approvingResult, setApprovingResult] = useState<MatchResultDocument | null>(null);
  const [rejectingResult, setRejectingResult] = useState<MatchResultDocument | null>(null);
  const [correctingResult, setCorrectingResult] = useState<MatchResultDocument | null>(null);

  const [rejectionReason, setRejectionReason] = useState(REJECTION_PRESETS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');

  // Correction form
  const [correctPlacement, setCorrectPlacement] = useState(1);
  const [correctKills, setCorrectKills] = useState(0);
  const [correctionReason, setCorrectionReason] = useState('');

  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Subscribe to real-time match results across all tournaments
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllMatchResults((allList) => {
      setResults(allList);
      setLoading(false);
    }, 'ALL');

    return () => {
      unsubscribe();
    };
  }, []);

  // Unique tournaments for dropdown
  const uniqueTournaments = Array.from(
    new Set(results.map((r) => r.tournamentName || r.tournamentId).filter(Boolean))
  );

  // Filtered results
  const filteredResults = results.filter((r) => {
    const matchStatus = filter === 'ALL' || r.status === filter;
    if (!matchStatus) return false;

    if (tournamentFilter !== 'ALL') {
      const tName = r.tournamentName || r.tournamentId;
      if (tName !== tournamentFilter) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.playerName?.toLowerCase().includes(q) ||
      r.playerUid?.toLowerCase().includes(q) ||
      r.userId?.toLowerCase().includes(q) ||
      r.tournamentName?.toLowerCase().includes(q) ||
      r.resultId?.toLowerCase().includes(q)
    );
  });

  const pendingCount = results.filter((r) => r.status === 'PENDING').length;
  const approvedCount = results.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = results.filter((r) => r.status === 'REJECTED').length;

  // Handle Approve
  const handleApproveConfirm = async () => {
    if (!approvingResult) return;
    setActionInProgress(true);
    setActionError(null);

    try {
      const res = await approveMatchResultTransaction(approvingResult.resultId, adminUid);
      showToast?.(res.message);
      setApprovingResult(null);
    } catch (err: any) {
      console.error('[Admin] Approval error:', err);
      setActionError(err.message || 'Failed to approve result.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle Reject
  const handleRejectConfirm = async () => {
    if (!rejectingResult) return;
    const finalReason = rejectionReason === 'Other'
      ? customRejectNote.trim()
      : customRejectNote.trim()
      ? `${rejectionReason} — ${customRejectNote.trim()}`
      : rejectionReason;

    if (!finalReason) {
      setActionError('Please provide a reason for rejection.');
      return;
    }

    setActionInProgress(true);
    setActionError(null);

    try {
      const res = await rejectMatchResultTransaction(rejectingResult.resultId, adminUid, finalReason);
      showToast?.(res.message);
      setRejectingResult(null);
      setCustomRejectNote('');
    } catch (err: any) {
      console.error('[Admin] Rejection error:', err);
      setActionError(err.message || 'Failed to reject result.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle Correction / Override
  const handleCorrectConfirm = async () => {
    if (!correctingResult) return;
    if (!correctionReason.trim()) {
      setActionError('Please provide a reason for correcting this result.');
      return;
    }

    setActionInProgress(true);
    setActionError(null);

    try {
      const res = await correctMatchResultTransaction(
        correctingResult.resultId,
        adminUid,
        correctPlacement,
        correctKills,
        correctionReason.trim()
      );
      showToast?.(res.message);
      setCorrectingResult(null);
      setCorrectionReason('');
    } catch (err: any) {
      console.error('[Admin] Correction error:', err);
      setActionError(err.message || 'Failed to correct result.');
    } finally {
      setActionInProgress(false);
    }
  };

  const openCorrectionModal = (r: MatchResultDocument) => {
    setCorrectingResult(r);
    setCorrectPlacement(r.placement);
    setCorrectKills(r.kills);
    setCorrectionReason('');
    setActionError(null);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header Banner */}
      <div className="p-4 mx-4 mt-2 rounded-2xl bg-gradient-to-r from-[#121929] to-[#0A0F1D] border border-[#202B40] shadow-card-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD600]/15 border border-[#FFD600]/30 flex items-center justify-center text-[#FFD600]">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">
              MATCH RESULT VERIFICATION
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#FFD600] text-black">
                STEP 5
              </span>
            </h2>
            <p className="text-[10px] text-zinc-400">
              Manual admin inspection of match proofs & atomic leaderboard updates
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A233A] border border-[#202B40] text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Manual Verification Disclaimer Notice */}
      <div className="mx-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-[11px] text-amber-200">
        <AlertTriangle className="w-4 h-4 text-[#FFD600] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-bold">Manual Verification Required</strong>
          Compare the submitted screenshot with your official custom room match report. Approving atomically credits official score and updates the official tournament leaderboard without double-counting.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mx-4 flex gap-1 p-1 rounded-xl bg-[#0B101D] border border-[#202B40]">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => {
          const count =
            tab === 'PENDING'
              ? pendingCount
              : tab === 'APPROVED'
              ? approvedCount
              : tab === 'REJECTED'
              ? rejectedCount
              : results.length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
                filter === tab
                  ? 'bg-[#FFD600] text-black shadow-glow-yellow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                  filter === tab
                    ? 'bg-black text-[#FFD600]'
                    : tab === 'PENDING' && pendingCount > 0
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Tournament Dropdown */}
      <div className="mx-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Player, UID, Tournament, ID..."
            className="w-full pl-9 pr-3 py-2 bg-[#0B101D] border border-[#202B40] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFD600]"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0B101D] border border-[#202B40] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFD600] cursor-pointer"
          >
            <option value="ALL">All Tournaments</option>
            {uniqueTournaments.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="mx-4 space-y-3">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#FFD600]" />
            <p className="text-xs text-zinc-400">Loading submitted match results from Firestore...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-[#0E1424] rounded-2xl border border-zinc-800 p-6">
            <Trophy className="w-10 h-10 mx-auto opacity-25 text-[#FFD600]" />
            <p className="font-bold text-white text-sm">No match results found</p>
            <p className="text-xs text-zinc-400">
              {filter === 'PENDING'
                ? 'All submitted match results have been reviewed!'
                : `No results with status ${filter}`}
            </p>
          </div>
        ) : (
          filteredResults.map((res) => {
            const isPending = res.status === 'PENDING';
            const isApproved = res.status === 'APPROVED';
            const isRejected = res.status === 'REJECTED';

            return (
              <div
                key={res.resultId}
                className="p-4 rounded-2xl bg-[#0D1424] border border-[#202B40] space-y-3.5 shadow-card-dark transition hover:border-[#2D3C5A]"
              >
                {/* Header row: Tournament, Match, Status */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#202B40]">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-[#FFD600] uppercase tracking-wider block">
                      {res.tournamentName || 'Tournament'} • Match #{res.matchNumber || 1}
                    </span>
                    <h4 className="font-black text-white text-sm truncate flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      {res.playerName}
                      {res.playerUid && (
                        <span className="text-[10px] font-mono text-zinc-400 font-normal">
                          (UID: {res.playerUid})
                        </span>
                      )}
                    </h4>
                    <span className="text-[9px] font-mono text-zinc-500 block truncate">
                      ID: {res.resultId} • User: {res.userId}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 shrink-0 border ${
                      isPending
                        ? 'bg-[#FFD600]/15 text-[#FFD600] border-[#FFD600]/30'
                        : isApproved
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}
                  >
                    {isPending && <Clock className="w-3 h-3 animate-pulse" />}
                    {isApproved && <CheckCircle2 className="w-3 h-3" />}
                    {isRejected && <XCircle className="w-3 h-3" />}
                    {res.status}
                  </span>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
                    <span className="text-[8px] font-bold uppercase text-zinc-400 block">PLACEMENT</span>
                    <span className="text-base font-black font-mono text-[#FFD600]">
                      #{res.placement}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
                    <span className="text-[8px] font-bold uppercase text-zinc-400 block">KILLS</span>
                    <span className="text-base font-black font-mono text-white">
                      {res.kills} Kills
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#FFD600]/25">
                    <span className="text-[8px] font-bold uppercase text-[#FFD600] block">
                      {isApproved ? 'OFFICIAL SCORE' : 'CALC SCORE'}
                    </span>
                    <span className="text-base font-black font-mono text-[#FFD600]">
                      {res.calculatedScore} pts
                    </span>
                  </div>
                </div>

                {/* Proof screenshot thumbnail & view button */}
                {res.proofImageUrl ? (
                  <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        onClick={() => {
                          setLightboxImageUrl(res.proofImageUrl);
                          setLightboxZoom(1);
                          setLightboxRotation(0);
                        }}
                        className="w-14 h-14 rounded-lg overflow-hidden bg-black border border-zinc-700 shrink-0 cursor-pointer relative group"
                      >
                        <img
                          src={res.proofImageUrl}
                          alt="Proof"
                          className="w-full h-full object-cover group-hover:scale-110 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-zinc-300 block">
                          Match Result Screenshot Proof
                        </span>
                        <span className="text-[9px] text-zinc-500 block truncate">
                          Stored in Firebase Storage
                        </span>
                        <button
                          onClick={() => {
                            setLightboxImageUrl(res.proofImageUrl);
                            setLightboxZoom(1);
                            setLightboxRotation(0);
                          }}
                          className="text-[10px] text-[#FFD600] hover:underline flex items-center gap-1 font-bold mt-0.5 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> View & Zoom Screenshot
                        </button>
                      </div>
                    </div>

                    <a
                      href={res.proofImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                      title="Open full resolution in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[10px] text-zinc-500">
                    No proof screenshot attached.
                  </div>
                )}

                {/* Admin Note if present */}
                {res.adminNote && (
                  <div className={`p-2.5 rounded-xl text-[10px] border ${
                    isRejected
                      ? 'bg-red-500/10 border-red-500/25 text-red-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}>
                    <strong>Admin Note:</strong> {res.adminNote}
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-[9px] text-zinc-500 flex items-center justify-between pt-1">
                  <span>
                    Submitted: {res.submittedAt?.seconds ? new Date(res.submittedAt.seconds * 1000).toLocaleString() : 'Recent'}
                  </span>
                  {res.verifiedBy && (
                    <span>Verified by: {res.verifiedBy.slice(0, 10)}...</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#202B40]">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => {
                          setApprovingResult(res);
                          setActionError(null);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        APPROVE RESULT
                      </button>

                      <button
                        onClick={() => {
                          setRejectingResult(res);
                          setRejectionReason(REJECTION_PRESETS[0]);
                          setCustomRejectNote('');
                          setActionError(null);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        REJECT
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Correction button for approved/rejected results */}
                      <button
                        onClick={() => openCorrectionModal(res)}
                        className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition cursor-pointer border border-zinc-700"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#FFD600]" />
                        CORRECT / OVERRIDE RESULT
                      </button>

                      {isApproved && (
                        <button
                          onClick={() => {
                            setRejectingResult(res);
                            setRejectionReason('Suspected forged/edited image');
                            setCustomRejectNote('');
                          }}
                          className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 text-xs font-bold transition cursor-pointer"
                        >
                          Revoke Approval
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── SCREENSHOT LIGHTBOX MODAL ──────────────────────────────────────── */}
      {lightboxImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#080D18] border border-[#202B40] rounded-2xl overflow-hidden shadow-2xl">
            {/* Lightbox Controls Header */}
            <div className="p-3 bg-[#0A0F1D] border-b border-[#202B40] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#FFD600]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  MATCH RESULT PROOF VIEWER
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-zinc-400 w-12 text-center">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white ml-1"
                  title="Rotate 90°"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setLightboxZoom(1);
                    setLightboxRotation(0);
                  }}
                  className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 ml-1"
                >
                  Reset
                </button>
                <button
                  onClick={() => setLightboxImageUrl(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Container */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[300px]">
              <img
                src={lightboxImageUrl}
                alt="Match Proof"
                style={{
                  transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── APPROVE CONFIRMATION MODAL ────────────────────────────────────── */}
      {approvingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0E1424] border border-[#202B40] rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white uppercase">Approve Match Result?</h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to approve this match result for{' '}
                <strong className="text-white">{approvingResult.playerName}</strong>?
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400 font-sans">Placement:</span>
                <span className="text-[#FFD600] font-black">#{approvingResult.placement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-sans">Kills:</span>
                <span className="text-white font-bold">{approvingResult.kills}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-1.5">
                <span className="text-zinc-300 font-sans font-bold">Official Score:</span>
                <span className="text-[#FFD600] font-black">
                  {approvingResult.calculatedScore} pts
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/25 text-[10px] text-purple-300">
              ⚡ Atomically updates the official tournament leaderboard without duplicate points.
            </div>

            {actionError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-300">
                {actionError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setApprovingResult(null)}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                {actionInProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    CONFIRM APPROVE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REJECT MODAL ──────────────────────────────────────────────────── */}
      {rejectingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0E1424] border border-[#202B40] rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white uppercase">Reject Match Result</h3>
              <p className="text-xs text-zinc-400">
                Specify the reason for rejecting {rejectingResult.playerName}&apos;s submission.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                Standard Rejection Reason:
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full py-2 px-3 bg-[#080D18] border border-[#202B40] rounded-xl text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {REJECTION_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <textarea
                value={customRejectNote}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder="Additional notes for the player (optional)..."
                rows={3}
                className="w-full p-2.5 bg-[#080D18] border border-[#202B40] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {actionError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-300">
                {actionError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setRejectingResult(null)}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-black text-xs font-black uppercase transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                {actionInProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    CONFIRM REJECT
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CORRECTION / OVERRIDE MODAL ───────────────────────────────────── */}
      {correctingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0E1424] border border-[#202B40] rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#202B40]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#FFD600]" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  CORRECT MATCH RESULT
                </h3>
              </div>
              <button
                onClick={() => setCorrectingResult(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs text-zinc-400">
              Player: <strong className="text-white">{correctingResult.playerName}</strong> ({correctingResult.tournamentName})
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Correct Placement (1–48)
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={correctPlacement}
                  onChange={(e) => setCorrectPlacement(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-[#080D18] border border-[#202B40] rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-[#FFD600]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Correct Kills (≥ 0)
                </label>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={correctKills}
                  onChange={(e) => setCorrectKills(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-[#080D18] border border-[#202B40] rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-[#FFD600]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">New Recalculated Score:</span>
              <span className="font-mono font-black text-[#FFD600]">
                {calculateOfficialScore(correctPlacement, correctKills)} pts
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">
                Mandatory Correction Reason:
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g. Corrected based on room scoreboard screenshot..."
                rows={2}
                className="w-full p-2.5 bg-[#080D18] border border-[#202B40] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFD600] resize-none"
              />
            </div>

            {actionError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-300">
                {actionError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setCorrectingResult(null)}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCorrectConfirm}
                disabled={actionInProgress || !correctionReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#FFD600] hover:bg-[#FFE033] text-black text-xs font-black uppercase transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionInProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    SAVE & UPDATE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
