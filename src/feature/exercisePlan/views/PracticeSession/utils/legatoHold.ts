/**
 * How long a hammer-on or pull-off has to stay at its pitch before it counts —
 * the same bar a lesson sets (LEARN_HOLD_MS). A legato note has no attack to
 * prove it was played, and one reading at the right pitch proves very little:
 * a string pulled too far sweeps through it on the way back, a muted one
 * flickers there for a frame. A note that actually sounded is still there
 * 60 ms later.
 */
export const LEGATO_HOLD_MS = 60;

/** The parts of a tab note that make it legato. */
interface LegatoFlags {
  isHammerOn?: boolean;
  isPullOff?: boolean;
}

/** A note sounded by the fretting hand alone, out of a string already ringing. */
export const isLegatoNote = (note: LegatoFlags): boolean => !!note.isHammerOn || !!note.isPullOff;

/**
 * Follows, per legato note, since when its pitch has been sounding without a
 * break. That moment is the note's "attack": it says both whether the note
 * held (LEGATO_HOLD_MS) and when the fretting hand made the change, which is
 * what its timing is graded on. On the matcher's clock (already set back by
 * the analysis window) that moment needs no correction of its own: synthetic
 * slurs read within ±25 ms of the true change, median 2 ms
 * (guitarBufferProcessor.legato.test.ts).
 */
export function createLegatoHold() {
  const since = new Map<string, number>();
  return {
    /**
     * Feed every reading of the note's pitch. Returns when the pitch came up
     * (ms, the clock `now` is on) once it has held long enough, null before.
     */
    observe(noteKey: string, now: number, isSounding: boolean): number | null {
      if (!isSounding) {
        since.delete(noteKey);
        return null;
      }
      let start = since.get(noteKey);
      if (start === undefined) {
        start = now;
        since.set(noteKey, start);
      }
      return now - start >= LEGATO_HOLD_MS ? start : null;
    },
    /** The note is settled — hit or missed. */
    forget(noteKey: string) {
      since.delete(noteKey);
    },
    clear() {
      since.clear();
    },
  };
}
