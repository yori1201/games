/**
 * Procedural Question Generator for RUMBELA GAMES
 * ============================================================
 * Generates fresh, randomized questions for MATH and LOGIC subjects
 * across all 10 levels and 3 difficulty tiers (EASY/MEDIUM/HARD).
 *
 * Each generator function returns a QuestionItem with a unique ID
 * prefixed `gen_` so they can be distinguished from hand-written questions.
 *
 * Combined with the hand-written QUESTION_BANK, this gives ~240+ unique
 * question variants per subject — enough for non-repetitive adaptive sessions.
 */
import type { QuestionItem, SubjectCode, DifficultyTier } from '../types/game';
import { generateEnglishSpelling } from './english-spelling-generator';

// ============================================================
// Utilities
// ============================================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeId(subject: string, level: number, tier: string, salt: number): string {
  return `gen_${subject.toLowerCase()}_${level}_${tier.toLowerCase()}_${salt}_${Date.now() % 100000}`;
}

// Build a multiple-choice question with 1 correct + 3 plausible distractors
function buildMCQ(
  subjectCode: SubjectCode,
  levelNumber: number,
  difficulty: DifficultyTier,
  competencyId: string,
  competencyName: string,
  gradeBand: string,
  prompt: string,
  promptSubtitle: string | undefined,
  correctAnswer: string,
  distractors: string[],
  explanation: string,
  hint: string,
  salt: number
): QuestionItem {
  // Filter distractors to remove duplicates and the correct answer
  const uniqueDistractors = Array.from(new Set(distractors)).filter((d) => d !== correctAnswer).slice(0, 3);
  // Pad with random "close" distractors if we don't have 3
  while (uniqueDistractors.length < 3) {
    const correctNum = parseInt(correctAnswer, 10);
    if (!isNaN(correctNum)) {
      const offset = pick([-3, -2, -1, 1, 2, 3, 5, -5]);
      const candidate = String(correctNum + offset);
      if (candidate !== correctAnswer && !uniqueDistractors.includes(candidate)) {
        uniqueDistractors.push(candidate);
      }
    } else {
      break;
    }
  }
  const options = shuffle([correctAnswer, ...uniqueDistractors]);
  return {
    id: makeId(subjectCode, levelNumber, difficulty, salt),
    subjectCode,
    gradeBand,
    competencyId,
    competencyName,
    levelNumber,
    difficulty,
    type: 'MULTIPLE_CHOICE',
    prompt,
    promptSubtitle,
    options,
    correctAnswer,
    explanation,
    hint,
  };
}

// ============================================================
// MATH GENERATORS — one per competency per tier
// ============================================================

// --- Level 1: Counting ---
function genMathCount(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  const count = tier === 'EASY' ? randInt(2, 5) : tier === 'MEDIUM' ? randInt(5, 9) : randInt(9, 15);
  const emoji = pick(['🍎', '🌟', '🌸', '🐟', '🐶', '🎈', '🍓', '🦋']);
  const subtitle = Array(count).fill(emoji).join(' ');
  const distractors = [String(count - 1), String(count + 1), String(count - 2), String(count + 2)];
  return buildMCQ(
    'MATH', level, tier, 'comp_math_count', 'Mengenal Angka & Hitung Objek', 'SD_1',
    `Berapakah jumlah ${emoji === '🍎' ? 'apel' : emoji === '🌟' ? 'bintang' : emoji === '🌸' ? 'bunga' : emoji === '🐟' ? 'ikan' : emoji === '🐶' ? 'anjak' : emoji === '🎈' ? 'balon' : emoji === '🍓' ? 'stroberi' : 'kupu-kupu'} pada gambar di bawah?`,
    subtitle, String(count), distractors,
    `Hitung satu per satu: ada ${count} ${emoji}.`,
    'Gunakan jarimu untuk menunjuk setiap gambar sambil berhitung dari kiri ke kanan.',
    salt
  );
}

