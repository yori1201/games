/**
 * Data Service for RUMBELA GAMES
 * Replaces the old Express server.ts with direct Firebase Firestore calls.
 *
 * All functions assume the caller is authenticated (auth.currentUser != null).
 * Security is enforced by firestore.rules on the server side.
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
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type {
  StudentProfile,
  StudentLevelProgress,
  SessionResult,
  SubjectCode,
  UserRole,
  EducationStage,
} from '../types/game';

// ============================================================
// Types matching firestore-blueprint.json
// ============================================================

interface StudentDoc {
  accessCode: string;
  displayName: string;
  educationStage: EducationStage;
  gradeCode: string;
  avatarKey: string;
  xp: number;
  stars: number;
  streak: number;
  lastStreakClaimDate?: string;
  streakRewardClaimedToday?: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface ProgressDoc {
  studentId: string;
  subjectCode: SubjectCode;
  competencyId: string;
  levelNumber: number;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'MASTERED';
  stars: number;
  masteryScore: number;
  bestAccuracy: number;
  attemptCount: number;
  lastPracticedAt: string;
  updatedAt: string;
}

// ============================================================
// Helpers
// ============================================================

const STUDENTS_COLLECTION = 'students';
const PROGRESS_COLLECTION = 'student_progress';
const SESSIONS_COLLECTION = 'game_sessions';
const ATTEMPTS_COLLECTION = 'answer_attempts';
const ACCESS_CODES_COLLECTION = 'access_codes';

function getUid(): string {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated. Call signInAnonymously first.');
  return u.uid;
}

function docToStudent(id: string, data: DocumentData): StudentProfile {
  return {
    id,
    accessCode: data.accessCode || '',
    displayName: data.displayName || 'Anonim',
    educationStage: data.educationStage || 'SD',
    gradeCode: data.gradeCode || 'SD_1',
    avatarKey: data.avatarKey || '🦊',
    xp: data.xp || 0,
    stars: data.stars || 0,
    streak: data.streak || 1,
    lastStreakClaimDate: data.lastStreakClaimDate || undefined,
    streakRewardClaimedToday: data.streakRewardClaimedToday || false,
    role: data.role || 'student',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

function docToProgress(id: string, data: DocumentData): StudentLevelProgress {
  return {
    id,
    studentId: data.studentId,
    subjectCode: data.subjectCode,
    competencyId: data.competencyId || '',
    levelId: data.levelId || `lvl_${data.subjectCode.toLowerCase()}_${data.levelNumber}`,
    levelNumber: data.levelNumber,
    status: data.status || 'LOCKED',
    stars: data.stars || 0,
    masteryScore: data.masteryScore || 0,
    bestAccuracy: data.bestAccuracy || 0,
    attemptCount: data.attemptCount || 0,
    lastPracticedAt: data.lastPracticedAt || new Date().toISOString(),
  };
}

// ============================================================
// 1. AUTH / ACCESS CODE VALIDATION
// (Replaces POST /api/auth/access)
// ============================================================

export interface AccessCodeInfo {
  accessCode: string;
  role: UserRole;
  displayName?: string;
  educationStage?: EducationStage;
  gradeCode?: string;
  avatarKey?: string;
  isPreRegistered: boolean;
}

/**
 * Look up an access code in Firestore to determine role & pre-filled profile.
 * Returns null if code is not registered.
 */
export async function lookupAccessCode(code: string): Promise<AccessCodeInfo | null> {
  const clean = code.trim().toUpperCase();
  try {
    const snap = await getDoc(doc(db, ACCESS_CODES_COLLECTION, clean));
    if (snap.exists()) {
      const data = snap.data() as AccessCodeInfo;
      return { ...data, isPreRegistered: true };
    }
  } catch (err) {
    console.warn('[data-service] lookupAccessCode failed:', err);
  }
  return null;
}

/**
 * Verify access code / get-or-register student.
 * Mirrors old POST /api/auth/access behavior.
 */
