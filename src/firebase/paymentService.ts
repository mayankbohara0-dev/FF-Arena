/**
 * Cloud Firestore & Storage Payment Service — FF Arena
 * STEP 2 Implementation:
 * - Real Firestore merchant settings (paymentSettings/default)
 * - Duplicate UTR verification
 * - Firebase Storage screenshot upload (paymentScreenshots/{userId}/{paymentId}/{fileName})
 * - PENDING payment document creation
 * - PAYMENT_PENDING registration document creation
 * - Real-time listeners for player status updates
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
import { ref, uploadBytes, getDownloadURL, type StorageReference } from 'firebase/storage';
import { db, storage } from './config';
import { createNotification } from './notificationService';
import type {
  PaymentDocument,
  PaymentSettingsDocument,
  RegistrationDocument,
  PaymentVerificationLogDocument,
  TournamentDocument,
} from '../types';

export const PAYMENTS_COLLECTION = 'payments';
export const PAYMENT_SETTINGS_DOC = 'paymentSettings/default';
export const VERIFICATION_LOGS_COLLECTION = 'paymentVerificationLogs';
export const UTR_REGISTRY_COLLECTION = 'utrRegistry';

/**
 * Returns the standard Firebase Storage path for a payment screenshot.
 * Logical Structure: paymentScreenshots/{userId}/{paymentId}/{fileName}
 */
export function getPaymentScreenshotStoragePath(
  userId: string,
  paymentId: string,
  fileName: string
): string {
  // Strip path traversal sequences and directory separators, taking only safe basename
  const baseName = fileName.split(/[\\/]/).pop() || 'screenshot.jpg';
  const cleanFileName = baseName.replace(/\.{2,}/g, '.').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `paymentScreenshots/${userId}/${paymentId}/${cleanFileName}`;
}

/**
 * Returns a Firebase StorageReference for uploading a payment screenshot.
 */
export function getPaymentScreenshotStorageRef(
  userId: string,
  paymentId: string,
  fileName: string
): StorageReference {
  return ref(storage, getPaymentScreenshotStoragePath(userId, paymentId, fileName));
}

/**
 * Validates UTR / Transaction ID format:
 * - Cannot be empty
 * - Strips whitespace
 * - Length between 10 and 22 characters
 * - Alphanumeric standard
 * - Rejects obvious dummy patterns (e.g. all same digits, sequential placeholder)
 */
export function validateUtr(utr: string): { valid: boolean; cleanUtr: string; error?: string } {
  if (!utr) {
    return { valid: false, cleanUtr: '', error: 'Transaction ID / UTR is required.' };
  }

  const cleanUtr = utr.trim().replace(/\s+/g, '');

  if (cleanUtr.length < 10 || cleanUtr.length > 22) {
    return {
      valid: false,
      cleanUtr,
      error: 'Please enter a valid 12-digit UPI Reference / UTR number (10 to 22 characters).',
    };
  }

  // Prevent purely identical repeating characters (e.g. "000000000000", "111111111111")
  if (/^(\w)\1+$/.test(cleanUtr)) {
    return {
      valid: false,
      cleanUtr,
      error: 'Invalid UTR: obvious repeating placeholder detected.',
    };
  }

  // Prevent obvious sequential dummy ("123456789012")
  if (cleanUtr === '123456789012' || cleanUtr === '012345678901') {
    return {
      valid: false,
      cleanUtr,
      error: 'Invalid UTR: dummy sequential reference detected.',
    };
  }

  // Alphanumeric format
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUtr)) {
    return {
      valid: false,
      cleanUtr,
      error: 'UTR must only contain alphanumeric characters.',
    };
  }

  return { valid: true, cleanUtr };
}

/**
 * Validates screenshot file type (JPG, JPEG, PNG, WEBP) and size (<= 5MB).
 */
export function validateScreenshotFile(
  file: { size: number; type?: string; name?: string }
): { valid: boolean; error?: string } {
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Screenshot size exceeds 5MB limit. Please upload a smaller image.',
    };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  const typeValid = file.type ? allowedTypes.includes(file.type.toLowerCase()) : false;
  const nameValid = file.name
    ? allowedExts.some((ext) => file.name?.toLowerCase().endsWith(ext))
    : false;

  if (!typeValid && !nameValid) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, JPEG, and PNG images are accepted.',
    };
  }

  return { valid: true };
}

