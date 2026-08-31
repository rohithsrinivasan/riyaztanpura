"use client";

type VolumeSliderProps = {
  label: string;
  value: number; // 0..1
  onChange: (value: number) => void;
};

export default function VolumeSlider({
  label,
  value,
  onChange,
}: VolumeSliderProps) {
  const percent = Math.round(value * 100);
  const isMuted = value === 0;

  return (
    <div className="flex w-full items-center gap-3">
      <button
        type="button"
        aria-label={isMuted ? `Unmute ${label}` : `Mute ${label}`}
        onClick={() => onChange(isMuted ? 0.6 : 0)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-wood transition-colors hover:bg-sand/60"
      >
        <SpeakerIcon level={isMuted ? 0 : percent > 60 ? 2 : 1} />
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label={`${label} volume`}
        className="range-warm h-11 w-full flex-1"
      />
      <span className="w-9 shrink-0 text-right font-mono text-sm text-ink-soft tabular-nums">
        {percent}%
      </span>
      <style jsx>{`
        .range-warm {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        .range-warm::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--color-wood) 0%,
            var(--color-wood) ${percent}%,
            var(--color-sand) ${percent}%,
            var(--color-sand) 100%
          );
        }
        .range-warm::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-cream-soft);
          border: 2px solid var(--color-wood);
          margin-top: -8px;
          box-shadow: 0 1px 3px rgba(58, 44, 32, 0.25);
        }
        .range-warm::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: var(--color-sand);
        }
        .range-warm::-moz-range-progress {
          height: 6px;
          border-radius: 999px;
          background: var(--color-wood);
        }
        .range-warm::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-cream-soft);
          border: 2px solid var(--color-wood);
        }
      `}</style>
    </div>
  );
}

function SpeakerIcon({ level }: { level: 0 | 1 | 2 }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 9v6h4l5 5V4L7 9H3z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {level >= 1 && (
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {level >= 2 && (
        <path
          d="M19.2 6a9 9 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {level === 0 && (
        <path
          d="M16 9l4 6M20 9l-4 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
