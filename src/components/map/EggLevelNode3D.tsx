import React from 'react';
import { Star, Lock } from 'lucide-react';

interface EggLevelNode3DProps {
  levelNumber: number;
  title: string;
  description: string;
  stars: number;
  unlocked: boolean;
  isMastered: boolean;
  themeMode: 'day' | 'night';
  isNewlyUnlocked?: boolean;
  onClick: () => void;
}

// 10 distinct vibrant 3D egg themes matching Screenshot 2 & fantasy styles
const EGG_THEMES = [
  // Lvl 1: Pink speckled egg with golden sheen (like Screenshot 2 near bird)
  {
    bg: 'radial-gradient(circle at 35% 25%, #fbcfe8 0%, #f472b6 40%, #db2777 85%, #9d174d 100%)',
    border: '#fbcfe8',
    pattern: 'radial-gradient(circle, #fff 15%, transparent 20%) 0 0/14px 14px',
    numColor: 'text-white',
    ring: 'ring-pink-300/60',
  },
  // Lvl 2: Emerald Green with Golden Stripe (like Screenshot 2 node 2)
  {
    bg: 'radial-gradient(circle at 35% 25%, #a7f3d0 0%, #34d399 35%, #059669 80%, #064e3b 100%)',
    border: '#fde047',
    pattern: 'linear-gradient(45deg, transparent 40%, #fef08a 45%, #facc15 55%, transparent 60%)',
    numColor: 'text-white',
    ring: 'ring-emerald-300/60',
  },
  // Lvl 3: Cloud Blue with Polka Dots (like Screenshot 2 node 3)
  {
    bg: 'radial-gradient(circle at 35% 25%, #bae6fd 0%, #38bdf8 40%, #0284c7 85%, #075985 100%)',
    border: '#e0f2fe',
    pattern: 'radial-gradient(circle, #ffffff 18%, transparent 22%) 0 0/16px 16px',
    numColor: 'text-white',
    ring: 'ring-sky-300/60',
  },
  // Lvl 4: Golden Royal Egg with metallic reflection
  {
    bg: 'radial-gradient(circle at 35% 22%, #fef08a 0%, #facc15 35%, #d97706 80%, #78350f 100%)',
    border: '#fef9c3',
    pattern: 'linear-gradient(90deg, transparent 45%, rgba(255,255,255,0.6) 50%, transparent 55%)',
    numColor: 'text-slate-950',
    ring: 'ring-amber-300/80',
  },
  // Lvl 5: Purple Cosmic Egg with stars (near bridge in Screenshot 2)
  {
    bg: 'radial-gradient(circle at 35% 25%, #e9d5ff 0%, #c084fc 40%, #7e22ce 85%, #3b0764 100%)',
    border: '#f3e8ff',
    pattern: 'radial-gradient(circle, #fde047 15%, transparent 20%) 0 0/18px 18px',
    numColor: 'text-white',
    ring: 'ring-purple-300/60',
  },
  // Lvl 6: Sunbeam Yellow with orange band
  {
    bg: 'radial-gradient(circle at 35% 25%, #fef9c3 0%, #fde047 40%, #f59e0b 85%, #b45309 100%)',
    border: '#fed7aa',
    pattern: 'linear-gradient(135deg, transparent 40%, #fb923c 45%, #ea580c 55%, transparent 60%)',
    numColor: 'text-slate-950',
    ring: 'ring-yellow-300/60',
  },
  // Lvl 7: Crimson Coral with Diamond Lattice
  {
    bg: 'radial-gradient(circle at 35% 25%, #fecdd3 0%, #fb7185 40%, #e11d48 85%, #881337 100%)',
    border: '#ffe4e6',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.4) 20%, transparent 25%) 0 0/12px 12px',
    numColor: 'text-white',
    ring: 'ring-rose-300/60',
  },
  // Lvl 8: Turquoise Lagoon with Gold Swirl
  {
    bg: 'radial-gradient(circle at 35% 25%, #99f6e4 0%, #2dd4bf 40%, #0f766e 85%, #134e4a 100%)',
    border: '#ccfbf1',
    pattern: 'linear-gradient(45deg, transparent 40%, #fde047 45%, #f59e0b 55%, transparent 60%)',
    numColor: 'text-white',
    ring: 'ring-teal-300/60',
  },
  // Lvl 9: Bronze Dragon Egg with scales
  {
    bg: 'radial-gradient(circle at 35% 25%, #fed7aa 0%, #fb923c 40%, #c2410c 85%, #7c2d12 100%)',
    border: '#ffedd5',
    pattern: 'radial-gradient(circle, #fde047 16%, transparent 22%) 0 0/15px 15px',
    numColor: 'text-white',
    ring: 'ring-orange-300/60',
  },
  // Lvl 10: Grand Diamond / Rainbow Golden Egg with Crown
  {
    bg: 'radial-gradient(circle at 32% 20%, #ffffff 0%, #fef08a 25%, #38bdf8 55%, #a855f7 80%, #4338ca 100%)',
    border: '#fef08a',
    pattern: 'linear-gradient(90deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(255,255,255,0.5) 100%)',
    numColor: 'text-white',
    ring: 'ring-amber-300/90',
  },
];

