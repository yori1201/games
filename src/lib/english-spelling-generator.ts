/**
 * English Spelling Generator for RUMBELA GAMES
 * ============================================================
 * Generates fresh SPELLING questions from curated word lists
 * organized by level (themes: colors, animals, food, family, etc.)
 *
 * Each generated question:
 *   - Picks a random word from the level's word list (filtered by tier)
 *   - Builds letter tiles = correct letters + 1-3 distractor letters
 *   - Shuffles the tiles
 *   - Includes Indonesian translation as prompt context
 *
 * This gives infinite variations of English spelling practice
 * without hardcoding every question.
 */
import type { QuestionItem, DifficultyTier } from '../types/game';

// ============================================================
// WORD LISTS PER LEVEL
// Tier filter: EASY = short words (3-4 letters), MEDIUM = 4-5, HARD = 5-7
// ============================================================

interface WordEntry {
  word: string;
  translation: string; // Indonesian
  emoji?: string;
}

const WORD_LISTS: Record<number, { theme: string; competencyId: string; competencyName: string; words: WordEntry[] }> = {
  1: {
    theme: 'Colors',
    competencyId: 'comp_eng_colors',
    competencyName: 'Colors & Magic Words',
    words: [
      { word: 'RED', translation: 'merah', emoji: '🔴' },
      { word: 'BOW', translation: 'pelangi (rainbow bagian)', emoji: '🌈' },
      { word: 'PINK', translation: 'merah muda', emoji: '🌸' },
      { word: 'BLUE', translation: 'biru', emoji: '🔵' },
      { word: 'GOLD', translation: 'emas', emoji: '🟡' },
      { word: 'GRAY', translation: 'abu-abu', emoji: '⬜' },
      { word: 'CYAN', translation: 'biru muda', emoji: '💎' },
      { word: 'TEAL', translation: 'biru hijau', emoji: '🦚' },
    ],
  },
  2: {
    theme: 'Animals',
    competencyId: 'comp_eng_animals',
    competencyName: 'Animal Kingdom & Spelling',
    words: [
      { word: 'CAT', translation: 'kucing', emoji: '🐱' },
      { word: 'DOG', translation: 'anjing', emoji: '🐶' },
      { word: 'COW', translation: 'sapi', emoji: '🐮' },
      { word: 'PIG', translation: 'babi', emoji: '🐷' },
      { word: 'FOX', translation: 'rubah', emoji: '🦊' },
      { word: 'BEE', translation: 'lebah', emoji: '🐝' },
      { word: 'OWL', translation: 'burung hantu', emoji: '🦉' },
      { word: 'LION', translation: 'singa', emoji: '🦁' },
      { word: 'BEAR', translation: 'beruang', emoji: '🐻' },
      { word: 'FROG', translation: 'katak', emoji: '🐸' },
      { word: 'WOLF', translation: 'serigala', emoji: '🐺' },
      { word: 'DEER', translation: 'rusa', emoji: '🦌' },
      { word: 'FISH', translation: 'ikan', emoji: '🐟' },
      { word: 'BIRD', translation: 'burung', emoji: '🐦' },
      { word: 'DUCK', translation: 'bebek', emoji: '🦆' },
      { word: 'GOAT', translation: 'kambing', emoji: '🐐' },
    ],
  },
  3: {
    theme: 'School',
    competencyId: 'comp_eng_school',
    competencyName: 'Classroom Quest',
    words: [
      { word: 'PEN', translation: 'pulpen', emoji: '🖊️' },
      { word: 'INK', translation: 'tinta', emoji: '🖋️' },
      { word: 'BAG', translation: 'tas', emoji: '🎒' },
      { word: 'MAP', translation: 'peta', emoji: '🗺️' },
      { word: 'BOOK', translation: 'buku', emoji: '📖' },
      { word: 'DESK', translation: 'meja', emoji: '🪑' },
      { word: 'PENCIL', translation: 'pensil', emoji: '✏️' },
      { word: 'RULER', translation: 'penggaris', emoji: '📏' },
      { word: 'CHALK', translation: 'kapur', emoji: '🪨' },
      { word: 'ERASER', translation: 'penghapus', emoji: '🧽' },
      { word: 'BAGPACK', translation: 'ransel', emoji: '🎒' },
      { word: 'CRAYON', translation: 'krayon', emoji: '🖍️' },
    ],
  },
  4: {
    theme: 'Food',
    competencyId: 'comp_eng_food',
    competencyName: 'Fruit Basket Spell',
    words: [
      { word: 'FIG', translation: 'buah ara', emoji: '🪴' },
      { word: 'PEA', translation: 'kacang polong', emoji: '🫛' },
      { word: 'JAM', translation: 'selai', emoji: '🍯' },
      { word: 'EGG', translation: 'telur', emoji: '🥚' },
      { word: 'CAKE', translation: 'kue', emoji: '🍰' },
      { word: 'MILK', translation: 'susu', emoji: '🥛' },
      { word: 'RICE', translation: 'nasi', emoji: '🍚' },
      { word: 'SOUP', translation: 'sup', emoji: '🍲' },
      { word: 'APPLE', translation: 'apel', emoji: '🍎' },
      { word: 'MANGO', translation: 'mangga', emoji: '🥭' },
      { word: 'BREAD', translation: 'roti', emoji: '🍞' },
      { word: 'GRAPE', translation: 'anggur', emoji: '🍇' },
      { word: 'LEMON', translation: 'lemon', emoji: '🍋' },
      { word: 'BANANA', translation: 'pisang', emoji: '🍌' },
      { word: 'ORANGE', translation: 'jeruk', emoji: '🍊' },
      { word: 'CHERRY', translation: 'ceri', emoji: '🍒' },
      { word: 'COCONUT', translation: 'kelapa', emoji: '🥥' },
      { word: 'PINEAPPLE', translation: 'nanas', emoji: '🍍' },
    ],
  },
  5: {
    theme: 'Family',
    competencyId: 'comp_eng_family',
    competencyName: 'My Family & Friends',
    words: [
      { word: 'MOM', translation: 'ibu', emoji: '👩' },
      { word: 'DAD', translation: 'ayah', emoji: '👨' },
      { word: 'SON', translation: 'anak laki-laki', emoji: '👦' },
      { word: 'AUNT', translation: 'bibi', emoji: '👩‍🦰' },
      { word: 'BABY', translation: 'bayi', emoji: '👶' },
      { word: 'COUSIN', translation: 'sepupu', emoji: '🧒' },
      { word: 'SISTER', translation: 'kakak/adik perempuan', emoji: '👧' },
      { word: 'BROTHER', translation: 'kakak/adik laki-laki', emoji: '👦' },
      { word: 'MOTHER', translation: 'ibu', emoji: '👩' },
      { word: 'FATHER', translation: 'ayah', emoji: '👨' },
      { word: 'GRANDMA', translation: 'nenek', emoji: '👵' },
      { word: 'GRANDPA', translation: 'kakek', emoji: '👴' },
      { word: 'FAMILY', translation: 'keluarga', emoji: '👨‍👩‍👧‍👦' },
      { word: 'PARENTS', translation: 'orang tua', emoji: '👨‍👩' },
    ],
  },
  6: {
    theme: 'Verbs',
    competencyId: 'comp_eng_verbs',
    competencyName: 'Action Verbs',
    words: [
      { word: 'RUN', translation: 'lari', emoji: '🏃' },
      { word: 'EAT', translation: 'makan', emoji: '🍽️' },
      { word: 'FLY', translation: 'terbang', emoji: '🦅' },
      { word: 'CRY', translation: 'menangis', emoji: '😢' },
      { word: 'WALK', translation: 'berjalan', emoji: '🚶' },
      { word: 'JUMP', translation: 'melompat', emoji: '🤸' },
      { word: 'READ', translation: 'membaca', emoji: '📖' },
      { word: 'SING', translation: 'bernyanyi', emoji: '🎤' },
      { word: 'DANCE', translation: 'menari', emoji: '💃' },
      { word: 'SLEEP', translation: 'tidur', emoji: '😴' },
      { word: 'SWIM', translation: 'berenang', emoji: '🏊' },
      { word: 'COOK', translation: 'memasak', emoji: '🍳' },
      { word: 'DRAW', translation: 'menggambar', emoji: '🎨' },
      { word: 'WRITE', translation: 'menulis', emoji: '✍️' },
      { word: 'SMILE', translation: 'tersenyum', emoji: '😊' },
      { word: 'CLIMB', translation: 'memanjat', emoji: '🧗' },
    ],
  },
  7: {
    theme: 'Greetings',
    competencyId: 'comp_eng_greet',
    competencyName: 'Daily Conversation',
    words: [
      { word: 'HI', translation: 'halo', emoji: '👋' },
      { word: 'BYE', translation: 'selamat tinggal', emoji: '👋' },
      { word: 'YES', translation: 'ya', emoji: '✅' },
      { word: 'SIR', translation: 'Tuan', emoji: '🤵' },
      { word: 'HELLO', translation: 'halo', emoji: '👋' },
      { word: 'THANK', translation: 'terima kasih (bagian)', emoji: '🙏' },
      { word: 'PLEASE', translation: 'tolong', emoji: '🥺' },
      { word: 'SORRY', translation: 'maaf', emoji: '😔' },
      { word: 'WELCOME', translation: 'selamat datang', emoji: '🤗' },
      { word: 'MORNING', translation: 'pagi', emoji: '🌅' },
      { word: 'EVENING', translation: 'sore', emoji: '🌆' },
      { word: 'GREETING', translation: 'sapaan', emoji: '💬' },
    ],
  },
  8: {
    theme: 'Grammar',
    competencyId: 'comp_eng_grammar',
    competencyName: 'Grammar: He / She / They',
    words: [
      { word: 'HE', translation: 'dia (laki)', emoji: '👨' },
      { word: 'SHE', translation: 'dia (perempuan)', emoji: '👩' },
      { word: 'IT', translation: 'itu', emoji: '👉' },
      { word: 'ARE', translation: 'adalah (jamak)', emoji: '🔁' },
      { word: 'WAS', translation: 'adalah (lampau)', emoji: '⏪' },
      { word: 'THEY', translation: 'mereka', emoji: '👥' },
      { word: 'HAVE', translation: 'memiliki', emoji: '🤲' },
      { word: 'WERE', translation: 'adalah (lampau jamak)', emoji: '⏮️' },
      { word: 'THEIR', translation: 'milik mereka', emoji: '👪' },
      { word: 'HERS', translation: 'miliknya (perempuan)', emoji: '💁‍♀️' },
      { word: 'OUR', translation: 'kami', emoji: '👨‍👩‍👧' },
      { word: 'YOUR', translation: 'milikmu', emoji: '👉' },
    ],
  },
  9: {
    theme: 'Sentence',
    competencyId: 'comp_eng_sentence',
    competencyName: 'Sentence Builder',
    words: [
      { word: 'IS', translation: 'adalah', emoji: '➡️' },
      { word: 'AM', translation: 'adalah (aku)', emoji: '🙋' },
      { word: 'GO', translation: 'pergi', emoji: '🚶' },
      { word: 'DO', translation: 'lakukan', emoji: '✋' },
      { word: 'THE', translation: 'the (artikel)', emoji: '📌' },
      { word: 'AND', translation: 'dan', emoji: '➕' },
      { word: 'BUT', translation: 'tapi', emoji: '↔️' },
      { word: 'ARE', translation: 'adalah (jamak)', emoji: '👥' },
      { word: 'HERE', translation: 'di sini', emoji: '📍' },
      { word: 'THERE', translation: 'di sana', emoji: '📍' },
      { word: 'WHERE', translation: 'di mana', emoji: '❓' },
      { word: 'WHAT', translation: 'apa', emoji: '❓' },
      { word: 'WHEN', translation: 'kapan', emoji: '⏰' },
      { word: 'WITH', translation: 'dengan', emoji: '🤝' },
      { word: 'FROM', translation: 'dari', emoji: '⬅️' },
      { word: 'THIS', translation: 'ini', emoji: '👉' },
      { word: 'THAT', translation: 'itu', emoji: '👉' },
      { word: 'HAVE', translation: 'memiliki', emoji: '🤲' },
    ],
  },
  10: {
    theme: 'Master',
    competencyId: 'comp_eng_master',
    competencyName: 'Grand Spell Master',
    words: [
      // Mix of all themes, harder words
      { word: 'BEAUTIFUL', translation: 'cantik/indah', emoji: '🌸' },
      { word: 'WONDERFUL', translation: 'menakjubkan', emoji: '✨' },
      { word: 'EDUCATION', translation: 'pendidikan', emoji: '🎓' },
      { word: 'KNOWLEDGE', translation: 'pengetahuan', emoji: '📚' },
      { word: 'ADVENTURE', translation: 'petualangan', emoji: '🗺️' },
      { word: 'FRIENDSHIP', translation: 'persahabatan', emoji: '🤝' },
      { word: 'HAPPINESS', translation: 'kebahagiaan', emoji: '😊' },
      { word: 'DISCOVERY', translation: 'penemuan', emoji: '🔬' },
      { word: 'JOURNEY', translation: 'perjalanan', emoji: '🚶' },
      { word: 'COURAGE', translation: 'keberanian', emoji: '🦁' },
      { word: 'WISDOM', translation: 'kebijaksanaan', emoji: '🦉' },
      { word: 'DREAM', translation: 'mimpi', emoji: '💤' },
      { word: 'CREATE', translation: 'membuat', emoji: '🎨' },
      { word: 'EXPLORE', translation: 'menjelajah', emoji: '🧭' },
    ],
  },
};

