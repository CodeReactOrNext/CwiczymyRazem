// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { bendAndReleaseExercise } from "feature/exercisePlan/data/exerises/bendAndRelease/bendAndRelease";
import { firstBendExercise } from "feature/exercisePlan/data/exerises/firstBend/firstBend";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ScoringFocus } from "../utils/pitchScoring";
import { tempoScoreFactor } from "../utils/tempoScoreFactor";
import { TIMING_GRADE_POINTS } from "../utils/timingGrade";
import { useNoteMatching } from "./useNoteMatching";

// Drives the real matcher through the first two bars of "Bending — Slow
// Release" at 65 BPM with a scripted player: pick D4 on the G string and bend
// it a whole step, hold, release it slowly back down, then pick the same D4
// again on beat 4. The detector refs are written the way the DSP writes them.

const BPM = 65;
const BEAT_MS = 60000 / BPM;
const T0 = 1_000_000;
const D4 = 293.66;
const FRAME_MS = 10;

const BEND = "0-0-0";
const RELEASE = "0-1-0";
const STRAIGHT = "1-0-0";

interface Script {
  /** Cents off the whole-step target where the bend tops out. */
  bendPeakCents?: number;
  /** Cents off D4 where the release lands. */
  releaseLandCents?: number;
  /** How long the release takes, from beat 2. */
  releaseMs?: number;
  /** An attack the detector reports while the released string settles — the
   *  phantom that used to grade the next note as early. null = none. */
  phantomOnsetMs?: number | null;
  /** When the straight note is picked, relative to beat 4. null = never. */
  pickOffsetMs?: number | null;
}

const cents = (f: number, c: number) => f * Math.pow(2, c / 1200);

function pitchAt(ms: number, s: Required<Script>): number {
  const peak = cents(D4, 200 + s.bendPeakCents);
  const land = cents(D4, s.releaseLandCents);
  const releaseStart = 2 * BEAT_MS;
  if (ms < 0) return 0;
  if (ms < 250) return D4 * Math.pow(peak / D4, ms / 250);
  if (ms < releaseStart) return peak;
  if (ms < releaseStart + s.releaseMs) return peak * Math.pow(land / peak, (ms - releaseStart) / s.releaseMs);
  if (ms < 4.8 * BEAT_MS) return land;
  return 0;
}

/** Runs the real matcher over `tablature` against a scripted pitch curve and
 *  the attacks the player makes (ms after the downbeat). */
function drive(focus: ScoringFocus, tablature: TablatureMeasure[], pitchOf: (ms: number) => number, onsets: number[], churn = false) {
  const audioRefs = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 }, confidenceRef: { current: 0.9 },
    analyserRef: { current: null }, onsetChromaRef: { current: null }, noiseFloorRef: { current: 0 },
    noteEventsRef: { current: [] }, lastAttackMsRef: { current: 0 },
  } as unknown as AudioRefs;

  let now = T0;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { frames.set(nextFrame, cb); return nextFrame++; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { frames.delete(id); });

  // In the app the session hands the matcher a fresh audioRefs object on every
  // render, so its loop restarts all the time. `churn` does the same here.
  let getLatencyMs = () => 0;
  const getAdjustedTargetFreq = (_: number, f: number) => f;
  const { result, rerender } = renderHook(() => useNoteMatching({
    isPlaying: true, startTime: T0, effectiveBpm: BPM, rawBpm: BPM,
    activeTablature: tablature, isMicEnabled: true, currentExerciseIndex: 0,
    speedMultiplier: 1, getLatencyMs, audioRefs, getAdjustedTargetFreq, scoringFocus: focus,
  }));

  /** Plays the script up to `untilMs` after the downbeat, one frame at a time. */
  const playUntil = (untilMs: number) => {
    while (now - T0 < untilMs) {
      // One act per frame, so a re-render's effects run before the next frame
      // — the way the browser interleaves them.
      act(() => {
        now += FRAME_MS;
        const ms = now - T0;
        const freq = pitchOf(ms);
        audioRefs.frequencyRef.current = freq;
        audioRefs.rawVolumeRef.current = freq > 0 ? 0.3 : 0;
        for (const onset of onsets) {
          // The DSP stamps the block it saw the attack in; the precise time
          // goes to lastAttackMsRef.
          if (onset < ms && onset >= ms - FRAME_MS) {
            audioRefs.lastOnsetTimeRef.current = T0 + onset + 20;
            audioRefs.lastTickTimeRef.current = T0 + onset + 20;
            audioRefs.lastAttackMsRef!.current = T0 + onset;
          }
        }
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach((cb) => cb(now));
      });
      if (churn) {
        getLatencyMs = () => 0;
        act(() => rerender());
      }
    }
  };

  return { result, playUntil, audioRefs };
}

