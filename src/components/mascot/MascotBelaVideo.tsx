import React, { useState } from 'react';
import { Sparkles, Film, X } from 'lucide-react';
import { sound } from '../../lib/audio';

interface MascotBelaVideoProps {
  className?: string;
  size?: number | string;
  autoPlay?: boolean;
  loop?: boolean;
  speechText?: string | null;
  interactive?: boolean;
  onTap?: () => void;
  showAudioControl?: boolean;
  showVideoTrigger?: boolean;
}

export const MascotBelaVideo: React.FC<MascotBelaVideoProps> = ({
  className = '',
  size = 200,
  speechText = null,
  interactive = true,
  onTap,
  showVideoTrigger = false,
}) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleMascotClick = () => {
    sound.playStarPop(2);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);

    if (onTap) {
      onTap();
    }
  };

  const dimensionStyle =
    typeof size === 'number'
      ? { width: `${size}px`, height: `${size}px` }
      : { width: size, height: size };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none bg-transparent ${className}`}
      style={dimensionStyle}
    >
      {/* Dynamic Animated Speech Bubble */}
      {speechText && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-950 font-black text-[11px] sm:text-xs px-3.5 py-1.5 rounded-2xl shadow-2xl border-2 border-emerald-400 z-30 animate-fadeIn flex items-center gap-1.5 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{speechText}</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
        </div>
      )}

      {/* 100% Transparent 3D Mascot Character (No Background, No Box Frame) */}
      <div
        onClick={interactive ? handleMascotClick : undefined}
        className={`relative w-full h-full flex items-center justify-center bg-transparent ${
          interactive ? 'cursor-pointer active:scale-90 transition-transform duration-200' : ''
        } ${isBouncing ? 'scale-110' : ''}`}
        title={interactive ? 'Sentuh Bela untuk menyapa!' : 'Maskot Bela'}
      >
        <img
          src="/assets/aistudio/MASKOT_RUMBELA_BG_6356fdb1.png"
          alt="Maskot Bela Rumbela"
          className="w-full h-full object-contain pointer-events-none drop-shadow-[0_12px_22px_rgba(0,0,0,0.35)] animate-float transition-all"
        />

        {/* Optional small video animation button */}
        {showVideoTrigger && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setShowVideoModal(true);
            }}
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-amber-300 border border-amber-400/30 shadow-md backdrop-blur-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold px-2"
            title="Tonton Animasi 3D Bela Membuka Buku Ajaib"
          >
            <Film className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Animasi</span>
          </button>
        )}
      </div>

      {/* Optional Modal for 3D Video Book Opening Scene */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="relative bg-slate-900 border-2 border-emerald-400/40 rounded-3xl p-4 max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Animasi 3D Bela & Buku Ajaib
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black shadow-inner">
              <video
                src="/assets/aistudio/MASKOT_3D_16b263e8.mp4"
                autoPlay
                loop
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[11px] text-white/60 text-center mt-2.5">
              Bela membuka buku ajaib dan memancarkan ilmu pengetahuan! ✨
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
