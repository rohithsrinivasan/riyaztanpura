"use client";

/**
 * Lookahead audio scheduler (the "Tale of Two Clocks" pattern) so beat timing
 * stays accurate regardless of the browser's JS timer jitter. A cheap
 * setInterval only decides *when to schedule*; actual sound timing is handled
 * by the Web Audio clock.
 */

const SCHEDULE_AHEAD_TIME = 0.12; // seconds
const LOOKAHEAD = 25; // ms, how often the scheduler wakes up

// The click is already at 1.0 peak pre-gain, so raw gain has no headroom
// left to boost into -- pushing gain past 1.0 without a limiter just clips
// and sounds harsh. Route through a soft-clip curve so we can drive the
// gain well past unity (roughly doubling perceived loudness at full volume)
// while keeping the transient clean instead of distorted.
const VOLUME_BOOST = 2.2;

function makeSoftClipCurve(samples = 1024): Float32Array {
  const curve = new Float32Array(samples);
  const drive = 1.6;
  const norm = Math.tanh(drive);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / norm;
  }
  return curve;
}

export type BeatCallback = (beatIndex: number, beatTime: number) => void;

export class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private limiter: WaveShaperNode | null = null;
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
      this.gainNode.gain.value = this.volume * VOLUME_BOOST;
      this.limiter = this.ctx.createWaveShaper();
      this.limiter.curve = makeSoftClipCurve() as Float32Array<ArrayBuffer>;
      this.gainNode.connect(this.limiter);
      this.limiter.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.gainNode) this.gainNode.gain.value = v * VOLUME_BOOST;
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

    // Tone: a touch longer decay than a bare 60ms burst so the click has
    // real energy (RMS), not just peak amplitude -- a longer, richer body
    // reads as louder than a short blip even at the same peak level.
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = isAccent ? 1500 : 1000;
    const peak = isAccent ? 1.0 : 0.75;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(peak, time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    osc.connect(envelope);
    envelope.connect(gain);
    osc.start(time);
    osc.stop(time + 0.1);

    // Percussive transient: a very short noise "tick" layered under the
    // tone gives the click a sharp attack, which reads as louder/clearer
    // than a pure sine of the same amplitude.
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = isAccent ? 2200 : 1600;
    noiseFilter.Q.value = 0.8;
    const noiseEnvelope = ctx.createGain();
    noiseEnvelope.gain.setValueAtTime(isAccent ? 0.55 : 0.35, time);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseEnvelope);
    noiseEnvelope.connect(gain);
    noise.start(time);
    noise.stop(time + 0.02);

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
