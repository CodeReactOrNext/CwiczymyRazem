// Where in the tab the audio being judged is, while AlphaTab is the one making
// the sound — the hidden Guitar Pro player, or the notation view's own player.
//
// Neither loops on the metronome grid. AlphaSynth only reports a pass finished
// once its buffered tail has played out; the hidden player restarts it from
// there (stop + play), and the notation view's `isLooping` seeks back at the same
// moment. Either way every pass starts ~0.1 s later than the grid says (measured:
// 96 ms for a tab whose last bar is full of notes, plus the restart's own message
// hops). Judging on the grid alone put the expected notes that much further ahead
// of the music on every loop, until nothing scored at all.
//
// So the metronome anchor only covers the pass playback started in. Each restart
// hands in its own anchor (the AudioContext time of the restart), and between the
// end of a pass and that restart the position simply runs past the last beat —
// the audio has nothing left to play, and the last notes keep their late window.

/** Which AlphaTab instance plays the tab: the hidden GP player or the notation view's. */
export type AlphaTabSource = "player" | "notation";

export interface AlphaTabPassClock {
  /** Metronome anchor: AudioContext time of beat 0, back-dated by seeks and resumes. */
  base: number;
  /** Whole passes the metronome anchor already counts. A resume back-dates it by
   *  every loop played so far while the player seeks to the same spot in one pass,
   *  so this is set from the first position read after the anchor changes. */
  baseOffsetBeats: number | null;
  /** AudioContext times AlphaTab restarted the tab at, oldest first. */
  passStarts: number[];
}

/** How long past the last beat a restart may take before the tab is taken to
 *  have looped on its own after all (a player that never reports back). */
export const ALPHATAB_RESTART_GRACE_SEC = 1;

export function createAlphaTabPassClock(base: number): AlphaTabPassClock {
  return { base, baseOffsetBeats: null, passStarts: [] };
}

export function addAlphaTabPassStart(clock: AlphaTabPassClock, startSec: number): void {
  // A restart from before the anchor belongs to playback a seek already replaced.
  if (startSec <= clock.base || clock.passStarts.includes(startSec)) return;
  // Only the pass being judged and the one about to be need keeping.
  clock.passStarts = [...clock.passStarts, startSec].slice(-2);
}

/**
 * Beats into the current pass at `judgedSec` (AudioContext time of the audio being
 * judged — now, minus the input latency). Runs past `totalBeats` while a restart
 * is still due; negative just before a pass's first beat.
 *
 * A restart takes over `earlySec` before its own start, so the first note's early
 * window opens on time even though the previous pass's last note is still in its
 * late one. `toBeats` maps seconds since an anchor to beats (tempo automation).
 */
export function alphaTabPassBeats(
  clock: AlphaTabPassClock,
  judgedSec: number,
  toBeats: (elapsedSec: number) => number,
  totalBeats: number,
  earlySec: number,
  graceBeats: number,
): number {
  let anchor = clock.base;
  let offset = clock.baseOffsetBeats;
  for (const start of clock.passStarts) {
    if (judgedSec >= start - earlySec) { anchor = start; offset = 0; }
  }
  const beats = toBeats(judgedSec - anchor);
  if (offset === null) {
    offset = Math.max(0, Math.floor(beats / totalBeats)) * totalBeats;
    clock.baseOffsetBeats = offset;
  }
  const inPass = beats - offset;
  // No restart came: fall back to looping on the grid, as the synth path does.
  return inPass < totalBeats + graceBeats ? inPass : inPass % totalBeats;
}
