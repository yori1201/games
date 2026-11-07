import React, { useState, useEffect } from 'react';
import { SubjectCode, QuestionItem, DifficultyTier, SessionResult } from '../../types/game';
import { AdaptiveEngine, AnswerLog } from '../../lib/adaptive-engine';
import { sound } from '../../lib/audio';
import { MascotBelaVideo } from '../mascot/MascotBelaVideo';
import { LogicGridNav } from './LogicGridNav';
import { cheerfulVoice } from '../../lib/cheerful-voice';
import { Lightbulb, Volume2, ArrowRight, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdaptiveGameSessionProps {
  studentId: string;
  subjectCode: SubjectCode;
  levelNumber: number;
  questions: QuestionItem[];
  onComplete: (result: SessionResult) => void;
  onExit: () => void;
}

export const AdaptiveGameSession: React.FC<AdaptiveGameSessionProps> = ({
  studentId,
  subjectCode,
  levelNumber,
  questions,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTier, setCurrentTier] = useState<DifficultyTier>('EASY');
  const [answersLog, setAnswersLog] = useState<AnswerLog[]>([]);
  const [mascotMood, setMascotMood] = useState<'idle' | 'happy' | 'thinking' | 'celebrate'>('idle');

  // Input states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spellingBuffer, setSpellingBuffer] = useState<string[]>([]);
  const [usedTileIndices, setUsedTileIndices] = useState<number[]>([]);
  const [logicSequence, setLogicSequence] = useState<string[]>([]);

  // Hint & Feedback states
  const [showHint, setShowHint] = useState(false);
  const [hintUsedForCurrent, setHintUsedForCurrent] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [adaptiveReason, setAdaptiveReason] = useState<string>('Tingkat kesulitan awal sesuai kompetensi');

  // ⏱️ Track real response time per question (replaces hardcoded 3200ms)
  const [questionStartTime, setQuestionStartTime] = useState<number>(() => Date.now());

  // 🔄 Pool that can be supplemented with tier-matched questions as the session adapts.
  // Initialized from the prop (already tier-aware via selectSessionQuestions in App.tsx),
  // but when tier changes mid-session we generate fresh questions of the new tier
  // to replace upcoming ones, so the session is truly adaptive.
  const [allQuestions, setAllQuestions] = useState<QuestionItem[]>(questions);

  const currentQ = allQuestions[currentIndex] || allQuestions[0];
  const totalQ = allQuestions.length;

  // Speak English word spelled letter-by-letter using Cheerful Female Voice
  const speakEnglishSpelled = (customWord?: string) => {
    const targetWord = customWord || (typeof currentQ?.correctAnswer === 'string' ? currentQ.correctAnswer : '');
    if (!targetWord) return;
    cheerfulVoice.spellWordCheerful(targetWord);
  };

  // Speak single letter on tile tap / typing with cheerful female voice
  const speakSingleLetter = (char: string) => {
    cheerfulVoice.pronounceLetter(char);
  };

  useEffect(() => {
    // Reset inputs for each question
    setSelectedOption(null);
    setSpellingBuffer([]);
    setUsedTileIndices([]);
    setLogicSequence([]);
    setShowHint(false);
    setHintUsedForCurrent(false);
    setFeedbackState('none');
    setMascotMood('idle');

    // ⏱️ Start the timer for this question (will be used to compute responseTimeMs on submit)
    setQuestionStartTime(Date.now());

    // Auto-pronounce English spelling word spelled letter-by-letter when question loads
    if (currentQ?.type === 'SPELLING' && currentQ.subjectCode === 'ENGLISH') {
      const timer = setTimeout(() => {
        speakEnglishSpelled();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  // Physical Keyboard Listener for Spelling
  useEffect(() => {
    if (currentQ?.type !== 'SPELLING' || feedbackState !== 'none') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if modal or input is active
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();

      if (key === 'BACKSPACE') {
        e.preventDefault();
        handleBackspaceSpelling();
      } else if (key === 'ENTER') {
        e.preventDefault();
        handleSubmitAnswer();
      } else if (/^[A-Z]$/.test(key) && currentQ.options) {
        // Find first available unused tile that matches this letter
        const availableIdx = currentQ.options.findIndex(
          (letter, idx) => letter.toUpperCase() === key && !usedTileIndices.includes(idx)
        );

        if (availableIdx !== -1) {
          e.preventDefault();
          handleTileClick(currentQ.options[availableIdx], availableIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, feedbackState, usedTileIndices, spellingBuffer]);

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <p>Memuat pertanyaan adaptif...</p>
      </div>
    );
  }

  // Handle Letter selection in Spelling mode by tile index
  const handleTileClick = (letter: string, tileIndex: number) => {
    if (usedTileIndices.includes(tileIndex) || feedbackState !== 'none') return;
    sound.playStarPop((spellingBuffer.length % 5) + 1);
    speakSingleLetter(letter); // Pronounce letter clicked
    setSpellingBuffer((prev) => [...prev, letter]);
    setUsedTileIndices((prev) => [...prev, tileIndex]);
    setMascotMood('thinking');
  };

  // Remove letter from specific slot index
  const handleRemoveSlotLetter = (slotIndex: number) => {
    if (feedbackState !== 'none') return;
    sound.playClick();
    const newBuffer = [...spellingBuffer];
    const newUsedIndices = [...usedTileIndices];

    newBuffer.splice(slotIndex, 1);
    newUsedIndices.splice(slotIndex, 1);

    setSpellingBuffer(newBuffer);
    setUsedTileIndices(newUsedIndices);
  };

  const handleBackspaceSpelling = () => {
    if (spellingBuffer.length === 0 || feedbackState !== 'none') return;
    sound.playClick();
    setSpellingBuffer((prev) => prev.slice(0, -1));
    setUsedTileIndices((prev) => prev.slice(0, -1));
  };

  const handleClearSpelling = () => {
    if (feedbackState !== 'none') return;
    sound.playClick();
    setSpellingBuffer([]);
    setUsedTileIndices([]);
  };

  // 🧩 Helper: evaluate grid navigation path by simulation
  // (Used for LOGIC_SEQUENCE questions that have gridSize/startPos/targetPos fields)
  const evaluateGridPath = (sequenceStr: string, q: QuestionItem): { isCorrect: boolean; reason: string } => {
    if (!q.gridSize || !q.startPos || !q.targetPos) {
      return { isCorrect: false, reason: 'Bukan soal grid navigation.' };
    }
    const [cols, rows] = q.gridSize;
    const [startX, startY] = q.startPos;
    const [targetX, targetY] = q.targetPos;
    const obstacles = q.obstacles || [];

    // Parse the sequence (e.g., "UP, RIGHT, DOWN, RIGHT")
    const directions = sequenceStr
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(s));

    if (directions.length === 0) {
      return { isCorrect: false, reason: 'Tidak ada perintah yang valid.' };
    }

    let x = startX;
    let y = startY;
    for (const dir of directions) {
      const dx = dir === 'LEFT' ? -1 : dir === 'RIGHT' ? 1 : 0;
      const dy = dir === 'UP' ? -1 : dir === 'DOWN' ? 1 : 0;
      const newX = x + dx;
      const newY = y + dy;
      // Check bounds
      if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) {
        return { isCorrect: false, reason: 'Robot keluar dari peta!' };
      }
      // Check obstacle
      if (obstacles.some(([ox, oy]) => ox === newX && oy === newY)) {
        return { isCorrect: false, reason: 'Robot menabrak rintangan!' };
      }
      x = newX;
      y = newY;
    }

    // Check if reached target
    const reached = x === targetX && y === targetY;
    return {
      isCorrect: reached,
      reason: reached
        ? `Hebat! Robot sampai di target dengan ${directions.length} langkah.`
        : `Robot berhenti di (${x},${y}), belum sampai target (${targetX},${targetY}).`,
    };
  };

  // Submit Answer & Evaluate Adaptively
  const handleSubmitAnswer = () => {
    let studentAnswer = '';
    if (currentQ.type === 'SPELLING') {
      studentAnswer = spellingBuffer.join('');
    } else if (currentQ.type === 'LOGIC_SEQUENCE') {
      // Grid navigation questions store the sequence in logicSequence
      studentAnswer = logicSequence.join(', ');
    } else {
      studentAnswer = selectedOption || '';
    }

    if (!studentAnswer) return;

    // Evaluate correctness
    let isCorrect = false;
    let evaluationReason = '';

    // Special case: grid navigation questions — evaluate by simulation, not string match
    const isGridQuestion = currentQ.type === 'LOGIC_SEQUENCE' && !!currentQ.gridSize;
    if (isGridQuestion) {
      const result = evaluateGridPath(studentAnswer, currentQ);
      isCorrect = result.isCorrect;
      evaluationReason = result.reason;
    } else {
      // Standard string comparison for MCQ / SPELLING
      if (typeof currentQ.correctAnswer === 'string') {
        isCorrect = studentAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
      } else if (Array.isArray(currentQ.correctAnswer)) {
        isCorrect = currentQ.correctAnswer.some(
          (ans) => ans.trim().toLowerCase() === studentAnswer.trim().toLowerCase()
        );
      }
      if (!isCorrect && currentQ.acceptedAnswers) {
        isCorrect = currentQ.acceptedAnswers.some(
          (ans) => ans.trim().toLowerCase() === studentAnswer.trim().toLowerCase()
        );
      }
    }

    // ⏱️ Compute real response time (replaces hardcoded 3200ms)
    const responseTimeMs = Date.now() - questionStartTime;

    const logItem: AnswerLog = {
      questionId: currentQ.id,
      isCorrect,
      responseTimeMs,
      hintUsed: hintUsedForCurrent,
    };

    const newLog = [...answersLog, logItem];
    setAnswersLog(newLog);

    // Audio & Mascot response
    if (isCorrect) {
      sound.playCorrect();
      setFeedbackState('correct');
      setMascotMood('happy');
      if (currentQ.subjectCode === 'ENGLISH') {
        setTimeout(() => {
          cheerfulVoice.pronouncePraise('Super! Good job!');
        }, 200);
      }
    } else {
      sound.playIncorrect();
      setFeedbackState('incorrect');
      setMascotMood('thinking');
    }

    // Calculate dynamic adaptive difficulty for next question
    const { nextTier, reason } = AdaptiveEngine.calculateDynamicDifficulty(currentTier, newLog);
    const tierChanged = nextTier !== currentTier;
    setCurrentTier(nextTier);
    setAdaptiveReason(reason);

    // 🔄 If tier changed, regenerate upcoming questions to match the new tier.
    // This makes the adaptive engine TRULY adaptive — students who excel get harder questions,
    // students who struggle get easier ones, in real-time mid-session.
    if (tierChanged && currentIndex + 1 < totalQ) {
      const remaining = totalQ - (currentIndex + 1);
      const freshQuestions = AdaptiveEngine.selectSessionQuestions(
        subjectCode,
        levelNumber,
        remaining,
        nextTier
      );
      if (freshQuestions.length > 0) {
        setAllQuestions((prev) => {
          const answered = prev.slice(0, currentIndex + 1);
          return [...answered, ...freshQuestions];
        });
      }
    }

    // Auto-advance after brief educational feedback
    setTimeout(() => {
      if (currentIndex + 1 < totalQ) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Conclude session
        const result = AdaptiveEngine.evaluateSession(
          `sess_${Date.now()}`,
          studentId,
          subjectCode,
          levelNumber,
          newLog
        );
        onComplete(result);
      }
    }, isCorrect ? 1400 : 2200);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-screen px-4 py-6 flex flex-col justify-between text-white select-none">
      {/* HEADER HUD */}
      <header className="flex items-center justify-between backdrop-blur-md bg-white/10 px-5 py-3 rounded-2xl border border-white/15">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            title="Keluar dari sesi"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              Level {levelNumber} · {currentQ.competencyName}
            </span>
            <h1 className="text-sm sm:text-base font-bold">
              Soal {currentIndex + 1} dari {totalQ}
            </h1>
          </div>
        </div>

        {/* Dynamic Difficulty Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              currentTier === 'HARD'
                ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                : currentTier === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
            }`}
          >
            <span>Tingkat: {currentTier === 'HARD' ? 'Tantangan' : currentTier === 'MEDIUM' ? 'Sedang' : 'Mudah'}</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setShowHint(!showHint);
              setHintUsedForCurrent(true);
            }}
            className={`p-2 rounded-xl border transition-all ${
              showHint
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/15'
            }`}
            title="Minta Petunjuk"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* QUESTION MAIN STAGE */}
      <main className="my-auto py-6 flex flex-col items-center">
        {/* Mascot & Prompt Lockup */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 w-full justify-center">
          {/* Official 3D Animated Bela Mascot */}
          <div className="shrink-0 flex justify-center">
            <MascotBelaVideo
              size={135}
              interactive={true}
              speechText={
                mascotMood === 'happy'
                  ? 'Keren banget! 🎉'
                  : mascotMood === 'thinking'
                  ? 'Ayo coba lagi ya! ✨'
                  : null
              }
              showAudioControl={false}
            />
          </div>

          {/* Question Speech Card */}
          <div className="relative bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/20 shadow-xl max-w-xl w-full">
            <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {currentQ.prompt}
            </p>
            {currentQ.promptSubtitle && (
              <p className="text-xl sm:text-2xl mt-2 font-mono text-amber-300 text-center font-bold">
                {currentQ.promptSubtitle}
              </p>
            )}

            {/* Hint Box if toggled */}
            {showHint && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-2 animate-fadeIn">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Petunjuk Bela: </span>
                  <span>{currentQ.hint}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE INPUT ZONE BASED ON TYPE */}
        <div className="w-full max-w-xl">
          {/* 1. SPELLING MODE (Spell Master) */}
          {currentQ.type === 'SPELLING' && (() => {
            const targetWord = typeof currentQ.correctAnswer === 'string' ? currentQ.correctAnswer : '';
            const targetLength = targetWord.length || currentQ.options?.length || 4;

            return (
              <div className="flex flex-col items-center gap-4">
                {/* Audio Pronunciation Button for English Spelling */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakEnglishSpelled()}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500/25 to-indigo-500/25 hover:from-sky-500/40 hover:to-indigo-500/40 text-sky-200 border border-sky-400/40 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                    title="Dengarkan ejaan kata per huruf dalam bahasa Inggris"
                  >
                    <Volume2 className="w-4 h-4 text-sky-300 animate-pulse" />
                    <span>🔊 Eja Kata per Huruf ({targetWord.split('').join(' - ')})</span>
                  </button>
                  <span className="text-[11px] text-white/50 hidden sm:inline">
                    · Bisa ketik langsung di keyboard ⌨️
                  </span>
                </div>

                {/* Fixed Interactive Target Slots Display */}
                <div className="flex items-center gap-2 sm:gap-2.5 p-3.5 bg-slate-900/90 rounded-2xl border-2 border-sky-400/30 min-h-[64px] justify-center shadow-inner">
                  {Array.from({ length: targetLength }).map((_, idx) => {
                    const char = spellingBuffer[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!char || feedbackState !== 'none'}
                        onClick={() => handleRemoveSlotLetter(idx)}
                        title={char ? 'Klik untuk menghapus huruf ini' : `Slot ke-${idx + 1}`}
                        className={`w-11 h-12 sm:w-13 sm:h-14 rounded-xl font-mono font-black text-xl sm:text-2xl flex items-center justify-center transition-all ${
                          char
                            ? 'bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md shadow-sky-500/30 border border-white cursor-pointer active:scale-90 hover:opacity-85'
                            : 'border-2 border-dashed border-white/25 bg-white/5 text-white/20'
                        }`}
                      >
                        {char || (idx + 1)}
                      </button>
                    );
                  })}
                </div>

                {/* Letter Tiles Pool */}
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <span className="text-[11px] text-white/60 font-medium">Pilih huruf dari kotak di bawah:</span>
                  <div className="flex flex-wrap gap-2.5 justify-center max-w-md">
                    {currentQ.options?.map((letter, idx) => {
                      const isUsed = usedTileIndices.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isUsed || feedbackState !== 'none'}
                          onClick={() => handleTileClick(letter, idx)}
                          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl font-mono font-extrabold text-lg sm:text-xl transition-all shadow-md flex items-center justify-center ${
                            isUsed
                              ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed scale-90 opacity-40'
                              : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-sky-300 active:scale-95 cursor-pointer hover:shadow-sky-400/20'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Utility Clear / Backspace */}
                <div className="flex items-center gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={handleBackspaceSpelling}
                    disabled={spellingBuffer.length === 0 || feedbackState !== 'none'}
                    className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white/80 font-medium transition-colors border border-white/15 disabled:opacity-40 cursor-pointer"
                  >
                    Hapus Huruf Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSpelling}
                    disabled={spellingBuffer.length === 0 || feedbackState !== 'none'}
                    className="px-4 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-xs text-rose-300 font-medium transition-colors border border-rose-400/25 disabled:opacity-40 cursor-pointer"
                  >
                    Reset Semua Huruf
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 2. MULTIPLE CHOICE & MATH MANIPULATIVE */}
          {(currentQ.type === 'MULTIPLE_CHOICE' ||
            currentQ.type === 'MATH_MANIPULATIVE') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={idx}
                    disabled={feedbackState !== 'none'}
                    onClick={() => {
                      sound.playClick();
                      setSelectedOption(opt);
                      setMascotMood('thinking');
                    }}
                    className={`p-4 rounded-2xl text-left font-medium text-sm sm:text-base transition-all duration-150 flex items-center justify-between border cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold border-amber-300 shadow-lg shadow-orange-500/30'
                        : 'bg-slate-900/70 hover:bg-slate-800 text-white border-white/15 hover:border-white/30'
                    }`}
                  >
                    <span>{opt}</span>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border ${
                        isSelected
                          ? 'border-slate-950 bg-slate-950/20 text-slate-950 font-bold'
                          : 'border-white/20 text-white/50'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. LOGIC GRID NAVIGATION (interactive) */}
          {currentQ.type === 'LOGIC_SEQUENCE' && currentQ.gridSize && (
            <LogicGridNav
              question={currentQ}
              onAnswer={(seq) => {
                setLogicSequence(seq);
                setMascotMood('thinking');
              }}
              disabled={feedbackState !== 'none'}
              feedbackState={feedbackState}
            />
          )}
        </div>

        {/* FEEDBACK OVERLAY BANNER */}
        {feedbackState !== 'none' && (
          <div
            className={`mt-6 p-4 rounded-2xl border flex items-center gap-3 w-full max-w-xl animate-fadeIn ${
              feedbackState === 'correct'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
            }`}
          >
            {feedbackState === 'correct' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div className="text-xs sm:text-sm">
              <p className="font-bold">
                {feedbackState === 'correct' ? 'Tepat Sekali! Hebat!' : 'Belum Tepat, Semangat!'}
              </p>
              <p className="text-white/80 mt-0.5">{currentQ.explanation}</p>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER ACTIONS */}
      <footer className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-[11px] text-white/60 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Mesin Adaptif: {adaptiveReason}</span>
        </div>

        <button
          disabled={
            feedbackState !== 'none' ||
            (currentQ.type === 'SPELLING'
              ? spellingBuffer.length === 0
              : currentQ.type === 'LOGIC_SEQUENCE' && currentQ.gridSize
              ? logicSequence.length === 0
              : !selectedOption)
          }
          onClick={handleSubmitAnswer}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          <span>Kirim Jawaban</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