// --- Level 2: Addition ---
function genMathAdd(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  let a: number, b: number;
  if (tier === 'EASY') { a = randInt(1, 5); b = randInt(1, 5); }
  else if (tier === 'MEDIUM') { a = randInt(3, 9); b = randInt(3, 9); }
  else { a = randInt(5, 19); b = randInt(5, 19); }
  const sum = a + b;
  const useStory = Math.random() < 0.5;
  const prompt = useStory
    ? `Di keranjang ada ${a} apel 🍎. Ibu menambah ${b} apel lagi. Berapa total apel sekarang?`
    : `Berapakah hasil dari ${a} + ${b}?`;
  return buildMCQ(
    'MATH', level, tier, 'comp_math_add', 'Penjumlahan Ceria', 'SD_1',
    prompt, undefined, String(sum),
    [String(sum - 1), String(sum + 1), String(sum + 2), String(sum - 2)],
    `${a} + ${b} = ${sum}.`,
    `Hitung maju ${b} langkah dari angka ${a}.`,
    salt
  );
}

// --- Level 3: Subtraction ---
function genMathSub(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  let a: number, b: number;
  if (tier === 'EASY') { a = randInt(3, 9); b = randInt(1, a - 1); }
  else if (tier === 'MEDIUM') { a = randInt(8, 18); b = randInt(2, a - 2); }
  else { a = randInt(15, 50); b = randInt(5, a - 5); }
  const diff = a - b;
  const useStory = Math.random() < 0.5;
  const prompt = useStory
    ? `Bela punya ${a} permen 🍬. Dia memberikan ${b} permen ke teman. Berapa sisa permen Bela?`
    : `Berapakah hasil dari ${a} − ${b}?`;
  return buildMCQ(
    'MATH', level, tier, 'comp_math_sub', 'Pengurangan Langkah', 'SD_1',
    prompt, undefined, String(diff),
    [String(diff + 1), String(diff - 1), String(diff + 2), String(a + b)],
    `${a} − ${b} = ${diff}.`,
    `Hitung mundur ${b} langkah dari angka ${a}.`,
    salt
  );
}

// --- Level 4: Number Patterns ---
function genMathPattern(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  let start: number, step: number, count: number;
  if (tier === 'EASY') { start = randInt(1, 3); step = 1; count = 4; }
  else if (tier === 'MEDIUM') { start = randInt(2, 5); step = pick([2, 3, 5]); count = 4; }
  else { start = randInt(2, 10); step = pick([2, 3, 4, 5, 10]); count = 5; }

  const seq: number[] = [];
  for (let i = 0; i < count; i++) seq.push(start + i * step);
  const answer = seq[seq.length - 1];
  const visible = seq.slice(0, -1);
  const prompt = `Lengkapi pola bilangan berikut: ${visible.join(', ')}, ... ?`;
  return buildMCQ(
    'MATH', level, tier, 'comp_math_pattern', 'Misteri Pola Bilangan', 'SD_2',
    prompt, undefined, String(answer),
    [String(answer - step), String(answer + step), String(answer + 1), String(answer - 1)],
    `Setiap angka bertambah ${step}. Jadi ${visible[visible.length - 1]} + ${step} = ${answer}.`,
    `Lihat selisih antara dua angka berdekatan.`,
    salt
  );
}

// --- Level 5: Multiplication ---
function genMathMult(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  let a: number, b: number;
  if (tier === 'EASY') { a = randInt(2, 5); b = randInt(1, 5); }
  else if (tier === 'MEDIUM') { a = randInt(2, 9); b = randInt(2, 9); }
  else { a = randInt(3, 12); b = randInt(3, 12); }
  const product = a * b;
  const useStory = Math.random() < 0.5;
  const prompt = useStory
    ? `Ada ${a} kotak pensil, masing-masing berisi ${b} pensil. Berapa total pensil?`
    : `Berapakah hasil dari ${a} × ${b}?`;
  return buildMCQ(
    'MATH', level, tier, 'comp_math_mult', 'Petualangan Perkalian', 'SD_2',
    prompt, undefined, String(product),
    [String(product + a), String(product - b), String(product + b), String(a + b)],
    `${a} × ${b} = ${product} (atau hitung ${a} + ${a} + ... sebanyak ${b} kali).`,
    `Perkalian adalah penjumlahan berulang. Hitung ${a} ditambah ${a} sebanyak ${b} kali.`,
    salt
  );
}

