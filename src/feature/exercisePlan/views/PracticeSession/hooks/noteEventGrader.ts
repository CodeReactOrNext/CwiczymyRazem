// Assigns detected attacks (onset-anchored pitch events) to expected notes.
//
// Why an assignment and not a per-note lookup: pitch trails its attack by ~40 ms
// in the high register and ~105 ms in the low one (measured — see
// guitarBufferProcessor.fastruns.test.ts). Once notes are shorter than that lag,
// asking "does the pitch sounding right now match this note" reads the *previous*
// note's pitch, so notes get graded against their neighbour. Anchoring pitch to
// its onset fixes the timestamp, but leaves a residual ambiguity: within roughly
// one hit window, we genuinely cannot tell two adjacent attacks apart.
//
// So the tolerance for reordering is set by OUR measurement uncertainty, not by
// how forgiving we feel like being. Adjacent attacks inside `maxDeltaMs` may swap
// — we cannot observe that they did, and grading a player down for an error we
// cannot see produces a "miss" they have no way to make sense of. Attacks further
// apart than that are resolved perfectly well and are not forgiven at all.
//
// Timing still costs: each assignment reports its own |Δt| so the caller can rate
// the note's timing separately from whether it counted as a hit.
import type { DetectedNoteEvent } from "hooks/guitarBufferProcessor";
import { correctOctaveForLowStrings, getCentsDistance } from "utils/audio/noteUtils";

export interface ExpectedAttack {
  /** Caller's identity for the note (PracticeSession uses its noteKey). */
  key: string;
  /** When the attack is due, in the same ms domain as the events' onsetMs. */
  timeMs: number;
  /** Expected pitch in Hz. */
  targetFreq: number;
  /** Cents tolerance, already register-adjusted by the caller. */
  toleranceCents: number;
  /** Minimum peak volume for an attack to count as this note being played. */
  volumeGate: number;
}

export interface AttackAssignment {
  key: string;
  /** Index into the `events` array that was assigned. */
  eventIndex: number;
  /** Signed timing error in ms (positive = played late). */
  deltaMs: number;
}

/** True when `event` could plausibly be an attempt at `expected`. */
function isCandidate(event: DetectedNoteEvent, expected: ExpectedAttack, maxDeltaMs: number): boolean {
  if (Math.abs(event.onsetMs - expected.timeMs) > maxDeltaMs) return false;
  if (event.peakVolume < expected.volumeGate) return false;
  if (event.pitchHz <= 20) return false; // never resolved — no pitch to compare
  // Same low-string 2nd-harmonic correction the live path applies; it only ever
  // relaxes toward the target this note actually expects.
  const corrected = correctOctaveForLowStrings(event.pitchHz, expected.targetFreq);
  return Math.abs(getCentsDistance(corrected, expected.targetFreq)) <= expected.toleranceCents;
}

/**
 * Greedy minimum-|Δt| assignment. Every (event, expected) pair that passes the
 * pitch, volume and time-window gates is scored by |Δt| and taken cheapest-first,
 * skipping pairs whose event or expected note is already spoken for.
 *
 * Greedy rather than optimal (Hungarian) on purpose: the candidate sets here are
 * a handful of notes inside one hit window, where greedy and optimal agree, and
 * greedy stays deterministic and readable. It also gives the ordering behaviour
 * described above for free — an in-order reading has strictly smaller |Δt| than
 * the swapped one, so it wins whenever both are possible.
 *
 * One event can satisfy at most one note, which is what stops a single attack
 * from crediting a whole run of notes.
 */
export function assignAttacks(
  events: readonly DetectedNoteEvent[],
  expected: readonly ExpectedAttack[],
  maxDeltaMs: number,
): AttackAssignment[] {
  const pairs: AttackAssignment[] = [];
  for (let e = 0; e < events.length; e++) {
    for (const exp of expected) {
      if (!isCandidate(events[e], exp, maxDeltaMs)) continue;
      pairs.push({ key: exp.key, eventIndex: e, deltaMs: events[e].onsetMs - exp.timeMs });
    }
  }
  // Cheapest timing error first; ties broken by event order so the result never
  // depends on the input's incidental ordering.
  pairs.sort((a, b) => Math.abs(a.deltaMs) - Math.abs(b.deltaMs) || a.eventIndex - b.eventIndex);

  const usedEvents = new Set<number>();
  const usedKeys = new Set<string>();
  const out: AttackAssignment[] = [];
  for (const pair of pairs) {
    if (usedEvents.has(pair.eventIndex) || usedKeys.has(pair.key)) continue;
    usedEvents.add(pair.eventIndex);
    usedKeys.add(pair.key);
    out.push(pair);
  }
  return out;
}
