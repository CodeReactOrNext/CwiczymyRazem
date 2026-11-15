import { midiToFrequency, STANDARD_OPEN_STRING_MIDI } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { GUITAR_STRING_FREQS, GUITAR_STRING_MIDI } from "./audio.constants";

describe("guitar open strings", () => {
  it("cover every string a tuning knows, a seven-string's low B included", () => {
    const strings = Object.keys(STANDARD_OPEN_STRING_MIDI).map(Number);
    expect(GUITAR_STRING_MIDI).toEqual(strings.map((s) => STANDARD_OPEN_STRING_MIDI[s]));
    GUITAR_STRING_FREQS.forEach((freq, i) =>
      expect(freq).toBeCloseTo(midiToFrequency(GUITAR_STRING_MIDI[i]), 1));
    expect(GUITAR_STRING_FREQS).toHaveLength(GUITAR_STRING_MIDI.length);
  });
});
