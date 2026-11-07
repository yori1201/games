/**
 * Separated Audio Services for RUMBELA GAMES:
 * 1. GameBGMService: Auto-playing, continuous cheerful background music loop (/assets/audio/game_background_loop.mp3)
 * 2. ThemeSongService: Dedicated player for the full vocal Theme Song (/assets/aistudio/theme_song._Petualangan_Pensil_Kuning_RUMBELA_4ef82d3d.mp3)
 */

export interface BGMState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
}

export interface ThemeSongState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}

type BGMListener = (state: BGMState) => void;
type ThemeSongListener = (state: ThemeSongState) => void;

/* =======================================================================
   1. GAME BGM SERVICE (CONTINUOUS AUTOMATIC BACKGROUND MUSIC)
======================================================================= */
class GameBGMService {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<BGMListener> = new Set();
  private baseVolume: number = 0.28; // Comfortable gentle background music level
  private isDucked: boolean = false;
  private pausedForThemeSong: boolean = false;
  private autoPlayInitialized: boolean = false;

  private state: BGMState = {
    isPlaying: false,
    isMuted: false,
    volume: 0.28,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
      this.setupAutoPlayGesture();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio('/assets/audio/game_background_loop.mp3');
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.audio.volume = this.baseVolume;

    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.notify();
    });
  }

  /**
   * Automatically play background music on first user interaction anywhere in the window
   * to comply with modern browser autoplay policies.
   */
  private setupAutoPlayGesture() {
    if (this.autoPlayInitialized || typeof window === 'undefined') return;
    this.autoPlayInitialized = true;

    // Attempt direct autoplay first
    this.play().catch(() => {});

    // Attach one-time user interaction listeners to start BGM immediately on first touch/click
    const startOnInteraction = () => {
      if (!this.state.isPlaying && !this.pausedForThemeSong) {
        this.play().catch(() => {});
      }
      window.removeEventListener('click', startOnInteraction);
      window.removeEventListener('touchstart', startOnInteraction);
      window.removeEventListener('keydown', startOnInteraction);
    };

    window.addEventListener('click', startOnInteraction, { passive: true });
    window.addEventListener('touchstart', startOnInteraction, { passive: true });
    window.addEventListener('keydown', startOnInteraction, { passive: true });
  }

  public subscribe(listener: BGMListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public async play(): Promise<boolean> {
    this.initAudio();
    if (!this.audio) return false;
    if (this.pausedForThemeSong) return false;

    try {
      await this.audio.play();
      this.state.isPlaying = true;
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
      this.state.isPlaying = false;
      this.notify();
    }
  }

  public toggle() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setVolume(val: number) {
    this.baseVolume = Math.max(0, Math.min(1, val));
    if (this.audio && !this.isDucked) {
      this.audio.volume = this.baseVolume;
    }
    this.state.volume = this.baseVolume;
    this.notify();
  }

  public setMuted(muted: boolean) {
    if (this.audio) {
      this.audio.muted = muted;
    }
    this.state.isMuted = muted;
    this.notify();
  }

  public duck() {
    if (!this.audio || this.isDucked) return;
    this.isDucked = true;
    this.audio.volume = Math.max(0.05, this.baseVolume * 0.2);
  }

  public unduck() {
    if (!this.audio || !this.isDucked) return;
    this.isDucked = false;
    this.audio.volume = this.baseVolume;
  }

  public pauseForThemeSong() {
    this.pausedForThemeSong = true;
    if (this.audio) {
      this.audio.pause();
    }
  }

  public resumeAfterThemeSong() {
    this.pausedForThemeSong = false;
    this.play().catch(() => {});
  }

  public getState(): BGMState {
    return { ...this.state };
  }
}

/* =======================================================================
   2. THEME SONG SERVICE (SEPARATED VOCAL SONG & JUKEBOX)
======================================================================= */
class ThemeSongService {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<ThemeSongListener> = new Set();
  private baseVolume: number = 0.5;

  private state: ThemeSongState = {
    isPlaying: false,
    isMuted: false,
    volume: 0.5,
    currentTime: 0,
    duration: 178, // ~2m 58s
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio('/assets/aistudio/theme_song._Petualangan_Pensil_Kuning_RUMBELA_4ef82d3d.mp3');
    this.audio.loop = true;
    this.audio.preload = 'metadata';
    this.audio.volume = this.baseVolume;

    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true;
      gameBGMService.pauseForThemeSong();
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      gameBGMService.resumeAfterThemeSong();
      this.notify();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.state.currentTime = this.audio.currentTime;
        this.notify();
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        this.state.duration = this.audio.duration || 178;
        this.notify();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.state.isPlaying = false;
      gameBGMService.resumeAfterThemeSong();
      this.notify();
    });
  }

  public subscribe(listener: ThemeSongListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public async play(): Promise<boolean> {
    this.initAudio();
    if (!this.audio) return false;
    try {
      await this.audio.play();
      this.state.isPlaying = true;
      gameBGMService.pauseForThemeSong();
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
      this.state.isPlaying = false;
      gameBGMService.resumeAfterThemeSong();
      this.notify();
    }
  }

  public toggle() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setVolume(val: number) {
    this.baseVolume = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = this.baseVolume;
    }
    this.state.volume = this.baseVolume;
    this.notify();
  }

  public getState(): ThemeSongState {
    return { ...this.state };
  }
}

export const gameBGMService = new GameBGMService();
export const themeSongService = new ThemeSongService();
