import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHighScoreConfetti } from '../../lib/confetti';
import { sound } from '../../lib/audio';
import { Sparkles, Trophy, ArrowRight, Zap, Star } from 'lucide-react';
import { SubjectCode } from '../../types/game';
import { SUBJECT_INFO } from '../../lib/curriculum-data';

interface CinematicLevelUpTransitionProps {
  unlockedLevelNumber: number;
  subjectCode: SubjectCode;
  xpEarned: number;
  starsEarned: number;
  onComplete: () => void;
}

export const CinematicLevelUpTransition: React.FC<CinematicLevelUpTransitionProps> = ({
  unlockedLevelNumber,
  subjectCode,
  xpEarned,
  starsEarned,
  onComplete,
}) => {
  const subjectMeta = SUBJECT_INFO[subjectCode];

  useEffect(() => {
    // Sound & multi-stage high score confetti
    sound.playVictoryFanfare();
    triggerHighScoreConfetti();

    // Additional wave after 1.2s for maximum satisfaction
    const timer = setTimeout(() => {
      triggerHighScoreConfetti();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-slate-950/95 backdrop-blur-xl select-none"
      >
        {/* Cinematic Letterbox Top Bar */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          className="absolute top-0 left-0 right-0 h-14 sm:h-20 bg-black/90 border-b border-amber-400/20 z-40 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-2 text-amber-300 font-mono text-xs sm:text-sm font-bold tracking-widest">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>RUMBELA GAMES · SPECIAL MILESTONE</span>
          </div>
          <span className="text-[11px] font-mono text-white/50 tracking-wider">
            CINEMATIC VICTORY MOMENT
          </span>
        </motion.div>

        {/* Cinematic Letterbox Bottom Bar */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          className="absolute bottom-0 left-0 right-0 h-14 sm:h-20 bg-black/90 border-t border-amber-400/20 z-40 flex items-center justify-center px-6"
        >
          <p className="text-xs text-white/60 tracking-wider text-center">
            Pencapaian baru berhasil dibuka di Pulau Petualangan Belajar!
          </p>
        </motion.div>

        {/* Ambient Radial Golden Sunburst Ray */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[800px] h-[800px] rounded-full pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300 via-orange-500 to-transparent blur-2xl"
        />

        {/* Centered Golden Aura Glow */}
        <div className="absolute w-96 h-96 rounded-full bg-amber-400/25 blur-3xl pointer-events-none animate-pulse" />

        {/* MAIN CINEMATIC HERO STAGE */}
        <div className="relative z-30 flex flex-col items-center max-w-xl mx-auto px-4 text-center">
          {/* Top Badge: Level Up Announcement */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.15 }}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-2xl shadow-amber-500/50 mb-3"
          >
            <Trophy className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>🎉 NAIK LEVEL BARU! · LEVEL UP! 🎉</span>
          </motion.div>

          {/* Celebratory Transparent Bela Mascot (Jumping & Leaping with Framer Motion) */}
          <motion.div
            initial={{ y: 160, scale: 0.4, opacity: 0 }}
            animate={{
              y: [0, -18, 0],
              scale: 1,
              opacity: 1,
              rotate: [0, -2, 2, 0],
            }}
            transition={{
              y: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' },
              rotate: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
              scale: { type: 'spring', damping: 12, stiffness: 150, delay: 0.25 },
              opacity: { duration: 0.4, delay: 0.2 },
            }}
            className="relative my-2 select-none"
          >
            {/* Mascot Speech Bubble */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.65, type: 'spring', stiffness: 220 }}
              className="absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-950 font-black text-xs sm:text-sm px-4 py-2 rounded-2xl shadow-2xl border-2 border-amber-400 z-30 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Horeee! Kamu berhasil naik level! Hebat sekali! ⭐</span>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
            </motion.div>

            {/* 100% Transparent Mascot Bela Image */}
            <img
              src="/assets/aistudio/MASKOT_RUMBELA_BG_6356fdb1.png"
              alt="Maskot Bela Merayakan Naik Level"
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] pointer-events-none"
            />
          </motion.div>

          {/* Glowing Milestone Heading */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.45 }}
            className="mt-1 mb-3"
          >
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 drop-shadow-[0_4px_16px_rgba(251,191,36,0.4)]">
              LEVEL {unlockedLevelNumber}
            </h1>
            <p className="text-sm sm:text-base font-extrabold text-cyan-200 mt-1">
              Telur Petualangan {subjectMeta?.name || 'Materi'} Terbuka! 🥚✨
            </p>
          </motion.div>

          {/* Reward Badges (XP & Stars) */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="flex items-center gap-4 bg-slate-900/80 border border-white/20 px-6 py-3 rounded-2xl shadow-xl backdrop-blur-md mb-6"
          >
            <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-sm sm:text-base">
              <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>+{starsEarned} Bintang</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-1.5 text-cyan-300 font-extrabold text-sm sm:text-base">
              <Zap className="w-5 h-5 fill-cyan-400 text-cyan-400" />
              <span>+{xpEarned} XP Petualang</span>
            </div>
          </motion.div>

          {/* Main Call to Action: Continue into Map */}
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.85, type: 'spring', stiffness: 200 }}
            onClick={() => {
              sound.playClick();
              onComplete();
            }}
            className="group relative px-8 py-4 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-base sm:text-lg shadow-2xl shadow-amber-400/40 flex items-center gap-3 cursor-pointer border-2 border-white/50 active:scale-95 transition-all"
          >
            <span>Buka Peta Petualangan</span>
            <ArrowRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
