/**
 * Firebase Authentication Context — FF Arena
 * Provides user state, role detection ('player' | 'admin'), and auth handlers.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  onAuthChange,
  signInWithEmail,
  signUpWithEmail,
  signInAnonymouslyUser,
  signOutUser,
  getUserProfile,
  isEmailAdmin,
} from '../firebase';
import type { UserDocument, AppUserRole } from '../types';

interface AuthContextType {
  user: UserDocument | null;
  firebaseUser: FirebaseUser | null;
  role: AppUserRole;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  signInAsGuest: (displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDocument | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((userDoc, fbUser) => {
      setUser(userDoc);
      setFirebaseUser(fbUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithEmail(email, pass);
      setUser(res.user);
      setFirebaseUser(res.firebaseUser);
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in. Please check your credentials.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string, phone?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signUpWithEmail(email, pass, name, phone);
      setUser(res.user);
      setFirebaseUser(res.firebaseUser);
    } catch (err: any) {
      const msg = err?.message || 'Failed to create account.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInAsGuest = async (displayName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInAnonymouslyUser(displayName);
      setUser(res.user);
      setFirebaseUser(res.firebaseUser);
    } catch (err: any) {
      const msg = err?.message || 'Failed to continue as guest.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setFirebaseUser(null);
    } catch (err: any) {
      console.error('[AuthContext] Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (firebaseUser?.uid) {
      const fresh = await getUserProfile(firebaseUser.uid);
      if (fresh) setUser(fresh);
    }
  };

  const role: AppUserRole = user?.role || (isEmailAdmin(firebaseUser?.email) ? 'admin' : 'player');
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role,
        isAdmin,
        loading,
        error,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
