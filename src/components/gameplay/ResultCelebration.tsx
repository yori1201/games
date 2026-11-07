import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SessionResult } from '../../types/game';
import { sound } from '../../lib/audio';
import { MascotBelaVideo } from '../mascot/MascotBelaVideo';
import { triggerHighScoreConfetti, triggerVictoryConfetti, triggerMilestoneConfetti } from '../../lib/confetti';
import { Check, Star, Zap, RotateCcw, ArrowRight, Trophy, Sparkles } from 'lucide-react';

interface ResultCelebrationProps {
  result: SessionResult;
  onContinue: () => void;
  onRetry: () => void;
}

export const ResultCelebration: React.FC<ResultCelebrationProps> = ({
  result,
  onContinue,
  onRetry,
}) => {
  const isMastered = result.decision === 'LEVEL_MASTERED';
  const isPerfectScore = result.correctAnswers === result.totalQuestions && result.totalQuestions > 0;
  const isHighScore = result.starsEarned === 3 || isPerfectScore;

  useEffect(() => {
    // Sound & celebratory particle confetti blast
    sound.playVictoryFanfare();

    if (isHighScore) {
      // Satisfying dual-side cannon confetti for High Score milestone!
      triggerHighScoreConfetti();
    } else if (isMastered) {
      triggerVictoryConfetti();
    } else {
      triggerMilestoneConfetti();
    }
  }, [isHighScore, isMastered]);

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-screen px-4 py-8 flex flex-col items-center justify-center text-white select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* RESULT MODAL CARD (Matching Screenshot 3) */}
      <div className="relative z-10 w-full max-w-2xl bg-gradient-to-b from-blue-400/90 to-indigo-600/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-4 border-blue-300 shadow-2xl flex flex-col items-center">
        {/* Satisfying High Score / Milestone Badge */}
        {isHighScore && (
          <div className="mb-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-400/40 animate-bounce">
            <Trophy className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>🏆 MILESTONE REKOR: SKOR SEMPURNA! ⭐</span>
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center drop-shadow-md">
          Good job!
        </h1>
        <p className="text-sm sm:text-base text-blue-100 mt-1 font-medium text-center">
          Here are your results:
        </p>

        {/* 3 Animated Smiling Stars (Screenshot 3 Reference) */}
        <div className="flex items-center justify-center gap-4 my-6">
          {[1, 2, 3].map((starNum) => {
            const hasStar = starNum <= result.starsEarned;
            return (
              <div
                key={starNum}
                className={`relative flex flex-col items-center transition-transform duration-300 ${
                  hasStar ? 'scale-110 animate-bounce' : 'opacity-40 grayscale'
                }`}
                style={{ animationDelay: `${starNum * 150}ms` }}
              >
                {/* Smiling Star Icon with Face */}
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full flex items-center justify-center bg-gradient-to-b from-amber-300 to-yellow-500 shadow-lg border-2 border-amber-200">
                  <span className="text-3xl sm:text-4xl select-none">
                    {starNum === 1 ? '😊' : starNum === 2 ? '🥰' : '🤩'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* STATS STRIP: Checkmark Score & Stars (Matching Screenshot 3) */}
        <div className="flex items-center justify-center gap-8 bg-blue-500/40 px-6 py-3 rounded-2xl border border-white/20 my-2">
          {/* Green Checkmark Score (10 / 10) */}
          <div className="flex items-center gap-2 text-lg sm:text-xl font-black text-white">
            <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm">
              <Check className="w-4 h-4 stroke-[3]" />
            </span>
            <span className="font-mono">
              {result.correctAnswers} / {result.totalQuestions}
            </span>
          </div>

          {/* Star Counter */}
          <div className="flex items-center gap-2 text-lg sm:text-xl font-black text-white">
            <Star className="w-6 h-6 fill-amber-300 text-amber-300" />
            <span className="font-mono">{result.starsEarned}</span>
          </div>

          {/* XP Ledger */}
          <div className="flex items-center gap-2 text-lg sm:text-xl font-black text-amber-300">
            <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
            <span className="font-mono">+{result.xpEarned} XP</span>
          </div>
        </div>

        {/* ADAPTIVE REASONING & DECISION FEEDBACK */}
        <div className="mt-4 text-center max-w-md">
          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-1.5 ${
              isMastered
                ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                : 'bg-amber-500/30 text-amber-200 border-amber-400'
            }`}
          >
            {isMastered ? 'MASTERED · LEVEL TERLALUI' : 'PERLU LATIHAN PENGUATAN'}
          </span>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-medium">
            {result.decisionReason}
          </p>
        </div>

        {/* ACTION BUTTONS (Screenshot 3: Cute Blue Button with Character Ear Badge) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full max-w-md justify-center">
          <button
            onClick={() => {
              sound.playClick();
              onRetry();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all border border-white/20 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulangi Level</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onContinue();
            }}
            className="relative w-full sm:w-auto flex-1 px-6 py-3 rounded-2xl bg-gradient-to-b from-sky-300 to-blue-600 hover:from-sky-200 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl border-2 border-white transition-all active:scale-95 cursor-pointer"
          >
            {/* Cute bear badge on button matching Screenshot 3 */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base select-none">
              🐹
            </span>
            <span>Lanjut Petualangan</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Official 3D Animated Bela Celebration Video */}
      <div className="mt-5 flex flex-col items-center justify-center animate-fadeIn">
        <MascotBelaVideo
          size={160}
          speechText={isMastered ? 'Hore! Kamu hebat sekali!' : 'Kerja bagus! Ayo terus berlatih!'}
          interactive={true}
          showAudioControl={true}
        />
        <span className="text-[11px] text-white/60 mt-1.5 font-medium">
          Sentuh Bela untuk memutar ulang perayaan ⭐
        </span>
      </div>
    </div>
  );
};
