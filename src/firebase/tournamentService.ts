/**
 * Cloud Firestore Tournament Service — FF Arena
 * Real-time tournament management conforming to the official tournament schema.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { TournamentDocument, TournamentDocStatus } from '../types';

const TOURNAMENTS_COLLECTION = 'tournaments';

/**
 * Fetches all tournaments sorted by start date / created date.
 */
export async function getTournaments(): Promise<TournamentDocument[]> {
  try {
    const q = query(collection(db, TOURNAMENTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TournamentDocument);
  } catch (error) {
    console.error('[Firebase Tournaments] Error fetching tournaments:', error);
    return [];
  }
}

/**
 * Fetches a single tournament by ID.
 */
export async function getTournamentById(tournamentId: string): Promise<TournamentDocument | null> {
  try {
    const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as TournamentDocument;
    }
    return null;
  } catch (error) {
    console.error(`[Firebase Tournaments] Error fetching tournament ${tournamentId}:`, error);
    return null;
  }
}

/**
 * Real-time listener for all tournaments in Firestore.
 */
export function subscribeTournaments(
  callback: (tournaments: TournamentDocument[]) => void
): () => void {
  const q = query(collection(db, TOURNAMENTS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const tournaments = snapshot.docs.map((d) => d.data() as TournamentDocument);
      callback(tournaments);
    },
    (error) => {
      console.error('[Firebase Tournaments] Real-time subscription error:', error);
    }
  );
}

/**
 * Admin action: Creates a new tournament in Firestore.
 */
export async function createTournament(
  data: Omit<TournamentDocument, 'createdAt' | 'updatedAt' | 'occupiedSlots' | 'availableSlots'> & {
    occupiedSlots?: number;
    availableSlots?: number;
  }
): Promise<TournamentDocument> {
  const tournamentId = data.tournamentId || `tourney-${Date.now()}`;
  const capacity = data.capacity || 48;
  const occupiedSlots = data.occupiedSlots || 0;
  const availableSlots = data.availableSlots ?? Math.max(0, capacity - occupiedSlots);

  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);

  const tournamentDoc: TournamentDocument = {
    ...data,
    tournamentId,
    game: data.game || 'Free Fire',
    category: data.category || 'Battle Royale',
    capacity,
    occupiedSlots,
    availableSlots,
    status: data.status || 'upcoming',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, tournamentDoc);
  return tournamentDoc;
}

/**
 * Admin action: Updates tournament details.
 */
export async function updateTournament(
  tournamentId: string,
  updates: Partial<TournamentDocument>
): Promise<void> {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin action: Sets custom room credentials before match starts.
 */
export async function updateRoomCredentials(
  tournamentId: string,
  roomId: string,
  roomPassword: string
): Promise<void> {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(docRef, {
    roomId: roomId.trim(),
    roomPassword: roomPassword.trim(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin action: Updates tournament status (upcoming | live | completed).
 */
export async function updateTournamentStatus(
  tournamentId: string,
  status: TournamentDocStatus
): Promise<void> {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}
