import type { PreviewEvent } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";
import { playGuitarSequence } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";

// The phrase an ear-training app plays to introduce an interval: the two notes one
// after the other, then the two together. What makes it readable is the SILENCE
// around each step — it has to land as "one … two … both", not as a run of guitar
// notes, so every note is given room to decay before the next one starts, and the
// pair is set apart by a longer gap than the melodic step.
const ROOT_AT_SECONDS = 0;
const TARGET_AT_SECONDS = 0.62;
const HARMONIC_AT_SECONDS = 1.45;

const MELODIC_RING_SECONDS = 0.7;
const HARMONIC_RING_SECONDS = 1.5;
/** Barely a strum — enough that the pair reads as two notes rather than one thick one. */
const HARMONIC_SPREAD_SECONDS = 0.03;
/** Two notes at once are twice the energy; each is backed off to sit level with the singles. */
const HARMONIC_GAIN = 0.62;

/**
 * How long the phrase needs before it can be silenced without swallowing a note.
 * The closing pair is faded rather than left to ring all the way out: by this point
 * it has been sounding for a second, which is all it takes to register as a chord,
 * and holding the round open for the whole tail would only stall the drill.
 */
export const INTERVAL_PHRASE_HOLD_MS = 2500;

/**
 * The phrase as scheduled events — root, target, both — exported on its own so the
 * spacing can be asserted without a Web Audio context.
 */
export function intervalPhraseEvents(rootMidi: number, targetMidi: number): PreviewEvent[] {
  return [
    { midis: [rootMidi], at: ROOT_AT_SECONDS, duration: MELODIC_RING_SECONDS },
    { midis: [targetMidi], at: TARGET_AT_SECONDS, duration: MELODIC_RING_SECONDS },
    {
      midis: [rootMidi, targetMidi],
      at: HARMONIC_AT_SECONDS,
      duration: HARMONIC_RING_SECONDS,
      spread: HARMONIC_SPREAD_SECONDS,
      gain: HARMONIC_GAIN,
    },
  ];
}

/**
 * Sound a completed interval: root → target → both at once, scheduled on the audio
 * clock so the spacing is exact rather than whatever the timer queue got around to.
 * Returns a stop function that silences the phrase INCLUDING the notes already
 * ringing — call it when the panel unmounts or the prompt rotates, so a phrase never
 * plays on underneath the next round.
 */
export function playIntervalPhrase(rootMidi: number, targetMidi: number): () => void {
  return playGuitarSequence(intervalPhraseEvents(rootMidi, targetMidi));
}
