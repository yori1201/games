/**
 * Auth Context for RUMBELA GAMES
 * Wraps Firebase Auth state and exposes it as a React context.
 *
 * Auth model:
 * - All users sign in anonymously on first visit (creates a UID).
 * - Their profile (role, displayName, etc.) is stored in Firestore `students/{uid}`.
 * - Role is determined by the access code they entered (looked up in `access_codes/{code}`).
 * - Security rules enforce that only the user themselves (or admin) can read/write their data.
 */
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import type { StudentProfile } from '../types/game';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  authError: string | null;
  student: StudentProfile | null;
  setStudent: (s: StudentProfile | null) => void;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);

      // Auto-sign-in anonymously if no user yet
      if (!u) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error('[auth] Anonymous sign-in failed:', err);
          setAuthError(
            'Tidak bisa masuk anonim. Pastikan Anonymous Authentication aktif di Firebase Console.'
          );
        }
      }
    });
    return () => unsub();
  }, []);

  const signIn = async () => {
    try {
      await signInAnonymously(auth);
      setAuthError(null);
    } catch (err) {
      console.error('[auth] signIn failed:', err);
      setAuthError('Gagal masuk. Coba refresh halaman.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setStudent(null);
      // Re-sign-in anonymously so the app stays functional
      await signInAnonymously(auth);
    } catch (err) {
      console.error('[auth] logout failed:', err);
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAuthReady,
    authError,
    student,
    setStudent,
    signIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
