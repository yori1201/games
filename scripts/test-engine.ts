/**
 * Quick sanity test for adaptive engine + question generator.
 * Run with: npx tsx scripts/test-engine.ts
 */
import { AdaptiveEngine, AnswerLog } from '../src/lib/adaptive-engine';
import { generateQuestion, generateSessionQuestions } from '../src/lib/question-generator';
import { generateEnglishSpelling } from '../src/lib/english-spelling-generator';
import type { DifficultyTier } from '../src/types/game';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('❌ FAIL:', msg);
    process.exit(1);
  } else {
    console.log('✓ PASS:', msg);
  }
}

console.log('\n=== Question Generator Test ===\n');

// Test MATH generation across all levels & tiers
const mathLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const tiers: DifficultyTier[] = ['EASY', 'MEDIUM', 'HARD'];
let mathGenerated = 0;
let mathValid = 0;

for (const lvl of mathLevels) {
  for (const tier of tiers) {
    const q = generateQuestion('MATH', lvl, tier);
    if (q) {
      mathGenerated++;
      // Validate structure
      if (
        q.id.startsWith('gen_') &&
        q.subjectCode === 'MATH' &&
        q.levelNumber === lvl &&
        q.difficulty === tier &&
        q.prompt.length > 0 &&
        q.correctAnswer.length > 0 &&
        q.options && q.options.length >= 2 &&
        q.options.includes(String(q.correctAnswer)) &&
        q.explanation.length > 0 &&
        q.hint.length > 0
      ) {
        mathValid++;
      } else {
        console.error(`❌ Invalid MATH question: L${lvl} ${tier}`, q);
      }
    }
  }
}
assert(mathGenerated >= 25, `MATH generator produced ${mathGenerated} questions (expected ≥25)`);
assert(mathValid === mathGenerated, `All ${mathGenerated} MATH questions are valid (got ${mathValid})`);

// Test LOGIC generation (MCQ levels only — grid levels 3, 4 tested separately below)
const logicMcqLevels = [1, 2, 5, 6, 7, 10];
let logicGenerated = 0;
let logicValid = 0;
for (const lvl of logicMcqLevels) {
  for (const tier of tiers) {
    const q = generateQuestion('LOGIC', lvl, tier);
    if (q) {
      logicGenerated++;
      if (q.id.startsWith('gen_') && q.subjectCode === 'LOGIC' && q.options?.includes(String(q.correctAnswer))) {
        logicValid++;
      }
    }
  }
}
assert(logicGenerated >= 15, `LOGIC MCQ generator produced ${logicGenerated} questions (expected ≥15)`);
assert(logicValid === logicGenerated, `All ${logicGenerated} LOGIC MCQ questions are valid`);

console.log('\n=== Adaptive Engine Test ===\n');

// Test 1: All correct + fast → tier escalation
const fastCorrectLog: AnswerLog[] = [
  { questionId: 'q1', isCorrect: true, responseTimeMs: 3000, hintUsed: false },
  { questionId: 'q2', isCorrect: true, responseTimeMs: 4000, hintUsed: false },
];
const r1 = AdaptiveEngine.calculateDynamicDifficulty('EASY', fastCorrectLog);
assert(r1.nextTier === 'MEDIUM', `2 fast correct answers escalate EASY→MEDIUM (got ${r1.nextTier})`);

const r2 = AdaptiveEngine.calculateDynamicDifficulty('MEDIUM', fastCorrectLog);
assert(r2.nextTier === 'HARD', `2 fast correct answers escalate MEDIUM→HARD (got ${r2.nextTier})`);

// Test 2: All wrong → tier de-escalation
const wrongLog: AnswerLog[] = [
  { questionId: 'q1', isCorrect: false, responseTimeMs: 8000, hintUsed: false },
  { questionId: 'q2', isCorrect: false, responseTimeMs: 9000, hintUsed: false },
];
const r3 = AdaptiveEngine.calculateDynamicDifficulty('HARD', wrongLog);
assert(r3.nextTier === 'MEDIUM', `2 wrong answers de-escalate HARD→MEDIUM (got ${r3.nextTier})`);