export const EggLevelNode3D: React.FC<EggLevelNode3DProps> = ({
  levelNumber,
  title,
  description,
  stars,
  unlocked,
  isMastered,
  themeMode,
  isNewlyUnlocked = false,
  onClick,
}) => {
  const theme = EGG_THEMES[(levelNumber - 1) % EGG_THEMES.length];

  return (
    <div className={`relative flex flex-col items-center group select-none ${isNewlyUnlocked ? 'z-40' : ''}`}>
      {/* Newly Unlocked Celebration Floating Badge */}
      {isNewlyUnlocked && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 text-slate-950 font-black text-[10px] sm:text-[11px] shadow-2xl border-2 border-white animate-bounce z-50 flex items-center gap-1">
          <span>✨</span>
          <span>LEVEL BARU TERBUKA!</span>
          <span>🎉</span>
        </div>
      )}

      {/* Radiant Glowing Aura Ring for Newly Unlocked Egg */}
      {isNewlyUnlocked && (
        <>
          <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 opacity-80 blur-lg animate-ping pointer-events-none" />
          <div className="absolute inset-0 -m-2 rounded-full border-2 border-amber-300 border-dashed animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />
        </>
      )}

      {/* 1. Golden Star Rating Floating on Top */}
      <div className="flex items-center gap-0.5 mb-0.5 h-4 z-20">
        {[1, 2, 3].map((s) => (
          <Star
            key={s}
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${
              s <= stars
                ? 'fill-amber-400 text-amber-300 drop-shadow-md scale-110'
                : 'fill-black/30 text-white/30'
            }`}
          />
        ))}
      </div>

      {/* 2. THE 3D EGG BUTTON */}
      <button
        disabled={!unlocked}
        onClick={onClick}
        title={unlocked ? `${title}: ${description}` : `Level ${levelNumber} Terkunci`}
        className={`relative transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center ${
          isNewlyUnlocked
            ? 'scale-120 animate-bounce ring-4 ring-amber-400 shadow-2xl shadow-amber-400/80'
            : unlocked
            ? 'hover:scale-115 hover:-translate-y-1.5'
            : 'opacity-70 grayscale cursor-not-allowed'
        }`}
        style={{
          width: '46px',
          height: '58px',
        }}
      >
        {/* Soft 3D Ground Contact Shadow */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-9 h-2.5 rounded-full bg-black/40 blur-[2px] transition-transform group-hover:scale-125"
          aria-hidden="true"
        />

        {/* 3D Egg Outer Shell with Egg-Curve Radii */}
        <div
          className={`relative w-full h-full flex items-center justify-center overflow-hidden border-2 shadow-xl transition-all ${
            unlocked
              ? `ring-2 ${theme.ring} shadow-lg group-hover:rotate-3`
              : 'border-slate-500/80 bg-slate-700/80'
          }`}
          style={{
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: unlocked ? theme.bg : 'radial-gradient(circle at 35% 25%, #94a3b8 0%, #475569 60%, #1e293b 100%)',
            borderColor: unlocked ? theme.border : '#64748b',
          }}
        >
          {/* Decorative Pattern Layer */}
          {unlocked && (
            <div
              className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
              style={{ background: theme.pattern }}
            />
          )}

          {/* 3D Glossy Light Reflection Sheen (Top-Left Highlight) */}
          <div
            className="absolute top-1 left-2 w-3.5 h-6 rounded-full bg-white/70 blur-[1px] rotate-[-25deg] pointer-events-none"
            aria-hidden="true"
          />

          {/* Secondary Subdued Specular Rim at Right */}
          <div
            className="absolute bottom-2 right-2 w-2 h-4 rounded-full bg-white/20 blur-[1px] rotate-[20deg] pointer-events-none"
            aria-hidden="true"
          />

          {/* Center Level Badge Disc */}
          <div
            className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono font-black text-sm shadow-md border ${
              unlocked
                ? isMastered
                  ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 border-amber-200 shadow-amber-400/50'
                  : 'bg-white/85 text-slate-900 border-white shadow-black/20'
                : 'bg-slate-800/80 text-slate-400 border-slate-600'
            }`}
          >
            {unlocked ? (
              <span className="drop-shadow-sm">{levelNumber}</span>
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-300" />
            )}
          </div>
        </div>

        {/* Mastered Crown Badge for Level 10 */}
        {isMastered && levelNumber === 10 && (
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm select-none z-30 drop-shadow">
            👑
          </span>
        )}
      </button>

      {/* 3. Floating Tooltip Info on Hover */}
      <div className="absolute top-full mt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap bg-slate-950/95 text-white text-[11px] px-3 py-1.5 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md">
        <span className="font-extrabold text-amber-300">
          Level {levelNumber}: {title}
        </span>
        <span className="text-[10px] text-slate-300">{description}</span>
      </div>
    </div>
  );
};
