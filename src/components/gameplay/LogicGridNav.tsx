/**
 * Logic Grid Navigation UI for RUMBELA GAMES
 * ============================================================
 * Renders an interactive grid where the student must guide
 * the robot Bela from start to target by clicking arrow buttons.
 *
 * - Grid size scales with difficulty (3x3 EASY, 4x4 MEDIUM, 5x5 HARD)
 * - 1-3 obstacles block the path
 * - Student clicks arrows (Up/Down/Left/Right) to build a sequence
 * - On submit, simulate the path: if robot reaches target without
 *   hitting obstacles or going out of bounds → correct
 *
 * This replaces the old MCQ-style LOGIC questions for grid navigation
 * levels (3, 4, 9) with a real interactive experience.
 */
import React, { useState, useMemo } from 'react';
import type { QuestionItem } from '../../types/game';
import { sound } from '../../lib/audio';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Check, X, MapPin, Target, Flag } from 'lucide-react';

interface LogicGridNavProps {
  question: QuestionItem;
  onAnswer: (sequence: string[]) => void;
  disabled?: boolean;
  feedbackState?: 'none' | 'correct' | 'incorrect';
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

const DIR_DELTA: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const DIR_ICON: Record<Direction, React.ReactNode> = {
  UP: <ArrowUp className="w-5 h-5" />,
  DOWN: <ArrowDown className="w-5 h-5" />,
  LEFT: <ArrowLeft className="w-5 h-5" />,
  RIGHT: <ArrowRight className="w-5 h-5" />,
};

const DIR_LABEL: Record<Direction, string> = {
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→',
};

export const LogicGridNav: React.FC<LogicGridNavProps> = ({
  question,
  onAnswer,
  disabled = false,
  feedbackState = 'none',
}) => {
  // Parse grid config from question fields (with safe defaults)
  const [cols, rows] = question.gridSize || [4, 4];
  const startPos: Position = useMemo(() => {
    const s = question.startPos || [0, 0];
    return { x: s[0], y: s[1] };
  }, [question.startPos]);

  const targetPos: Position = useMemo(() => {
    const t = question.targetPos || [cols - 1, rows - 1];
    return { x: t[0], y: t[1] };
  }, [question.targetPos, cols, rows]);

  const obstacles: Position[] = useMemo(() => {
    return (question.obstacles || []).map((o) => ({ x: o[0], y: o[1] }));
  }, [question.obstacles]);

  const [sequence, setSequence] = useState<Direction[]>([]);

  // Simulate the path (returns final position + failure reason if any)
  const simulatePath = (seq: Direction[]): { path: Position[]; finalPos: Position; failure: string | null; reachedTarget: boolean } => {
    let pos: Position = { ...startPos };
    const path: Position[] = [{ ...pos }];
    for (const dir of seq) {
      const delta = DIR_DELTA[dir];
      const newPos = { x: pos.x + delta.x, y: pos.y + delta.y };
      // Check bounds
      if (newPos.x < 0 || newPos.x >= cols || newPos.y < 0 || newPos.y >= rows) {
        return { path, finalPos: pos, failure: 'Robot keluar dari peta!', reachedTarget: false };
      }
      // Check obstacle
      if (obstacles.some((o) => o.x === newPos.x && o.y === newPos.y)) {
        return { path, finalPos: newPos, failure: 'Robot menabrak rintangan!', reachedTarget: false };
      }
      pos = newPos;
      path.push({ ...pos });
    }
    const reachedTarget = pos.x === targetPos.x && pos.y === targetPos.y;
    return { path, finalPos: pos, failure: reachedTarget ? null : 'Robot belum sampai ke target.', reachedTarget };
  };

  // Preview the path for visualization (only show if there are commands)
  const preview = useMemo(() => {
    if (sequence.length === 0) return null;
    return simulatePath(sequence);
  }, [sequence, startPos, targetPos, obstacles, cols, rows]);

  const handleAddDirection = (dir: Direction) => {
    if (disabled) return;
    sound.playClick();
    const next = [...sequence, dir];
    setSequence(next);
    onAnswer(next); // notify parent of new sequence
  };

  const handleRemoveLast = () => {
    if (disabled || sequence.length === 0) return;
    sound.playClick();
    const next = sequence.slice(0, -1);
    setSequence(next);
    onAnswer(next);
  };

  const handleReset = () => {
    if (disabled) return;
    sound.playClick();
    setSequence([]);
    onAnswer([]);
  };

  // (submit is handled by parent's "Kirim Jawaban" button via logicSequence state)

  // Render a single grid cell
  const renderCell = (x: number, y: number) => {
    const isStart = startPos.x === x && startPos.y === y;
    const isTarget = targetPos.x === x && targetPos.y === y;
    const isObstacle = obstacles.some((o) => o.x === x && o.y === y);
    const isOnPath = preview?.path.some((p) => p.x === x && p.y === y) || false;
    const isFinalPos = preview && preview.finalPos.x === x && preview.finalPos.y === y;
    const isFailureCell = preview?.failure && isFinalPos;

    let bgClass = 'bg-white/5 border-white/10';
    let content: React.ReactNode = null;

    if (isObstacle) {
      bgClass = 'bg-rose-900/40 border-rose-500/40';
      content = <span className="text-2xl">🪨</span>;
    } else if (isStart) {
      bgClass = 'bg-emerald-900/40 border-emerald-500/50';
      content = <span className="text-2xl">🤖</span>;
    } else if (isTarget) {
      bgClass = 'bg-amber-900/40 border-amber-500/50';
      content = <span className="text-2xl">🎯</span>;
    } else if (isOnPath) {
      bgClass = 'bg-sky-900/30 border-sky-500/40';
      if (isFinalPos && !isFailureCell && !preview?.reachedTarget) {
        content = <span className="text-2xl">🤖</span>;
      } else if (isFinalPos && isFailureCell) {
        content = <span className="text-2xl">💥</span>;
      } else if (isFinalPos && preview?.reachedTarget) {
        content = <span className="text-2xl">🏆</span>;
      }
    }

    return (
      <div
        key={`${x}-${y}`}
        className={`relative aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${bgClass}`}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* GRID */}
      <div
        className="grid gap-1.5 p-3 bg-slate-900/70 rounded-2xl border-2 border-white/15 shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          width: `min(90vw, ${cols * 70}px)`,
        }}
      >
        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((_, x) => renderCell(x, y))
        )}
      </div>

      {/* LEGEND */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-white/70 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="text-base">🤖</span>
          <span>Robot Bela</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-base">🎯</span>
          <span>Target</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-base">🪨</span>
          <span>Rintangan</span>
        </span>
      </div>

      {/* SEQUENCE DISPLAY */}
      <div className="w-full p-3 bg-slate-900/70 rounded-2xl border-2 border-sky-500/30 min-h-[64px] flex items-center justify-center gap-1.5 flex-wrap">
        {sequence.length === 0 ? (
          <span className="text-xs text-white/40 italic">Klik panah untuk menyusun jalur...</span>
        ) : (
          sequence.map((dir, idx) => (
            <span
              key={idx}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/30 border border-sky-400/50 text-sky-200 text-sm font-bold"
            >
              {DIR_LABEL[dir]}
            </span>
          ))
        )}
      </div>

      {/* PREVIEW FEEDBACK */}
      {preview && sequence.length > 0 && (
        <div className={`text-xs px-3 py-1.5 rounded-xl border ${
          preview.reachedTarget
            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
            : preview.failure
            ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
            : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
        }`}>
          {preview.reachedTarget
            ? '✓ Robot sampai ke target! Klik "Kirim Jawaban"'
            : preview.failure
            ? `✗ ${preview.failure}`
            : `Robot berada di (${preview.finalPos.x}, ${preview.finalPos.y}) — belum sampai target (${targetPos.x}, ${targetPos.y})`}
        </div>
      )}

      {/* ARROW BUTTONS */}
      <div className="grid grid-cols-3 gap-2 w-44">
        <div />
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleAddDirection('UP')}
          className="aspect-square rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Maju ke Atas"
        >
          {DIR_ICON.UP}
        </button>
        <div />
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleAddDirection('LEFT')}
          className="aspect-square rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Belok Kiri"
        >
          {DIR_ICON.LEFT}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleRemoveLast}
          className="aspect-square rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 flex items-center justify-center text-amber-300 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Hapus Langkah Terakhir"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleAddDirection('RIGHT')}
          className="aspect-square rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Belok Kanan"
        >
          {DIR_ICON.RIGHT}
        </button>
        <div />
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleAddDirection('DOWN')}
          className="aspect-square rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Mundur ke Bawah"
        >
          {DIR_ICON.DOWN}
        </button>
        <div />
      </div>

      {/* RESET BUTTON */}
      <button
        type="button"
        disabled={disabled || sequence.length === 0}
        onClick={handleReset}
        className="px-4 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-xs text-rose-300 font-medium transition-colors border border-rose-400/25 disabled:opacity-40 cursor-pointer"
      >
        Reset Semua
      </button>
    </div>
  );
};
