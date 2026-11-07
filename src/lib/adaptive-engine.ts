import { DifficultyTier, QuestionItem, SessionResult, SubjectCode } from '../types/game';
import { QUESTION_BANK } from './curriculum-data';
import { generateQuestion } from './question-generator';

export interface AnswerLog {
  questionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
}

// ============================================================
// TIER ORDERING & ADJACENCY
// ============================================================

const TIER_ORDER: DifficultyTier[] = ['EASY', 'MEDIUM', 'HARD'];

function tierIndex(t: DifficultyTier): number {
  return TIER_ORDER.indexOf(t);
}

function adjacentTiers(target: DifficultyTier): DifficultyTier[] {
  const idx = tierIndex(target);
  const out: DifficultyTier[] = [];
  // Step down then up
  for (let d = 1; d <= 2; d++) {
    if (idx - d >= 0) out.push(TIER_ORDER[idx - d]);
    if (idx + d < TIER_ORDER.length) out.push(TIER_ORDER[idx + d]);
  }
  return out;
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class AdaptiveEngine {
  // ============================================================
  // 1. DYNAMIC DIFFICULTY: decide next tier from recent answers
  // ============================================================
  public static calculateDynamicDifficulty(
    currentTier: DifficultyTier,
    answerHistory: AnswerLog[]
  ): { nextTier: DifficultyTier; reason: string } {
    if (answerHistory.length < 2) {
      return { nextTier: currentTier, reason: 'Mempertahankan tingkat kesulitan dasar' };
    }

    const lastTwo = answerHistory.slice(-2);
    const bothCorrectFast = lastTwo.every(
      (a) => a.isCorrect && !a.hintUsed && a.responseTimeMs > 0 && a.responseTimeMs < 10000
    );
    const bothWrong = lastTwo.every((a) => !a.isCorrect);

    if (bothCorrectFast) {
      if (currentTier === 'EASY') {
        return { nextTier: 'MEDIUM', reason: 'Performa sangat baik & cepat! Tingkat dinaikkan ke Sedang' };
      }
      if (currentTier === 'MEDIUM') {
        return { nextTier: 'HARD', reason: 'Dua jawaban benar berturut-turut! Membuka soal Tantangan' };
      }
    } else if (bothWrong) {
      if (currentTier === 'HARD') {
        return { nextTier: 'MEDIUM', reason: 'Memberikan soal penguatan bertahap' };
      }
      if (currentTier === 'MEDIUM') {
        return { nextTier: 'EASY', reason: 'Menyesuaikan representasi soal menjadi lebih visual' };
      }
    }

    return { nextTier: currentTier, reason: 'Tingkat kesulitan stabil' };
  }

  // ============================================================
  // 2. TIER-AWARE QUESTION SELECTION
  //    Picks `count` questions matching `currentTier`, with fallbacks.
  //    Mixes hand-written QUESTION_BANK questions with procedural
  //    generator questions for non-repetitive sessions.
  // ============================================================
  public static selectSessionQuestions(
    subjectCode: SubjectCode,
    levelNumber: number,
    count: number = 8,
    currentTier: DifficultyTier = 'EASY'
  ): QuestionItem[] {
    // Step 1: hand-written questions for this exact level + tier
    const directMatch = QUESTION_BANK.filter(
      (q) =>
        q.subjectCode === subjectCode &&
        q.levelNumber === levelNumber &&
        q.difficulty === currentTier
    );

    // Step 2: hand-written for this level + adjacent tiers
    const adjacentTierMatch = QUESTION_BANK.filter(
      (q) =>
        q.subjectCode === subjectCode &&
        q.levelNumber === levelNumber &&
        q.difficulty !== currentTier &&
        adjacentTiers(currentTier).includes(q.difficulty)
    );

    // Step 3: hand-written for adjacent levels (±1) + same tier
    const adjacentLevelMatch = QUESTION_BANK.filter(
      (q) =>
        q.subjectCode === subjectCode &&
        q.levelNumber !== levelNumber &&
        Math.abs(q.levelNumber - levelNumber) <= 1 &&
        q.difficulty === currentTier
    );

    // Step 4: any hand-written for this level (any tier) — last resort
    const anyLevelMatch = QUESTION_BANK.filter(
      (q) => q.subjectCode === subjectCode && q.levelNumber === levelNumber
    );

    // Combine with priority: directMatch > adjacentTierMatch > adjacentLevelMatch > anyLevelMatch
    // Dedup by question id
    const seenIds = new Set<string>();
    const combined: QuestionItem[] = [];
    for (const arr of [directMatch, adjacentTierMatch, adjacentLevelMatch, anyLevelMatch]) {
      for (const q of arr) {
        if (!seenIds.has(q.id)) {
          seenIds.add(q.id);
          combined.push(q);
        }
      }
    }

    // Scramble MCQ options & spelling tiles so choices are fresh each time
    const scrambled = combined.map((q) => {
      if (q.type === 'SPELLING' && q.options) {
        return { ...q, options: shuffle(q.options) };
      }
      if (q.type === 'MULTIPLE_CHOICE' && q.options) {
        return { ...q, options: shuffle(q.options) };
      }
      return q;
    });

    // Step 5: top up with procedural generator questions if we don't have enough
    // The generator creates fresh, randomized questions each call — infinite supply.
    const handWritten = shuffle(scrambled).slice(0, count);
    const deficit = count - handWritten.length;

    if (deficit > 0) {
      // Try generator for this exact tier first
      for (let i = 0; i < deficit; i++) {
        const gen = generateQuestion(subjectCode, levelNumber, currentTier);
        if (gen) handWritten.push(gen);
      }
      // If generator doesn't exist for this level/tier, try adjacent tiers
      let remaining = count - handWritten.length;
      if (remaining > 0) {
        for (const adjTier of adjacentTiers(currentTier)) {
          if (remaining <= 0) break;
          for (let i = 0; i < remaining; i++) {
            const gen = generateQuestion(subjectCode, levelNumber, adjTier);
            if (gen) handWritten.push(gen);
          }
          remaining = count - handWritten.length;
        }
      }
      // Last resort: try generator at adjacent levels
      remaining = count - handWritten.length;
      if (remaining > 0) {
        for (const dLevel of [-1, 1]) {
          if (remaining <= 0) break;
          const adjLevel = levelNumber + dLevel;
          if (adjLevel < 1 || adjLevel > 10) continue;
          for (let i = 0; i < remaining; i++) {
            const gen = generateQuestion(subjectCode, adjLevel, currentTier);
            if (gen) handWritten.push(gen);
          }
          remaining = count - handWritten.length;
        }
      }
    }

    return handWritten.slice(0, count);
  }

  // ============================================================
  // 3. SESSION EVALUATION
  //    Mastery formula (PRD Section 7.6, extended with response time):
  //      masteryScore = 0.55 × accuracy
  //                   + 0.20 × recentPerformance (second half)
  //                   + 0.15 × independentCorrectRate (no hint)
  //                   + 0.10 × speedScore (fast & correct = bonus)
  // ============================================================
  public static evaluateSession(
    sessionId: string,
    studentId: string,
    subjectCode: SubjectCode,
    levelNumber: number,
    answers: AnswerLog[]
  ): SessionResult {
    const totalQuestions = answers.length;
    if (totalQuestions === 0) {
      return {
        sessionId,
        studentId,
        subjectCode,
        levelNumber,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        masteryScore: 0,
        starsEarned: 0,
        xpEarned: 0,
        decision: 'NEEDS_PRACTICE',
        decisionReason: 'Sesi belum memiliki jawaban yang valid',
        nextLevelUnlocked: false,
      };
    }

    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const baseAccuracy = (correctAnswers / totalQuestions) * 100;

    // Recent performance: weight second half of session more
    const halfIndex = Math.floor(totalQuestions / 2);
    const recentAnswers = answers.slice(halfIndex);
    const recentCorrect = recentAnswers.filter((a) => a.isCorrect).length;
    const recentPerformance =
      recentAnswers.length > 0 ? (recentCorrect / recentAnswers.length) * 100 : baseAccuracy;

    // Independent correct rate (correct without hint)
    const independentCorrect = answers.filter((a) => a.isCorrect && !a.hintUsed).length;
    const independentCorrectRate = (independentCorrect / totalQuestions) * 100;

    // Speed score: bonus for fast correct answers (< 8s)
    // 100 = all fast correct, 0 = none fast
    const FAST_THRESHOLD_MS = 8000;
    const fastCorrect = answers.filter(
      (a) => a.isCorrect && a.responseTimeMs > 0 && a.responseTimeMs < FAST_THRESHOLD_MS
    ).length;
    const speedScore = (fastCorrect / totalQuestions) * 100;

    // Multi-factor mastery score
    const masteryScore = Math.round(
      0.55 * baseAccuracy +
        0.20 * recentPerformance +
        0.15 * independentCorrectRate +
        0.10 * speedScore
    );

    let starsEarned = 0;
    let decision: 'LEVEL_MASTERED' | 'NEEDS_PRACTICE' | 'REMEDIAL' = 'NEEDS_PRACTICE';
    let decisionReason = '';
    let nextLevelUnlocked = false;

    if (masteryScore >= 80) {
      decision = 'LEVEL_MASTERED';
      nextLevelUnlocked = true;
      starsEarned = masteryScore >= 95 ? 3 : 2;
      decisionReason = `Hebat! Skor penguasaan ${masteryScore}% memenuhi ambang batas kelulusan (80%). Level berikutnya terbuka!`;
    } else if (masteryScore >= 60) {
      decision = 'NEEDS_PRACTICE';
      starsEarned = 1;
      decisionReason = `Bagus! Skor penguasaan ${masteryScore}%. Sedikit latihan lagi untuk menguasai level ini sepenuhnya.`;
    } else {
      decision = 'REMEDIAL';
      starsEarned = 0;
      decisionReason = `Ayo coba lagi! Skor ${masteryScore}%. Sistem telah menyiapkan latihan penguatan dengan panduan visual.`;
    }

    // Ledger-based XP: correct × 10 + stars × 15 + mastered bonus 25 + speed bonus
    const speedBonus = fastCorrect * 2;
    const xpEarned = Math.round(
      correctAnswers * 10 + starsEarned * 15 + (decision === 'LEVEL_MASTERED' ? 25 : 0) + speedBonus
    );

    return {
      sessionId,
      studentId,
      subjectCode,
      levelNumber,
      totalQuestions,
      correctAnswers,
      accuracy: Math.round(baseAccuracy),
      masteryScore,
      starsEarned,
      xpEarned,
      decision,
      decisionReason,
      nextLevelUnlocked,
      unlockedLevelNumber: nextLevelUnlocked ? levelNumber + 1 : undefined,
    };
  }
}
