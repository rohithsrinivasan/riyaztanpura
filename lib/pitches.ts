export type Pitch = {
  id: string;
  label: string;
  file: string;
};

export const PITCHES: Pitch[] = [
  { id: "C", label: "C", file: "/audio/C.webm" },
  { id: "C#", label: "C#", file: "/audio/C-sharp.webm" },
  { id: "D", label: "D", file: "/audio/D.webm" },
  { id: "D#", label: "D#", file: "/audio/D-sharp.webm" },
  { id: "E", label: "E", file: "/audio/E.webm" },
  { id: "F", label: "F", file: "/audio/F.webm" },
  { id: "F#", label: "F#", file: "/audio/F-sharp.webm" },
  { id: "G", label: "G", file: "/audio/G.webm" },
  { id: "G#", label: "G#", file: "/audio/G-sharp.webm" },
  { id: "A", label: "A", file: "/audio/A.webm" },
  { id: "A#", label: "A#", file: "/audio/A-sharp.webm" },
  { id: "B", label: "B", file: "/audio/B.webm" },
];

export const DEFAULT_PITCH_ID = "C";

export function getPitchById(id: string): Pitch {
  return PITCHES.find((p) => p.id === id) ?? PITCHES[0];
}
