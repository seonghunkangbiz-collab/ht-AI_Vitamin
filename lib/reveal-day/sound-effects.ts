// Web Audio API based sound synthesizer for Reveal Day stage effects
// Zero external network dependencies, 100% offline resilient

class SoundEffectManager {
  private ctx: AudioContext | null = null;
  private drumRollTimer: any = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopDrumRoll();
    }
  }

  /**
   * Plays a rolling drum snare effect during lucky draw selection
   */
  public startDrumRoll() {
    if (this.isMuted) return;
    this.stopDrumRoll();

    const ctx = this.getAudioContext();
    if (!ctx) return;

    let beat = 0;
    const playTap = () => {
      if (!this.ctx || this.isMuted) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Low frequency thud with noisy rattle
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(65 + (beat % 6) * 4, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        beat++;
      } catch {}
    };

    playTap();
    this.drumRollTimer = setInterval(playTap, 70); // rapid rolling tempo
  }

  public stopDrumRoll() {
    if (this.drumRollTimer) {
      clearInterval(this.drumRollTimer);
      this.drumRollTimer = null;
    }
  }

  /**
   * Plays a celebratory fanfare arpeggio when a winner is locked in
   */
  public playFanfare() {
    this.stopDrumRoll();
    if (this.isMuted) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Major celebratory chords: C4, E4, G4, C5 (Triumphant brass chime)
    const notes = [
      { freq: 261.63, delay: 0.0, dur: 0.2 },   // C4
      { freq: 329.63, delay: 0.15, dur: 0.2 },  // E4
      { freq: 392.00, delay: 0.30, dur: 0.2 },  // G4
      { freq: 523.25, delay: 0.45, dur: 0.6 },  // C5
      { freq: 659.25, delay: 0.50, dur: 0.8 },  // E5
      { freq: 783.99, delay: 0.55, dur: 1.1 }   // G5 (grand finale)
    ];

    notes.forEach(n => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.delay);

        gain.gain.setValueAtTime(0, ctx.currentTime + n.delay);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + n.delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.delay + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + n.delay);
        osc.stop(ctx.currentTime + n.delay + n.dur);
      } catch {}
    });
  }

  /**
   * Pleasant chime for button interaction or mobile feedback
   */
  public playChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }
}

export const soundEffects = new SoundEffectManager();
