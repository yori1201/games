import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { StudentProfile, StudentLevelProgress, SubjectCode } from '../../types/game';
import { triggerMilestoneConfetti, triggerHighScoreConfetti } from '../../lib/confetti';
import { SUBJECT_INFO } from '../../lib/curriculum-data';
import { sound } from '../../lib/audio';
import { MascotBelaVideo } from '../mascot/MascotBelaVideo';
import { ThemeSongWidget } from '../audio/ThemeSongWidget';
import {
  Star,
  Zap,
  Flame,
  Play,
  Compass,
  LogOut,
  Sparkles,
  BookOpen,
  Check,
  Gift,
  Lock,
  MessageCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { claimDailyStreak } from '../../lib/data-service';

interface StudentDashboardProps {
  student: StudentProfile;
  progressList: StudentLevelProgress[];
  onSelectSubject: (subjectCode: SubjectCode) => void;
  onOpenPlacementTest: () => void;
  onLogout: () => void;
  onUpdateStudent?: (updated: StudentProfile) => void;
}

const STREAK_REWARDS = [
  { day: 1, xp: 15, label: 'Hari 1', icon: '🌱' },
  { day: 2, xp: 25, label: 'Hari 2', icon: '🌿' },
  { day: 3, xp: 35, label: 'Hari 3', icon: '🍀' },
  { day: 4, xp: 45, label: 'Hari 4', icon: '🍎' },
  { day: 5, xp: 60, label: 'Hari 5', icon: '⭐' },
  { day: 6, xp: 75, label: 'Hari 6', icon: '🏆' },
  { day: 7, xp: 120, label: 'Hari 7', icon: '🌟', badge: 'Tunas Emas' },
];

const BELA_QUOTES = [
  'Ayo taklukkan misi belajar hari ini bersamaku!',
  'Streak belajarmu keren banget! Jangan sampai terputus ya! 🔥',
  'Setiap soal yang kamu kerjakan membuatmu semakin cerdas!',
  'Kamu bisa memutar tubuhku 360 derajat lho! Coba geser!',
  'Latihan konsisten setiap hari adalah kunci kesuksesan!',
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  progressList,
  onSelectSubject,
  onOpenPlacementTest,
  onLogout,
  onUpdateStudent,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimToast, setClaimToast] = useState<{ bonusXP: number; day: number } | null>(null);

  // 3D Bela Mascot interactive mood & speech state
  const [belaMood, setBelaMood] = useState<'idle' | 'happy' | 'xp_reward'>('idle');
  const [belaSpeech, setBelaSpeech] = useState<string>(
    'Halo! Aku Bela si Tunas Cerdas. Sentuh aku untuk menyapa!'
  );
  const [isTalking, setIsTalking] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const isClaimedToday = student.lastStreakClaimDate === todayStr;

  // Current day in 7-day cycle
  const currentStreak = student.streak || 1;
  const currentCycleDay = isClaimedToday
    ? ((currentStreak - 1) % 7) + 1
    : (currentStreak % 7) + 1;

  // Calculate stats per subject
  const getSubjectStats = (subject: SubjectCode) => {
    const list = progressList.filter((p) => p.subjectCode === subject);
    const masteredCount = list.filter((p) => p.status === 'MASTERED').length;
    const totalStars = list.reduce((acc, p) => acc + (p.stars || 0), 0);
    const pct = Math.min(100, Math.round((masteredCount / 10) * 100));
    return { masteredCount, totalStars, pct };
  };

  // Claim Streak Reward -> Triggers 3D Bela Celebration & XP reaction!
  const handleClaimStreak = async () => {
    if (isClaimedToday || isClaiming) return;
    setIsClaiming(true);
    sound.playStarPop(2);

    try {
      const data = await claimDailyStreak(student.id);

      if (data.student && onUpdateStudent) {
        onUpdateStudent(data.student);
      }
      setClaimToast({ bonusXP: data.bonusXP, day: data.cycleDay });

      // Trigger Exuberant 3D Bela XP Celebration Reaction!
      setBelaMood('xp_reward');
      setBelaSpeech(`Hore! Kamu dapat +${data.bonusXP} XP bonus streak! Hebat sekali! 🎉`);
      setIsTalking(true);

      sound.playVictoryFanfare();

      // Satisfying Confetti for milestone or streak reward
      if (data.cycleDay === 7 || data.cycleDay === 3) {
        triggerHighScoreConfetti();
      } else {
        triggerMilestoneConfetti();
      }

      // Reset Bela back to idle after celebration
      setTimeout(() => {
        setClaimToast(null);
        setBelaMood('idle');
        setIsTalking(false);
      }, 4500);
    } catch (err) {
      console.error('Failed to claim streak', err);
    } finally {
      setIsClaiming(false);
    }
  };

  // When student taps / interacts with 3D Bela directly
  const handleInteractWithBela = () => {
    sound.playClick();
    const randomQuote = BELA_QUOTES[Math.floor(Math.random() * BELA_QUOTES.length)];
    setBelaMood('happy');
    setBelaSpeech(randomQuote);
    setIsTalking(true);

    setTimeout(() => {
      setBelaMood('idle');
    }, 2800);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 text-white select-none">
      {/* TOP BAR / USER GREETING */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/15 shadow-xl">
        <div className="flex items-center gap-3.5">
          {/* Interactive 3D Bela Mascot Companion */}
          <div className="relative shrink-0">
            <MascotBelaVideo
              size={92}
              speechText={isTalking ? belaSpeech : null}
              interactive={true}
              onTap={handleInteractWithBela}
              showAudioControl={false}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                RUMBELA GAMES
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Halo, {student.displayName}!
            </h1>
            <p className="text-xs text-white/70 mt-0.5">
              Klik Bela untuk menyapa atau klaim streak harianmu di bawah!
            </p>
          </div>
        </div>

        {/* METERS: STREAK, STARS, XP */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Streak Counter Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-400/40 text-orange-400 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 fill-orange-400 animate-pulse" />
            <span className="font-mono">{student.streak || 1} Hari Streak</span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-mono">{student.stars || 0}</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
            <Zap className="w-4 h-4 fill-cyan-400 text-cyan-400" />
            <span className="font-mono">{student.xp || 0} XP</span>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              sound.playClick();
              onLogout();
            }}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors border border-white/15 cursor-pointer"
            title="Keluar Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DAILY STREAK REWARDS CARD (Triggers 3D Bela XP Reaction) */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 border border-white/20 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shadow">
              <Flame className="w-6 h-6 fill-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Hadiah Login Harian (Streak Tracker)
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                  {currentStreak} Hari Beruntun 🔥
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Login setiap hari untuk mendapatkan bonus XP dan melihat reaksi perayaan Bela 3D!
              </p>
            </div>
          </div>

          {/* Claim Button / Status */}
          <div>
            {!isClaimedToday ? (
              <button
                onClick={handleClaimStreak}
                disabled={isClaiming}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Gift className="w-4 h-4" />
                <span>Klaim Bonus Hari Ini!</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Bonus Hari Ini Sudah Diklaim</span>
              </div>
            )}
          </div>
        </div>

        {/* 7-DAY REWARD CARDS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
          {STREAK_REWARDS.map((rew) => {
            const isCompleted = isClaimedToday
              ? rew.day <= currentCycleDay
              : rew.day < currentCycleDay;
            const isToday = isClaimedToday
              ? rew.day === currentCycleDay
              : rew.day === currentCycleDay;

            return (
              <div
                key={rew.day}
                className={`relative rounded-2xl p-3 border flex flex-col items-center justify-between text-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                    : isToday && !isClaimedToday
                    ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20 text-white scale-102 ring-2 ring-amber-400/50'
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}
              >
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
                  {rew.label}
                </span>

                <div className="my-1.5 text-2xl select-none">
                  {rew.icon}
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-black font-mono text-amber-300">
                    +{rew.xp} XP
                  </span>

                  {isCompleted ? (
                    <span className="mt-1 flex items-center gap-0.5 text-[9px] font-bold text-emerald-400">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Klaim</span>
                    </span>
                  ) : isToday && !isClaimedToday ? (
                    <span className="mt-1 text-[9px] font-bold text-amber-300 animate-pulse">
                      Hari Ini!
                    </span>
                  ) : (
                    <span className="mt-1 text-[9px] text-white/40 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Kunci</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* OFFICIAL THEME SONG JUKEBOX CARD */}
      <ThemeSongWidget variant="card" />

      {/* 3 GAME SUBJECT CARDS (Matematika, English, Coding/Logic) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">Pilih Dunia Pembelajaran</h3>
            <span className="text-xs text-white/60">· 3 Modul Adaptif</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenPlacementTest();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-xs sm:text-sm font-bold border border-indigo-400/30 text-indigo-200 transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <Compass className="w-4 h-4 text-amber-300" />
            <span>Tes Penempatan Level (5 Soal)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['MATH', 'ENGLISH', 'LOGIC'] as SubjectCode[]).map((subj) => {
            const info = SUBJECT_INFO[subj];
            const stats = getSubjectStats(subj);

            return (
              <div
                key={subj}
                className="group relative bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-white/15 hover:border-white/30 transition-all duration-300 shadow-xl flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15">
                      {info.badge}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      <span>{stats.totalStars} / 30</span>
                    </div>
                  </div>

                  <h4 className="text-xl font-extrabold text-white mb-1.5">
                    {info.name}
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed mb-6">
                    {info.description}
                  </p>
                </div>

                {/* Progress Bar & CTA */}
                <div>
                  <div className="flex items-center justify-between text-xs text-white/80 font-medium mb-1.5">
                    <span>Kemajuan Level</span>
                    <span className="font-mono">{stats.masteredCount} / 10 Mastered</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-5">
                    <div
                      className={`h-full bg-gradient-to-r ${info.color} transition-all duration-500`}
                      style={{ width: `${stats.pct}%` }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onSelectSubject(subj);
                    }}
                    className={`w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 bg-gradient-to-r ${info.color} text-slate-950 shadow-lg transition-transform active:scale-95 cursor-pointer`}
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Jelajahi Peta Level</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