// --- Level 6: Division ---
function genMathDiv(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  let b: number, q: number;
  if (tier === 'EASY') { b = randInt(2, 5); q = randInt(2, 5); }
  else if (tier === 'MEDIUM') { b = randInt(2, 9); q = randInt(2, 9); }
  else { b = randInt(3, 12); q = randInt(3, 12); }
  const a = b * q; // ensures clean division
  const useStory = Math.random() < 0.5;
  const prompt = useStory
    ? `${a} permen 🍬 dibagi rata ke ${b} anak. Berapa permen yang didapat setiap anak?`
    : `Berapakah hasil dari ${a} ÷ ${b}?`;
  return buildMCQ(
    'MATH', level, tier, 'comp_math_div', 'Membagi Rata Permen', 'SD_3',
    prompt, undefined, String(q),
    [String(q + 1), String(q - 1), String(b), String(a - q)],
    `${a} ÷ ${b} = ${q} karena ${q} × ${b} = ${a}.`,
    `Pikirkan: ${b} × ? = ${a}?`,
    salt
  );
}

// --- Level 7: Fractions ---
function genMathFrac(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  // Use simple pizza/pie fractions
  const fractions = tier === 'EASY'
    ? [['1/2', 'setengah'], ['1/4', 'seperempat']]
    : tier === 'MEDIUM'
    ? [['1/2', 'setengah'], ['1/4', 'seperempat'], ['3/4', 'tiga perempat']]
    : [['1/3', 'sepertiga'], ['2/3', 'dua pertiga'], ['1/4', 'seperempat'], ['3/4', 'tiga perempat']];
  const [frac, name] = pick(fractions);
  const prompt = `Pizza dipotong menjadi 4 bagian sama. Bela makan bagian yang sesuai dengan pecahan ${frac}. Bagaimana menulis pecahan ${frac} dari pizza utuh?`;
  return buildMCQ(
    'MATH', level, tier, 'comp_math_frac', 'Potongan Pecahan Pizza', 'SD_3',
    prompt, undefined, frac,
    [String(parseInt(frac.split('/')[0]) + 1) + '/' + frac.split('/')[1],
     frac.split('/')[0] + '/' + String(parseInt(frac.split('/')[1]) + 1),
     frac.split('/').reverse().join('/'),
     '1/' + frac.split('/')[1]],
    `Pecahan ${frac} artinya ${name} bagian dari pizza utuh.`,
    `Angka atas = bagian yang diambil, angka bawah = total potongan.`,
    salt
  );
}

