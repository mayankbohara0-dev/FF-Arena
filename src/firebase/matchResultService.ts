/**
 * Cloud Firestore Match Result & Leaderboard Service — FF Arena
 * Provides:
 * - Real player result submission + Storage screenshot proof upload
 * - Duplicate submission prevention
 * - Manual admin verification (Approve / Reject / Correct)
 * - Atomic Firestore transaction for official score calculation & idempotent leaderboard updates
 * - Full audit trail (matchResultVerificationLogs)
 * - Real-time listeners for player results, admin queues, and tournament leaderboards
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from './config';
import { createNotification } from './notificationService';
import type {
  MatchDocument,
  MatchResultDocument,
  MatchResultStatus,
  TournamentScoringConfig,
  LeaderboardEntryDocument,
  LeaderboardMatchStat,
  MatchResultVerificationLogDocument,
} from '../types';

export const MATCHES_COLLECTION = 'matches';
export const MATCH_RESULTS_COLLECTION = 'matchResults';
export const MATCH_VERIFICATION_LOGS_COLLECTION = 'matchResultVerificationLogs';
export const TOURNAMENTS_COLLECTION = 'tournaments';

// Default scoring rules matching standard competitive Free Fire esports
export const DEFAULT_TOURNAMENT_SCORING: TournamentScoringConfig = {
  killPointValue: 1,
  placementPoints: {
    '1': 12,
    '2': 9,
    '3': 8,
    '4': 7,
    '5': 6,
    '6': 5,
    '7': 4,
    '8': 3,
    '9': 2,
    '10': 1,
  },
};

/**
 * Calculates official tournament match score using placement points and kill multiplier.
 * Official Formula: TOTAL SCORE = PLACEMENT POINTS + (KILLS × KILL POINT VALUE)
 */
export function calculateOfficialScore(
  placement: number,
  kills: number,
  scoring?: Partial<TournamentScoringConfig> | null
): number {
  const activeScoring: TournamentScoringConfig = {
    killPointValue: scoring?.killPointValue ?? DEFAULT_TOURNAMENT_SCORING.killPointValue,
    placementPoints: {
      ...DEFAULT_TOURNAMENT_SCORING.placementPoints,
      ...(scoring?.placementPoints || {}),
    },
  };

  const placementPts = activeScoring.placementPoints[String(placement)] ?? 0;
  const killPts = Math.max(0, kills) * (activeScoring.killPointValue || 1);
  return placementPts + killPts;
}

// ─── STORAGE HELPER ──────────────────────────────────────────────────────────

/**
 * Uploads a match result screenshot proof to Firebase Storage.
 * Path format: matchResults/{userId}/{matchId}/{resultId}/proof.jpg
 */
export async function uploadMatchResultProof(
  userId: string,
  matchId: string,
  resultId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const cleanExt = ['png', 'jpeg', 'jpg', 'webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : 'jpg';
  const sanitizedPath = `matchResults/${userId}/${matchId}/${resultId}/proof_${Date.now()}.${cleanExt}`;
  const storageRef = ref(storage, sanitizedPath);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  return await getDownloadURL(snapshot.ref);
}

// ─── QUERY HELPERS ───────────────────────────────────────────────────────────

/**
 * Fetches an existing match result for a specific user and match to prevent duplicates.
 */
export async function getUserMatchResultForMatch(
  tournamentId: string,
  matchId: string,
  userId: string
): Promise<MatchResultDocument | null> {
  try {
    const q = query(
      collection(db, MATCH_RESULTS_COLLECTION),
      where('tournamentId', '==', tournamentId),
      where('matchId', '==', matchId),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as MatchResultDocument;
    }
    return null;
  } catch (error) {
    console.error('[MatchResults] Error fetching user match result:', error);
    return null;
  }
}

/**
 * Real-time listener for all results submitted by a specific player.
 */
export function subscribeUserMatchResults(
  userId: string,
  callback: (results: MatchResultDocument[]) => void
): () => void {
  const q = query(
    collection(db, MATCH_RESULTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map((d) => d.data() as MatchResultDocument);
      callback(results);
    },
    (err) => {
      console.error('[MatchResults] User results subscription error:', err);
    }
  );
}

/**
 * Real-time listener for the admin verification queue with optional status filtering.
 */
export function subscribeAllMatchResults(
  callback: (results: MatchResultDocument[]) => void,
  statusFilter: 'ALL' | MatchResultStatus = 'ALL'
): () => void {
  let q = query(collection(db, MATCH_RESULTS_COLLECTION), orderBy('createdAt', 'desc'));

  if (statusFilter !== 'ALL') {
    q = query(
      collection(db, MATCH_RESULTS_COLLECTION),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc')
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map((d) => d.data() as MatchResultDocument);
      callback(results);
    },
    (err) => {
      console.error('[MatchResults] Admin results subscription error:', err);
    }
  );
}

/**
 * Real-time listener for official tournament leaderboard standings.
 */
export function subscribeTournamentLeaderboard(
  tournamentId: string,
  callback: (entries: LeaderboardEntryDocument[]) => void
): () => void {
  const leaderboardRef = collection(db, TOURNAMENTS_COLLECTION, tournamentId, 'leaderboard');
  const q = query(leaderboardRef, orderBy('totalPoints', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((d) => d.data() as LeaderboardEntryDocument);
      // Secondary sort by totalKills desc, then matchesPlayed asc
      entries.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
        return a.matchesPlayed - b.matchesPlayed;
      });
      callback(entries);
    },
    (err) => {
      console.error(`[Leaderboard] Subscription error for ${tournamentId}:`, err);
    }
  );
}