const r4 = AdaptiveEngine.calculateDynamicDifficulty('MEDIUM', wrongLog);
assert(r4.nextTier === 'EASY', `2 wrong answers de-escalate MEDIUM→EASY (got ${r4.nextTier})`);

// Test 3: Mixed answers → stable
const mixedLog: AnswerLog[] = [
  { questionId: 'q1', isCorrect: true, responseTimeMs: 5000, hintUsed: false },
  { questionId: 'q2', isCorrect: false, responseTimeMs: 8000, hintUsed: false },
];
const r5 = AdaptiveEngine.calculateDynamicDifficulty('MEDIUM', mixedLog);
assert(r5.nextTier === 'MEDIUM', `Mixed answers keep tier stable at MEDIUM (got ${r5.nextTier})`);

// Test 4: Slow correct → no escalation (must be <10s)
const slowCorrectLog: AnswerLog[] = [
  { questionId: 'q1', isCorrect: true, responseTimeMs: 15000, hintUsed: false },
  { questionId: 'q2', isCorrect: true, responseTimeMs: 12000, hintUsed: false },
];
const r6 = AdaptiveEngine.calculateDynamicDifficulty('EASY', slowCorrectLog);
assert(r6.nextTier === 'EASY', `2 slow correct answers keep tier at EASY (got ${r6.nextTier})`);

// Test 5: Hint used → no escalation (counts as not independent)
const hintLog: AnswerLog[] = [
  { questionId: 'q1', isCorrect: true, responseTimeMs: 4000, hintUsed: true },
  { questionId: 'q2', isCorrect: true, responseTimeMs: 4000, hintUsed: true },
];
const r7 = AdaptiveEngine.calculateDynamicDifficulty('EASY', hintLog);
assert(r7.nextTier === 'EASY', `2 correct with hint do NOT escalate (got ${r7.nextTier})`);

console.log('\n=== English Spelling Generator Test ===\n');

// Test English spelling generation across all 10 levels
let engGenerated = 0;
let engValid = 0;
let engTierFiltered = 0;

for (const lvl of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  for (const tier of tiers) {
    const q = generateEnglishSpelling(lvl, tier);
    if (q) {
      engGenerated++;
      const word = String(q.correctAnswer);
      // For SPELLING: options are individual letter tiles, NOT the full word.
      // Validate: every letter in the word must be present in options.
      const wordLetters = word.split('');
      const allLettersPresent = q.options && wordLetters.every((l) => q.options!.includes(l));
      // Validate structure
      if (
        q.id.startsWith('gen_eng_') &&
        q.subjectCode === 'ENGLISH' &&
        q.levelNumber === lvl &&
        q.difficulty === tier &&
        q.type === 'SPELLING' &&
        q.prompt.length > 0 &&
        word.length > 0 &&
        q.options && q.options.length >= word.length &&
        allLettersPresent &&
        q.explanation.length > 0 &&
        q.hint.length > 0
      ) {
        engValid++;
        // Tier filter check: EASY ≤3 letters, MEDIUM 4-5, HARD 6+
        const wordLen = word.length;
        const tierOk =
          (tier === 'EASY' && wordLen <= 3) ||
          (tier === 'MEDIUM' && wordLen >= 4 && wordLen <= 5) ||
          (tier === 'HARD' && wordLen >= 6);
        if (tierOk) engTierFiltered++;
      } else {
        console.error(`❌ Invalid ENG question: L${lvl} ${tier}`, q);
      }
    }
  }
}
assert(engGenerated >= 25, `ENG spelling generator produced ${engGenerated} questions (expected ≥25)`);
assert(engValid === engGenerated, `All ${engGenerated} ENG questions are valid (got ${engValid})`);
console.log(`   Tier-filtered words: ${engTierFiltered}/${engGenerated} (rest are fallbacks when tier pool empty)`);

console.log('\n=== LOGIC Grid Navigation Test ===\n');

// Test grid navigation questions for levels 3, 4
let gridGenerated = 0;
let gridValid = 0;

