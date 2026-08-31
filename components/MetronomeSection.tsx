"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistentState } from "@/lib/useLocalStorage";
import { MetronomeEngine } from "@/lib/metronomeEngine";
import {
  TIME_SIGNATURES,
  DEFAULT_TIME_SIGNATURE_ID,
  getTimeSignatureById,
} from "@/lib/timeSignatures";
import VolumeSlider from "./VolumeSlider";
import PlayPauseButton from "./PlayPauseButton";
import BeatDots from "./BeatDots";

type MetronomeSettings = {
  bpm: number;
  timeSignatureId: string;
  volume: number;
};

const DEFAULT_SETTINGS: MetronomeSettings = {
  bpm: 80,
  timeSignatureId: DEFAULT_TIME_SIGNATURE_ID,
  volume: 0.6,
};

const MIN_BPM = 30;
const MAX_BPM = 300;
const HOLD_REPEAT_DELAY_MS = 400;
const HOLD_REPEAT_INTERVAL_MS = 90;

export default function MetronomeSection() {
  const [settings, setSettings] = usePersistentState<MetronomeSettings>(
    "myriyaz:metronome",
    DEFAULT_SETTINGS
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<MetronomeEngine | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeSignature = getTimeSignatureById(settings.timeSignatureId);

  useEffect(() => {
    const engine = new MetronomeEngine();
    engine.onBeat = (beatIndex) => setActiveBeat(beatIndex);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.bpm = settings.bpm;
  }, [settings.bpm]);

  useEffect(() => {
    if (engineRef.current)
      engineRef.current.beatsPerBar = timeSignature.beatsPerBar;
  }, [timeSignature.beatsPerBar]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.setVolume(settings.volume);
  }, [settings.volume]);

  const togglePlay = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    setError(null);
    try {
      if (isPlaying) {
        engine.stop();
        setIsPlaying(false);
        setActiveBeat(null);
      } else {
        engine.bpm = settings.bpm;
        engine.beatsPerBar = timeSignature.beatsPerBar;
        engine.setVolume(settings.volume);
        await engine.start();
        setIsPlaying(true);
      }
    } catch {
      setError("Metronome audio couldn't start. Please try again.");
    }
  }, [isPlaying, settings.bpm, settings.volume, timeSignature.beatsPerBar]);

  const setBpm = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_BPM, Math.max(MIN_BPM, next));
      setSettings((prev) => ({ ...prev, bpm: clamped }));
    },
    [setSettings]
  );

  const stepBpm = useCallback(
    (delta: number) => setBpm(settings.bpm + delta),
    [setBpm, settings.bpm]
  );

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimeoutRef.current = null;
    holdIntervalRef.current = null;
  }, []);

  const startHold = useCallback(
    (delta: number) => {
      holdTimeoutRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(
          () => stepBpm(delta),
          HOLD_REPEAT_INTERVAL_MS
        );
      }, HOLD_REPEAT_DELAY_MS);
    },
    [stepBpm]
  );

  useEffect(() => clearHold, [clearHold]);

  return (
    <section
      aria-labelledby="metronome-heading"
      className="flex w-full flex-col items-center gap-5 rounded-3xl bg-cream-soft/70 p-6 shadow-[0_2px_20px_rgba(93,59,37,0.08)] sm:p-8"
    >
      <h2
        id="metronome-heading"
        className="font-serif text-xl tracking-wide text-ink"
      >
        Metronome
      </h2>

      <div className="flex flex-col items-center">
        <span className="font-serif text-5xl tabular-nums text-wood-dark">
          {settings.bpm}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
          BPM
        </span>
      </div>

      <div className="flex items-center gap-6">
        <BpmButton
          label="Decrease tempo"
          symbol="−"
          onPress={() => stepBpm(-1)}
          onHoldStart={() => startHold(-1)}
          onHoldEnd={clearHold}
          disabled={settings.bpm <= MIN_BPM}
        />
        <BpmButton
          label="Increase tempo"
          symbol="+"
          onPress={() => stepBpm(1)}
          onHoldStart={() => startHold(1)}
          onHoldEnd={clearHold}
          disabled={settings.bpm >= MAX_BPM}
        />
      </div>

      <div className="flex w-full flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
          Time signature
        </span>
        <label className="sr-only" htmlFor="time-signature">
          Time signature
        </label>
        <select
          id="time-signature"
          value={settings.timeSignatureId}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, timeSignatureId: e.target.value }))
          }
          className="h-11 rounded-xl border border-sand bg-cream-soft px-4 font-serif text-lg text-wood-dark"
        >
          {TIME_SIGNATURES.map((ts) => (
            <option key={ts.id} value={ts.id}>
              {ts.label}
            </option>
          ))}
        </select>
      </div>

      <BeatDots
        beatsPerBar={timeSignature.beatsPerBar}
        activeBeat={isPlaying ? activeBeat : null}
      />

      <div className="w-full max-w-xs">
        <VolumeSlider
          label="Metronome"
          value={settings.volume}
          onChange={(volume) => setSettings((prev) => ({ ...prev, volume }))}
        />
      </div>

      <PlayPauseButton
        isPlaying={isPlaying}
        onToggle={togglePlay}
        label="metronome"
      />

      {error && (
        <p role="alert" className="text-center text-sm text-accent">
          {error}
        </p>
      )}
    </section>
  );
}

function BpmButton({
  label,
  symbol,
  onPress,
  onHoldStart,
  onHoldEnd,
  disabled,
}: {
  label: string;
  symbol: string;
  onPress: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
      onPointerDown={onHoldStart}
      onPointerUp={onHoldEnd}
      onPointerLeave={onHoldEnd}
      className="flex h-14 w-14 select-none items-center justify-center rounded-full bg-cream-soft text-2xl font-semibold text-wood-dark shadow-[0_2px_8px_rgba(93,59,37,0.15)] transition-transform active:scale-95 disabled:opacity-40"
    >
      {symbol}
    </button>
  );
}