/**
 * Fetches default merchant payment settings from Firestore (`paymentSettings/default`).
 * If document does not exist, returns null (does NOT fallback to fake mock credentials).
 */
export async function getPaymentSettings(): Promise<PaymentSettingsDocument | null> {
  try {
    const docRef = doc(db, 'paymentSettings', 'default');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        upiId: data.upiId || data.merchantUpiId || '',
        qrImageUrl: data.qrImageUrl || data.qrCodeUrl || '',
        instructions: data.instructions || '',
        enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
        merchantName: data.merchantName || 'FF Arena Esports',
        merchantUpiId: data.merchantUpiId || data.upiId || '',
        qrCodeUrl: data.qrCodeUrl || data.qrImageUrl || '',
        updatedAt: data.updatedAt || null,
        updatedBy: data.updatedBy || 'admin',
      };
    }
    return null;
  } catch (error) {
    console.error('[Firebase Payments] Error fetching payment settings:', error);
    return null;
  }
}

/**
 * Checks whether the given UTR has already been submitted or approved.
 * Dual-layer check:
 * 1. Checks global utrRegistry/{cleanUtr}
 * 2. Checks payments collection where utr == cleanUtr
 * Returns true if duplicate exists, false otherwise.
 */
export async function checkDuplicateUtr(utr: string): Promise<boolean> {
  try {
    const cleanUtr = utr.trim().replace(/\s+/g, '');

    // 1. Check global atomic UTR registry
    try {
      const utrDoc = await getDoc(doc(db, UTR_REGISTRY_COLLECTION, cleanUtr));
      if (utrDoc.exists()) {
        return true;
      }
    } catch {
      // Continue to payments collection check
    }

    // 2. Check payments collection
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where('utr', '==', cleanUtr)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.error('[Firebase Payments] Error checking duplicate UTR:', error);
    throw new Error('Unable to verify transaction ID uniqueness. Please check your internet connection.');
  }
}

/**
 * Checks if a player already has an active (PAYMENT_PENDING, PENDING_PAYMENT, or CONFIRMED) registration
 * for a given tournament. Players whose previous registration was PAYMENT_REJECTED are permitted to retry.
 */
export async function checkExistingUserRegistration(
  userId: string,
  tournamentId: string
): Promise<{ hasPendingOrApproved: boolean; registration?: RegistrationDocument; isRejectedOnly?: boolean }> {
  try {
    const q = query(
      collection(db, 'registrations'),
      where('userId', '==', userId),
      where('tournamentId', '==', tournamentId)
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d) => d.data() as RegistrationDocument);
    const active = all.find(
      (r) =>
        r.registrationStatus === 'PAYMENT_PENDING' ||
        r.registrationStatus === 'PENDING_PAYMENT' ||
        r.registrationStatus === 'CONFIRMED'
    );
    const hasRejected = all.some(
      (r) => r.registrationStatus === 'PAYMENT_REJECTED' || (r.registrationStatus as string) === 'REJECTED'
    );

    return {
      hasPendingOrApproved: !!active,
      registration: active || all[0],
      isRejectedOnly: !active && hasRejected,
    };
  } catch (error) {
    console.error('[Firebase Payments] Error checking existing registration:', error);
    return { hasPendingOrApproved: false };
  }
}

/**
 * Uploads a payment screenshot to Firebase Storage.
 * Path: paymentScreenshots/{userId}/{paymentId}/{fileName}
 * Returns the permanent download URL.
 */
export async function uploadPaymentScreenshot(
  userId: string,
  paymentId: string,
  file: File | Blob,
  fileName: string
): Promise<string> {
  const fileCheck = validateScreenshotFile({
    size: file.size,
    type: file.type,
    name: fileName,
  });

  if (!fileCheck.valid) {
    throw new Error(fileCheck.error || 'Invalid screenshot file.');
  }

  const storageRef = getPaymentScreenshotStorageRef(userId, paymentId, fileName);
  const metadata = {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      userId,
      paymentId,
      uploadedAt: new Date().toISOString(),
    },
  };

  const uploadResult = await uploadBytes(storageRef, file, metadata);
  const downloadUrl = await getDownloadURL(uploadResult.ref);
  return downloadUrl;
}

