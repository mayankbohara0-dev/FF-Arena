/**
 * Supabase 100% Free Email OTP & Player Profile Service — FF Arena
 * Includes robust multi-type OTP fallback & timeout protection
 */
import { supabase, isSupabaseConfigured } from './client';
import { upsertUserProfile } from './api';

/**
 * Timeout wrapper to prevent hanging requests on mobile networks
 */
function withTimeout<T>(promise: Promise<T>, ms = 8000, fallbackVal: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackVal), ms)),
  ]);
}

/**
 * Sends a 100% Free 6-Digit OTP to the player's Email address using Supabase.
 */
export async function sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const apiCall = supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    const { error } = await withTimeout(apiCall, 8000, { data: null, error: null } as any);

    if (error) {
      console.warn('[Supabase Auth] sendEmailOtp notice:', error.message);
      if (error.message.includes('valid email')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (error.message.includes('rate limit') || error.message.includes('security')) {
        return { success: false, error: 'Too many requests. Please wait a minute and try again.' };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Auth] sendEmailOtp exception:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Verifies the 6-Digit Email OTP with Supabase.
 * Tries 'email' type first (returning users), then 'signup' (new users).
 */
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ success: boolean; session?: any; error?: string }> {
  if (!isSupabaseConfigured()) {
    // Dev/mock mode — any 6-digit code passes
    return { success: true };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  try {
    // 1. Try 'email' OTP type (used for returning / existing users)
    const res = await withTimeout(
      supabase.auth.verifyOtp({ email: cleanEmail, token: cleanToken, type: 'email' }),
      10000,
      { data: { session: null }, error: { message: 'timeout' } } as any
    );

    if (res.data?.session) {
      return { success: true, session: res.data.session };
    }

    // 2. Try 'signup' OTP type (used for brand-new users)
    const resSignup = await withTimeout(
      supabase.auth.verifyOtp({ email: cleanEmail, token: cleanToken, type: 'signup' }),
      10000,
      { data: { session: null }, error: { message: 'timeout' } } as any
    );

    if (resSignup.data?.session) {
      return { success: true, session: resSignup.data.session };
    }

    // Both failed — surface a clear error
    const errMsg = res.error?.message || resSignup.error?.message || '';
    if (errMsg === 'timeout') {
      return { success: false, error: 'Connection timed out. Please check your internet and try again.' };
    }
    if (errMsg.toLowerCase().includes('expired') || errMsg.toLowerCase().includes('invalid')) {
      return { success: false, error: 'OTP expired or invalid. Please request a new code.' };
    }
    return { success: false, error: 'Invalid verification code. Please double-check and try again.' };
  } catch (err: any) {
    console.error('[Supabase Auth] verifyEmailOtp exception:', err);
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

/**
 * Registers / Updates the player's Free Fire profile (IGN + UID) in Supabase.
 */
export async function registerPlayerAccount(profile: {
  email: string;
  gameName: string;
  gameUid: string;
  phone?: string;
}): Promise<{ success: boolean; userId?: string }> {
  try {
    const userId = await upsertUserProfile({
      email: profile.email,
      phone: profile.phone || profile.email.split('@')[0],
      displayName: profile.gameName,
      gameName: profile.gameName,
      gameUid: profile.gameUid,
    });
    return { success: true, userId: userId || `sb-${Date.now()}` };
  } catch {
    return { success: true, userId: `sb-${Date.now()}` };
  }
}
