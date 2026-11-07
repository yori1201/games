import confetti from 'canvas-confetti';

/**
 * Satisfying Particle Confetti Effects for RUMBELA GAMES
 * Powered by canvas-confetti for positive reinforcement, milestones, and high scores.
 */

interface ConfettiOptions {
  particleCount?: number;
  origin?: { x: number; y: number };
}

/**
 * High Score Celebration: Dual side cannons shooting celebratory confetti into the center
 */
export const triggerHighScoreConfetti = () => {
  const duration = 2800;
  const end = Date.now() + duration;

  const colors = ['#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#8b5cf6', '#fbbf24'];

  const frame = () => {
    // Left cannon
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.75 },
      colors,
      zIndex: 1000,
      disableForReducedMotion: true,
    });
    // Right cannon
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.75 },
      colors,
      zIndex: 1000,
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();

  // Initial energetic burst
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#ffd700', '#ffb703', '#ffffff', '#00f5d4'],
    zIndex: 1000,
  });
};

/**
 * Milestone Celebration: Multi-stage fountain burst with golden stars and celebratory sparks
 */
export const triggerMilestoneConfetti = (opts?: ConfettiOptions) => {
  const count = opts?.particleCount || 150;
  const origin = opts?.origin || { x: 0.5, y: 0.6 };

  // Stage 1: Fast concentrated pop
  confetti({
    particleCount: Math.floor(count * 0.35),
    spread: 35,
    startVelocity: 45,
    origin,
    colors: ['#fbbf24', '#f59e0b', '#f43f5e', '#3b82f6'],
    zIndex: 1000,
  });

  // Stage 2: Wide radiant spread (slightly delayed)
  setTimeout(() => {
    confetti({
      particleCount: Math.floor(count * 0.45),
      spread: 85,
      startVelocity: 35,
      decay: 0.92,
      origin,
      colors: ['#10b981', '#06b6d4', '#eab308', '#ec4899'],
      zIndex: 1000,
    });
  }, 180);

  // Stage 3: Float down glittering particles
  setTimeout(() => {
    confetti({
      particleCount: Math.floor(count * 0.2),
      spread: 120,
      startVelocity: 25,
      ticks: 300,
      gravity: 0.7,
      origin,
      colors: ['#ffd700', '#ffffff', '#67e8f9'],
      zIndex: 1000,
    });
  }, 350);
};

/**
 * Level Mastered / Perfect Victory Fanfare
 */
export const triggerVictoryConfetti = () => {
  const defaults = { origin: { y: 0.65 }, zIndex: 1000 };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(180 * particleRatio),
    });
  };

  fire(0.25, { spread: 30, startVelocity: 60, colors: ['#ffd700', '#ffffff'] });
  fire(0.2, { spread: 65, colors: ['#06b6d4', '#3b82f6', '#10b981'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9, colors: ['#f59e0b', '#ec4899', '#a855f7'] });
  fire(0.1, { spread: 130, startVelocity: 28, decay: 0.93, scalar: 1.2 });
  fire(0.1, { spread: 140, startVelocity: 45, colors: ['#ffd700', '#00f5d4'] });
};
