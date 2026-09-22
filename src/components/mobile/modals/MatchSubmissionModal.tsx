import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trophy,
  Swords,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Camera,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  submitMatchResult,
  getUserMatchResultForMatch,
  calculateOfficialScore,
  DEFAULT_TOURNAMENT_SCORING,
} from '../../../firebase/matchResultService';
import { tapFeedback, booyahFeedback, successFeedback } from '../../../services/soundService';
import type { MatchResultDocument, TournamentScoringConfig } from '../../../types';

interface MatchSubmissionModalProps {
  match: any;
  tournament?: any;
  player?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MatchSubmissionModal: React.FC<MatchSubmissionModalProps> = ({
  match,
  tournament: propTournament,
  player,
  onClose,
  onSuccess,
}) => {
  const { user: authUser, firebaseUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Match & Tournament details
  const tournamentId = match?.tournamentId || propTournament?.id || propTournament?.tournamentId || match?.id || '';
  const matchedTournament = propTournament || match;
  const tournamentName = matchedTournament?.name || match?.title || match?.tournamentName || 'Tournament Match';
  const matchNumber = match?.matchNumber || 1;
  const matchSchedule = match?.startTime || match?.scheduledAt || matchedTournament?.startTime || 'Today';

  // Effective Player ID & Name
  const effectiveUserId =
    player?.id ||
    player?.uid ||
    authUser?.uid ||
    firebaseUser?.uid ||
    'usr-default';

  const effectivePlayerName =
    player?.name ||
    player?.displayName ||
    authUser?.name ||
    firebaseUser?.displayName ||
    'Player';

  const effectivePlayerUid =
    player?.uid ||
    player?.gameUid ||
    '';

  // Scoring rules
  const scoringConfig: TournamentScoringConfig = {
    killPointValue: matchedTournament?.scoringSystem?.killPoint || matchedTournament?.perKillReward ? 1 : DEFAULT_TOURNAMENT_SCORING.killPointValue,
    placementPoints: {
      ...DEFAULT_TOURNAMENT_SCORING.placementPoints,
      ...(matchedTournament?.scoringSystem?.placementPoints || {}),
    },
  };

  // Form State
  const [placement, setPlacement] = useState<number>(1);
  const [kills, setKills] = useState<number>(3);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Status & Validation State
  const [existingResult, setExistingResult] = useState<MatchResultDocument | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live estimated score
  const estimatedScore = calculateOfficialScore(placement, kills, scoringConfig);

  // Check if player has already submitted for this match
  useEffect(() => {
    let isMounted = true;
    if (tournamentId && match?.id && effectiveUserId) {
      setCheckingExisting(true);
      getUserMatchResultForMatch(tournamentId, match.id, effectiveUserId)
        .then((res) => {
          if (!isMounted) return;
          if (res) {
            setExistingResult(res);
            if (res.status === 'REJECTED') {
              // Pre-fill with old values so user can adjust
              setPlacement(res.placement || 1);
              setKills(res.kills || 0);
            }
          }
        })
        .finally(() => {
          if (isMounted) setCheckingExisting(false);
        });
    } else {
      setCheckingExisting(false);
    }
    return () => {
      isMounted = false;
    };
  }, [tournamentId, match?.id, effectiveUserId]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB.');
      return;
    }

    setErrorMessage(null);
    setProofFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    tapFeedback();
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setErrorMessage(null);

    if (!proofFile && !existingResult?.proofImageUrl) {
      setErrorMessage('Please select and upload your match end-screen screenshot.');
      return;
    }

    if (placement < 1 || placement > 48) {
      setErrorMessage('Placement must be between 1 and 48.');
      return;
    }

    if (kills < 0) {
      setErrorMessage('Kills must be 0 or higher.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitMatchResult({
        matchId: match.id,
        tournamentId,
        tournamentName,
        matchNumber,
        userId: effectiveUserId,
        playerName: effectivePlayerName,
        playerUid: effectivePlayerUid,
        teamId: player?.teamId || '',
        placement,
        kills,
        proofFile,
        scoring: scoringConfig,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }

      setSubmitSuccess(true);
      if (placement === 1) {
        booyahFeedback();
      } else {
        successFeedback();
      }

      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      console.error('[MatchSubmission] Submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit match result. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E0E12] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-in-up sm:animate-scale-up">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 bg-[#08080A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FFE600]" />
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">
              SUBMIT MATCH RESULT
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* Match Info Banner */}
          <div className="p-3 rounded-2xl bg-[#050507] border border-zinc-800 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-zinc-500 uppercase block">
                {tournamentName} • MATCH #{matchNumber}
              </span>
              <span className="text-xs font-black text-white truncate block">
                Player: {effectivePlayerName} {effectivePlayerUid && `(${effectivePlayerUid})`}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] font-bold text-zinc-500 uppercase block">SCHEDULE</span>
              <span className="text-xs font-mono font-bold text-[#FFE600]">{matchSchedule}</span>
            </div>
          </div>

          {/* Loading status check */}
          {checkingExisting ? (
            <div className="py-8 text-center space-y-2">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#FFE600]" />
              <p className="text-xs text-zinc-400">Checking match submission status...</p>
            </div>
          ) : submitSuccess ? (
            /* Success confirmation screen */
            <div className="py-6 text-center space-y-3 animate-scale-up">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-glow-yellow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-white uppercase">
                Result Submitted for Verification!
              </h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Your placement (#{placement}) and kills ({kills}) have been submitted along with your screenshot. An administrator will review your evidence shortly.
              </p>
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-xs font-mono text-[#FFE600]">
                Estimated Points: {estimatedScore} pts
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#FFE600] text-black font-black text-xs uppercase tracking-wider mt-2"
              >
                DONE
              </button>
            </div>
          ) : existingResult && existingResult.status === 'PENDING' ? (
            /* Already Pending */
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3 text-center">
              <Clock className="w-8 h-8 text-[#FFE600] mx-auto animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-black text-white text-sm uppercase">Under Verification</h4>
                <p className="text-xs text-amber-200">
                  Your result for this match is currently under review by the tournament organizers.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Claimed Placement:</span>
                  <span className="text-white font-bold">#{existingResult.placement}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Claimed Kills:</span>
                  <span className="text-white font-bold">{existingResult.kills}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase"
              >
                Close
              </button>
            </div>
          ) : existingResult && existingResult.status === 'APPROVED' ? (
            /* Already Approved */
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-black text-white text-sm uppercase">Result Verified</h4>
                <p className="text-xs text-emerald-200">
                  Your match result has already been officially verified and credited to the tournament leaderboard.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Official Placement:</span>
                  <span className="text-[#FFE600] font-black">#{existingResult.placement}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Official Kills:</span>
                  <span className="text-white font-bold">{existingResult.kills}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-1 text-zinc-300">
                  <span>Official Score:</span>
                  <span className="text-[#FFE600] font-black">{existingResult.calculatedScore} pts</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase"
              >
                Close
              </button>
            </div>
          ) : (
            /* Submission Form (New or Resubmission if Rejected) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {existingResult?.status === 'REJECTED' && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-1 text-xs text-red-200">
                  <div className="flex items-center gap-1.5 font-bold text-red-400 uppercase text-[10px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Previous Submission Rejected
                  </div>
                  <p>
                    <strong>Reason:</strong> {existingResult.adminNote || 'Evidence did not match match logs.'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Please correct your placement, kills, and upload a clear screenshot before resubmitting.
                  </p>
                </div>
              )}

              {/* Placement Rank Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>PLACEMENT RANK (1–48)</span>
                  {placement === 1 && (
                    <span className="text-[#FFE600] font-black flex items-center gap-1">
                      🏆 BOOYAH (+12 PTS)
                    </span>
                  )}
                  {(placement === 2 || placement === 3) && (
                    <span className="text-amber-400 font-bold">🥈 PODIUM FINISH</span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      tapFeedback();
                      setPlacement((p) => Math.max(1, p - 1));
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold text-white active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    -
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="1"
                      max="48"
                      value={placement}
                      onChange={(e) => {
                        tapFeedback();
                        const val = Number(e.target.value);
                        setPlacement(Math.max(1, Math.min(48, val || 1)));
                      }}
                      className="w-full bg-[#050507] border border-zinc-800 rounded-xl py-2.5 px-3 text-center text-lg text-[#FFE600] font-mono font-black focus:outline-none focus:border-[#FFE600]"
                      required
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                      #
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      tapFeedback();
                      setPlacement((p) => Math.min(48, p + 1));
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold text-white active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Kills Count Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>TOTAL KILLS (1 PT PER KILL)</span>
                  <span className="text-[#FFE600] font-mono font-bold">+{kills} pts</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      tapFeedback();
                      setKills((k) => Math.max(0, k - 1));
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold text-white active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="48"
                    value={kills}
                    onChange={(e) => {
                      tapFeedback();
                      const val = Number(e.target.value);
                      setKills(Math.max(0, Math.min(48, val || 0)));
                    }}
                    className="flex-1 bg-[#050507] border border-zinc-800 rounded-xl py-2.5 px-3 text-center text-lg text-white font-mono font-black focus:outline-none focus:border-[#FFE600]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      tapFeedback();
                      setKills((k) => Math.min(48, k + 1));
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-bold text-white active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Proof Screenshot Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                  MATCH END SCREENSHOT (PROOF)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                />

                {previewUrl || existingResult?.proofImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black/60 group">
                    <img
                      src={previewUrl || existingResult?.proofImageUrl}
                      alt="Proof Preview"
                      className="w-full h-36 object-contain bg-black"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-[#FFE600] text-black text-xs font-black uppercase cursor-pointer"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-[#FFE600]/50 bg-[#050507] text-center space-y-2 cursor-pointer transition active:scale-98"
                  >
                    <Camera className="w-6 h-6 mx-auto text-[#FFE600]" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">
                        Upload Match Result Screenshot
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        Tap to select JPG, JPEG, or PNG (Max 5MB)
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Estimated Score Live Preview */}
              <div className="p-3 rounded-2xl bg-[#050507] border border-[#FFE600]/30 space-y-1.5 shadow-glow-yellow-sm">
                <span className="text-[9px] font-black uppercase text-[#FFE600] tracking-wider block">
                  ESTIMATED OFFICIAL SCORE BREAKDOWN
                </span>
                <div className="text-xs text-zinc-300 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-sans">
                      Placement Points (#{placement}):
                    </span>
                    <span className="font-bold text-white">
                      +{scoringConfig.placementPoints[String(placement)] ?? 0} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-sans">
                      Kill Points ({kills} × 1 pt):
                    </span>
                    <span className="font-bold text-white">+{kills} pts</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-zinc-800 text-sm font-sans font-black">
                    <span className="text-white">ESTIMATED SCORE:</span>
                    <span className="font-mono text-[#FFE600]">{estimatedScore} pts</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-[10px] text-red-300">
                  {errorMessage}
                </div>
              )}

              {/* Manual Verification Note */}
              <p className="text-[9px] text-zinc-500 text-center leading-relaxed">
                ⚖️ <strong>Manual Admin Verification:</strong> An admin verifies the screenshot against match logs. Results remain PENDING and do not affect the leaderboard until approved.
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (!proofFile && !existingResult?.proofImageUrl)}
                className="w-full py-3 rounded-2xl bg-[#FFE600] hover:bg-[#FFF066] text-black font-black text-xs tracking-wider uppercase shadow-glow-yellow transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Proof & Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>SUBMIT FOR VERIFICATION ({estimatedScore} PTS)</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