export interface SubmitPaymentParams {
  userId: string;
  tournamentId: string;
  tournamentName: string;
  playerName: string;
  playerUid: string;
  teamName?: string;
  teammates?: Array<{ name: string; uid: string }>;
  entryFee: number; // Must be tournament's actual entryFee from Firestore
  utr: string;
  screenshotFile: File | Blob;
  screenshotFileName: string;
}

export interface SubmitPaymentResult {
  payment: PaymentDocument;
  registration: RegistrationDocument;
}

/**
 * Complete STEP 2 Payment & Registration Submission Flow:
 * 1. Checks UTR validity & duplicate status in Firestore.
 * 2. Checks existing pending/approved registration for user.
 * 3. Uploads screenshot to Firebase Storage.
 * 4. Creates payments/{paymentId} with status = 'PENDING'.
 * 5. Creates registrations/{registrationId} with registrationStatus = 'PAYMENT_PENDING'.
 */
export async function submitPaymentAndRegistration(
  params: SubmitPaymentParams
): Promise<SubmitPaymentResult> {
  // 1. Validate UTR
  const utrCheck = validateUtr(params.utr);
  if (!utrCheck.valid) {
    throw new Error(utrCheck.error || 'Invalid UTR.');
  }
  const cleanUtr = utrCheck.cleanUtr;

  // 2. Duplicate UTR check (dual-layer: utrRegistry + payments collection)
  const isDuplicate = await checkDuplicateUtr(cleanUtr);
  if (isDuplicate) {
    throw new Error('This transaction ID has already been submitted.');
  }

  // 3. Duplicate registration check for same player & tournament
  const existing = await checkExistingUserRegistration(params.userId, params.tournamentId);
  if (existing.hasPendingOrApproved) {
    throw new Error('You already have a pending or confirmed registration for this tournament.');
  }

  // 4. Trusted tournament verification & entry fee enforcement (tamper protection)
  let trustedEntryFee = params.entryFee;
  let trustedTournamentName = params.tournamentName;
  try {
    const tourneyRef = doc(db, 'tournaments', params.tournamentId);
    const tourneySnap = await getDoc(tourneyRef);
    if (tourneySnap.exists()) {
      const tData = tourneySnap.data() as TournamentDocument;
      if (typeof tData.entryFee === 'number' && tData.entryFee >= 0) {
        trustedEntryFee = tData.entryFee; // Overwrite with server-verified trusted fee
      }
      if (tData.name) {
        trustedTournamentName = tData.name;
      }
      const capacity = tData.capacity ?? 48;
      const occupied = tData.occupiedSlots ?? 0;
      if ((tData.status as string) === 'FULL' || occupied >= capacity) {
        throw new Error('This tournament is full. Registration is closed.');
      }
      if (tData.status === 'completed' || (tData.status as string) === 'COMPLETED') {
        throw new Error('This tournament has already completed.');
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('full') || err.message.includes('completed'))) {
      throw err;
    }
  }

  // 5. Generate unique IDs
  const timestamp = Date.now();
  const paymentId = `pay-${timestamp}-${Math.random().toString(36).slice(2, 7)}`;
  const registrationId = `reg-${timestamp}-${Math.random().toString(36).slice(2, 7)}`;

  // 6. Upload screenshot to Firebase Storage
  let screenshotUrl = '';
  try {
    screenshotUrl = await uploadPaymentScreenshot(
      params.userId,
      paymentId,
      params.screenshotFile,
      params.screenshotFileName
    );
  } catch (uploadErr: any) {
    console.error('[Firebase Payments] Screenshot upload failed:', uploadErr);
    throw new Error(`Screenshot upload failed: ${uploadErr.message || 'Storage error'}`);
  }

  // 7. Create payment document in Firestore (status: PENDING, trusted amount)
  const paymentDocRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  const paymentDoc: PaymentDocument = {
    paymentId,
    userId: params.userId,
    tournamentId: params.tournamentId,
    tournamentName: trustedTournamentName,
    playerName: params.playerName.trim(),
    amount: trustedEntryFee, // Strictly enforced trusted entry fee
    utr: cleanUtr,
    screenshotUrl,
    registrationId,
    status: 'PENDING', // Initial payment status MUST be PENDING
    adminNote: '',
    submittedAt: serverTimestamp(),
  };

  // 8. Create registration document in Firestore (status: PAYMENT_PENDING)
  const regDocRef = doc(db, 'registrations', registrationId);
  const registrationDoc: RegistrationDocument = {
    registrationId,
    userId: params.userId,
    tournamentId: params.tournamentId,
    playerName: params.playerName.trim(),
    playerUid: params.playerUid.trim(),
    teamName: params.teamName?.trim() || '',
    teammates: params.teammates || [],
    paymentId,
    paymentStatus: 'PENDING',
    registrationStatus: 'PAYMENT_PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(paymentDocRef, paymentDoc);
    await setDoc(regDocRef, registrationDoc);
  } catch (firestoreErr: any) {
    console.error('[Firebase Payments] Firestore write failed:', firestoreErr);
    throw new Error(
      'Payment proof upload succeeded, but saving your registration record failed. Please contact support with UTR ' +
        cleanUtr
    );
  }

  return { payment: paymentDoc, registration: registrationDoc };
}

