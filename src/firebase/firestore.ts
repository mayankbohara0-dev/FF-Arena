/**
 * Firestore Database Service — FF Arena
 * All real-time reads and writes to Firebase Firestore.
 */
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  Unsubscribe,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

// ── Helpers ──────────────────────────────────────────────────────────────────

function tsToISO(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  return String(ts);
}

function docToObj(id: string, data: DocumentData): any {
  return { id, ...data, createdAt: tsToISO(data.createdAt), updatedAt: tsToISO(data.updatedAt) };
}

// ── USER PROFILE ─────────────────────────────────────────────────────────────

export async function createOrUpdateUser(uid: string, data: {
  phone?: string;
  displayName?: string;
  gameName?: string;
  gameUid?: string;
  role?: string;
  walletBalance?: number;
  winningsBalance?: number;
}): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, {
      ...data,
      walletBalance: 0,
      winningsBalance: 0,
      kycStatus: 'NONE',
      role: 'PLAYER',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getUser(uid: string): Promise<any | null> {
  if (!isFirebaseConfigured()) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? docToObj(snap.id, snap.data()) : null;
}

export async function updateWallet(uid: string, walletDelta: number, winningsDelta: number): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await updateDoc(doc(db, 'users', uid), {
    walletBalance: increment(walletDelta),
    winningsBalance: increment(winningsDelta),
    updatedAt: serverTimestamp(),
  });
}

// ── TOURNAMENTS ───────────────────────────────────────────────────────────────

/** Listen to all tournaments in real-time */
export function subscribeTournaments(callback: (tournaments: any[]) => void): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const q = query(collection(db, 'tournaments'), orderBy('startTime', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToObj(d.id, d.data())));
  });
}

/** Admin: create a new tournament */
export async function createTournament(data: Record<string, any>): Promise<string> {
  if (!isFirebaseConfigured()) return `mock-${Date.now()}`;
  const ref = await addDoc(collection(db, 'tournaments'), {
    ...data,
    currentParticipants: 0,
    status: 'Registration Open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Admin: update room credentials */
export async function updateTournamentRoom(
  tournamentId: string,
  roomId: string,
  roomPassword: string,
  isRoomReleased: boolean
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await updateDoc(doc(db, 'tournaments', tournamentId), {
    roomId,
    roomPassword,
    isRoomReleased,
    roomReleasedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ── REGISTRATIONS ────────────────────────────────────────────────────────────

/** Register a player for a tournament (atomic slot increment) */
export async function registerForTournament(data: {
  tournamentId: string;
  userId: string;
  playerName: string;
  gameUid: string;
  teamId?: string;
  teamName?: string;
  slotNumber: number;
}): Promise<string> {
  if (!isFirebaseConfigured()) return `reg-${Date.now()}`;
  
  // Write registration document
  const ref = await addDoc(collection(db, 'registrations'), {
    ...data,
    status: 'Confirmed',
    registeredAt: serverTimestamp(),
  });

  // Increment participant count on the tournament
  await updateDoc(doc(db, 'tournaments', data.tournamentId), {
    currentParticipants: increment(1),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

/** Listen to registrations for a specific user */
export function subscribeUserRegistrations(
  userId: string,
  callback: (regs: any[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const q = query(collection(db, 'registrations'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToObj(d.id, d.data())));
  });
}

// ── MATCH RESULTS ─────────────────────────────────────────────────────────────

/** Submit a match result (kills + placement + screenshot) */
export async function submitResult(data: {
  matchId: string;
  tournamentId: string;
  userId: string;
  kills: number;
  placement: number;
  screenshotUrl: string;
  screenshotHash: string;
  notes?: string;
}): Promise<string> {
  if (!isFirebaseConfigured()) return `result-${Date.now()}`;
  const ref = await addDoc(collection(db, 'results'), {
    ...data,
    aiStatus: 'Pending',
    verificationStatus: 'Pending',
    submittedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Admin: verify a result */
export async function verifyResult(
  resultId: string,
  status: 'Approved' | 'Rejected' | 'Manual Review',
  notes?: string
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await updateDoc(doc(db, 'results', resultId), {
    verificationStatus: status,
    adminNotes: notes || '',
    verifiedAt: serverTimestamp(),
  });
}

/** Listen to results for a specific user */
export function subscribeUserResults(
  userId: string,
  callback: (results: any[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const q = query(collection(db, 'results'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToObj(d.id, d.data())));
  });
}

// ── WALLET TRANSACTIONS ───────────────────────────────────────────────────────

/** Add a wallet transaction record */
export async function addTransaction(data: {
  userId: string;
  type: string;
  title: string;
  amount: number;
  status: string;
  utrRef?: string;
}): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await addDoc(collection(db, 'transactions'), {
    ...data,
    date: serverTimestamp(),
  });
}

/** Listen to a user's wallet transactions */
export function subscribeTransactions(
  userId: string,
  callback: (txs: any[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) return () => {};
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToObj(d.id, d.data())));
  });
}

// ── NOTIFICATIONS ────────────────────────────────────────────────────────────

/** Save a push notification to Firestore */
export async function saveNotification(data: {
  userId: string;
  title: string;
  body: string;
  type: string;
  dataPayload?: Record<string, any>;
}): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await addDoc(collection(db, 'notifications'), {
    ...data,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}