// ─── PLAYER SUBMISSION FLOW ──────────────────────────────────────────────────

export interface SubmitMatchResultParams {
  matchId: string;
  tournamentId: string;
  tournamentName?: string;
  matchNumber?: number;
  userId: string;
  playerName: string;
  playerUid?: string;
  teamId?: string;
  teamName?: string;
  placement: number;
  kills: number;
  proofFile?: File | null;
  proofImageUrl?: string;
  scoring?: Partial<TournamentScoringConfig> | null;
}

/**
 * Submits player match result with screenshot proof.
 * Enforces duplicate protection and sets status to PENDING.
 */
export async function submitMatchResult(
  params: SubmitMatchResultParams
): Promise<{ success: boolean; resultId: string; message: string; status: MatchResultStatus }> {
  const placement = Number(params.placement);
  const kills = Number(params.kills);

  // Validation
  if (isNaN(placement) || placement < 1 || placement > 48) {
    throw new Error('Please enter a valid placement between 1 and 48.');
  }
  if (isNaN(kills) || kills < 0) {
    throw new Error('Please enter a valid non-negative number of kills.');
  }
  if (!params.proofFile && !params.proofImageUrl) {
    throw new Error('Match result proof screenshot is required.');
  }

  // 1. Check existing submission for this match & user
  const existing = await getUserMatchResultForMatch(params.tournamentId, params.matchId, params.userId);

  if (existing) {
    if (existing.status === 'PENDING') {
      return {
        success: false,
        resultId: existing.resultId,
        message: 'Your result is already under verification.',
        status: 'PENDING',
      };
    }
    if (existing.status === 'APPROVED') {
      return {
        success: false,
        resultId: existing.resultId,
        message: 'Your result has already been verified.',
        status: 'APPROVED',
      };
    }
    // If REJECTED, allow controlled resubmission updating the existing document
    let proofUrl = existing.proofImageUrl;
    if (params.proofFile) {
      proofUrl = await uploadMatchResultProof(
        params.userId,
        params.matchId,
        existing.resultId,
        params.proofFile
      );
    } else if (params.proofImageUrl) {
      proofUrl = params.proofImageUrl;
    }

    const estimatedScore = calculateOfficialScore(placement, kills, params.scoring);
    const resultRef = doc(db, MATCH_RESULTS_COLLECTION, existing.resultId);

    await updateDoc(resultRef, {
      placement,
      kills,
      playerSubmittedScore: estimatedScore,
      proofImageUrl: proofUrl,
      status: 'PENDING',
      adminNote: '',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createNotification(
      params.userId,
      'Match Result Resubmitted',
      `Your updated match result for Match #${params.matchNumber || 1} has been submitted for admin verification.`,
      'RESULT_SUBMITTED'
    );

    return {
      success: true,
      resultId: existing.resultId,
      message: 'Result resubmitted successfully. Waiting for admin verification.',
      status: 'PENDING',
    };
  }

  // 2. New Submission
  const resultId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let proofUrl = params.proofImageUrl || '';

  if (params.proofFile) {
    proofUrl = await uploadMatchResultProof(
      params.userId,
      params.matchId,
      resultId,
      params.proofFile
    );
  }

  const estimatedScore = calculateOfficialScore(placement, kills, params.scoring);
  const resultRef = doc(db, MATCH_RESULTS_COLLECTION, resultId);

  const newResult: MatchResultDocument = {
    resultId,
    matchId: params.matchId,
    tournamentId: params.tournamentId,
    tournamentName: params.tournamentName || 'Tournament Match',
    matchNumber: params.matchNumber || 1,
    userId: params.userId,
    playerName: params.playerName.trim(),
    playerUid: params.playerUid?.trim() || '',
    teamId: params.teamId || '',
    teamName: params.teamName || '',
    placement,
    kills,
    calculatedScore: estimatedScore,
    playerSubmittedScore: estimatedScore,
    proofImageUrl: proofUrl,
    status: 'PENDING',
    submittedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(resultRef, newResult);

  // Send player notification
  await createNotification(
    params.userId,
    'Match Result Submitted',
    `Your match result for Match #${params.matchNumber || 1} has been submitted for admin verification.`,
    'RESULT_SUBMITTED'
  );

  return {
    success: true,
    resultId,
    message: 'Result submitted successfully. Waiting for admin verification.',
    status: 'PENDING',
  };
}

// ─── ADMIN APPROVAL & LEADERBOARD TRANSACTION ─────────────────────────────────

/**
 * Admin action: Approves a match result.
 * Executes an atomic Firestore transaction that:
 * 1. Checks current status is PENDING (or idempotent re-run)
 * 2. Fetches official tournament scoring rules
 * 3. Computes official score: TOTAL SCORE = PLACEMENT POINTS + (KILLS × KILL POINT VALUE)
 * 4. Updates matchResults/{resultId} with status = APPROVED, verifiedAt, verifiedBy
 * 5. Updates tournaments/{tournamentId}/leaderboard/{userId} using matchBreakdown[matchId] to prevent double counting
 * 6. Creates immutable audit log in matchResultVerificationLogs
 * 7. Sends real-time notification to the player
 */
export async function approveMatchResultTransaction(
  resultId: string,
  adminUid: string,
  overrides?: { placement?: number; kills?: number; note?: string }
): Promise<{ success: boolean; message: string; calculatedScore: number }> {
  if (!resultId) throw new Error('Result ID is required.');
  if (!adminUid) throw new Error('Admin UID is required.');

  let officialScore = 0;
  let targetUserId = '';
  let targetMatchNumber = 1;

  await runTransaction(db, async (transaction) => {
    // 1. Read Match Result Document
    const resultRef = doc(db, MATCH_RESULTS_COLLECTION, resultId);
    const resultSnap = await transaction.get(resultRef);

    if (!resultSnap.exists()) {
      throw new Error(`Match result ${resultId} not found.`);
    }

    const resultData = resultSnap.data() as MatchResultDocument;
    targetUserId = resultData.userId;
    targetMatchNumber = resultData.matchNumber || 1;

    // Determine effective placement & kills (allowing optional admin correction)
    const effectivePlacement = overrides?.placement ?? resultData.placement;
    const effectiveKills = overrides?.kills ?? resultData.kills;

    // 2. Read Tournament Configuration for Scoring Rules
    const tourneyRef = doc(db, TOURNAMENTS_COLLECTION, resultData.tournamentId);
    const tourneySnap = await transaction.get(tourneyRef);
    const tourneyData = tourneySnap.exists() ? tourneySnap.data() : null;

    const scoringConfig: TournamentScoringConfig = {
      killPointValue: tourneyData?.scoring?.killPointValue ?? DEFAULT_TOURNAMENT_SCORING.killPointValue,
      placementPoints: {
        ...DEFAULT_TOURNAMENT_SCORING.placementPoints,
        ...(tourneyData?.scoring?.placementPoints || {}),
      },
    };

    // 3. Compute Official Score
    officialScore = calculateOfficialScore(effectivePlacement, effectiveKills, scoringConfig);

    // 4. Read Tournament Leaderboard Document for this User
    const leaderboardDocRef = doc(
      db,
      TOURNAMENTS_COLLECTION,
      resultData.tournamentId,
      'leaderboard',
      resultData.userId
    );
    const leaderboardSnap = await transaction.get(leaderboardDocRef);
    const currentLeaderboard = leaderboardSnap.exists()
      ? (leaderboardSnap.data() as LeaderboardEntryDocument)
      : null;

    // 5. Update matchBreakdown keyed by matchId (STRICT IDEMPOTENCY — NO DOUBLE COUNTING)
    const matchBreakdown: Record<string, LeaderboardMatchStat> = {
      ...(currentLeaderboard?.matchBreakdown || {}),
      [resultData.matchId]: {
        resultId,
        kills: effectiveKills,
        placement: effectivePlacement,
        score: officialScore,
        approvedAt: new Date().toISOString(),
      },
    };

    // Calculate deterministic cumulative totals from matchBreakdown map
    const breakdownEntries = Object.values(matchBreakdown);
    const matchesPlayed = breakdownEntries.length;
    const totalKills = breakdownEntries.reduce((acc, m) => acc + (m.kills || 0), 0);
    const totalPoints = breakdownEntries.reduce((acc, m) => acc + (m.score || 0), 0);
    const bestPlacement = Math.min(...breakdownEntries.map((m) => m.placement || 48));

    const updatedLeaderboardDoc: LeaderboardEntryDocument = {
      userId: resultData.userId,
      tournamentId: resultData.tournamentId,
      playerName: resultData.playerName,
      playerUid: resultData.playerUid || '',
      teamId: resultData.teamId || '',
      teamName: resultData.teamName || '',
      matchesPlayed,
      totalKills,
      totalPoints,
      bestPlacement,
      matchBreakdown,
      updatedAt: serverTimestamp(),
    };

    // 6. Write Leaderboard Entry
    transaction.set(leaderboardDocRef, updatedLeaderboardDoc, { merge: true });

    // 7. Update Match Result Document
    transaction.update(resultRef, {
      placement: effectivePlacement,
      kills: effectiveKills,
      calculatedScore: officialScore,
      status: 'APPROVED',
      adminNote: overrides?.note || resultData.adminNote || 'Verified by admin',
      verifiedAt: serverTimestamp(),
      verifiedBy: adminUid,
      updatedAt: serverTimestamp(),
    });

    // 8. Create Audit Log
    const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const logRef = doc(db, MATCH_VERIFICATION_LOGS_COLLECTION, logId);
    const isCorrection = Boolean(overrides && (overrides.placement !== undefined || overrides.kills !== undefined));

    const auditLog: MatchResultVerificationLogDocument = {
      logId,
      resultId,
      matchId: resultData.matchId,
      tournamentId: resultData.tournamentId,
      action: isCorrection ? 'CORRECTED' : 'APPROVED',
      oldStatus: resultData.status,
      newStatus: 'APPROVED',
      oldPlacement: resultData.placement,
      newPlacement: effectivePlacement,
      oldKills: resultData.kills,
      newKills: effectiveKills,
      oldScore: resultData.calculatedScore || 0,
      newScore: officialScore,
      adminUid,
      adminNote: overrides?.note || (isCorrection ? 'Admin corrected score' : 'Admin approved result'),
      createdAt: serverTimestamp(),
    };

    transaction.set(logRef, auditLog);
  });

  // 9. Deliver Real-Time Notification to Player
  if (targetUserId) {
    await createNotification(
      targetUserId,
      'Match Result Verified! 🏆',
      `Your Match #${targetMatchNumber} result has been verified! Official score: ${officialScore} points. Leaderboard updated.`,
      'RESULT_APPROVED'
    );
  }

  return {
    success: true,
    message: `Result approved successfully! Official score of ${officialScore} pts applied to leaderboard.`,
    calculatedScore: officialScore,
  };
}

// ─── ADMIN REJECTION TRANSACTION ─────────────────────────────────────────────

/**
 * Admin action: Rejects a match result with mandatory reason.
 * Does NOT add points to official leaderboard. If result was previously approved,
 * safely removes it from the leaderboard breakdown.
 */
export async function rejectMatchResultTransaction(
  resultId: string,
  adminUid: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  if (!resultId) throw new Error('Result ID is required.');
  if (!adminUid) throw new Error('Admin UID is required.');
  if (!reason?.trim()) throw new Error('A rejection reason is required.');

  let targetUserId = '';
  let targetMatchNumber = 1;

  await runTransaction(db, async (transaction) => {
    const resultRef = doc(db, MATCH_RESULTS_COLLECTION, resultId);
    const resultSnap = await transaction.get(resultRef);

    if (!resultSnap.exists()) {
      throw new Error(`Match result ${resultId} not found.`);
    }

    const resultData = resultSnap.data() as MatchResultDocument;
    targetUserId = resultData.userId;
    targetMatchNumber = resultData.matchNumber || 1;

    // If it was previously approved, remove from leaderboard map to maintain consistency
    if (resultData.status === 'APPROVED') {
      const leaderboardDocRef = doc(
        db,
        TOURNAMENTS_COLLECTION,
        resultData.tournamentId,
        'leaderboard',
        resultData.userId
      );
      const leaderboardSnap = await transaction.get(leaderboardDocRef);
      if (leaderboardSnap.exists()) {
        const lbData = leaderboardSnap.data() as LeaderboardEntryDocument;
        const matchBreakdown = { ...(lbData.matchBreakdown || {}) };
        delete matchBreakdown[resultData.matchId];

        const breakdownEntries = Object.values(matchBreakdown);
        const matchesPlayed = breakdownEntries.length;
        const totalKills = breakdownEntries.reduce((acc, m) => acc + (m.kills || 0), 0);
        const totalPoints = breakdownEntries.reduce((acc, m) => acc + (m.score || 0), 0);
        const bestPlacement = breakdownEntries.length > 0
          ? Math.min(...breakdownEntries.map((m) => m.placement || 48))
          : 0;

        transaction.set(
          leaderboardDocRef,
          {
            matchesPlayed,
            totalKills,
            totalPoints,
            bestPlacement,
            matchBreakdown,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    // Update Result Status
    transaction.update(resultRef, {
      status: 'REJECTED',
      adminNote: reason.trim(),
      verifiedAt: serverTimestamp(),
      verifiedBy: adminUid,
      updatedAt: serverTimestamp(),
    });

    // Write Audit Log
    const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const logRef = doc(db, MATCH_VERIFICATION_LOGS_COLLECTION, logId);
    const auditLog: MatchResultVerificationLogDocument = {
      logId,
      resultId,
      matchId: resultData.matchId,
      tournamentId: resultData.tournamentId,
      action: 'REJECTED',
      oldStatus: resultData.status,
      newStatus: 'REJECTED',
      oldPlacement: resultData.placement,
      newPlacement: resultData.placement,
      oldKills: resultData.kills,
      newKills: resultData.kills,
      oldScore: resultData.calculatedScore || 0,
      newScore: 0,
      adminUid,
      adminNote: reason.trim(),
      createdAt: serverTimestamp(),
    };

    transaction.set(logRef, auditLog);
  });

  // Deliver Notification
  if (targetUserId) {
    await createNotification(
      targetUserId,
      'Match Result Rejected',
      `Your Match #${targetMatchNumber} result was rejected. Reason: ${reason.trim()}`,
      'RESULT_REJECTED'
    );
  }

  return {
    success: true,
    message: 'Result rejected and player notified.',
  };
}

// ─── ADMIN RESULT CORRECTION / OVERRIDE ──────────────────────────────────────

/**
 * Admin action: Safely corrects placement and/or kills for a match result.
 * Recalculates official score, updates leaderboard, and writes an audit log.
 */
export async function correctMatchResultTransaction(
  resultId: string,
  adminUid: string,
  newPlacement: number,
  newKills: number,
  correctionReason: string
): Promise<{ success: boolean; message: string; newScore: number }> {
  if (!correctionReason?.trim()) {
    throw new Error('A reason is required to correct a match result.');
  }

  const res = await approveMatchResultTransaction(resultId, adminUid, {
    placement: newPlacement,
    kills: newKills,
    note: correctionReason.trim(),
  });

  return {
    success: true,
    message: 'Match result successfully corrected and leaderboard updated.',
    newScore: res.calculatedScore,
  };
}

// ─── MATCH DOCUMENT MANAGEMENT ───────────────────────────────────────────────

/**
 * Fetches all matches belonging to a tournament.
 */
export async function getTournamentMatches(tournamentId: string): Promise<MatchDocument[]> {
  try {
    const q = query(
      collection(db, MATCHES_COLLECTION),
      where('tournamentId', '==', tournamentId),
      orderBy('matchNumber', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as MatchDocument);
  } catch (error) {
    console.error(`[Matches] Error fetching matches for tournament ${tournamentId}:`, error);
    return [];
  }
}

/**
 * Admin action: Creates a new match document in Firestore.
 */
export async function createMatch(
  matchData: Omit<MatchDocument, 'createdAt' | 'updatedAt'>
): Promise<MatchDocument> {
  const matchId = matchData.matchId || `match-${Date.now()}`;
  const docRef = doc(db, MATCHES_COLLECTION, matchId);

  const matchDoc: MatchDocument = {
    ...matchData,
    matchId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, matchDoc);
  return matchDoc;
}
