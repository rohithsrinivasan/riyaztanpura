"use client";

type BeatDotsProps = {
  beatsPerBar: number;
  activeBeat: number | null; // null when stopped
};

export default function BeatDots({ beatsPerBar, activeBeat }: BeatDotsProps) {
  return (
    <div
      role="status"
      aria-label={
        activeBeat != null
          ? `Beat ${activeBeat + 1} of ${beatsPerBar}`
          : "Metronome stopped"
      }
      className="flex flex-wrap items-center justify-center gap-2.5"
    >
      {Array.from({ length: beatsPerBar }).map((_, i) => {
        const isActive = activeBeat === i;
        const isDownbeat = i === 0;
        return (
          <span
            key={i}
            aria-hidden="true"
            className="rounded-full transition-all duration-100 ease-out"
            style={{
              width: isDownbeat ? 16 : 12,
              height: isDownbeat ? 16 : 12,
              backgroundColor: isActive
                ? "var(--color-accent)"
                : "var(--color-sand)",
              transform: isActive ? "scale(1.35)" : "scale(1)",
              boxShadow: isActive
                ? "0 0 0 6px rgba(181, 98, 47, 0.18)"
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}
