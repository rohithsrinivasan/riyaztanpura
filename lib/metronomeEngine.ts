"use client";

/**
 * Lookahead audio scheduler (the "Tale of Two Clocks" pattern) so beat timing
 * stays accurate regardless of the browser's JS timer jitter. A cheap
 * setInterval only decides *when to schedule*; actual sound timing is handled
 * by the Web Audio clock.
 */

const SCHEDULE_AHEAD_TIME = 0.12; // seconds
const LOOKAHEAD = 25; // ms, how often the scheduler wakes up

export type BeatCallback = (beatIndex: number, beatTime: number) => void;

export class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private currentBeat = 0;

  bpm = 80;
  beatsPerBar = 4;
  volume = 0.7;
  onBeat: BeatCallback | null = null;

  private ensureContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.gainNode) this.gainNode.gain.value = v;
  }

  get isPlaying() {
    return this.timerId !== null;
  }

  async start() {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    if (this.isPlaying) return;

    this.currentBeat = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.timerId = setInterval(() => this.scheduler(), LOOKAHEAD);
  }

  stop() {
    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      this.scheduleClick(this.currentBeat, this.nextNoteTime);
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextNoteTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    }
  }

  private scheduleClick(beatIndex: number, time: number) {
    const ctx = this.ctx;
    const gain = this.gainNode;
    if (!ctx || !gain) return;

    const isAccent = beatIndex === 0;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = isAccent ? 1500 : 1000;

    const peak = isAccent ? 1.0 : 0.6;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(peak, time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    osc.connect(envelope);
    envelope.connect(gain);

    osc.start(time);
    osc.stop(time + 0.07);

    if (this.onBeat) {
      const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
      setTimeout(() => this.onBeat?.(beatIndex, time), delayMs);
    }
  }

  dispose() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
