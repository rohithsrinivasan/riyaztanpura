"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistentState } from "@/lib/useLocalStorage";
import { useAudioPlaybackService } from "@/lib/useAudioPlaybackService";
import { getPitchById, getAdjacentPitchId, DEFAULT_PITCH_ID } from "@/lib/pitches";
import {
  getDeviceById,
  getAdjacentDeviceId,
  DEFAULT_DEVICE_ID,
  type DeviceId,
} from "@/lib/devices";
import { rampVolume } from "@/lib/rampVolume";
import DeviceIllustration from "./DeviceIllustration";
import PitchSelector from "./PitchSelector";
import VolumeSlider from "./VolumeSlider";
import PlayPauseButton from "./PlayPauseButton";

type TanpuraSettings = {
  deviceId: DeviceId;
  pitchId: string;
  volume: number;
};

const DEFAULT_SETTINGS: TanpuraSettings = {
  deviceId: DEFAULT_DEVICE_ID,
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

  const { startPlayback, stopPlayback } = useAudioPlaybackService();

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
        "Audio couldn't be loaded. Please check your connection and try again."
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
    const device = getDeviceById(settings.deviceId);
    ensureSourceLoaded(device.audioFile(settings.pitchId));
    try {
      setIsLoading(true);
      await audio.play();
      setIsPlaying(true);
      audio.volume = settings.volume;
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setError(
        `${device.label} audio couldn't be loaded. Please check your connection and try again.`
      );
    }
  }, [ensureSourceLoaded, settings.deviceId, settings.pitchId, settings.volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  // Switch device and/or pitch. If currently playing, crossfade to the new
  // source without requiring the user to press stop/play again.
  const switchAudio = useCallback(
    async (nextDeviceId: DeviceId, nextPitchId: string) => {
      if (nextDeviceId === settings.deviceId && nextPitchId === settings.pitchId) {
        return;
      }
      const device = getDeviceById(nextDeviceId);
      const file = device.audioFile(nextPitchId);
      const audio = audioRef.current;
      setSettings((prev) => ({
        ...prev,
        deviceId: nextDeviceId,
        pitchId: nextPitchId,
      }));

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
            `${device.label} audio couldn't be loaded. Please check your connection and try again.`
          );
        }
      } else {
        loadedFileRef.current = null; // load on next play
      }
    },
    [isPlaying, settings.deviceId, settings.pitchId, settings.volume, setSettings]
  );

  const handlePitchChange = useCallback(
    (pitchId: string) => switchAudio(settings.deviceId, pitchId),
    [switchAudio, settings.deviceId]
  );

  const handleDeviceChange = useCallback(
    (deviceId: DeviceId) => switchAudio(deviceId, settings.pitchId),
    [switchAudio, settings.pitchId]
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
    const device = getDeviceById(settings.deviceId);
    const pitch = getPitchById(settings.pitchId);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${device.label} — ${pitch.label}`,
      artist: "My Riyaz",
    });
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, [settings.deviceId, settings.pitchId, isPlaying, play, pause]);

  // Foreground service for background audio on Android.
  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  const device = getDeviceById(settings.deviceId);
  const pitch = getPitchById(settings.pitchId);

  return (
    <section
      aria-labelledby="device-heading"
      className="flex w-full flex-col items-center gap-5 rounded-3xl bg-cream-soft/70 p-6 shadow-[0_2px_20px_rgba(93,59,37,0.08)] sm:p-8"
    >
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          type="button"
          aria-label="Previous device"
          onClick={() =>
            handleDeviceChange(getAdjacentDeviceId(settings.deviceId, -1))
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-wood-dark transition-colors hover:bg-sand/60 active:scale-95"
        >
          <ChevronIcon direction="left" />
        </button>

        <DeviceIllustration deviceId={settings.deviceId} isPlaying={isPlaying} />

        <button
          type="button"
          aria-label="Next device"
          onClick={() =>
            handleDeviceChange(getAdjacentDeviceId(settings.deviceId, 1))
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-wood-dark transition-colors hover:bg-sand/60 active:scale-95"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <h2
        id="device-heading"
        className="font-serif text-xl tracking-wide text-ink"
      >
        {device.label}
      </h2>

      <div className="flex w-full flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
          Pitch
        </span>
        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label="Previous pitch"
            onClick={() =>
              handlePitchChange(getAdjacentPitchId(settings.pitchId, -1))
            }
            className="flex h-10 w-10 items-center justify-center rounded-full text-wood-dark transition-colors hover:bg-sand/60 active:scale-95"
          >
            <ChevronIcon direction="left" />
          </button>
          <span className="w-12 text-center font-serif text-3xl text-wood-dark">
            {pitch.label}
          </span>
          <button
            type="button"
            aria-label="Next pitch"
            onClick={() =>
              handlePitchChange(getAdjacentPitchId(settings.pitchId, 1))
            }
            className="flex h-10 w-10 items-center justify-center rounded-full text-wood-dark transition-colors hover:bg-sand/60 active:scale-95"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>

      <PitchSelector value={settings.pitchId} onChange={handlePitchChange} />

      <div className="w-full max-w-xs">
        <VolumeSlider
          label={device.label}
          value={settings.volume}
          onChange={handleVolumeChange}
        />
      </div>

      <PlayPauseButton
        isPlaying={isPlaying}
        isLoading={isLoading}
        onToggle={togglePlay}
        label={device.label.toLowerCase()}
      />

      {error && (
        <p role="alert" className="text-center text-sm text-accent">
          {error}
        </p>
      )}
    </section>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