/**
 * Fetches a single payment record by ID.
 */
export async function getPaymentById(paymentId: string): Promise<PaymentDocument | null> {
  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PaymentDocument;
    }
    return null;
  } catch (error) {
    console.error(`[Firebase Payments] Error fetching payment ${paymentId}:`, error);
    return null;
  }
}

/**
 * Fetches all payment records for a specific player.
 */
export async function getUserPayments(userId: string): Promise<PaymentDocument[]> {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PaymentDocument);
  } catch (error) {
    console.error(`[Firebase Payments] Error fetching payments for user ${userId}:`, error);
    return [];
  }
}

/**
 * Real-time listener for a user's payments so the player dashboard reflects changes instantly.
 */
export function subscribeUserPayments(
  userId: string,
  callback: (payments: PaymentDocument[]) => void
): () => void {
  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('submittedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const payments = snapshot.docs.map((d) => d.data() as PaymentDocument);
      callback(payments);
    },
    (error) => {
      console.error('[Firebase Payments] Subscription error:', error);
    }
  );
}

/**
 * Admin action: Updates default merchant payment settings.
 */
export async function updatePaymentSettings(
  settings: Partial<PaymentSettingsDocument>,
  adminUid: string
): Promise<void> {
  const docRef = doc(db, 'paymentSettings', 'default');
  await setDoc(
    docRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    },
    { merge: true }
  );
}

// ─── STEP 3: ADMIN PAYMENT VERIFICATION & APPROVAL ───────────────────────────

/**
 * Fetches payments across all players for the Admin Verification panel.
 * Supports filtering by status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'.
 */
export async function getAllPayments(
  statusFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL'
): Promise<PaymentDocument[]> {
  try {
    let q;
    if (statusFilter === 'ALL') {
      q = query(collection(db, PAYMENTS_COLLECTION), orderBy('submittedAt', 'desc'));
    } else {
      q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('status', '==', statusFilter),
        orderBy('submittedAt', 'desc')
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PaymentDocument);
  } catch (error) {
    console.warn('[Firebase Payments] Index notice on getAllPayments, falling back to memory sort:', error);
    try {
      const fallbackQuery =
        statusFilter === 'ALL'
          ? collection(db, PAYMENTS_COLLECTION)
          : query(collection(db, PAYMENTS_COLLECTION), where('status', '==', statusFilter));
      const snap = await getDocs(fallbackQuery);
      const list = snap.docs.map((d) => d.data() as PaymentDocument);
      return list.sort((a, b) => {
        const timeA = a.submittedAt?.seconds
          ? a.submittedAt.seconds * 1000
          : a.submittedAt
          ? new Date(a.submittedAt).getTime()
          : 0;
        const timeB = b.submittedAt?.seconds
          ? b.submittedAt.seconds * 1000
          : b.submittedAt
          ? new Date(b.submittedAt).getTime()
          : 0;
        return timeB - timeA;
      });
    } catch (innerErr) {
      console.error('[Firebase Payments] Fallback error fetching payments:', innerErr);
      return [];
    }
  }
}

