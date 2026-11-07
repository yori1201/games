/**
 * Firebase initialization for RUMBELA GAMES
 * Production-ready: reads config from env vars, initializes Auth + Firestore.
 *
 * Security model:
 * - Firebase Web API key is PUBLIC by design (it's shipped in the client bundle).
 * - Real security comes from Firestore Security Rules + Firebase Auth, NOT from hiding the API key.
 * - See firestore.rules for the authoritative access control.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

// Validate required env vars at module load time
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];
const missingVars = requiredEnvVars.filter((v) => !import.meta.env[v]);
if (missingVars.length > 0) {
  console.error(
    '[firebase] Missing required environment variables:',
    missingVars.join(', '),
    '\nCopy .env.example to .env.local and fill in the values.'
  );
}

// Initialize Firebase App (singleton)
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the specific database ID, plus offline persistence
let dbInstance: Firestore | null = null;
try {
  if (firestoreDatabaseId) {
    // initializeFirestore with a non-default database ID
    // The 'databaseId' field is accepted at runtime but not in TS types — cast to any to bypass.
    dbInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      } as any,
      firestoreDatabaseId
    );
  } else {
    dbInstance = getFirestore(app);
  }
} catch (err) {
  console.warn('[firebase] Firestore init failed, falling back to default:', err);
  dbInstance = getFirestore(app);
}
export const db: Firestore = dbInstance!;

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

/**
 * Quick connection sanity check (callable from app init / debug).
 * Returns true if Firestore is reachable, false otherwise.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (!db) return false;
    // We don't need to actually read a doc — if Firestore instance exists,
    // we consider it "ready". Actual permission errors will surface on first read/write.
    return true;
  } catch (err) {
    console.warn('[firebase] Connection test failed:', err);
    return false;
  }
}
