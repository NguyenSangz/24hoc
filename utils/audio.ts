/**
 * Audio synthesis library using browser native Web Audio API.
 * Provides latency-free, low-overhead sound effects that work
 * cross-platform and resolve CORS and asset loading issues.
 */

class SoundLibrary {
  private muted: boolean = false;
  private ctx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('sound_muted') === 'true';
    }
  }

  /**
   * Retrieves the current AudioContext in a lazy, safe manner.
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_muted', String(this.muted));
    }
    this.playClick();
    return this.muted;
  }

  private resumeCtx() {
    const context = this.getContext();
    if (context && context.state === 'suspended') {
      context.resume().catch((err) => console.log('Audio Context resume blocked', err));
    }
  }

  /**
   * Universal audio synthesizer core.
   */
  private playTone(
    frequencies: number[],
    durations: number[],
    type: OscillatorType = 'sine',
    volumes: number[] = [0.1]
  ) {
    if (this.muted) return;
    const context = this.getContext();
    if (!context) return;
    
    this.resumeCtx();
    const startTime = context.currentTime;

    frequencies.forEach((freq, idx) => {
      // Calculate delay based on previous durations
      const delay = idx > 0 ? durations.slice(0, idx).reduce((sum, d) => sum + d, 0) : 0;
      const noteStart = startTime + delay;
      const duration = durations[idx] || 0.1;
      const noteEnd = noteStart + duration;
      const vol = volumes[idx] !== undefined ? volumes[idx] : volumes[0];

      const osc = context.createOscillator();
      const gainNode = context.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, noteStart);

      // Attack, Decay, Sustain, Release (Envelope)
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(vol, noteStart + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd - 0.01);

      osc.connect(gainNode);
      gainNode.connect(context.destination);

      osc.start(noteStart);
      osc.stop(noteEnd);
    });
  }

  /**
   * Direct, ultra-short UI tick sound.
   */
  public playClick() {
    this.playTone([800], [0.04], 'sine', [0.06]);
  }

  /**
   * Bubble-pop sound for node/map navigation.
   */
  public playMove() {
    this.playTone([480, 720], [0.05, 0.06], 'sine', [0.08, 0.07]);
  }

  /**
   * Upward, cheery feedback for correct answers.
   */
  public playCorrect() {
    this.playTone([523.25, 659.25, 783.99, 1046.50], [0.08, 0.08, 0.08, 0.22], 'sine', [0.1, 0.1, 0.1, 0.14]);
  }

  /**
   * Sad, downward buzzing sound for incorrect answers.
   */
  public playIncorrect() {
    this.playTone([246.94, 185.00], [0.15, 0.35], 'triangle', [0.15, 0.2]);
  }

  /**
   * Powerful, festive victory sound effect!
   */
  public playWin() {
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 659.25];
    const durs = [0.1, 0.1, 0.1, 0.15, 0.1, 0.15, 0.45];
    const vols = [0.1, 0.1, 0.1, 0.15, 0.1, 0.15, 0.2];
    this.playTone(notes, durs, 'sine', vols);
  }
}

export const sound = new SoundLibrary();
