import React, { useEffect, useState } from 'react';
import {
  gameBGMService,
  themeSongService,
  BGMState,
  ThemeSongState,
} from '../../lib/theme-song-service';
import { sound } from '../../lib/audio';
import { Music, Play, Pause, Volume2, Sparkles, Disc3, ChevronDown, ChevronUp } from 'lucide-react';

interface ThemeSongWidgetProps {
  variant?: 'floating' | 'card';
  className?: string;
}

const LYRIC_SNIPPETS = [
  'Ayo semua mari belajar, Rumbela siap jadi temanmu... 🎒',
  'Buku biru siap di tangan, pensil kuning siap beraksi! ✏️',
  'Daun di kepala melambangkan ilmu baru yang kita cari... 🌱',
  'Rumbela Rumbela ayo membaca, Rumbela Rumbela ayo menulis! 📖',
  'Dunia ini penuh rahasia, kita jelajahi tanpa batas! 🌍',
  '1, 2, 3 dan 4, angka-angka mulai menari... ✨',
  'A, B, C, D kita sebutkan, huruf-huruf jadi bernyanyi! 🎶',
  'Rumbela selalu sayang kamu! ❤️',
];

export const ThemeSongWidget: React.FC<ThemeSongWidgetProps> = ({
  variant = 'floating',
  className = '',
}) => {
  const [bgmState, setBgmState] = useState<BGMState>(gameBGMService.getState());
  const [themeState, setThemeState] = useState<ThemeSongState>(themeSongService.getState());
  const [isExpanded, setIsExpanded] = useState(false);
  const [lyricIndex, setLyricIndex] = useState(0);

  // Subscribe to both audio services
  useEffect(() => {
    const unsubBGM = gameBGMService.subscribe(setBgmState);
    const unsubTheme = themeSongService.subscribe(setThemeState);
    return () => {
      unsubBGM();
      unsubTheme();
    };
  }, []);

  // Cycle lyric preview when Theme Song is playing
  useEffect(() => {
    if (!themeState.isPlaying) return;
    const interval = setInterval(() => {
      setLyricIndex((prev) => (prev + 1) % LYRIC_SNIPPETS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [themeState.isPlaying]);

  // 1. INLINE CARD VARIANT (DEDICATED THEME SONG JUKEBOX)
  if (variant === 'card') {
    const handleToggleTheme = () => {
      sound.playClick();
      themeSongService.toggle();
    };

    const handleThemeVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      themeSongService.setVolume(val);
    };

    return (
      <div
        className={`relative overflow-hidden rounded-3xl p-5 border border-white/20 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-600/20 backdrop-blur-md shadow-xl select-none ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Vinyl & Title */}
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div
              onClick={handleToggleTheme}
              className={`relative w-14 h-14 rounded-full bg-slate-950 border-2 border-amber-300 flex items-center justify-center shrink-0 cursor-pointer shadow-lg transition-transform active:scale-95 ${
                themeState.isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '6s' }}
              title="Klik untuk Putar / Jeda Lagu Tema"
            >
              <Disc3 className="w-8 h-8 text-amber-300" />
              <div className="absolute w-3 h-3 rounded-full bg-amber-400 border border-slate-950" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <Sparkles className="w-3 h-3" />
                <span>LAGU TEMA RESMI (VOCAL & LIRIK)</span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                Petualangan Pensil Kuning RUMBELA
              </h4>
              <p className="text-xs text-white/80 italic mt-0.5 font-medium animate-fadeIn">
                "{LYRIC_SNIPPETS[lyricIndex]}"
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Volume Slider */}
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-2xl border border-white/10">
              <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={themeState.volume}
                onChange={handleThemeVolumeChange}
                className="w-16 sm:w-20 accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                title={`Volume Lagu Tema: ${Math.round(themeState.volume * 100)}%`}
              />
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                themeState.isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/30'
              }`}
            >
              {themeState.isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Jeda Lagu Tema</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Putar Lagu Tema 🎤</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. FLOATING HUD VARIANT (AUTOMATIC CONTINUOUS GAME BGM)
  const handleToggleBGM = () => {
    sound.playClick();
    gameBGMService.toggle();
  };

  const handleBGMVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    gameBGMService.setVolume(val);
  };

  return (
    <div className={`relative flex items-center select-none ${className}`}>
      {/* Compact Floating Pill */}
      <div className="flex items-center bg-slate-900/90 hover:bg-slate-800 text-white rounded-full border border-amber-400/30 shadow-lg backdrop-blur-md transition-all">
        <button
          type="button"
          onClick={handleToggleBGM}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 cursor-pointer"
          title={bgmState.isPlaying ? 'Jeda Musik Latar Game' : 'Nyalakan Musik Latar Game Otomatis'}
        >
          <Music
            className={`w-3.5 h-3.5 text-amber-300 ${
              bgmState.isPlaying ? 'animate-bounce text-amber-400' : ''
            }`}
          />
          <span className="hidden sm:inline font-semibold text-[11px] text-amber-200">
            {bgmState.isPlaying ? 'BGM Game On' : 'BGM Game Off'}
          </span>
          {bgmState.isPlaying ? (
            <Pause className="w-3 h-3 fill-white/80" />
          ) : (
            <Play className="w-3 h-3 fill-amber-300" />
          )}
        </button>

        {/* Small expand toggle for volume slider */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="pr-2 pl-1 py-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
          title="Atur Volume Musik Latar Game"
        >
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded Mini Dropdown */}
      {isExpanded && (
        <div className="absolute top-10 right-0 w-64 bg-slate-900/95 border-2 border-amber-400/40 rounded-3xl p-4 shadow-2xl backdrop-blur-lg z-50 animate-fadeIn text-white">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Music
                className={`w-4 h-4 text-amber-400 ${bgmState.isPlaying ? 'animate-pulse' : ''}`}
              />
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                BGM Game Otomatis
              </span>
            </div>
            <span className="text-[10px] text-white/50 font-mono">
              {bgmState.isPlaying ? 'Memutar' : 'Jeda'}
            </span>
          </div>

          <p className="text-[11px] text-white/70 leading-relaxed mb-3">
            Musik latar instrumen ceria yang terus berputar otomatis menemani petualangan belajarmu.
          </p>

          {/* Volume Slider Bar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
            <span className="text-[10px] text-white/70">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmState.volume}
              onChange={handleBGMVolumeChange}
              className="w-28 accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
            />
            <span className="text-[10px] font-mono text-amber-300 w-8 text-right">
              {Math.round(bgmState.volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
