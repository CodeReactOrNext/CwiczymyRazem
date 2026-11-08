/**
 * The setup's sustain test: one held note, followed exactly the way the tab
 * follows a note — the right pitch, above the sustain gate. How long it stays
 * followed is how far a tab note's green fill would get; if it drops out early,
 * the reading says why, so the player knows which gain to turn up.
 */
import { SUSTAIN_COMPLETE_SHARE } from "../../utils/sustainCredit";
import { CLIP_PEAK } from "./inputLevel";

/** How long the note is followed. */
export const SUSTAIN_TEST_MS = 2500;
/** Passing share — the same one that fills a tab note whole. */
export const SUSTAIN_PASS_SHARE = SUSTAIN_COMPLETE_SHARE;
/** Not followed for this long, the test is over. */
export const END_SILENCE_MS = 400;
/** Another note heard this long before the right one — tell the player. */
export const WRONG_NOTE_MS = 600;
/**
 * Gained level (volume units, RMS × 10) under which the processor's silence
 * gate drops the pitch altogether (guitarBufferProcessor VOLUME_THRESHOLD =
 * 0.001 RMS), with a little headroom. Below it the app's own gain is the fix.
 */
export const PROCESSOR_GATE_VOLUME = 0.012;
/**
 * Gained level that is as loud as the meter goes (volume refs clamp at 1 =
 * −20 dBFS RMS). A note sitting there for much of its length means the app's
 * gain is far past the auto-gain target, and the room's noise is being lifted
 * over the gates along with it.
 */
export const HOT_VOLUME = 0.99;
/** Share of the heard time at HOT_VOLUME that counts as too sensitive. */
export const HOT_SHARE = 0.4;

/** Why the note stopped being followed. */
export type DropCause =
  /** Signal there, but too quiet after the app's gain for the detector. */
  | "gain"
  /** The string itself fell to the room's noise — the interface's gain. */
  | "quiet"
  /** Loud enough, but the pitch wandered off the note. */
  | "pitch";

export type SustainOutcome =
  | "pass"
  | DropCause
  /** The input clipped — too loud before the app ever saw it. */
  | "clipping"
  /** The app's gain is so high the note pinned the meter. */
  | "too_hot";

export interface SustainFrame {
  /** Distance from the target note, or null with no pitch read. */
  cents: number | null;
  /** Raw (ungained) level — what the tab's gates read. */
  rawVolume: number;
  /** Level after the app's input gain. */
  gainedVolume: number;
  /** Loudest raw sample of the window — near 1 the input is clipping. */
  rawPeak: number;
  /** The tab's gate for starting a note and for keeping one alive. */
  attackGate: number;
  sustainGate: number;
  toleranceCents: number;
  dtMs: number;
}

export interface SustainState {
  phase: "waiting" | "holding" | "done";
  /** Since the note was first followed. */
  elapsedMs: number;
  /** How long it was followed for — the last moment it still was. */
  heardMs: number;
  silentMs: number;
  /** How long another note has been heard while waiting. */
  wrongMs: number;
  /** The reason the latest gap began. */
  lastCause: DropCause | null;
  /** The input clipped while the note was followed. */
  clipped: boolean;
  /** How long the note was followed with the gained level pinned at the top. */
  hotMs: number;
  outcome: SustainOutcome | null;
}

export const initialSustain = (): SustainState => ({
  phase: "waiting", elapsedMs: 0, heardMs: 0, silentMs: 0, wrongMs: 0, lastCause: null, clipped: false, hotMs: 0, outcome: null,
});

/**
 * A level problem outranks how long the note lasted: a clipped or pinned
 * signal can ring "to the end" and still be wrong for detection.
 */
function finish(state: SustainState, passed: boolean, cause: DropCause | null): SustainOutcome {
  if (state.clipped) return "clipping";
  if (state.heardMs > 0 && state.hotMs >= HOT_SHARE * state.heardMs) return "too_hot";
  return passed ? "pass" : (cause ?? "quiet");
}

export const isWrongNote = (state: SustainState) => state.phase === "waiting" && state.wrongMs >= WRONG_NOTE_MS;

/** Share of the test the note has been followed for, 0–1. */
export const sustainProgress = (state: SustainState) => Math.min(1, state.heardMs / SUSTAIN_TEST_MS);

const onPitch = (f: SustainFrame) => f.cents !== null && Math.abs(f.cents) <= f.toleranceCents;

function causeOf(f: SustainFrame): DropCause {
  if (f.rawVolume <= f.sustainGate) return "quiet";
  if (f.gainedVolume < PROCESSOR_GATE_VOLUME || f.cents === null) return "gain";
  return "pitch";
}

export function advanceSustain(state: SustainState, f: SustainFrame): SustainState {
  if (state.phase === "done") return state;

  if (state.phase === "waiting") {
    if (onPitch(f) && f.rawVolume > f.attackGate) {
      return {
        ...state, phase: "holding", elapsedMs: 0, heardMs: 0, silentMs: 0, wrongMs: 0,
        clipped: f.rawPeak >= CLIP_PEAK, hotMs: 0,
      };
    }
    const otherNote = f.cents !== null && !onPitch(f) && f.rawVolume > f.attackGate;
    return { ...state, wrongMs: otherNote ? state.wrongMs + f.dtMs : 0 };
  }

  const elapsedMs = state.elapsedMs + f.dtMs;
  const clipped = state.clipped || f.rawPeak >= CLIP_PEAK;
  if (onPitch(f) && f.rawVolume > f.sustainGate) {
    const heardMs = Math.min(SUSTAIN_TEST_MS, elapsedMs);
    const hotMs = state.hotMs + (f.gainedVolume >= HOT_VOLUME ? f.dtMs : 0);
    const next = { ...state, elapsedMs, heardMs, silentMs: 0, lastCause: null, clipped, hotMs };
    if (heardMs >= SUSTAIN_TEST_MS) return { ...next, phase: "done", outcome: finish(next, true, null) };
    return next;
  }

  const lastCause = state.silentMs === 0 ? causeOf(f) : (state.lastCause ?? causeOf(f));
  const silentMs = state.silentMs + f.dtMs;
  const next = { ...state, elapsedMs, silentMs, lastCause, clipped };
  if (silentMs < END_SILENCE_MS) return next;

  const passed = state.heardMs >= SUSTAIN_PASS_SHARE * SUSTAIN_TEST_MS;
  return { ...next, phase: "done", outcome: finish(next, passed, lastCause) };
}