export async function verifyAccessAndSignIn(payload: {
  accessCode: string;
  displayName?: string;
  educationStage?: EducationStage;
  gradeCode?: string;
  avatarKey?: string;
}): Promise<{ student: StudentProfile; isNewUser: boolean }> {
  const clean = payload.accessCode.trim().toUpperCase();

  // Look up the access code first
  const codeInfo = await lookupAccessCode(clean);
  const role: UserRole = codeInfo?.role || (clean.includes('TUTOR') ? 'tutor' : clean.includes('ADMIN') ? 'admin' : 'student');

  // Try to find an existing student by accessCode
  const q = query(collection(db, STUDENTS_COLLECTION), where('accessCode', '==', clean));
  const existing = await getDocs(q);

  if (!existing.empty) {
    // Existing student — return their profile
    const dSnap = existing.docs[0];
    const student = docToStudent(dSnap.id, dSnap.data());
    return { student, isNewUser: false };
  }

  // New student — register
  const newStudent: StudentDoc = {
    accessCode: clean,
    displayName: payload.displayName?.trim() || codeInfo?.displayName || 'Siswa Baru',
    educationStage: payload.educationStage || codeInfo?.educationStage || 'SD',
    gradeCode: payload.gradeCode || codeInfo?.gradeCode || 'SD_1',
    avatarKey: payload.avatarKey || codeInfo?.avatarKey || '🦊',
    xp: 0,
    stars: 0,
    streak: 1,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Use the auth UID as the document ID for consistency
  const uid = getUid();
  await setDoc(doc(db, STUDENTS_COLLECTION, uid), newStudent);

  return {
    student: { id: uid, ...newStudent },
    isNewUser: true,
  };
}

// ============================================================
// 2. STUDENT PROGRESS
// (Replaces GET /api/student/:id/progress)
// ============================================================

export async function fetchStudentProgress(studentId: string): Promise<StudentLevelProgress[]> {
  try {
    const q = query(collection(db, PROGRESS_COLLECTION), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToProgress(d.id, d.data()));
  } catch (err) {
    console.warn('[data-service] fetchStudentProgress failed:', err);
    return [];
  }
}

// ============================================================
// 3. COMPLETE SESSION & CONCLUDE MASTERY
// (Replaces POST /api/sessions/complete)
// ============================================================

export async function completeSession(payload: {
  studentId: string;
  subjectCode: SubjectCode;
  levelNumber: number;
  result: SessionResult;
}): Promise<{ student: StudentProfile; progress: StudentLevelProgress[] }> {
  const { studentId, subjectCode, levelNumber, result } = payload;
  const now = new Date().toISOString();

  // Update student XP and stars
  const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
  const studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) throw new Error('Student not found');

  const studentData = studentSnap.data() as StudentDoc;
  const updatedStudent: StudentDoc = {
    ...studentData,
    xp: (studentData.xp || 0) + (result.xpEarned || 0),
    stars: (studentData.stars || 0) + (result.starsEarned || 0),
    updatedAt: now,
  };
  await updateDoc(studentRef, {
    xp: updatedStudent.xp,
    stars: updatedStudent.stars,
    updatedAt: now,
  });

  // Update or create progress record
  const progressKey = `${studentId}_${subjectCode}_${levelNumber}`;
  const progressRef = doc(db, PROGRESS_COLLECTION, progressKey);
  const progSnap = await getDoc(progressRef);

  const existingProg = progSnap.exists() ? (progSnap.data() as ProgressDoc) : null;
  const updatedProgress: ProgressDoc = {
    studentId,
    subjectCode,
    competencyId: `comp_${subjectCode.toLowerCase()}_${levelNumber}`,
    levelNumber,
    status: result.decision === 'LEVEL_MASTERED' ? 'MASTERED' : existingProg?.status || 'AVAILABLE',
    stars: Math.max(existingProg?.stars || 0, result.starsEarned || 0),
    masteryScore: Math.max(existingProg?.masteryScore || 0, result.masteryScore || 0),
    bestAccuracy: Math.max(existingProg?.bestAccuracy || 0, result.accuracy || 0),
    attemptCount: (existingProg?.attemptCount || 0) + 1,
    lastPracticedAt: now,
    updatedAt: now,
  };
  await setDoc(progressRef, updatedProgress, { merge: true });

  // Auto-unlock next level if mastered
  if (result.decision === 'LEVEL_MASTERED' && levelNumber < 10) {
    const nextKey = `${studentId}_${subjectCode}_${levelNumber + 1}`;
    const nextRef = doc(db, PROGRESS_COLLECTION, nextKey);
    const nextSnap = await getDoc(nextRef);
    if (!nextSnap.exists() || (nextSnap.data() as ProgressDoc).status === 'LOCKED') {
      const nextProg: ProgressDoc = {
        studentId,
        subjectCode,
        competencyId: `comp_${subjectCode.toLowerCase()}_${levelNumber + 1}`,
        levelNumber: levelNumber + 1,
        status: 'AVAILABLE',
        stars: 0,
        masteryScore: 0,
        bestAccuracy: 0,
        attemptCount: 0,
        lastPracticedAt: now,
        updatedAt: now,
      };
      await setDoc(nextRef, nextProg, { merge: true });
    }
  }

  // Record the game session (audit trail)
  const sessionRef = doc(collection(db, SESSIONS_COLLECTION));
  await setDoc(sessionRef, {
    sessionId: result.sessionId,
    studentId,
    subjectCode,
    levelNumber,
    status: 'COMPLETED',
    score: result.accuracy,
    accuracy: result.accuracy,
    masteryScore: result.masteryScore,
    xpEarned: result.xpEarned,
    starsEarned: result.starsEarned,
    adaptiveDecision: result.decision,
    adaptiveReason: result.decisionReason,
    startedAt: now,
    completedAt: now,
    createdAt: serverTimestamp(),
  });

  // Return updated student + full progress list
  const allProgress = await fetchStudentProgress(studentId);
  return {
    student: { id: studentId, ...updatedStudent },
    progress: allProgress,
  };
}

