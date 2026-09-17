"use client";

type PadIllustrationProps = {
  isPlaying: boolean;
  variant: "major" | "minor";
};

/** Warm-pad visual sibling to TanpuraIllustration: same size, palette, and
 * sway/shimmer motion language, but a radiating-glow motif in place of the
 * instrument body. */
export default function PadIllustration({
  isPlaying,
  variant,
}: PadIllustrationProps) {
  const isMajor = variant === "major";
  const outerRing = isMajor ? "#c98a52" : "#8a5a3b";
  const midRing = isMajor ? "#e7b483" : "#a5673f";
  const core = isMajor ? "#eecfa0" : "#c98a52";

  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto h-40 w-40 sm:h-48 sm:w-48 ${
        isPlaying ? "animate-[sway_4.5s_ease-in-out_infinite]" : ""
      }`}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-sm">
        {/* radiating halo */}
        <circle cx="100" cy="100" r="72" fill={outerRing} opacity="0.16" />
        <circle cx="100" cy="100" r="54" fill={midRing} opacity="0.35" />

        {/* core */}
        <circle cx="100" cy="100" r="36" fill={core} />
        <circle
          cx="100"
          cy="100"
          r="36"
          fill="none"
          stroke="#5d3b25"
          strokeWidth="2"
        />
        <ellipse cx="100" cy="90" rx="18" ry="10" fill="#fff3e0" opacity="0.5" />

        {/* emanating rays, echoing the tanpura's shimmering strings */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 100 + 44 * Math.cos(rad);
          const y1 = 100 + 44 * Math.sin(rad);
          const x2 = 100 + 80 * Math.cos(rad);
          const y2 = 100 + 80 * Math.sin(rad);
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3a2c20"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity={isPlaying ? 0.5 : 0.3}
              className={
                isPlaying ? "animate-[stringshimmer_1.2s_ease-in-out_infinite]" : ""
              }
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          );
        })}
      </svg>

      <style jsx>{`
        @keyframes sway {
          0%,
          100% {
            transform: rotate(-1deg);
          }
          50% {
            transform: rotate(1deg);
          }
        }
        @keyframes stringshimmer {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
