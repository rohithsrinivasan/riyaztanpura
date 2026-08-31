/** Linearly ramps an <audio> element's volume to avoid audible clicks when switching sources. */
export function rampVolume(
  audio: HTMLAudioElement,
  to: number,
  durationMs: number
): Promise<void> {
  return new Promise((resolve) => {
    const from = audio.volume;
    const start = performance.now();
    const clampedTo = Math.min(1, Math.max(0, to));

    if (durationMs <= 0 || from === clampedTo) {
      audio.volume = clampedTo;
      resolve();
      return;
    }

    function step() {
      const elapsed = performance.now() - start;
      const progress = Math.min(1, elapsed / durationMs);
      audio.volume = from + (clampedTo - from) * progress;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}