// --- Level 8: Time ---
function genMathTime(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  if (tier === 'EASY') {
    const h = randInt(1, 12);
    const m = pick([0, 15, 30, 45]);
    const mStr = m === 0 ? 'tepat' : `lebih ${m}`;
    const correct = `${h}.${String(m).padStart(2, '0')}`;
    const prompt = `Jam dinding menunjukkan pukul ${h} ${mStr}. Bagaimana menulisnya dalam angka?`;
    return buildMCQ(
      'MATH', level, tier, 'comp_math_time', 'Jarum Jam & Waktu', 'SD_2',
      prompt, undefined, correct,
      [`${h}.${String((m + 15) % 60).padStart(2, '0')}`,
       `${(h % 12) + 1}.${String(m).padStart(2, '0')}`,
       `${h}.${String(m).padStart(2, '0').split('').reverse().join('')}`],
      `Jam ${h} ${mStr} ditulis ${correct}.`,
      `Angka sebelum titik = jam, angka setelah titik = menit.`,
      salt
    );
  } else if (tier === 'MEDIUM') {
    const start = randInt(7, 11);
    const dur = pick([30, 45, 60, 90]);
    const endMin = start * 60 + dur;
    const endH = Math.floor(endMin / 60) % 24;
    const endM = endMin % 60;
    const correct = `${endH}.${String(endM).padStart(2, '0')}`;
    const prompt = `Belajar mulai pukul ${start}.00 selama ${dur} menit. Pukul berapa belajar selesai?`;
    return buildMCQ(
      'MATH', level, tier, 'comp_math_time', 'Jarum Jam & Waktu', 'SD_3',
      prompt, undefined, correct,
      [`${(endH + 1) % 24}.${String(endM).padStart(2, '0')}`,
       `${endH}.${String((endM + 15) % 60).padStart(2, '0')}`,
       `${(endH - 1 + 24) % 24}.${String(endM).padStart(2, '0')}`],
      `${start}.00 + ${dur} menit = ${correct}.`,
      `Konversi ke menit: ${start}×60 = ${start * 60}, lalu tambah ${dur}, lalu balik ke jam:menit.`,
      salt
    );
  } else {
    const start = randInt(13, 20);
    const end = start + randInt(1, 4);
    const correct = (end - start) * 60;
    const prompt = `Bela belajar dari pukul ${start}.00 sampai ${end}.00. Berapa lama (dalam menit) Bela belajar?`;
    return buildMCQ(
      'MATH', level, tier, 'comp_math_time', 'Jarum Jam & Waktu', 'SD_4',
      prompt, undefined, String(correct),
      [String(correct + 60), String(correct - 60), String(end - start)],
      `${end} − ${start} = ${end - start} jam = ${(end - start) * 60} menit.`,
      `Hitung selisih jam dulu, lalu kalikan 60 untuk dapat menit.`,
      salt
    );
  }
}

// --- Level 8 fallback geometry mix: Level 9 Geometry ---
function genMathGeo(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  const shapes = [
    { name: 'segitiga', sides: 3, emoji: '🔺' },
    { name: 'persegi', sides: 4, emoji: '⬛' },
    { name: 'persegi panjang', sides: 4, emoji: '▭' },
    { name: 'lingkaran', sides: 0, emoji: '⭕' },
    { name: 'pentagon', sides: 5, emoji: '⬟' },
    { name: 'heksagon', sides: 6, emoji: '⬢' },
  ];
  if (tier === 'EASY') {
    const s = pick(shapes.slice(0, 4));
    const prompt = `Bangun datar apa yang memiliki ${s.sides > 0 ? s.sides + ' sisi' : 'tidak ada sisi (melengkung)'}? ${s.emoji}`;
    return buildMCQ(
      'MATH', level, tier, 'comp_math_geo', 'Istana Bangun Datar', 'SD_2',
      prompt, undefined, s.name,
      shapes.filter((x) => x.name !== s.name).slice(0, 3).map((x) => x.name),
      `Bangun ${s.name} memiliki ${s.sides > 0 ? s.sides + ' sisi' : 'kurva melengkung'}.`,
      `Hitung jumlah sisi pada gambar.`,
      salt
    );
  } else if (tier === 'MEDIUM') {
    const s = pick(shapes.slice(0, 5));
    const prompt = `Berapa sisi pada bangun ${s.name}? ${s.emoji}`;
    return buildMCQ(
      'MATH', level, tier, 'comp_math_geo', 'Istana Bangun Datar', 'SD_3',
      prompt, undefined, String(s.sides),
      [String(s.sides + 1), String(s.sides - 1), String(s.sides + 2)],
      `${s.name} memiliki ${s.sides} sisi.`,
      `Hitung setiap garis lurus pada bangun tersebut.`,
      salt
    );
  } else {
    // Perimeter of square/rectangle
    const side = randInt(3, 12);
    const prompt = `Sebuah persegi memiliki sisi ${side} cm. Berapa kelilingnya?`;
    const correct = 4 * side;
    return buildMCQ(
      'MATH', level, tier, 'comp_math_geo', 'Istana Bangun Datar', 'SD_4',
      prompt, undefined, String(correct),
      [String(correct + side), String(side * side), String(2 * side)],
      `Keliling persegi = 4 × sisi = 4 × ${side} = ${correct} cm.`,
      `Persegi punya 4 sisi sama panjang. Kalikan sisi dengan 4.`,
      salt
    );
  }
}

