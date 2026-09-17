import { PITCHES, getPitchById } from "./pitches";

export type DeviceId = "tanpura" | "major-pad" | "minor-pad";

export type Device = {
  id: DeviceId;
  label: string;
  /** Resolves the audio file URL for this device at a given pitch. */
  audioFile: (pitchId: string) => string;
};

/** Builds an audioFile resolver for the numbered "NN-<Pitch> <Suffix>.webm" pad sample naming. */
function padAudioFile(folder: string, suffix: string) {
  return (pitchId: string) => {
    const index = PITCHES.findIndex((p) => p.id === pitchId);
    const safeIndex = index === -1 ? 0 : index;
    const num = String(safeIndex + 1).padStart(2, "0");
    const name = `${num}-${PITCHES[safeIndex].label} ${suffix}.webm`;
    return `/${folder}/${encodeURIComponent(name)}`;
  };
}

// Ordered device list. Add or reorder devices here -- navigation wraps
// around this array by index, so no other logic needs to change.
export const DEVICES: Device[] = [
  {
    id: "tanpura",
    label: "Tanpura",
    audioFile: (pitchId) => getPitchById(pitchId).file,
  },
  {
    id: "major-pad",
    label: "Major Pad",
    audioFile: padAudioFile("audio-major", "Major Pad"),
  },
  {
    id: "minor-pad",
    label: "Minor Pad",
    audioFile: padAudioFile("audio-minor", "Minor Pad"),
  },
];

export const DEFAULT_DEVICE_ID: DeviceId = "tanpura";

export function getDeviceById(id: string): Device {
  return DEVICES.find((d) => d.id === id) ?? DEVICES[0];
}

export function getAdjacentDeviceId(id: string, direction: -1 | 1): DeviceId {
  const index = DEVICES.findIndex((d) => d.id === id);
  const safeIndex = index === -1 ? 0 : index;
  const nextIndex = (safeIndex + direction + DEVICES.length) % DEVICES.length;
  return DEVICES[nextIndex].id;
}