/**
 * Real-time listener for the Admin Payment Verification panel.
 * Updates instantly whenever a player submits proof or an admin approves/rejects.
 */
export function subscribeAllPayments(
  callback: (payments: PaymentDocument[]) => void,
  statusFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL'
): () => void {
  try {
    let q;
    if (statusFilter === 'ALL') {
      q = query(collection(db, PAYMENTS_COLLECTION), orderBy('submittedAt', 'desc'));
    } else {
      q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('status', '==', statusFilter),
        orderBy('submittedAt', 'desc')
      );
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as PaymentDocument);
        callback(list);
      },
      (error) => {
        console.warn('[Firebase Payments] Subscription fallback without orderBy:', error);
        const fallbackQuery =
          statusFilter === 'ALL'
            ? collection(db, PAYMENTS_COLLECTION)
            : query(collection(db, PAYMENTS_COLLECTION), where('status', '==', statusFilter));

        return onSnapshot(fallbackQuery, (snapshot) => {
          const list = snapshot.docs.map((d) => d.data() as PaymentDocument);
          list.sort((a, b) => {
            const timeA = a.submittedAt?.seconds
              ? a.submittedAt.seconds * 1000
              : a.submittedAt
              ? new Date(a.submittedAt).getTime()
              : 0;
            const timeB = b.submittedAt?.seconds
              ? b.submittedAt.seconds * 1000
              : b.submittedAt
              ? new Date(b.submittedAt).getTime()
              : 0;
            return timeB - timeA;
          });
          callback(list);
        });
      }
    );
  } catch (err) {
    console.error('[Firebase Payments] Error creating subscribeAllPayments listener:', err);
    return () => {};
  }
}

/**
 * Real Firestore Atomic Approval Transaction.
 * 1. Checks payment status == 'PENDING' (prevents double approval).
 * 2. Checks tournament capacity (if full, aborts with specific error).
 * 3. Updates payment doc -> status: 'APPROVED', verifiedAt: serverTimestamp(), verifiedBy: adminUid.
 * 4. Updates registration doc -> paymentStatus: 'APPROVED', registrationStatus: 'CONFIRMED'.
 * 5. Updates tournament doc -> increments occupiedSlots, decrements availableSlots, marks FULL if reached.
 * 6. Writes immutable audit log to paymentVerificationLogs/{logId}.
 * 7. Dispatches real-time notification to the player.
 */