// --- Level 10: Story problems (composite) ---
function genMathStory(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  // Two-step story problem
  const a = randInt(3, tier === 'EASY' ? 8 : tier === 'MEDIUM' ? 15 : 25);
  const b = randInt(2, tier === 'EASY' ? 6 : tier === 'MEDIUM' ? 10 : 12);
  const c = randInt(1, tier === 'EASY' ? 4 : tier === 'MEDIUM' ? 8 : 10);
  // Story: Bela has a apples, buys b more, gives c to friend. How many left?
  const result = a + b - c;
  const prompt = `Bela memiliki ${a} permen. Ibu memberinya ${b} permen lagi. Kemudian Bela memberikan ${c} permen ke adiknya. Berapa sisa permen Bela?`;
  return buildMCQ(
    'MATH', level, tier, 'comp_math_story', 'Tantangan Master Matematika', 'SD_3',
    prompt, undefined, String(result),
    [String(a + b + c), String(a - b + c), String(a + b), String(result - 1)],
    `Langkah 1: ${a} + ${b} = ${a + b}. Langkah 2: ${a + b} − ${c} = ${result}.`,
    `Pecah soal menjadi 2 langkah: jumlahkan dulu, lalu kurangi.`,
    salt
  );
}

// ============================================================
// LOGIC GENERATORS — one per competency per tier
// ============================================================

// --- Level 1: Pattern (shapes/colors) ---
function genLogicPattern(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  const colors = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];
  if (tier === 'EASY') {
    // ABAB pattern
    const [a, b] = [pick(colors), pick(colors.filter((c) => c !== colors[0]))];
    const seq = [a, b, a, b, a];
    const answer = b;
    const prompt = `Lengkapi pola warna berikut: ${seq.join(' ')} ... ?`;
    return buildMCQ(
      'LOGIC', level, tier, 'comp_log_pattern', 'Lanjutkan Pola Rahasia', 'SD_1',
      prompt, undefined, answer,
      colors.filter((c) => c !== answer).slice(0, 3),
      `Pola berulang ${a} ${b} ${a} ${b}. Selanjutnya adalah ${answer}.`,
      `Lihat pola pengulangan setelah setiap 2 bentuk.`,
      salt
    );
  } else if (tier === 'MEDIUM') {
    // AABB pattern
    const [a, b] = [pick(colors), pick(colors.filter((c) => c !== colors[0]))];
    const seq = [a, a, b, b, a, a];
    const answer = b;
    const prompt = `Lengkapi pola warna berikut: ${seq.join(' ')} ... ?`;
    return buildMCQ(
      'LOGIC', level, tier, 'comp_log_pattern', 'Lanjutkan Pola Rahasia', 'SD_1',
      prompt, undefined, answer,
      colors.filter((c) => c !== answer).slice(0, 3),
      `Pola: ${a}${a} ${b}${b} ${a}${a} ${b}${b}.`,
      `Hitung berapa kali warna yang sama muncul berurutan.`,
      salt
    );
  } else {
    // ABC pattern
    const pool = shuffle(colors).slice(0, 3);
    const seq = [pool[0], pool[1], pool[2], pool[0], pool[1]];
    const answer = pool[2];
    const prompt = `Lengkapi pola warna berikut: ${seq.join(' ')} ... ?`;
    return buildMCQ(
      'LOGIC', level, tier, 'comp_log_pattern', 'Lanjutkan Pola Rahasia', 'SD_2',
      prompt, undefined, answer,
      colors.filter((c) => c !== answer).slice(0, 3),
      `Pola berulang setiap 3 warna: ${pool.join(' ')}.`,
      `Identifikasi blok 3-warna yang berulang.`,
      salt
    );
  }
}

