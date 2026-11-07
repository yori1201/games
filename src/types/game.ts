/**
 * Types for Rumbela Games Adaptive Learning Platform
 */

export type EducationStage = 'PAUD' | 'TK' | 'SD' | 'SMP' | 'SMA';

export type UserRole = 'student' | 'tutor' | 'admin';

export type SubjectCode = 'MATH' | 'ENGLISH' | 'LOGIC';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SPELLING'
  | 'WORD_MATCH'
  | 'FILL_BLANK'
  | 'LOGIC_SEQUENCE'
  | 'MATH_MANIPULATIVE';

export type DifficultyTier = 'EASY' | 'MEDIUM' | 'HARD';

export type ProgressStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'MASTERED';

export interface StudentProfile {
  id: string;
  accessCode: string;
  displayName: string;
  educationStage: EducationStage;
  gradeCode: string; // e.g. "TK_A", "SD_2", "SMP_7"
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

export interface QuestionItem {
  id: string;
  subjectCode: SubjectCode;
  gradeBand: string;
  competencyId: string;
  competencyName: string;
  levelNumber: number;
  difficulty: DifficultyTier;
  type: QuestionType;
  prompt: string;
  promptSubtitle?: string;
  options?: string[];
  correctAnswer: string | string[];
  acceptedAnswers?: string[];
  explanation: string;
  hint: string;
  mediaUrl?: string;
  tags?: string[];
  // For Logic Sequencing
  gridSize?: [number, number];
  startPos?: [number, number];
  targetPos?: [number, number];
  obstacles?: [number, number][];
}

export interface GameLevelDef {
  id: string;
  levelNumber: number;
  subjectCode: SubjectCode;
  competencyId: string;
  title: string;
  description: string;
  requiredStars: number;
  masteryThreshold: number; // e.g. 80 for 80%
  mapX: number; // percentage 0-100 on map
  mapY: number; // percentage 0-100 on map
  theme: 'forest' | 'river' | 'bridge' | 'temple' | 'cave' | 'castle';
}

export interface StudentLevelProgress {
  id: string;
  studentId: string;
  subjectCode: SubjectCode;
  competencyId: string;
  levelId: string;
  levelNumber: number;
  status: ProgressStatus;
  stars: number; // 0-3
  masteryScore: number; // 0-100
  bestAccuracy: number;
  attemptCount: number;
  lastPracticedAt: string;
}

export interface SessionResult {
  sessionId: string;
  studentId: string;
  subjectCode: SubjectCode;
  levelNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  masteryScore: number;
  starsEarned: number;
  xpEarned: number;
  decision: 'LEVEL_MASTERED' | 'NEEDS_PRACTICE' | 'REMEDIAL';
  decisionReason: string;
  nextLevelUnlocked: boolean;
  unlockedLevelNumber?: number;
}