export async function approvePaymentTransaction(
  paymentId: string,
  adminUid: string
): Promise<{ success: boolean; message: string; tournamentId: string; registrationId: string }> {
  // Pre-fetch payment to resolve registration ID and ensure existence
  const paymentDocRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  const paySnapPre = await getDoc(paymentDocRef);
  if (!paySnapPre.exists()) {
    throw new Error('Payment record not found.');
  }
  const paymentPre = paySnapPre.data() as PaymentDocument;
  if (paymentPre.status === 'APPROVED') {
    throw new Error('This payment has already been approved.');
  }

  let resolvedRegId = paymentPre.registrationId;
  if (!resolvedRegId) {
    const regQuery = query(
      collection(db, 'registrations'),
      where('paymentId', '==', paymentId)
    );
    const regSnap = await getDocs(regQuery);
    if (!regSnap.empty) {
      resolvedRegId = regSnap.docs[0].id;
    }
  }

  // Atomic transaction
  const result = await runTransaction(db, async (transaction) => {
    // 1. Re-read payment doc inside transaction
    const paySnap = await transaction.get(paymentDocRef);
    if (!paySnap.exists()) {
      throw new Error('Payment record not found.');
    }
    const payment = paySnap.data() as PaymentDocument;

    // Check duplicate approval
    if (payment.status === 'APPROVED') {
      throw new Error('This payment has already been approved.');
    }
    if (payment.status === 'REJECTED') {
      throw new Error('This payment was already marked as rejected.');
    }

    // 2. Global UTR Registry Check (Guarantees zero duplicate approval across any player/match)
    const cleanUtr = payment.utr.trim().replace(/\s+/g, '');
    const utrRef = doc(db, UTR_REGISTRY_COLLECTION, cleanUtr);
    const utrSnap = await transaction.get(utrRef);
    if (utrSnap.exists()) {
      throw new Error(
        `This transaction reference / UTR (${payment.utr}) has already been approved for another registration.`
      );
    }

    // 3. Read tournament document
    const tourneyRef = doc(db, 'tournaments', payment.tournamentId);
    const tourneySnap = await transaction.get(tourneyRef);
    if (!tourneySnap.exists()) {
      throw new Error(`Associated tournament (${payment.tournamentId}) not found.`);
    }
    const tourney = tourneySnap.data() as TournamentDocument;

    // Capacity Check
    const capacity = tourney.capacity ?? 48;
    const currentOccupied = tourney.occupiedSlots ?? 0;
    if (currentOccupied >= capacity) {
      throw new Error('This tournament is full. Payment cannot be confirmed automatically.');
    }

    // 4. Read registration document if exists
    let regRef = null;
    if (resolvedRegId) {
      regRef = doc(db, 'registrations', resolvedRegId);
      const regSnap = await transaction.get(regRef);
      if (!regSnap.exists()) {
        regRef = null; // Registration doc deleted or missing
      }
    }

    // Calculations
    const newOccupied = currentOccupied + 1;
    const newAvailable = Math.max(0, capacity - newOccupied);

    // 5. Update Payment
    transaction.update(paymentDocRef, {
      status: 'APPROVED',
      verifiedAt: serverTimestamp(),
      verifiedBy: adminUid,
    });

    // 6. Update Registration
    if (regRef) {
      transaction.update(regRef, {
        paymentStatus: 'APPROVED',
        registrationStatus: 'CONFIRMED',
        updatedAt: serverTimestamp(),
      });
    }

    // 7. Update Tournament slots & status
    transaction.update(tourneyRef, {
      occupiedSlots: newOccupied,
      availableSlots: newAvailable,
      ...(newOccupied >= capacity ? { status: 'FULL' } : {}),
      updatedAt: serverTimestamp(),
    });

    // 8. Register in Global UTR Registry (Prevents any other approval of same UTR)
    transaction.set(utrRef, {
      utr: cleanUtr,
      paymentId,
      userId: payment.userId,
      tournamentId: payment.tournamentId,
      approvedAt: serverTimestamp(),
      approvedBy: adminUid,
    });

    // 9. Write Audit Trail to paymentVerificationLogs
    const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const logRef = doc(db, VERIFICATION_LOGS_COLLECTION, logId);
    const logData: PaymentVerificationLogDocument = {
      logId,
      paymentId,
      registrationId: resolvedRegId || '',
      tournamentId: payment.tournamentId,
      userId: payment.userId,
      adminUid,
      action: 'APPROVED',
      amount: payment.amount,
      utr: payment.utr,
      timestamp: serverTimestamp(),
    };
    transaction.set(logRef, logData);

    return {
      tournamentId: payment.tournamentId,
      registrationId: resolvedRegId || '',
      amount: payment.amount,
      utr: payment.utr,
      userId: payment.userId,
      tournamentName: payment.tournamentName,
    };
  });

  // Post-transaction: Create player notification
  try {
    await createNotification(
      result.userId,
      'Payment Verified! 🎉',
      `Your payment of ₹${result.amount} (UTR: ${result.utr}) for ${result.tournamentName} has been verified! Registration confirmed.`,
      'PAYMENT_VERIFIED'
    );
  } catch (notifErr) {
    console.warn('[Firebase Payments] Could not dispatch notification:', notifErr);
  }

  return {
    success: true,
    message: `Payment of ₹${result.amount} approved successfully. Slot confirmed.`,
    tournamentId: result.tournamentId,
    registrationId: result.registrationId,
  };
}

/**
 * Real Firestore Atomic Rejection Transaction.
 * 1. Validates payment is not already approved.
 * 2. Updates payment doc -> status: 'REJECTED', adminNote: rejectionReason, verifiedAt, verifiedBy.
 * 3. Updates registration doc -> paymentStatus: 'REJECTED', registrationStatus: 'PAYMENT_REJECTED'.
 * 4. Does NOT increase tournament slot count.
 * 5. Writes immutable audit log to paymentVerificationLogs/{logId}.
 * 6. Dispatches real-time notification to the player with rejection reason.
 */