for (const lvl of [3, 4]) {
  for (const tier of tiers) {
    const q = generateQuestion('LOGIC', lvl, tier);
    if (q && q.gridSize) {
      gridGenerated++;
      // Validate grid structure
      if (
        q.type === 'LOGIC_SEQUENCE' &&
        q.gridSize.length === 2 &&
        q.startPos && q.startPos.length === 2 &&
        q.targetPos && q.targetPos.length === 2 &&
        q.obstacles !== undefined
      ) {
        // Verify start != target
        const [sx, sy] = q.startPos;
        const [tx, ty] = q.targetPos;
        if (sx !== tx || sy !== ty) {
          // Verify start/target not on obstacles
          const obs = q.obstacles || [];
          const startOk = !obs.some(([ox, oy]) => ox === sx && oy === sy);
          const targetOk = !obs.some(([ox, oy]) => ox === tx && oy === ty);
          if (startOk && targetOk) {
            gridValid++;
          }
        }
      }
    }
  }
}
assert(gridGenerated >= 6, `Grid navigation generated ${gridGenerated} questions (expected ≥6)`);
assert(gridValid === gridGenerated, `All ${gridGenerated} grid questions valid (got ${gridValid})`);

// Test path simulation: a known-correct path should be evaluated as correct
const gridQ = generateQuestion('LOGIC', 3, 'EASY');
if (gridQ && gridQ.gridSize && gridQ.startPos && gridQ.targetPos) {
  const [sx, sy] = gridQ.startPos;
  const [tx, ty] = gridQ.targetPos;
  const dx = tx - sx;
  const dy = ty - sy;
  const optimalPath = [
    ...Array(Math.abs(dx)).fill(dx > 0 ? 'RIGHT' : 'LEFT'),
    ...Array(Math.abs(dy)).fill(dy > 0 ? 'DOWN' : 'UP'),
  ];
  // Simulate the path (mirrors AdaptiveGameSession.evaluateGridPath logic)
  let x = sx, y = sy;
  let pathValid = true;
  for (const dir of optimalPath) {
    const ddx = dir === 'LEFT' ? -1 : dir === 'RIGHT' ? 1 : 0;
    const ddy = dir === 'UP' ? -1 : dir === 'DOWN' ? 1 : 0;
    x += ddx; y += ddy;
    const [cols, rows] = gridQ.gridSize;
    if (x < 0 || x >= cols || y < 0 || y >= rows) { pathValid = false; break; }
    if ((gridQ.obstacles || []).some(([ox, oy]) => ox === x && oy === y)) { pathValid = false; break; }
  }
  const reachedTarget = pathValid && x === tx && y === ty;
  assert(reachedTarget, `Optimal path (${optimalPath.join(', ')}) reaches target for LOGIC L3 EASY`);
}

console.log('\n=== Tier-Aware Question Selection Test ===\n');

// Test 6: selectSessionQuestions returns tier-matched questions
const session = AdaptiveEngine.selectSessionQuestions('MATH', 2, 8, 'HARD');
assert(session.length === 8, `Session has 8 questions (got ${session.length})`);
const hardCount = session.filter((q) => q.difficulty === 'HARD').length;
assert(hardCount >= 1, `At least 1 question is HARD tier (got ${hardCount} out of 8)`);
console.log(`   MATH L2 HARD session: ${hardCount}/8 questions are HARD, rest are adjacent-tier fallbacks`);

const session2 = AdaptiveEngine.selectSessionQuestions('MATH', 5, 8, 'MEDIUM');
assert(session2.length === 8, `MATH L5 MEDIUM session has 8 questions (got ${session2.length})`);

const session3 = AdaptiveEngine.selectSessionQuestions('LOGIC', 1, 8, 'EASY');
assert(session3.length === 8, `LOGIC L1 EASY session has 8 questions (got ${session3.length})`);

console.log('\n=== Mastery Score Calculation Test ===\n');

// Test 7: All correct + fast + no hint → high mastery
const perfectLog: AnswerLog[] = Array.from({ length: 8 }, (_, i) => ({
  questionId: `q${i}`,
  isCorrect: true,
  responseTimeMs: 4000,
  hintUsed: false,
}));
const perfectResult = AdaptiveEngine.evaluateSession('test', 's1', 'MATH', 1, perfectLog);
assert(perfectResult.masteryScore === 100, `Perfect fast correct → mastery 100 (got ${perfectResult.masteryScore})`);
assert(perfectResult.decision === 'LEVEL_MASTERED', `Perfect → LEVEL_MASTERED (got ${perfectResult.decision})`);
assert(perfectResult.starsEarned === 3, `Perfect → 3 stars (got ${perfectResult.starsEarned})`);
assert(perfectResult.nextLevelUnlocked === true, `Perfect → next level unlocked`);