// ============================================================
// TIER FILTER
// EASY = short words (≤3 letters), MEDIUM = 4-5 letters, HARD = 6+ letters
// ============================================================

function filterByTier(words: WordEntry[], tier: DifficultyTier): WordEntry[] {
  if (tier === 'EASY') return words.filter((w) => w.word.length <= 3);
  if (tier === 'MEDIUM') return words.filter((w) => w.word.length >= 4 && w.word.length <= 5);
  return words.filter((w) => w.word.length >= 6);
}

// Fallback: if no words match the tier filter, use any word
function pickWordFallback(words: WordEntry[], tier: DifficultyTier): WordEntry {
  const filtered = filterByTier(words, tier);
  if (filtered.length > 0) return filtered[Math.floor(Math.random() * filtered.length)];
  // Fallback to any word
  return words[Math.floor(Math.random() * words.length)];
}

// ============================================================
// LETTER TILE BUILDER
// Build a pool of letters = correct letters + distractor letters
// Total tiles = correct word length + 2-3 distractors (capped at 10 tiles)
// ============================================================

function buildLetterTiles(word: string): string[] {
  const correctLetters = word.toUpperCase().split('');
  // Add 2-3 distractor letters that are NOT in the word
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const notInWord = allLetters.filter((l) => !correctLetters.includes(l));
  const distractorCount = Math.min(3, Math.max(2, 8 - correctLetters.length));
  const distractors: string[] = [];
  for (let i = 0; i < distractorCount; i++) {
    const idx = Math.floor(Math.random() * notInWord.length);
    distractors.push(notInWord[idx]);
    notInWord.splice(idx, 1);
  }
  // Combine and shuffle
  const tiles = [...correctLetters, ...distractors];
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

// ============================================================
// MAIN GENERATOR
// ============================================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateEnglishSpelling(
  levelNumber: number,
  tier: DifficultyTier
): QuestionItem | null {
  const themeData = WORD_LISTS[levelNumber];
  if (!themeData) return null;

  const entry = pickWordFallback(themeData.words, tier);
  const word = entry.word.toUpperCase();
  const letterTiles = buildLetterTiles(word);

  const prompt = `Eja kata "${word}" (${entry.translation}) ${entry.emoji || ''}`;
  const promptSubtitle = entry.emoji ? `${entry.emoji} = ${entry.translation}` : `${entry.translation}`;

  return {
    id: `gen_eng_${levelNumber}_${tier.toLowerCase()}_${word.toLowerCase()}_${randInt(1, 9999)}`,
    subjectCode: 'ENGLISH',
    gradeBand: levelNumber <= 4 ? 'SD_1' : levelNumber <= 7 ? 'SD_2' : levelNumber <= 9 ? 'SD_3' : 'SD_4',
    competencyId: themeData.competencyId,
    competencyName: themeData.competencyName,
    levelNumber,
    difficulty: tier,
    type: 'SPELLING',
    prompt: `Eja kata "${entry.translation}" dalam Bahasa Inggris:`,
    promptSubtitle: `${entry.emoji || ''} ${entry.translation.toUpperCase()}`,
    options: letterTiles,
    correctAnswer: word,
    acceptedAnswers: [word, word.toLowerCase(), word.charAt(0) + word.slice(1).toLowerCase()],
    explanation: `"${entry.translation}" dalam Bahasa Inggris adalah ${word} (dibaca: ${word.split('').join('-')}).`,
    hint: `Kata ini punya ${word.length} huruf, diawali huruf "${word[0]}".`,
  };
}
