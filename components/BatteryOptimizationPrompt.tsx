"use client";

import { useState } from "react";

export default function BatteryOptimizationPrompt() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-yellow-500/30 bg-yellow-50 p-4 text-sm text-yellow-800">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">⚡</span>
        <div className="flex-1">
          <p className="font-semibold">Battery optimization may pause audio</p>
          <p className="mt-1 text-xs">
            Some phones (Samsung, Xiaomi, etc.) aggressively restrict background apps.
            For best experience, disable battery optimization for this app in your device settings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="shrink-0 text-yellow-600 hover:text-yellow-700"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
