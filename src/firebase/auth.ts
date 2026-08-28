/**
 * Firebase Phone Authentication Service
 * Wraps Firebase Auth phone OTP flow with a clean API.
 */
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Set up invisible reCAPTCHA on a container element.
 * Must be called once before sendOTP.
 */
export function setupRecaptcha(containerId: string): void {
  if (!isFirebaseConfigured()) return;
  if (recaptchaVerifier) return; // Already set up

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved automatically
    },
    'expired-callback': () => {
      recaptchaVerifier = null;
    },
  });
}

/**
 * Send OTP to an Indian phone number.
 * @param phone - 10-digit number (no country code). We add +91.
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured()) {
    // Mock mode — always succeed
    console.warn('[Firebase] Not configured — using mock OTP flow');
    return { success: true };
  }

  try {
    if (!recaptchaVerifier) {
      return { success: false, error: 'reCAPTCHA not initialized. Please refresh.' };
    }
    const phoneWithCountryCode = `+91${phone.replace(/\D/g, '')}`;
    confirmationResult = await signInWithPhoneNumber(auth, phoneWithCountryCode, recaptchaVerifier);
    return { success: true };
  } catch (err: any) {
    console.error('[Firebase Auth] sendOTP error:', err);
    return { success: false, error: err.message || 'Failed to send OTP. Try again.' };
  }
}

/**
 * Verify OTP entered by user.
 * Returns the Firebase user on success.
 */
export async function verifyOTP(otp: string): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  if (!isFirebaseConfigured()) {
    // Mock — any 6-digit code works
    return { success: true };
  }

  try {
    if (!confirmationResult) {
      return { success: false, error: 'Session expired. Please request a new OTP.' };
    }
    const credential = await confirmationResult.confirm(otp);
    return { success: true, user: credential.user };
  } catch (err: any) {
    console.error('[Firebase Auth] verifyOTP error:', err);
    return { success: false, error: 'Invalid OTP. Please try again.' };
  }
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await signOut(auth);
    confirmationResult = null;
  } catch (err) {
    console.error('[Firebase Auth] signOut error:', err);
  }
}

/**
 * Subscribe to auth state changes.
 * Returns unsubscribe function.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  if (!isFirebaseConfigured()) {
    // Mock — immediately call with null (unauthenticated)
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export type { FirebaseUser };