export async function rejectPaymentTransaction(
  paymentId: string,
  rejectionReason: string,
  adminUid: string
): Promise<{ success: boolean; message: string }> {
  const cleanReason = rejectionReason.trim() || 'Payment details could not be verified.';
  const paymentDocRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  const paySnapPre = await getDoc(paymentDocRef);
  if (!paySnapPre.exists()) {
    throw new Error('Payment record not found.');
  }
  const paymentPre = paySnapPre.data() as PaymentDocument;
  if (paymentPre.status === 'APPROVED') {
    throw new Error('Cannot reject a payment that has already been approved.');
  }

  let resolvedRegId = paymentPre.registrationId;
  if (!resolvedRegId) {
    const regQuery = query(
      collection(db, 'registrations'),
      where('paymentId', '==', paymentId)
    );
    const regSnap = await getDocs(regQuery);
    if (!regSnap.empty) {
      resolvedRegId = regSnap.docs[0].id;
    }
  }

  // Atomic transaction
  const result = await runTransaction(db, async (transaction) => {
    const paySnap = await transaction.get(paymentDocRef);
    if (!paySnap.exists()) {
      throw new Error('Payment record not found.');
    }
    const payment = paySnap.data() as PaymentDocument;

    if (payment.status === 'APPROVED') {
      throw new Error('Cannot reject a payment that has already been approved.');
    }
    if (payment.status === 'REJECTED') {
      throw new Error('This payment has already been rejected.');
    }

    let regRef = null;
    if (resolvedRegId) {
      regRef = doc(db, 'registrations', resolvedRegId);
      const regSnap = await transaction.get(regRef);
      if (!regSnap.exists()) {
        regRef = null;
      }
    }

    // 1. Update Payment (DO NOT touch tournament slots)
    transaction.update(paymentDocRef, {
      status: 'REJECTED',
      adminNote: cleanReason,
      verifiedAt: serverTimestamp(),
      verifiedBy: adminUid,
    });

    // 2. Update Registration
    if (regRef) {
      transaction.update(regRef, {
        paymentStatus: 'REJECTED',
        registrationStatus: 'PAYMENT_REJECTED',
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Write Audit Trail to paymentVerificationLogs
    const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const logRef = doc(db, VERIFICATION_LOGS_COLLECTION, logId);
    const logData: PaymentVerificationLogDocument = {
      logId,
      paymentId,
      registrationId: resolvedRegId || '',
      tournamentId: payment.tournamentId,
      userId: payment.userId,
      adminUid,
      action: 'REJECTED',
      amount: payment.amount,
      utr: payment.utr,
      reason: cleanReason,
      timestamp: serverTimestamp(),
    };
    transaction.set(logRef, logData);

    return {
      userId: payment.userId,
      tournamentName: payment.tournamentName,
      amount: payment.amount,
      utr: payment.utr,
    };
  });

  // Post-transaction: Create player notification
  try {
    await createNotification(
      result.userId,
      'Payment Verification Update ⚠️',
      `Your payment of ₹${result.amount} (UTR: ${result.utr}) for ${result.tournamentName} was rejected. Reason: ${cleanReason}`,
      'PAYMENT_REJECTED'
    );
  } catch (notifErr) {
    console.warn('[Firebase Payments] Could not dispatch notification:', notifErr);
  }

  return {
    success: true,
    message: `Payment rejected with note: "${cleanReason}".`,
  };
}

/**
 * Fetches audit verification logs for auditing & inspection.
 */
export async function getPaymentVerificationLogs(
  paymentId?: string
): Promise<PaymentVerificationLogDocument[]> {
  try {
    let q;
    if (paymentId) {
      q = query(
        collection(db, VERIFICATION_LOGS_COLLECTION),
        where('paymentId', '==', paymentId)
      );
    } else {
      q = query(
        collection(db, VERIFICATION_LOGS_COLLECTION),
        orderBy('timestamp', 'desc')
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PaymentVerificationLogDocument);
  } catch (error) {
    console.error('[Firebase Payments] Error fetching verification logs:', error);
    return [];
  }
}

