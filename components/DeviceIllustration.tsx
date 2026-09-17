"use client";

import type { DeviceId } from "@/lib/devices";
import TanpuraIllustration from "./TanpuraIllustration";
import PadIllustration from "./PadIllustration";

type DeviceIllustrationProps = {
  deviceId: DeviceId;
  isPlaying: boolean;
};

export default function DeviceIllustration({
  deviceId,
  isPlaying,
}: DeviceIllustrationProps) {
  switch (deviceId) {
    case "major-pad":
      return <PadIllustration isPlaying={isPlaying} variant="major" />;
    case "minor-pad":
      return <PadIllustration isPlaying={isPlaying} variant="minor" />;
    default:
      return <TanpuraIllustration isPlaying={isPlaying} />;
  }
}
