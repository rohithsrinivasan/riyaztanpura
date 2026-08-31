"use client";

type PlayPauseButtonProps = {
  isPlaying: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  label: string;
};

export default function PlayPauseButton({
  isPlaying,
  isLoading,
  onToggle,
  label,
}: PlayPauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      aria-pressed={isPlaying}
      aria-label={isLoading ? `${label} loading` : isPlaying ? `Pause ${label}` : `Play ${label}`}
      className="flex h-14 w-full max-w-[220px] items-center justify-center gap-2 rounded-full bg-wood px-8 text-base font-semibold tracking-wide text-cream-soft shadow-[0_4px_14px_rgba(93,59,37,0.28)] transition-transform active:scale-[0.97] disabled:opacity-60"
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cream-soft/40 border-t-cream-soft" />
      ) : isPlaying ? (
        <PauseIcon />
      ) : (
        <PlayIcon />
      )}
      <span>{isLoading ? "Loading…" : isPlaying ? "Pause" : "Play"}</span>
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4.5v15l14-7.5-14-7.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="4" width="5" height="16" rx="1" />
      <rect x="14" y="4" width="5" height="16" rx="1" />
    </svg>
  );
}