// ============================================================
// 4. TUTOR: GET ALL STUDENTS & PROGRESS
// (Replaces GET /api/tutor/students)
// ============================================================

export async function fetchTutorRoster(): Promise<{
  students: StudentProfile[];
  progress: StudentLevelProgress[];
}> {
  try {
    const [studentsSnap, progressSnap] = await Promise.all([
      getDocs(collection(db, STUDENTS_COLLECTION)),
      getDocs(collection(db, PROGRESS_COLLECTION)),
    ]);
    const students = studentsSnap.docs.map((d) => docToStudent(d.id, d.data()));
    const progress = progressSnap.docs.map((d) => docToProgress(d.id, d.data()));
    return { students, progress };
  } catch (err) {
    console.warn('[data-service] fetchTutorRoster failed:', err);
    return { students: [], progress: [] };
  }
}

// ============================================================
// 5. TUTOR MANUAL UNLOCK OVERRIDE
// (Replaces POST /api/tutor/override-unlock)
// ============================================================

export async function tutorOverrideUnlock(payload: {
  studentId: string;
  subjectCode: SubjectCode;
  levelNumber: number;
  reason: string;
  tutorId: string;
}): Promise<{ progress: StudentLevelProgress[] }> {
  const { studentId, subjectCode, levelNumber, reason, tutorId } = payload;
  const now = new Date().toISOString();
  const key = `${studentId}_${subjectCode}_${levelNumber}`;
  const ref = doc(db, PROGRESS_COLLECTION, key);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as ProgressDoc) : null;

  const unlocked: ProgressDoc = {
    studentId,
    subjectCode,
    competencyId: `comp_${subjectCode.toLowerCase()}_${levelNumber}`,
    levelNumber,
    status: 'AVAILABLE',
    stars: existing?.stars || 0,
    masteryScore: existing?.masteryScore || 80,
    bestAccuracy: existing?.bestAccuracy || 80,
    attemptCount: existing?.attemptCount || 1,
    lastPracticedAt: now,
    updatedAt: now,
  };
  await setDoc(ref, unlocked, { merge: true });

  // Audit log
  console.log(`[Tutor Override] Tutor ${tutorId} unlocked ${subjectCode} L${levelNumber} for ${studentId}. Reason: ${reason}`);

  return { progress: await fetchStudentProgress(studentId) };
}

