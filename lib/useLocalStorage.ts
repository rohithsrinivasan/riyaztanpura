"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Persists a piece of state to localStorage under `key`.
 * Reads happen once on mount (client-only) so SSR output stays deterministic;
 * writes are debounced with a microtask so rapid updates (e.g. BPM taps) don't
 * thrash storage.
 */
export function usePersistentState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        setValue({ ...defaultValue, ...JSON.parse(raw) });
      }
    } catch {
      // ignore corrupt/unavailable storage
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota/unavailable storage errors
    }
  }, [key, value]);

  return [value, setValue] as const;
}
