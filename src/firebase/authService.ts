/**
 * Firebase Authentication Service — FF Arena
 * Connects Firebase Auth with Cloud Firestore user profiles and role governance.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInAnonymously,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, getEnvVar } from './config';
import type { UserDocument, AppUserRole } from '../types';

/**
 * Returns configured admin emails from environment variables.
 * Never stores admin passwords or sensitive credentials in client code.
 */
export function getAdminEmails(): string[] {
  const envAdmins = getEnvVar('VITE_ADMIN_EMAILS') || 'mayankbohara0@gmail.com,sahilzalte36@gmail.com,bhadanepavan04@gmail.com,jaydip13452@gmail.com';
  return envAdmins
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks if a given email is registered as an admin.
 */
export function isEmailAdmin(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.trim().toLowerCase());
}

/**
 * Fetches user profile document from Firestore (`users/{uid}`).
 */
export async function getUserProfile(uid: string): Promise<UserDocument | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserDocument;
    }
    return null;
  } catch (error) {
    console.error(`[Firebase Auth] Error fetching profile for ${uid}:`, error);
    return null;
  }
}

/**
 * Creates or updates a user profile document in Firestore (`users/{uid}`).
 */
export async function createOrUpdateUserProfile(
  uid: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    role?: AppUserRole;
  }
): Promise<UserDocument> {
  const userRef = doc(db, 'users', uid);
  const existing = await getUserProfile(uid);

  // Determine role:
  // 1. If explicitly provided and existing doc already has admin, keep admin
  // 2. If user email is in VITE_ADMIN_EMAILS, elevate to 'admin'
  // 3. Otherwise, default to 'player'
  let finalRole: AppUserRole = data.role || existing?.role || 'player';
  if (isEmailAdmin(data.email)) {
    finalRole = 'admin';
  }

  const profileData: UserDocument = {
    uid,
    name: data.name || existing?.name || 'Arena Warrior',
    email: data.email.toLowerCase(),
    phone: data.phone || existing?.phone || '',
    role: finalRole,
    createdAt: existing?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, profileData, { merge: true });
  return profileData;
}

/**
 * Registers a new user with Firebase Authentication and creates `users/{uid}` profile.
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  name: string,
  phone?: string
): Promise<{ user: UserDocument; firebaseUser: FirebaseUser }> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const profile = await createOrUpdateUserProfile(cred.user.uid, {
    name: name.trim(),
    email: cred.user.email || email,
    phone: phone?.trim(),
    role: isEmailAdmin(cred.user.email) ? 'admin' : 'player',
  });

  return { user: profile, firebaseUser: cred.user };
}

/**
 * Signs in an existing user with Firebase Authentication.
 */
export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{ user: UserDocument; firebaseUser: FirebaseUser }> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  let profile = await getUserProfile(cred.user.uid);

  if (!profile) {
    // Bootstrap profile if missing
    profile = await createOrUpdateUserProfile(cred.user.uid, {
      name: cred.user.displayName || email.split('@')[0],
      email: cred.user.email || email,
      role: isEmailAdmin(cred.user.email) ? 'admin' : 'player',
    });
  }

  return { user: profile, firebaseUser: cred.user };
}

/**
 * Signs in anonymously for guest browsing and sandbox testing.
 */
export async function signInAnonymouslyUser(
  displayName = 'Guest Player'
): Promise<{ user: UserDocument; firebaseUser: FirebaseUser }> {
  const cred = await signInAnonymously(auth);
  let profile = await getUserProfile(cred.user.uid);

  if (!profile) {
    profile = await createOrUpdateUserProfile(cred.user.uid, {
      name: displayName,
      email: `guest-${cred.user.uid.slice(0, 6)}@ffarena.in`,
      role: 'player',
    });
  }

  return { user: profile, firebaseUser: cred.user };
}

/**
 * Signs out the current Firebase user.
 */
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Subscribes to Firebase Authentication state changes.
 * Resolves full `UserDocument` with role.
 */
export function onAuthChange(
  callback: (userDoc: UserDocument | null, fbUser: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null, null);
      return;
    }

    try {
      let profile = await getUserProfile(fbUser.uid);
      if (!profile && fbUser.email) {
        profile = await createOrUpdateUserProfile(fbUser.uid, {
          name: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          role: isEmailAdmin(fbUser.email) ? 'admin' : 'player',
        });
      }
      callback(profile, fbUser);
    } catch (err) {
      console.error('[Firebase Auth] Error resolving user profile on auth change:', err);
      callback(null, fbUser);
    }
  });
}
