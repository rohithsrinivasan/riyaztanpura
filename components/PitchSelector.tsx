"use client";

import { PITCHES } from "@/lib/pitches";

type PitchSelectorProps = {
  value: string;
  onChange: (pitchId: string) => void;
};

export default function PitchSelector({ value, onChange }: PitchSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tanpura pitch"
      className="grid w-full grid-cols-4 gap-2 sm:grid-cols-6"
    >
      {PITCHES.map((pitch) => {
        const selected = pitch.id === value;
        return (
          <button
            key={pitch.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(pitch.id)}
            className={`flex h-11 min-w-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
              selected
                ? "bg-wood text-cream-soft shadow-sm"
                : "bg-cream-soft text-ink-soft hover:bg-sand/70"
            }`}
          >
            {pitch.label}
          </button>
        );
      })}
    </div>
  );
}