// --- Level 2: Sequence (number sequence) ---
function genLogicSequence(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  // Sequence of numbers in order
  const start = randInt(1, 5);
  const step = tier === 'EASY' ? 1 : tier === 'MEDIUM' ? 2 : 3;
  const seq = [start, start + step, start + 2 * step, start + 3 * step];
  const answer = start + 4 * step;
  const prompt = `Urutkan pola bilangan berikut. Angka berikutnya setelah ${seq[3]} adalah?`;
  return buildMCQ(
    'LOGIC', level, tier, 'comp_log_sequence', 'Urutan Kejadian Logis', 'SD_1',
    prompt, `${seq.join(', ')}, ... ?`, String(answer),
    [String(answer - step), String(answer + step), String(answer + 1)],
    `Setiap angka bertambah ${step}. ${seq[3]} + ${step} = ${answer}.`,
    `Lihat selisih antar angka.`,
    salt
  );
}

// --- Level 3: Direction (grid navigation — INTERACTIVE) ---
// Generates a LOGIC_SEQUENCE question with grid data.
// AdaptiveGameSession renders LogicGridNav component for these.
function genLogicDirection(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  // Grid size scales with tier
  const size = tier === 'EASY' ? 3 : tier === 'MEDIUM' ? 4 : 5;
  const start: [number, number] = [0, 0];
  // Target at opposite corner (with some randomization)
  const target: [number, number] = tier === 'EASY'
    ? [size - 1, size - 1]
    : [randInt(size - 2, size - 1), randInt(size - 2, size - 1)];
  // No obstacles for level 3 (just direction learning)
  const obstacles: [number, number][] = [];

  // Compute optimal path (just for hint purposes — student can take any valid path)
  const dx = target[0] - start[0];
  const dy = target[1] - start[1];
  const optimalPath: string[] = [
    ...Array(Math.abs(dx)).fill(dx > 0 ? 'RIGHT' : 'LEFT'),
    ...Array(Math.abs(dy)).fill(dy > 0 ? 'DOWN' : 'UP'),
  ];

  return {
    id: makeId('LOGIC', level, tier, salt),
    subjectCode: 'LOGIC',
    gradeBand: 'SD_2',
    competencyId: 'comp_log_direction',
    competencyName: 'Arah Navigasi Robot Bela',
    levelNumber: level,
    difficulty: tier,
    type: 'LOGIC_SEQUENCE',
    prompt: `Bimbing Robot Bela 🤖 dari posisi awal ke target 🎯! Klik tombol panah untuk menyusun jalur.`,
    promptSubtitle: `Grid ${size}×${size} · Posisi awal (${start[0]},${start[1]}) → Target (${target[0]},${target[1]})`,
    correctAnswer: optimalPath.join(', '),
    acceptedAnswers: [], // Evaluation is done by simulation in AdaptiveGameSession
    explanation: `Jalur optimal: ${optimalPath.length} langkah. Tapi jalur manapun yang sampai ke target tanpa menabrak rintangan diterima!`,
    hint: `Robot perlu pindah ${Math.abs(dx)} langkah ke ${dx > 0 ? 'kanan' : 'kiri'} dan ${Math.abs(dy)} langkah ke ${dy > 0 ? 'bawah' : 'atas'}.`,
    gridSize: [size, size],
    startPos: start,
    targetPos: target,
    obstacles,
  };
}

