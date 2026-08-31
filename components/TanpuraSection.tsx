"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistentState } from "@/lib/useLocalStorage";
import { getPitchById, DEFAULT_PITCH_ID } from "@/lib/pitches";
import { rampVolume } from "@/lib/rampVolume";
import TanpuraIllustration from "./TanpuraIllustration";
import PitchSelector from "./PitchSelector";
import VolumeSlider from "./VolumeSlider";
import PlayPauseButton from "./PlayPauseButton";

type TanpuraSettings = {
  pitchId: string;
  volume: number;
};

const DEFAULT_SETTINGS: TanpuraSettings = {
  pitchId: DEFAULT_PITCH_ID,
  volume: 0.7,
};

const SWITCH_RAMP_MS = 120;

export default function TanpuraSection() {
  const [settings, setSettings] = usePersistentState<TanpuraSettings>(
    "myriyaz:tanpura",
    DEFAULT_SETTINGS
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedFileRef = useRef<string | null>(null);
  const switchTokenRef = useRef(0);

  // Create the single audio element once, lazily on the client.
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.volume = settings.volume;
    audioRef.current = audio;

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setError(null);
    };
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError(
        "Tanpura audio couldn't be loaded. Please check your connection and try again."
      );
    };

    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureSourceLoaded = useCallback((file: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (loadedFileRef.current !== file) {
      audio.src = file;
      audio.load();
      loadedFileRef.current = file;
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    ensureSourceLoaded(getPitchById(settings.pitchId).file);
    try {
      setIsLoading(true);
      await audio.play();
      setIsPlaying(true);
      audio.volume = settings.volume;
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setError(
        "Tanpura audio couldn't be loaded. Please check your connection and try again."
      );
    }
  }, [ensureSourceLoaded, settings.pitchId, settings.volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  // Switch pitch. If currently playing, crossfade to the new source without
  // requiring the user to press stop/play again.
  const handlePitchChange = useCallback(
    async (pitchId: string) => {
      if (pitchId === settings.pitchId) return;
      const file = getPitchById(pitchId).file;
      const audio = audioRef.current;
      setSettings((prev) => ({ ...prev, pitchId }));

      if (!audio) return;
      const token = ++switchTokenRef.current;

      if (isPlaying) {
        await rampVolume(audio, 0, SWITCH_RAMP_MS);
        if (switchTokenRef.current !== token) return;
        audio.pause();
        audio.src = file;
        loadedFileRef.current = file;
        audio.load();
        try {
          setIsLoading(true);
          await audio.play();
          if (switchTokenRef.current !== token) return;
          setIsLoading(false);
          await rampVolume(audio, settings.volume, SWITCH_RAMP_MS);
        } catch {
          if (switchTokenRef.current !== token) return;
          setIsLoading(false);
          setIsPlaying(false);
          setError(
            "Tanpura audio couldn't be loaded. Please check your connection and try again."
          );
        }
      } else {
        loadedFileRef.current = null; // load on next play
      }
    },
    [isPlaying, settings.pitchId, settings.volume, setSettings]
  );

  const handleVolumeChange = useCallback(
    (volume: number) => {
      setSettings((prev) => ({ ...prev, volume }));
      if (audioRef.current) audioRef.current.volume = volume;
    },
    [setSettings]
  );

  // Media Session integration for lock-screen / hardware controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const pitch = getPitchById(settings.pitchId);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Tanpura — ${pitch.label}`,
      artist: "My Riyaz",
    });
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, [settings.pitchId, isPlaying, play, pause]);

  const pitch = getPitchById(settings.pitchId);

  return (
    <section
      aria-labelledby="tanpura-heading"
      className="flex w-full flex-col items-center gap-5 rounded-3xl bg-cream-soft/70 p-6 shadow-[0_2px_20px_rgba(93,59,37,0.08)] sm:p-8"
    >
      <TanpuraIllustration isPlaying={isPlaying} />

      <h2
        id="tanpura-heading"
        className="font-serif text-xl tracking-wide text-ink"
      >
        Tanpura
      </h2>

      <div className="flex w-full flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
          Pitch
        </span>
        <span className="font-serif text-2xl text-wood-dark">{pitch.label}</span>
      </div>

      <PitchSelector value={settings.pitchId} onChange={handlePitchChange} />

      <div className="w-full max-w-xs">
        <VolumeSlider
          label="Tanpura"
          value={settings.volume}
          onChange={handleVolumeChange}
        />
      </div>

      <PlayPauseButton
        isPlaying={isPlaying}
        isLoading={isLoading}
        onToggle={togglePlay}
        label="tanpura"
      />

      {error && (
        <p role="alert" className="text-center text-sm text-accent">
          {error}
        </p>
      )}
    </section>
  );
}
