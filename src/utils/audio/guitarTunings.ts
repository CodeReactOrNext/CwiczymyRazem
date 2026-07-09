// Open-string MIDI note numbers, string 1 (high E) … string 6 (low E) —
// same order/convention as GUITAR_STRING_MIDI in useTablatureAudio/audio.constants.ts.
export type TuningStringMidi = [number, number, number, number, number, number];

export interface GuitarTuningPreset {
  id: string;
  name: string;
  /** Short notation, low string → high string (e.g. "D A D G B E"). */
  notation: string;
  stringMidi: TuningStringMidi;
}

export const DEFAULT_GUITAR_TUNING_ID = "standard";

export const GUITAR_TUNINGS: GuitarTuningPreset[] = [
  { id: "standard", name: "Standard", notation: "E A D G B E", stringMidi: [64, 59, 55, 50, 45, 40] },
  { id: "halfStepDown", name: "Half Step Down", notation: "Eb Ab Db Gb Bb Eb", stringMidi: [63, 58, 54, 49, 44, 39] },
  { id: "fullStepDown", name: "Full Step Down (D Standard)", notation: "D G C F A D", stringMidi: [62, 57, 53, 48, 43, 38] },
  { id: "dropD", name: "Drop D", notation: "D A D G B E", stringMidi: [64, 59, 55, 50, 45, 38] },
  { id: "dropCSharp", name: "Drop C#", notation: "C# G# C# F# A# D#", stringMidi: [63, 58, 54, 49, 44, 37] },
  { id: "dropC", name: "Drop C", notation: "C G C F A D", stringMidi: [62, 57, 53, 48, 43, 36] },
  { id: "openG", name: "Open G", notation: "D G D G B D", stringMidi: [62, 59, 55, 50, 43, 38] },
  { id: "openD", name: "Open D", notation: "D A D F# A D", stringMidi: [62, 57, 54, 50, 45, 38] },
  { id: "dadgad", name: "DADGAD", notation: "D A D G A D", stringMidi: [62, 57, 55, 50, 45, 38] },
];

export function getGuitarTuning(id: string | undefined | null): GuitarTuningPreset {
  return GUITAR_TUNINGS.find(tuning => tuning.id === id) ?? GUITAR_TUNINGS[0];
}