function setup(focus: ScoringFocus, script: Script) {
  const s: Required<Script> = {
    bendPeakCents: 0, releaseLandCents: 0, releaseMs: 1500, phantomOnsetMs: null, pickOffsetMs: 0,
    ...script,
  };
  const onsets = [0, s.phantomOnsetMs, s.pickOffsetMs === null ? null : 4 * BEAT_MS + s.pickOffsetMs]
    .filter((t): t is number => t !== null);
  return drive(focus, bendAndReleaseExercise.tablature!, (ms) => pitchAt(ms, s), onsets);
}

const points = (grade: 1 | 2 | 3) => Math.round(100 * tempoScoreFactor(BPM) * TIMING_GRADE_POINTS[grade]);

beforeEach(() => { vi.useRealTimers(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("useNoteMatching — a picked note after a release to the same pitch", () => {
  it("is not timed off an attack heard while the released string was still settling", () => {
    const { result, playUntil } = setup("timing", { phantomOnsetMs: 3350 });
    playUntil(5000);
    const timings = result.current.noteTimings;
    expect(result.current.hitNotes[STRAIGHT]).toBeTruthy();
    expect(timings[STRAIGHT].grade).toBe(3);
    expect(Math.abs(timings[STRAIGHT].offsetBeats ?? 1)).toBeLessThan(0.05);
  });

  it("still grades a genuinely late pick as late", () => {
    const { result, playUntil } = setup("timing", { phantomOnsetMs: 3350, pickOffsetMs: 150 });
    playUntil(5000);
    const timing = result.current.noteTimings[STRAIGHT];
    expect(timing.grade).toBe(2);
    expect(timing.offsetBeats).toBeGreaterThan(0);
  });

  it("is not credited from the ringing release when it is never picked", () => {
    const { result, playUntil } = setup("timing", { phantomOnsetMs: 3350, pickOffsetMs: null });
    playUntil(5000);
    expect(result.current.hitNotes[STRAIGHT]).toBeFalsy();
    expect(result.current.missedNotes[STRAIGHT]).toBe(true);
  });

  it("credits the release on pitch alone, without timing it", () => {
    const { result, playUntil } = setup("timing", {});
    playUntil(5000);
    expect(result.current.hitNotes[RELEASE]).toBeTruthy();
    expect(result.current.noteTimings[RELEASE]).toMatchObject({ grade: 3, offsetBeats: null });
  });
});

describe("useNoteMatching — run log", () => {
  it("keeps every graded note across loops, which the tab's hit marks don't", () => {
    // One bar: a D4 on beat 1, then three beats of rest — a loop every 4 beats.
    const bar: TablatureMeasure[] = [{
      timeSignature: [4, 4],
      beats: [{ duration: 1, notes: [{ string: 3, fret: 7 }] }, { duration: 3, notes: [] }],
    }];
    const loopMs = 4 * BEAT_MS;
    const pitchOf = (ms: number) => (ms % loopMs < 600 ? cents(D4, 10) : 0);
    const { result, playUntil } = drive("pitch", bar, pitchOf, [0, loopMs]);
    playUntil(2 * loopMs - 200);
    // The second pass has started over on the tab…
    expect(Object.keys(result.current.hitNotes)).toHaveLength(1);
    // …but the run remembers both notes, with what each was graded on.
    expect(result.current.runLogRef.current).toEqual([
      { hit: true, timingMs: 0, cents: 10 },
      { hit: true, timingMs: 0, cents: 10 },
    ]);
  });
});

describe("useNoteMatching — pitch-focused scoring", () => {
  it("scores a bend on how close it got and doesn't charge for timing", () => {
    const { result, playUntil } = setup("pitch", { bendPeakCents: -30, releaseLandCents: 5, pickOffsetMs: 150 });
    playUntil(5000);
    const timings = result.current.noteTimings;
    expect(timings[BEND].intonation).toEqual({ grade: 2, cents: -30 });
    expect(timings[RELEASE].intonation).toEqual({ grade: 3, cents: 5 });
    // Late, and shown as late — but scored on its pitch alone, which sat 5
    // cents sharp like the release it follows.
    expect(timings[STRAIGHT].grade).toBe(2);
    expect(timings[STRAIGHT].intonation).toEqual({ grade: 3, cents: 5 });
    expect(result.current.gameState.score).toBe(points(2) + points(3) + points(3));
    expect(result.current.intonationCountsRef.current).toEqual({ 3: 2, 2: 1, 1: 0 });
  });

  it("keeps every note's points while the session keeps re-rendering", () => {
    const { result, playUntil } = drive("pitch", bendAndReleaseExercise.tablature!, (ms) => pitchAt(ms, {
      bendPeakCents: -30, releaseLandCents: 5, releaseMs: 1500, phantomOnsetMs: null, pickOffsetMs: 0,
    }), [0, 4 * BEAT_MS], true);
    playUntil(5000);
    expect(result.current.gameState.score).toBe(points(2) + points(3) + points(3));
    expect(result.current.intonationCountsRef.current).toEqual({ 3: 2, 2: 1, 1: 0 });
  });

  it("banks the note still ringing when the run is summed up", () => {
    const { result, playUntil } = setup("pitch", { bendPeakCents: -30 });
    playUntil(1500); // mid-way through the bend's hold
    expect(result.current.gameState.score).toBe(0);
    let score = 0;
    act(() => { score = result.current.settlePendingIntonation(); });
    expect(score).toBe(points(2));
    expect(result.current.intonationCountsRef.current).toEqual({ 3: 0, 2: 1, 1: 0 });
  });

  it("gives an unbent bend the lowest grade, but still a hit", () => {
    const { result, playUntil } = setup("pitch", { bendPeakCents: -200 });
    playUntil(2000);
    expect(result.current.hitNotes[BEND]).toBeTruthy();
    expect(result.current.noteTimings[BEND].intonation).toEqual({ grade: 1, cents: null });
  });

  it("doesn't take the reference note still held through the attack for the bend", () => {
    // "First Whole Step": a reference E4 (G string, 9th fret) for two beats,
    // then the 7th fret bent up to it. Through the bend's attack the detector
    // still reports the reference — exactly the bend's target pitch.
    const E4 = 329.63;
    const bendAt = 2 * BEAT_MS;
    const peak = cents(E4, -30);
    const pitchOf = (ms: number) => {
      if (ms < bendAt + 60) return E4;
      if (ms < bendAt + 400) return D4 * Math.pow(peak / D4, (ms - bendAt - 60) / 340);
      if (ms < 4 * BEAT_MS - 50) return peak;
      return 0;
    };
    const { result, playUntil } = drive("pitch", firstBendExercise.tablature!, pitchOf, [0, bendAt]);
    playUntil(4 * BEAT_MS + 100);
    expect(result.current.noteTimings["0-1-0"].intonation).toEqual({ grade: 2, cents: -30 });
  });

  it("grades a held note on where its pitch sat, not on one lucky reading", () => {
    // The straight D4 is pressed sharp: it starts in tune for a moment (the
    // release it follows), then sits 30 cents high for the rest of the note.
    const sharp = cents(D4, 30);
    const pitchOf = (ms: number) => {
      const pickAt = 4 * BEAT_MS;
      if (ms < pickAt) return pitchAt(ms, { bendPeakCents: 0, releaseLandCents: 0, releaseMs: 1500, phantomOnsetMs: null, pickOffsetMs: 0 });
      if (ms < pickAt + 40) return D4;
      if (ms < 4.8 * BEAT_MS) return sharp;
      return 0;
    };
    const { result, playUntil } = drive("pitch", bendAndReleaseExercise.tablature!, pitchOf, [0, 4 * BEAT_MS]);
    playUntil(4 * BEAT_MS + 400);
    // While it rings, the tab's tuner reads it.
    expect(result.current.livePitchRef.current).toMatchObject({ noteKey: STRAIGHT, kind: "note", cents: 30 });
    playUntil(5 * BEAT_MS + 100);
    expect(result.current.noteTimings[STRAIGHT].intonation).toEqual({ grade: 2, cents: 30 });
  });

  it("shows no tuner where intonation isn't scored", () => {
    const { result, playUntil } = setup("timing", {});
    playUntil(4 * BEAT_MS + 400);
    expect(result.current.livePitchRef.current).toBeNull();
  });

  it("reports the bend under the cursor as it climbs", () => {
    const { result, playUntil } = setup("pitch", {});
    playUntil(125);
    const live = result.current.livePitchRef.current;
    expect(live).toMatchObject({ noteKey: BEND, kind: "bend" });
    expect(live!.amount).toBeGreaterThan(0.35);
    expect(live!.amount).toBeLessThan(0.65);
    playUntil(2 * BEAT_MS + 750);
    expect(result.current.livePitchRef.current).toMatchObject({ noteKey: RELEASE, kind: "release" });
  });
});
