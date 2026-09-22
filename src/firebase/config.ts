/**
 * Firebase Client SDK Initialization & Core Config — FF Arena
 * Provides Auth, Cloud Firestore, and Firebase Storage instances.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export function getEnvVar(key: string): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch {
    // fallback
  }
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key] as string;
  }
  return '';
}

const firebaseConfig: FirebaseConfigOptions = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
};

/**
 * Checks if all required Firebase environment variables are provided.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

// Singleton instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (!getApps().length) {
    if (isFirebaseConfigured()) {
      app = initializeApp(firebaseConfig);
      console.log('🔥 [Firebase] Initialized production app with Project ID:', firebaseConfig.projectId);
    } else {
      // Fallback app configuration to allow development and avoid crashes before user pastes keys
      console.warn('⚠️ [Firebase] VITE_FIREBASE_* environment variables missing or incomplete in .env. Initializing development container.');
      app = initializeApp({
        apiKey: 'demo-api-key',
        authDomain: 'demo-project.firebaseapp.com',
        projectId: 'demo-ff-arena',
        storageBucket: 'demo-ff-arena.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef123456',
      }, '[DEFAULT]');
    }
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('❌ [Firebase] Initialization failed:', error);
  throw error;
}

export { app, auth, db, storage, firebaseConfig };
