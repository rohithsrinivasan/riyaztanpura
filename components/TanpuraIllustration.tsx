"use client";

type TanpuraIllustrationProps = {
  isPlaying: boolean;
};

export default function TanpuraIllustration({
  isPlaying,
}: TanpuraIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto h-40 w-40 sm:h-48 sm:w-48 ${
        isPlaying ? "animate-[sway_4.5s_ease-in-out_infinite]" : ""
      }`}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-sm">
        {/* resonator gourd */}
        <ellipse cx="100" cy="150" rx="46" ry="34" fill="#c98a52" />
        <ellipse cx="100" cy="150" rx="46" ry="34" fill="none" stroke="#8a5a3b" strokeWidth="2" />
        <ellipse cx="100" cy="140" rx="30" ry="18" fill="#e7b483" opacity="0.6" />

        {/* neck */}
        <rect x="94" y="18" width="12" height="120" rx="5" fill="#a5673f" />
        <rect x="94" y="18" width="12" height="120" rx="5" fill="none" stroke="#5d3b25" strokeWidth="1.5" />

        {/* tuning pegs */}
        <circle cx="88" cy="30" r="5" fill="#5d3b25" />
        <circle cx="112" cy="30" r="5" fill="#5d3b25" />
        <circle cx="88" cy="46" r="5" fill="#5d3b25" />
        <circle cx="112" cy="46" r="5" fill="#5d3b25" />

        {/* bridge */}
        <rect x="82" y="122" width="36" height="6" rx="2" fill="#5d3b25" />

        {/* strings */}
        {[86, 93, 100, 107, 114].map((x, i) => (
          <line
            key={x}
            x1={x}
            y1="24"
            x2={x}
            y2="126"
            stroke="#3a2c20"
            strokeWidth="1"
            opacity={isPlaying ? 0.55 : 0.35}
            className={isPlaying ? "animate-[stringshimmer_1.2s_ease-in-out_infinite]" : ""}
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}

        {/* decorative flourish on gourd */}
        <path
          d="M78 150 q22 -14 44 0"
          fill="none"
          stroke="#5d3b25"
          strokeWidth="1.5"
          opacity="0.5"
        />
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
            opacity: 0.35;
          }
          50% {
            opacity: 0.75;
          }
        }
      `}</style>
    </div>
  );
}
