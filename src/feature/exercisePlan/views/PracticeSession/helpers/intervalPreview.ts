import { playGuitarNotePreview } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";

// Melodic first (root, then the note the interval lands on), then the two
// together — the same way an ear-training app introduces an interval, so the
// answer is confirmed by sound and not only by a green tick.
const MELODIC_GAP_MS = 420;
const HARMONIC_DELAY_MS = 950;

/**
 * Sound a completed interval: root → target → both at once. Returns a cancel
 * function; call it when the panel unmounts or the prompt rotates, so a phrase
 * never keeps playing over the next round.
 */
export function playIntervalPhrase(rootMidi: number, targetMidi: number): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];

  playGuitarNotePreview(rootMidi, 1.3);
  timers.push(setTimeout(() => playGuitarNotePreview(targetMidi, 1.3), MELODIC_GAP_MS));
  timers.push(
    setTimeout(() => {
      // Quieter together than apart: two notes at full gain read as one loud
      // thump rather than as a chord.
      playGuitarNotePreview(rootMidi, 2.4, 0.7);
      playGuitarNotePreview(targetMidi, 2.4, 0.7);
    }, HARMONIC_DELAY_MS),
  );

  return () => timers.forEach(clearTimeout);
}
