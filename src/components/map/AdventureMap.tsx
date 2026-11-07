import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SubjectCode, StudentLevelProgress, StudentProfile } from '../../types/game';
import { triggerMilestoneConfetti, triggerHighScoreConfetti } from '../../lib/confetti';
import { LEVEL_DEFINITIONS, SUBJECT_INFO } from '../../lib/curriculum-data';
import { sound } from '../../lib/audio';
import { EggLevelNode3D } from './EggLevelNode3D';
import { Star, Zap, Sun, Moon, ArrowLeft, Award, Sparkles, X } from 'lucide-react';

interface AdventureMapProps {
  student: StudentProfile;
  subjectCode: SubjectCode;
  progressList: StudentLevelProgress[];
  newlyUnlockedLevelNumber?: number | null;
  onSelectLevel: (levelNumber: number) => void;
  onBackToDashboard: () => void;
  onClearUnlockedLevel?: () => void;
}

// Coordinates calibrated specifically for the vibrant Day Adventure Island & Enchanted Night maps
const DAY_MAP_COORDS: Record<number, { x: number; y: number }> = {
  1: { x: 18, y: 78 }, // Pintu Masuk Dermaga Pantai
  2: { x: 26, y: 71 }, // Jalur Bebatuan Awal
  3: { x: 33, y: 62 }, // Dekat Kincir Angin & Rumah Jamur
  4: { x: 42, y: 68 }, // Sebelum Jembatan Kayu
  5: { x: 55, y: 70 }, // Pasar Buah Pulau Tropis
  6: { x: 67, y: 67 }, // Di Bawah Pohon Apel Manis
  7: { x: 79, y: 56 }, // Lereng Rumah Jamur Warna-Warni
  8: { x: 67, y: 45 }, // Menyeberangi Jembatan Air Terjun
  9: { x: 53, y: 39 }, // Bukit Pohon Buah Pir
  10: { x: 75, y: 22 }, // Puncak Istana Kerajaan RUMBELA
};

const NIGHT_MAP_COORDS: Record<number, { x: number; y: number }> = {
  1: { x: 16, y: 78 }, // Desa Lampu Bintang
  2: { x: 26, y: 65 }, // Jalur Hutan Berkilau
  3: { x: 26, y: 46 }, // Lingkaran Jamur Neon Biru
  4: { x: 37, y: 39 }, // Menara Cahaya Malam
  5: { x: 41, y: 67 }, // Lembah Jamur Ungu Bersinar
  6: { x: 50, y: 53 }, // Jembatan Kuno Danau Bintang
  7: { x: 62, y: 44 }, // Pulau Magis Tengah Danau
  8: { x: 70, y: 68 }, // Jembatan Busur Kembar
  9: { x: 82, y: 53 }, // Jalur Reruntuhan Kuno
  10: { x: 87, y: 24 }, // Benteng Megah Puncak Bintang
};