// ============================================================
// 6. CLAIM DAILY STREAK BONUS
// (Replaces POST /api/student/claim-streak)
// ============================================================

const STREAK_BONUS_TABLE: Record<number, number> = {
  1: 15,
  2: 25,
  3: 35,
  4: 45,
  5: 60,
  6: 75,
  7: 120,
};

export async function claimDailyStreak(studentId: string): Promise<{
  bonusXP: number;
  cycleDay: number;
  streak: number;
  student: StudentProfile;
}> {
  const ref = doc(db, STUDENTS_COLLECTION, studentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Student not found');

  const data = snap.data() as StudentDoc;
  const todayStr = new Date().toISOString().split('T')[0];
  if (data.lastStreakClaimDate === todayStr) {
    throw new Error('Bonus streak hari ini sudah diklaim!');
  }

  const currentStreak = (data.streak || 0) + 1;
  const cycleDay = ((currentStreak - 1) % 7) + 1;
  const bonusXP = STREAK_BONUS_TABLE[cycleDay] || 25;

  const updated: Partial<StudentDoc> = {
    streak: currentStreak,
    xp: (data.xp || 0) + bonusXP,
    lastStreakClaimDate: todayStr,
    streakRewardClaimedToday: true,
    updatedAt: new Date().toISOString(),
  };
  await updateDoc(ref, updated);

  return {
    bonusXP,
    cycleDay,
    streak: currentStreak,
    student: { id: studentId, ...data, ...updated } as StudentProfile,
  };
}

// ============================================================
// 7. RECORD ANSWER ATTEMPT (granular audit)
// ============================================================

export async function recordAnswerAttempt(payload: {
  sessionId: string;
  studentId: string;
  questionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
}): Promise<void> {
  try {
    const ref = doc(collection(db, ATTEMPTS_COLLECTION));
    await setDoc(ref, {
      ...payload,
      submittedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Don't fail the session if audit logging fails
    console.warn('[data-service] recordAnswerAttempt failed (non-fatal):', err);
  }
}

// ============================================================
// SEED HELPERS (call once from admin script if needed)
// ============================================================

/**
 * Seed an access code into Firestore so it can be looked up at login.
 * Used by admin to create new tutor/admin/student invite codes.
 */
export async function seedAccessCode(info: AccessCodeInfo): Promise<void> {
  await setDoc(doc(db, ACCESS_CODES_COLLECTION, info.accessCode), info);
}

/**
 * Seed a demo student (for first-run QA). Safe to call multiple times.
 */
export async function seedDemoStudent(payload: {
  uid: string;
  accessCode: string;
  displayName: string;
  educationStage: EducationStage;
  gradeCode: string;
  avatarKey: string;
  xp: number;
  stars: number;
  streak: number;
  role: UserRole;
}): Promise<void> {
  const now = new Date().toISOString();
  await setDoc(doc(db, STUDENTS_COLLECTION, payload.uid), {
    accessCode: payload.accessCode,
    displayName: payload.displayName,
    educationStage: payload.educationStage,
    gradeCode: payload.gradeCode,
    avatarKey: payload.avatarKey,
    xp: payload.xp,
    stars: payload.stars,
    streak: payload.streak,
    role: payload.role,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // Also seed the access code so it can be looked up
  await seedAccessCode({
    accessCode: payload.accessCode,
    role: payload.role,
    displayName: payload.displayName,
    educationStage: payload.educationStage,
    gradeCode: payload.gradeCode,
    avatarKey: payload.avatarKey,
    isPreRegistered: true,
  });
}
