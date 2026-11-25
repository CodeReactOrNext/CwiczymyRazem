import { playChime } from "lib/uiSounds/uiSounds";
import { NOTES } from "utils/audio/noteUtils";

// C5: above the guitar notes the drills play, below where a bell turns shrill.
const CHIME_FLOOR_MIDI = 72;
const CHIME_GAIN = 0.08;

/** How long the solved chime is left alone before the interval is played back. */
export const ANSWER_CHIME_LEAD_MS = 320;

const frequencyOf = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/**
 * The reaction to a right answer, for the drills nothing listens to (a click is
 * the answer, so it cannot leak into a microphone). It is tuned to the note that
 * was found: a fixed pitch would clash with the interval the player is hearing.
 * One bell for half the round, the bell and its octave for the whole of it.
 */
export function playAnswerChime(note: string, solved: boolean): void {
  const pitchClass = NOTES.indexOf(note);
  if (pitchClass < 0) return;
  const freq = frequencyOf(CHIME_FLOOR_MIDI + pitchClass);
  playChime(
    solved
      ? [
          { freq, at: 0, length: 0.2 },
          { freq: freq * 2, at: 0.09, length: 0.4 },
        ]
      : [{ freq, at: 0, length: 0.22 }],
    CHIME_GAIN,
  );
}
