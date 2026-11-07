/**
 * SEED SCRIPT — RUMBELA GAMES
 * ============================================================
 * Jalankan script ini SEKALI setelah deploy pertama untuk:
 *   1. Mendaftarkan access codes (RUMBELA-SISWA, RUMBELA-TUTOR, RUMBELA-ADMIN)
 *      di Firestore collection `access_codes`.
 *   2. Mendaftarkan 3 demo students (Budi, Siti, Alif) dengan data awal.
 *
 * CARA JALANKAN:
 *   1. Pastikan `.env.local` sudah berisi VITE_FIREBASE_* (sama seperti app).
 *   2. Pastikan Firebase Authentication → Sign-in method → Anonymous = ENABLE.
 *   3. Jalankan:
 *        npm run seed
 *
 * Script ini idempotent — aman dijalankan berulang kali (data lama di-merge, tidak overwrite).
 */
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Missing VITE_FIREBASE_* env vars. Copy .env.example to .env.local and fill in values.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

// ============================================================
// Access codes to seed
// ============================================================
const ACCESS_CODES = [
  { accessCode: 'RUMBELA-SISWA', role: 'student', displayName: 'Budi Petualang', educationStage: 'SD', gradeCode: 'SD_2', avatarKey: '🦊', isPreRegistered: true },
  { accessCode: 'RUMBELA-SITI',  role: 'student', displayName: 'Siti Cerdas',   educationStage: 'SD', gradeCode: 'SD_1', avatarKey: '🐰', isPreRegistered: true },
  { accessCode: 'RUMBELA-ALIF',  role: 'student', displayName: 'Alif Kreatif',  educationStage: 'TK', gradeCode: 'TK_B', avatarKey: '🦁', isPreRegistered: true },
  { accessCode: 'RUMBELA-TUTOR', role: 'tutor',   displayName: 'Kakak Tutor Rumbela', educationStage: 'SD', gradeCode: 'SD_ALL', avatarKey: '🦉', isPreRegistered: true },
  { accessCode: 'RUMBELA-ADMIN', role: 'admin',   displayName: 'Admin Rumbela',      educationStage: 'SD', gradeCode: 'SD_ALL', avatarKey: '🦉', isPreRegistered: true },
];

// ============================================================
// Demo student records (paired with access codes above)
// Uses deterministic IDs (demo_*) for QA — real users get their own UID on first login
// ============================================================
const DEMO_STUDENTS = [
  { uid: 'demo_siswa', accessCode: 'RUMBELA-SISWA', displayName: 'Budi Petualang', educationStage: 'SD', gradeCode: 'SD_2', avatarKey: '🦊', xp: 140, stars: 8, streak: 3, role: 'student' },
  { uid: 'demo_siti',  accessCode: 'RUMBELA-SITI',  displayName: 'Siti Cerdas',   educationStage: 'SD', gradeCode: 'SD_1', avatarKey: '🐰', xp: 220, stars: 14, streak: 5, role: 'student' },
  { uid: 'demo_alif',  accessCode: 'RUMBELA-ALIF',  displayName: 'Alif Kreatif',  educationStage: 'TK', gradeCode: 'TK_B', avatarKey: '🦁', xp: 90,  stars: 6,  streak: 2, role: 'student' },
];

// ============================================================
// Initial progress for Budi (demo student)
// ============================================================
const BUDI_PROGRESS = [
  { subjectCode: 'MATH',    levelNumber: 1, status: 'MASTERED',  stars: 3, masteryScore: 100, bestAccuracy: 100, attemptCount: 1 },
  { subjectCode: 'MATH',    levelNumber: 2, status: 'AVAILABLE', stars: 2, masteryScore: 80,  bestAccuracy: 80,  attemptCount: 1 },
  { subjectCode: 'ENGLISH', levelNumber: 1, status: 'MASTERED',  stars: 3, masteryScore: 100, bestAccuracy: 100, attemptCount: 1 },
];

// ============================================================
// Seed runner
// ============================================================
async function seed() {
  console.log('🌱 Rumbela Games — Seeding initial data...\n');

  console.log('1. Seeding access codes...');
  for (const code of ACCESS_CODES) {
    await setDoc(doc(db, 'access_codes', code.accessCode), code, { merge: true });
    console.log(`   ✓ ${code.accessCode.padEnd(20)} → role: ${code.role}`);
  }
  console.log(`   Done. ${ACCESS_CODES.length} access codes seeded.\n`);

  console.log('2. Seeding demo students (with deterministic IDs for QA only)...');
  for (const s of DEMO_STUDENTS) {
    const now = new Date().toISOString();
    await setDoc(
      doc(db, 'students', s.uid),
      {
        accessCode: s.accessCode,
        displayName: s.displayName,
        educationStage: s.educationStage,
        gradeCode: s.gradeCode,
        avatarKey: s.avatarKey,
        xp: s.xp,
        stars: s.stars,
        streak: s.streak,
        role: s.role,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    console.log(`   ✓ ${s.uid.padEnd(20)} → ${s.displayName} (${s.role})`);
  }
  console.log(`   Done. ${DEMO_STUDENTS.length} demo students seeded.\n`);

  console.log('3. Seeding initial progress for demo student Budi...');
  for (const p of BUDI_PROGRESS) {
    const key = `demo_siswa_${p.subjectCode}_${p.levelNumber}`;
    const now = new Date().toISOString();
    await setDoc(
      doc(db, 'student_progress', key),
      {
        studentId: 'demo_siswa',
        subjectCode: p.subjectCode,
        competencyId: `comp_${p.subjectCode.toLowerCase()}_${p.levelNumber}`,
        levelNumber: p.levelNumber,
        status: p.status,
        stars: p.stars,
        masteryScore: p.masteryScore,
        bestAccuracy: p.bestAccuracy,
        attemptCount: p.attemptCount,
        lastPracticedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    console.log(`   ✓ ${key}`);
  }
  console.log(`   Done. ${BUDI_PROGRESS.length} progress records seeded.\n`);

  console.log('════════════════════════════════════════════');
  console.log('✅ SEED COMPLETE');
  console.log('════════════════════════════════════════════');
  console.log('\nLogin dengan access codes berikut:');
  console.log('  • RUMBELA-SISWA  → student (demo Budi)');
  console.log('  • RUMBELA-SITI   → student (demo Siti)');
  console.log('  • RUMBELA-ALIF   → student (demo Alif)');
  console.log('  • RUMBELA-TUTOR  → tutor');
  console.log('  • RUMBELA-ADMIN  → admin');
  console.log('\n⚠️  Catatan: Saat user pertama kali login, akan dibuat dokumen students/{uid}');
  console.log('   baru dengan UID Firebase Auth mereka. Demo students (demo_*) hanya untuk QA.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  console.error('\nKemungkinan penyebab:');
  console.error('  • Firestore database belum dibuat di Firebase Console');
  console.error('  • Database ID di .env.local salah');
  console.error('  • Network issue');
  process.exit(1);
});
