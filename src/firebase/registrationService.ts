/**
 * Cloud Firestore Registration Service — FF Arena
 * Prepares registration lifecycle with PENDING_PAYMENT status enforcement.
 * Does NOT auto-confirm registration on join click.
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
} from 'firebase/firestore';
import { db } from './config';
import type { RegistrationDocument, RegistrationStatus, PaymentStatus } from '../types';

const REGISTRATIONS_COLLECTION = 'registrations';

export interface CreateRegistrationParams {
  userId: string;
  tournamentId: string;
  playerName: string;
  playerUid: string;
  teamName?: string;
  teammates?: Array<{ name: string; uid: string }>;
  paymentId: string;
}

/**
 * Creates a new tournament registration in PENDING_PAYMENT state.
 * Important: Status stays PENDING_PAYMENT until verified in payment step.
 */
export async function createRegistration(
  params: CreateRegistrationParams
): Promise<RegistrationDocument> {
  const registrationId = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const docRef = doc(db, REGISTRATIONS_COLLECTION, registrationId);

  const registrationData: RegistrationDocument = {
    registrationId,
    userId: params.userId,
    tournamentId: params.tournamentId,
    playerName: params.playerName.trim(),
    playerUid: params.playerUid.trim(),
    teamName: params.teamName?.trim(),
    teammates: params.teammates || [],
    paymentId: params.paymentId,
    paymentStatus: 'PENDING',
    registrationStatus: 'PAYMENT_PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, registrationData);
  return registrationData;
}

/**
 * Fetches all registrations submitted by a specific user.
 */
export async function getUserRegistrations(userId: string): Promise<RegistrationDocument[]> {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RegistrationDocument);
  } catch (error) {
    console.error(`[Firebase Registrations] Error fetching registrations for user ${userId}:`, error);
    return [];
  }
}

/**
 * Real-time listener for a user's tournament registrations.
 */
export function subscribeUserRegistrations(
  userId: string,
  callback: (registrations: RegistrationDocument[]) => void
): () => void {
  const q = query(
    collection(db, REGISTRATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const registrations = snapshot.docs.map((d) => d.data() as RegistrationDocument);
      callback(registrations);
    },
    (error) => {
      console.error('[Firebase Registrations] Subscription error:', error);
    }
  );
}

/**
 * Admin action: Fetches all registrations for a given tournament.
 */
export async function getTournamentRegistrations(tournamentId: string): Promise<RegistrationDocument[]> {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('tournamentId', '==', tournamentId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RegistrationDocument);
  } catch (error) {
    console.error(`[Firebase Registrations] Error fetching tournament ${tournamentId} registrations:`, error);
    return [];
  }
}

/**
 * Admin action: Updates registration status and payment verification status.
 */
export async function updateRegistrationStatus(
  registrationId: string,
  registrationStatus: RegistrationStatus,
  paymentStatus?: PaymentStatus
): Promise<void> {
  const docRef = doc(db, REGISTRATIONS_COLLECTION, registrationId);
  const updates: Record<string, any> = {
    registrationStatus,
    updatedAt: serverTimestamp(),
  };

  if (paymentStatus) {
    updates.paymentStatus = paymentStatus;
  }

  await updateDoc(docRef, updates);
}