export const AdventureMap: React.FC<AdventureMapProps> = ({
  student,
  subjectCode,
  progressList,
  newlyUnlockedLevelNumber = null,
  onSelectLevel,
  onBackToDashboard,
  onClearUnlockedLevel,
}) => {
  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');
  const levels = LEVEL_DEFINITIONS[subjectCode] || [];
  const subjectMeta = SUBJECT_INFO[subjectCode];

  const coordsMap = themeMode === 'day' ? DAY_MAP_COORDS : NIGHT_MAP_COORDS;

  // Trigger celebration particle effect and audio fanfare when new level is unlocked
  useEffect(() => {
    if (newlyUnlockedLevelNumber && newlyUnlockedLevelNumber > 1) {
      sound.playVictoryFanfare();

      const coords = coordsMap[newlyUnlockedLevelNumber] || { x: 50, y: 50 };

      // Milestone celebratory particle confetti burst
      if (newlyUnlockedLevelNumber === 10) {
        triggerHighScoreConfetti();
      } else {
        triggerMilestoneConfetti({
          origin: { x: coords.x / 100, y: Math.max(0.15, coords.y / 100) },
        });
      }
    }
  }, [newlyUnlockedLevelNumber]);

  // Helper to get progress for a specific level
  const getLevelProgress = (lvlNum: number) => {
    return progressList.find((p) => p.levelNumber === lvlNum && p.subjectCode === subjectCode);
  };

  // Level 1 is always unlocked; subsequent levels require previous level mastered or available
  const isLevelUnlocked = (lvlNum: number) => {
    if (lvlNum === 1) return true;
    const prev = getLevelProgress(lvlNum - 1);
    if (prev && (prev.status === 'MASTERED' || prev.status === 'AVAILABLE')) return true;
    const current = getLevelProgress(lvlNum);
    return current?.status === 'AVAILABLE' || current?.status === 'MASTERED' || current?.status === 'IN_PROGRESS';
  };

  const totalStars = progressList
    .filter((p) => p.subjectCode === subjectCode)
    .reduce((acc, curr) => acc + (curr.stars || 0), 0);

  const maxStars = levels.length * 3;

  // Active high-definition map background image
  const mapBgImage =
    themeMode === 'day'
      ? '/assets/maps/adventure_island_day.jpg'
      : '/assets/maps/adventure_island_night.jpg';

  return (
    <div
      className={`relative w-full min-h-screen overflow-hidden flex flex-col transition-colors duration-500 select-none ${
        themeMode === 'night'
          ? 'bg-slate-950 text-white'
          : 'bg-emerald-900 text-slate-900'
      }`}
    >
      {/* TOP HEADER HUD (Matching Screenshot 1 & 2) */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 backdrop-blur-md bg-black/40 border-b border-white/15 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBackToDashboard();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 transition-all border border-white/15"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Subject Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>{subjectMeta.name}</span>
          </div>
        </div>

        {/* Meters: Stars, Energy, Day/Night Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Star Counter Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-mono">{totalStars} / {maxStars}</span>
          </div>

          {/* Energy Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
            <Zap className="w-4 h-4 fill-cyan-400 text-cyan-400" />
            <span className="font-mono">140 / 140</span>
          </div>

          {/* Theme Toggle (Siang / Malam) */}
          <button
            onClick={() => {
              sound.playClick();
              setThemeMode(themeMode === 'night' ? 'day' : 'night');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all bg-white/15 hover:bg-white/25 border border-white/25 cursor-pointer"
            title="Ganti tema peta: Siang / Malam"
          >
            {themeMode === 'night' ? (
              <>
                <Sun className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Tema Siang</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-300" />
                <span className="hidden sm:inline">Tema Malam</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* MAP CANVAS VIEWPORT */}
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col justify-center">
        {/* Newly Unlocked Level Celebratory Banner */}
        {newlyUnlockedLevelNumber && (
          <div className="mb-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-between shadow-2xl border-2 border-white animate-bounce z-40">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <span>HORE! LEVEL {newlyUnlockedLevelNumber} BERHASIL DIBUKA! Telur baru siap dijelajahi!</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectLevel(newlyUnlockedLevelNumber);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-amber-300 hover:text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Mulai Level 🚀
              </button>
              {onClearUnlockedLevel && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onClearUnlockedLevel();
                  }}
                  className="p-1 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 cursor-pointer"
                  title="Tutup Notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Title & prompt */}
        <div className="flex items-center justify-between mb-3 px-2 z-10 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h2 className="text-sm sm:text-base font-bold drop-shadow">
              Peta Level {subjectMeta.name} · {student.gradeCode.replace('_', ' ')}
            </h2>
          </div>
          <span className="text-[11px] text-white/70 bg-black/30 px-3 py-1 rounded-full border border-white/10">
            Klik Telur 3D untuk Mulai Level
          </span>
        </div>

        {/* MAP CONTAINER WITH ACTUAL ILLUSTRATION BACKGROUND */}
        <div className="relative w-full aspect-[16/9] min-h-[380px] max-h-[640px] rounded-3xl overflow-hidden border-2 border-white/25 shadow-2xl bg-black">
          {/* Map Illustration Background Image */}
          <img
            src={mapBgImage}
            alt="Peta Petualangan Rumbela"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500"
          />

          {/* Subtle Ambient Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

          {/* "RUMBELA GAMES" Map Badge */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-2xl bg-slate-900/90 text-white font-black text-xs sm:text-sm shadow-xl border border-white/30 pointer-events-none z-10 flex items-center gap-2 backdrop-blur-md">
            <span className="text-amber-400">RUMBELA GAMES</span>
            <span className="text-white/40">·</span>
            <span>{themeMode === 'day' ? 'Pulau Petualangan (Map 1)' : 'Jalur Bintang Malam (Map 2)'}</span>
          </div>

          {/* 3D EGG LEVEL NODES (1 to 10) */}
          {levels.map((lvl) => {
            const progress = getLevelProgress(lvl.levelNumber);
            const unlocked = isLevelUnlocked(lvl.levelNumber);
            const isMastered = progress?.status === 'MASTERED';
            const stars = progress?.stars || 0;
            const coords = coordsMap[lvl.levelNumber] || { x: lvl.mapX, y: lvl.mapY };
            const isNewlyUnlocked = newlyUnlockedLevelNumber === lvl.levelNumber;

            return (
              <div
                key={lvl.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                style={{
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                }}
              >
                <EggLevelNode3D
                  levelNumber={lvl.levelNumber}
                  title={lvl.title}
                  description={lvl.description}
                  stars={stars}
                  unlocked={unlocked}
                  isMastered={isMastered}
                  themeMode={themeMode}
                  isNewlyUnlocked={isNewlyUnlocked}
                  onClick={() => {
                    if (unlocked) {
                      sound.playClick();
                      onSelectLevel(lvl.levelNumber);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