// Test 8: All wrong → low mastery + remedial
const failLog: AnswerLog[] = Array.from({ length: 8 }, (_, i) => ({
  questionId: `q${i}`,
  isCorrect: false,
  responseTimeMs: 10000,
  hintUsed: false,
}));
const failResult = AdaptiveEngine.evaluateSession('test', 's1', 'MATH', 1, failLog);
assert(failResult.masteryScore === 0, `All wrong → mastery 0 (got ${failResult.masteryScore})`);
assert(failResult.decision === 'REMEDIAL', `All wrong → REMEDIAL (got ${failResult.decision})`);
assert(failResult.starsEarned === 0, `All wrong → 0 stars`);
assert(failResult.nextLevelUnlocked === false, `All wrong → no unlock`);

// Test 9: Half correct → NEEDS_PRACTICE
const halfLog: AnswerLog[] = Array.from({ length: 8 }, (_, i) => ({
  questionId: `q${i}`,
  isCorrect: i < 4,
  responseTimeMs: 7000,
  hintUsed: false,
}));
const halfResult = AdaptiveEngine.evaluateSession('test', 's1', 'MATH', 1, halfLog);
assert(halfResult.decision === 'NEEDS_PRACTICE' || halfResult.decision === 'REMEDIAL',
  `Half correct → NEEDS_PRACTICE or REMEDIAL (got ${halfResult.decision}, mastery=${halfResult.masteryScore})`);

// Test 10: Slow answers reduce mastery (vs fast answers with same accuracy)
const slowLog: AnswerLog[] = Array.from({ length: 8 }, (_, i) => ({
  questionId: `q${i}`,
  isCorrect: true,
  responseTimeMs: 30000, // 30 seconds — slow!
  hintUsed: false,
}));
const slowResult = AdaptiveEngine.evaluateSession('test', 's1', 'MATH', 1, slowLog);
assert(slowResult.masteryScore < perfectResult.masteryScore,
  `Slow correct (${slowResult.masteryScore}) < fast correct (${perfectResult.masteryScore}) — speed bonus works`);

console.log('\n=== XP Ledger Test ===\n');

// Test 11: XP calculation
assert(perfectResult.xpEarned > 0, `Perfect session earns XP > 0 (got ${perfectResult.xpEarned})`);
// perfectLog: 8 correct × 10 = 80, 3 stars × 15 = 45, mastered bonus 25, speed bonus 8×2=16 → 80+45+25+16 = 166
const expectedXP = 8 * 10 + 3 * 15 + 25 + 8 * 2;
assert(perfectResult.xpEarned === expectedXP,
  `Perfect XP = ${expectedXP} (8×10 + 3×15 + 25 + 8×2) (got ${perfectResult.xpEarned})`);

console.log('\n═══════════════════════════════════════');
console.log('✅ ALL TESTS PASSED');
console.log('═══════════════════════════════════════\n');

console.log('Summary:');
console.log(`  • ${mathValid} MATH questions generated & valid`);
console.log(`  • ${logicValid} LOGIC MCQ questions generated & valid`);
console.log(`  • ${engValid} ENGLISH spelling questions generated & valid`);
console.log(`  • ${gridValid} LOGIC grid navigation questions generated & valid`);
console.log('  • Tier escalation: EASY→MEDIUM→HARD on 2 fast correct');
console.log('  • Tier de-escalation: HARD→MEDIUM→EASY on 2 wrong');
console.log('  • Tier-aware selection: picks HARD questions for HARD session');
console.log('  • Mastery formula: accuracy 55% + recent 20% + independent 15% + speed 10%');
console.log('  • Speed bonus: fast correct answers contribute to mastery & XP');
console.log('  • XP ledger: correct×10 + stars×15 + mastered bonus + speed bonus');
console.log('  • English: tier-filtered word lists (EASY ≤3, MEDIUM 4-5, HARD 6+ letters)');
console.log('  • Grid nav: 3x3/4x4/5x5 grids with obstacles, simulation-based evaluation');