// --- Level 4: Obstacle avoidance (grid navigation with rocks) ---
function genLogicObstacle(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  const size = tier === 'EASY' ? 3 : tier === 'MEDIUM' ? 4 : 5;
  const start: [number, number] = [0, 0];
  const target: [number, number] = [size - 1, size - 1];

  // Place 1-3 obstacles randomly (not on start or target)
  const obstacleCount = tier === 'EASY' ? 1 : tier === 'MEDIUM' ? 2 : 3;
  const obstacles: [number, number][] = [];
  const occupied = new Set([`${start[0]},${start[1]}`, `${target[0]},${target[1]}`]);

  let attempts = 0;
  while (obstacles.length < obstacleCount && attempts < 50) {
    const x = randInt(0, size - 1);
    const y = randInt(0, size - 1);
    const key = `${x},${y}`;
    if (!occupied.has(key)) {
      // Verify path still exists (simple check: don't block entire row/column adjacent to start/target)
      obstacles.push([x, y]);
      occupied.add(key);
    }
    attempts++;
  }

  // Optimal path: go around obstacles (simplified — just RIGHT then DOWN)
  const optimalPath: string[] = [
    ...Array(target[0] - start[0]).fill('RIGHT'),
    ...Array(target[1] - start[1]).fill('DOWN'),
  ];

  return {
    id: makeId('LOGIC', level, tier, salt),
    subjectCode: 'LOGIC',
    gradeBand: 'SD_2',
    competencyId: 'comp_log_obstacle',
    competencyName: 'Menghindari Rintangan Jurang',
    levelNumber: level,
    difficulty: tier,
    type: 'LOGIC_SEQUENCE',
    prompt: `Bimbing Robot Bela 🤖 ke target 🎯, tapi HINDARI rintangan 🪨!`,
    promptSubtitle: `Grid ${size}×${size} · ${obstacleCount} rintangan`,
    correctAnswer: optimalPath.join(', '),
    acceptedAnswers: [],
    explanation: `Ada ${obstacles.length} rintangan. Pilih jalur yang bebas hambatan menuju target.`,
    hint: `Lihat posisi rintangan. Kalau ada di depan, coba belok dulu sebelum melanjutkan.`,
    gridSize: [size, size],
    startPos: start,
    targetPos: target,
    obstacles,
  };
}

// --- Level 5: Conditional (IF-THEN) ---
function genLogicConditional(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  const scenarios = [
    { condition: 'hujan 🌧️', action: 'payung ☔', alt: 'topi 🎩' },
    { condition: 'panas ☀️', action: 'topi 🎩', alt: 'payung ☔' },
    { condition: 'dingin ❄️', action: 'jaket 🧥', alt: 'kaos 👕' },
    { condition: 'berangin 🌬️', action: 'jaket 🧥', alt: 'topi 🎩' },
  ];
  const s = pick(scenarios);
  const prompt = `Jika cuaca ${s.condition}, Bela memakai ${s.action}. Hari ini cuaca ${s.condition}. Apa yang dipakai Bela?`;
  return buildMCQ(
    'LOGIC', level, tier, 'comp_log_conditional', 'Logika Jika-Maka (IF-THEN)', 'SD_2',
    prompt, undefined, s.action.split(' ')[0],
    [s.alt.split(' ')[0], 'Tidak perlu apa-apa', 'Bawa semua'],
    `Aturan: JIKA ${s.condition} MAKA pakai ${s.action}. Hari ini ${s.condition}, jadi pakai ${s.action}.`,
    `Cocokkan kondisi cuaca dengan aturan yang sesuai.`,
    salt
  );
}

// --- Level 6: Loop (count repetitions) ---
function genLogicLoop(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  const reps = tier === 'EASY' ? randInt(2, 4) : tier === 'MEDIUM' ? randInt(3, 6) : randInt(4, 9);
  const step = randInt(1, 3);
  const start = randInt(1, 3);
  const final = start + reps * step;
  const prompt = `Robot Bela mengulang perintah "Maju ${step} langkah" sebanyak ${reps} kali. Jika posisi awal = ${start}, di mana posisi akhir Bela?`;
  return buildMCQ(
    'LOGIC', level, tier, 'comp_log_loop', 'Perulangan Cerdas (LOOP)', 'SD_3',
    prompt, undefined, String(final),
    [String(final + step), String(final - step), String(start + reps)],
    `Perulangan ${reps}× dengan langkah ${step} = ${reps * step} langkah. ${start} + ${reps * step} = ${final}.`,
    `Kalikan jumlah perulangan dengan panjang langkah, lalu tambah posisi awal.`,
    salt
  );
}

