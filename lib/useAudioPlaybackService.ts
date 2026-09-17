"use client";

import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";

export function useAudioPlaybackService() {
  const startPlayback = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { AudioPlayback } = await import("@capacitor/core");
        // @ts-ignore - custom plugin
        await AudioPlayback.startAudioPlayback();
      }
    } catch (error) {
      console.warn("Failed to start audio playback service:", error);
      // Non-critical error; app still works without native service
    }
  }, []);

  const stopPlayback = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { AudioPlayback } = await import("@capacitor/core");
        // @ts-ignore - custom plugin
        await AudioPlayback.stopAudioPlayback();
      }
    } catch (error) {
      console.warn("Failed to stop audio playback service:", error);
      // Non-critical error; app still works without native service
    }
  }, []);

  return { startPlayback, stopPlayback };
}
