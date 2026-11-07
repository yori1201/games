/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  StudentLevelProgress,
  SubjectCode,
  SessionResult,
  QuestionItem,
} from './types/game';
import { PLACEMENT_QUESTIONS } from './lib/curriculum-data';
import { AdaptiveEngine } from './lib/adaptive-engine';
import { sound } from './lib/audio';
import { AccessOnboarding } from './components/auth/AccessOnboarding';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { AdventureMap } from './components/map/AdventureMap';
import { AdaptiveGameSession } from './components/gameplay/AdaptiveGameSession';
import { ResultCelebration } from './components/gameplay/ResultCelebration';
import { TutorDashboard } from './components/dashboard/TutorDashboard';
import { ThemeSongWidget } from './components/audio/ThemeSongWidget';
import { CinematicLevelUpTransition } from './components/transitions/CinematicLevelUpTransition';
import { AuthProvider, useAuth } from './lib/auth-context';
import {
  fetchStudentProgress,
  fetchTutorRoster,
  completeSession,
  tutorOverrideUnlock,
} from './lib/data-service';
import { ShieldCheck, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';

type AppScreen =
  | 'AUTH'
  | 'DASHBOARD'
  | 'PLACEMENT_TEST'
  | 'MAP'
  | 'GAME_SESSION'
  | 'RESULT_CELEBRATION'
  | 'CINEMATIC_LEVEL_UP'
  | 'TUTOR_VIEW';

function AppInner() {
  const { isAuthReady, isAuthenticated, student, setStudent, user, authError } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('AUTH');
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [progressList, setProgressList] = useState<StudentLevelProgress[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCode>('MATH');
  const [selectedLevelNumber, setSelectedLevelNumber] = useState<number>(1);
  const [activeSessionQuestions, setActiveSessionQuestions] = useState<QuestionItem[]>([]);
  const [latestResult, setLatestResult] = useState<SessionResult | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [newlyUnlockedLevel, setNewlyUnlockedLevel] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Fetch student progress from Firestore (replaces old fetch('/api/student/:id/progress'))
  const fetchStudentProgressLocal = async (studentId: string) => {
    try {
      const list = await fetchStudentProgress(studentId);
      setProgressList(list);
    } catch (err) {
      console.warn('[App] fetchStudentProgress failed, using empty list:', err);
      setProgressList([]);
    }
  };

  // Fetch tutor students list (replaces old fetch('/api/tutor/students'))
  const fetchTutorData = async () => {
    try {
      const { students, progress } = await fetchTutorRoster();
      setAllStudents(students);
      setProgressList(progress);
    } catch (err) {
      console.warn('[App] fetchTutorData failed:', err);
    }
  };

  // Handle successful student login / registration
  const handleAuthSuccess = async (loggedStudent: StudentProfile) => {
    setStudent(loggedStudent);

    if (loggedStudent.role === 'tutor' || loggedStudent.role === 'admin') {
      await fetchTutorData();
      setCurrentScreen('TUTOR_VIEW');
    } else {
      await fetchStudentProgressLocal(loggedStudent.id);
      setCurrentScreen('DASHBOARD');
    }
  };

  // Launch Adventure Map for a subject
  const handleSelectSubject = (subject: SubjectCode) => {
    setSelectedSubject(subject);
    setCurrentScreen('MAP');
  };

  // Start Adaptive Game Session for a Level
  const handleStartLevel = (levelNumber: number) => {
    setSelectedLevelNumber(levelNumber);
    // ⚡ Pass initial tier 'EASY' so the engine picks tier-aware questions from the start.
    // The AdaptiveGameSession will adjust tier dynamically based on student performance.
    const questions = AdaptiveEngine.selectSessionQuestions(
      selectedSubject,
      levelNumber,
      8,
      'EASY'
    );
    setActiveSessionQuestions(questions);
    setCurrentScreen('GAME_SESSION');
  };

  // Start Diagnostic Placement Test (5 questions)
  const handleStartPlacementTest = () => {
    setSelectedSubject('MATH');
    setSelectedLevelNumber(1);
    setActiveSessionQuestions(PLACEMENT_QUESTIONS);
    setCurrentScreen('GAME_SESSION');
  };

  // Handle Session Completion (replaces old fetch('/api/sessions/complete'))
  const handleSessionComplete = async (result: SessionResult) => {
    setLatestResult(result);
    if (result.nextLevelUnlocked && result.unlockedLevelNumber) {
      setNewlyUnlockedLevel(result.unlockedLevelNumber);
    } else {
      setNewlyUnlockedLevel(null);
    }

    if (student) {
      try {
        const { student: updatedStudent, progress } = await completeSession({
          studentId: student.id,
          subjectCode: selectedSubject,
          levelNumber: selectedLevelNumber,
          result,
        });
        setStudent(updatedStudent);
        setProgressList(progress);
      } catch (err) {
        console.warn('[App] completeSession failed, applying local fallback:', err);
        // Local update fallback (preserves UX if Firestore is unreachable)
        setStudent(
          student
            ? {
                ...student,
                xp: student.xp + result.xpEarned,
                stars: student.stars + result.starsEarned,
              }
            : null
        );
      }
    }

    if (result.nextLevelUnlocked && result.unlockedLevelNumber) {
      setCurrentScreen('CINEMATIC_LEVEL_UP');
    } else {
      setCurrentScreen('RESULT_CELEBRATION');
    }
  };

  // Tutor manual level unlock override (replaces old fetch('/api/tutor/override-unlock'))
  const handleManualUnlock = async (
    studentId: string,
    subjectCode: SubjectCode,
    levelNumber: number,
    reason: string
  ) => {
    if (!student) return;
    try {
      await tutorOverrideUnlock({
        studentId,
        subjectCode,
        levelNumber,
        reason,
        tutorId: student.id,
      });
      await fetchTutorData();
    } catch (err) {
      console.warn('[App] handleManualUnlock failed:', err);
    }
  };

  // Sound toggle
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  // Show loading screen while Firebase Auth is initializing
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm text-white/70">Menyiapkan sesi belajar...</p>
      </div>
    );
  }

  // Show error screen if auth failed (e.g., Anonymous Auth not enabled in Firebase Console)
  if (authError && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <div className="text-center max-w-md">
          <h2 className="text-lg font-bold mb-2">Autentikasi Belum Siap</h2>
          <p className="text-sm text-white/70 leading-relaxed">{authError}</p>
          <p className="text-xs text-white/50 mt-3">
            Pastikan <strong>Anonymous Authentication</strong> diaktifkan di Firebase Console →
            Authentication → Sign-in method. Lihat DEPLOYMENT.md untuk panduan lengkap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Top Utility Controls (Audio, Theme Song & Tutor fast switch) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Official Theme Song BGM Player */}
        <ThemeSongWidget variant="floating" />

        <button
          onClick={toggleSound}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-md backdrop-blur transition-all active:scale-95"
          title={isMuted ? 'Nyalakan Efek Suara' : 'Matikan Efek Suara'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {student && (student.role === 'tutor' || student.role === 'admin') && (
          <button
            onClick={() => {
              sound.playClick();
              setCurrentScreen(currentScreen === 'TUTOR_VIEW' ? 'DASHBOARD' : 'TUTOR_VIEW');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold shadow-md border border-indigo-400/30 backdrop-blur transition-all active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>{currentScreen === 'TUTOR_VIEW' ? 'Lihat Mode Siswa' : 'Panel Tutor'}</span>
          </button>
        )}
      </div>

      {/* VIEW ROUTING */}
      {currentScreen === 'AUTH' && (
        <AccessOnboarding onSuccess={handleAuthSuccess} />
      )}

      {currentScreen === 'DASHBOARD' && student && (
        <StudentDashboard
          student={student}
          progressList={progressList}
          onSelectSubject={handleSelectSubject}
          onOpenPlacementTest={handleStartPlacementTest}
          onLogout={() => {
            setStudent(null);
            setCurrentScreen('AUTH');
          }}
          onUpdateStudent={(updated) => setStudent(updated)}
        />
      )}

      {currentScreen === 'MAP' && student && (
        <AdventureMap
          student={student}
          subjectCode={selectedSubject}
          progressList={progressList}
          newlyUnlockedLevelNumber={newlyUnlockedLevel}
          onSelectLevel={(lvl) => {
            setNewlyUnlockedLevel(null);
            handleStartLevel(lvl);
          }}
          onBackToDashboard={() => {
            setNewlyUnlockedLevel(null);
            setCurrentScreen('DASHBOARD');
          }}
          onClearUnlockedLevel={() => setNewlyUnlockedLevel(null)}
        />
      )}

      {currentScreen === 'GAME_SESSION' && student && (
        <AdaptiveGameSession
          studentId={student.id}
          subjectCode={selectedSubject}
          levelNumber={selectedLevelNumber}
          questions={activeSessionQuestions}
          onComplete={handleSessionComplete}
          onExit={() => setCurrentScreen('MAP')}
        />
      )}

      {currentScreen === 'RESULT_CELEBRATION' && latestResult && (
        <ResultCelebration
          result={latestResult}
          onContinue={() => {
            if (newlyUnlockedLevel) {
              setCurrentScreen('CINEMATIC_LEVEL_UP');
            } else {
              setCurrentScreen('MAP');
            }
          }}
          onRetry={() => handleStartLevel(selectedLevelNumber)}
        />
      )}

      {currentScreen === 'CINEMATIC_LEVEL_UP' && latestResult && newlyUnlockedLevel && (
        <CinematicLevelUpTransition
          unlockedLevelNumber={newlyUnlockedLevel}
          subjectCode={selectedSubject}
          xpEarned={latestResult.xpEarned}
          starsEarned={latestResult.starsEarned}
          onComplete={() => setCurrentScreen('MAP')}
        />
      )}

      {currentScreen === 'TUTOR_VIEW' && (
        <TutorDashboard
          students={allStudents.length > 0 ? allStudents : student ? [student] : []}
          progressList={progressList}
          onManualUnlock={handleManualUnlock}
          onBackToApp={() => setCurrentScreen(student?.role === 'student' ? 'DASHBOARD' : 'DASHBOARD')}
        />
      )}

      {/* Global Minimal Footer */}
      <footer className="w-full text-center py-3 text-[11px] text-white/50 border-t border-white/5 backdrop-blur-sm">
        <span className="font-bold text-amber-300">RUMBELA GAMES</span>
        <span> · Rumah Belajar Anak · Adaptive Learning Engine v1.0</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