// --- Level 7: Debugging (find the wrong step) ---
function genLogicDebug(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  // Sequence 1, 2, 3, 5, 4 — find wrong
  const wrongIdx = randInt(0, 3);
  const seq = [1, 2, 3, 4, 5];
  const correctStep = seq[wrongIdx];
  seq[wrongIdx] = correctStep + pick([-2, 2, -1, 1]);
  const prompt = `Bela menulis urutan langkah: ${seq.join(' → ')}. Satu langkah salah. Langkah ke berapa yang salah?`;
  return buildMCQ(
    'LOGIC', level, tier, 'comp_log_debug', 'Detektif Kode / Debugging', 'SD_3',
    prompt, undefined, `Langkah ${wrongIdx + 1}`,
    [`Langkah ${(wrongIdx + 1) % 5 + 1}`, `Langkah ${(wrongIdx + 2) % 5 + 1}`, `Langkah ${(wrongIdx + 3) % 5 + 1}`],
    `Urutan seharusnya: 1, 2, 3, 4, 5. Pada langkah ${wrongIdx + 1}, tertulis ${seq[wrongIdx]} seharusnya ${correctStep}.`,
    `Bandingkan setiap langkah dengan urutan yang benar.`,
    salt
  );
}

// --- Level 10: Master algorithm (composite) ---
function genLogicMaster(level: number, tier: DifficultyTier): QuestionItem {
  const salt = randInt(1, 1000);
  // Find the shortest sequence of commands
  const x = randInt(2, tier === 'EASY' ? 3 : tier === 'MEDIUM' ? 5 : 7);
  const y = randInt(2, tier === 'EASY' ? 3 : tier === 'MEDIUM' ? 5 : 7);
  const total = x + y;
  const prompt = `Robot Bela di (0,0) harus ke (${x},${y}). Setiap perintah "Maju" atau "Atas" memindahkan 1 langkah. Berapa perintah minimum yang dibutuhkan?`;
  return buildMCQ(
    'LOGIC', level, tier, 'comp_log_algo', 'Optimasi Rute Terpendek', 'SD_4',
    prompt, undefined, String(total),
    [String(total + 1), String(total + 2), String(Math.max(x, y))],
    `Robot perlu ${x} langkah horizontal + ${y} langkah vertikal = ${total} perintah minimum.`,
    `Jumlahkan langkah horizontal dan vertikal yang diperlukan.`,
    salt
  );
}

// ============================================================
// PUBLIC: Generate a single question for a given subject/level/tier
// ============================================================

type GenFn = (level: number, tier: DifficultyTier) => QuestionItem;

const MATH_GENERATORS: Record<number, GenFn> = {
  1: genMathCount,
  2: genMathAdd,
  3: genMathSub,
  4: genMathPattern,
  5: genMathMult,
  6: genMathDiv,
  7: genMathFrac,
  8: genMathTime,
  9: genMathGeo,
  10: genMathStory,
};

const LOGIC_GENERATORS: Record<number, GenFn> = {
  1: genLogicPattern,
  2: genLogicSequence,
  3: genLogicDirection,
  4: genLogicObstacle,
  5: genLogicConditional,
  6: genLogicLoop,
  7: genLogicDebug,
  10: genLogicMaster,
};

export function generateQuestion(
  subjectCode: SubjectCode,
  levelNumber: number,
  tier: DifficultyTier
): QuestionItem | null {
  if (subjectCode === 'MATH') {
    const fn = MATH_GENERATORS[levelNumber];
    return fn ? fn(levelNumber, tier) : null;
  }
  if (subjectCode === 'LOGIC') {
    const fn = LOGIC_GENERATORS[levelNumber];
    return fn ? fn(levelNumber, tier) : null;
  }
  if (subjectCode === 'ENGLISH') {
    return generateEnglishSpelling(levelNumber, tier);
  }
  return null;
}

/**
 * Generate N fresh questions for a session, all matching the given tier.
 * Falls back to adjacent tiers if the generator doesn't exist for this level.
 */
export function generateSessionQuestions(
  subjectCode: SubjectCode,
  levelNumber: number,
  tier: DifficultyTier,
  count: number = 8
): QuestionItem[] {
  const out: QuestionItem[] = [];
  for (let i = 0; i < count; i++) {
    const q = generateQuestion(subjectCode, levelNumber, tier);
    if (q) out.push(q);
  }
  return out;
}
