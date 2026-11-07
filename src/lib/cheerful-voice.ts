import { gameBGMService } from './theme-song-service';

/**
 * Cheerful Female Voice Synthesizer for RUMBELA GAMES
 * Optimized for friendly, enthusiastic, letter-by-letter English spelling
 * using high-quality female voice profiles with upbeat cadence.
 */

class CheerfulVoiceService {
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    this.selectedVoice = this.pickBestCheerfulFemaleVoice();
    this.initialized = true;
  }

  /**
   * Selects the highest quality natural/cheerful female voice available on the device
   */
  private pickBestCheerfulFemaleVoice(): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) return null;

    // Filter English voices
    const enVoices = this.voices.filter((v) => v.lang.startsWith('en'));
    if (enVoices.length === 0) return this.voices[0] || null;

    // Priority rank for top natural, cheerful female voices
    const preferredFemaleNames = [
      /samantha/i, // Apple macOS/iOS Samantha (clear, warm, friendly)
      /ava/i,
      /victoria/i,
      /allison/i,
      /jenny/i,    // Microsoft Natural Jenny
      /aria/i,     // Microsoft Aria
      /zira/i,     // Microsoft Zira
      /karen/i,    // Australian friendly
      /fiona/i,
      /google.*female/i,
      /google.*us.*english/i,
      /female/i,
    ];

    for (const regex of preferredFemaleNames) {
      const match = enVoices.find((v) => regex.test(v.name));
      if (match) return match;
    }

    // Default to first en-US or English voice
    const usVoice = enVoices.find((v) => v.lang === 'en-US' || v.lang === 'en_US');
    return usVoice || enVoices[0];
  }

  /**
   * Speak English word spelled letter-by-letter with lively cheerful female intonation
   * Example: "Let's spell! C! ... A! ... T! ... Cat! Yay!"
   */
  public spellWordCheerful(word: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!word) return;

    window.speechSynthesis.cancel();

    if (!this.selectedVoice) {
      this.initVoices();
    }

    const cleanWord = word.trim();
    const letters = cleanWord.toUpperCase().split('');

    // Cheerful phrasing tailored for kids:
    // Let's spell! C! ... A! ... T! ... Cat! Super!
    const spelledLetterChain = letters.map((l) => `${l}!`).join(' ... ');
    const cheerfulScript = `Let's spell! ${spelledLetterChain} ... ${cleanWord}! Yay!`;

    const utterance = new SpeechSynthesisUtterance(cheerfulScript);
    utterance.lang = 'en-US';
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Cheerful high-energy pitch and lively cadence
    utterance.pitch = 1.32; // Higher, youthful, enthusiastic female tone
    utterance.rate = 0.92;  // Deliberate but energetic and rhythmic
    utterance.volume = 1.0;
    gameBGMService.duck();
    utterance.onend = () => {
      gameBGMService.unduck();
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      gameBGMService.unduck();
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Cheerfully pronounce an individual letter when clicked or typed
   */
  public pronounceLetter(letter: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!letter) return;

    window.speechSynthesis.cancel();

    if (!this.selectedVoice) {
      this.initVoices();
    }

    const utterance = new SpeechSynthesisUtterance(`${letter.toUpperCase()}!`);
    utterance.lang = 'en-US';
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.pitch = 1.35; // Cheerful bright pitch
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Cheerful word celebration phrase
   */
  public pronouncePraise(phrase: string = 'Super!') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (!this.selectedVoice) {
      this.initVoices();
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = 'en-US';
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.pitch = 1.38;
    utterance.rate = 1.02;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  public cancel() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const cheerfulVoice = new CheerfulVoiceService();
