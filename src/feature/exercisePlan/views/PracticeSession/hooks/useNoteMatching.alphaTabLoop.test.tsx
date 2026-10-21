// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { getFrequencyFromTab } from "utils/audio/noteUtils";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AlphaTabSource } from "./alphaTabPassClock";
import { useNoteMatching } from "./useNoteMatching";

// A tab looped by AlphaTab, played by someone who only listens. AlphaTab starts
// every pass ~0.1 s after the grid says it should (its buffered tail plays out
// first), and the player follows the music. Reported from Discord: after a few
// minutes nothing scored at all.

const BPM = 120;
const BEAT_SEC = 60 / BPM;
const FRETS = [5, 7, 8, 10];
const tab: TablatureMeasure[] = [{
  timeSignature: [4, 4],
  beats: FRETS.map((fret) => ({ duration: 1, notes: [{ string: 1, fret }] })),
}];
const PASS_SEC = FRETS.length * BEAT_SEC;
const SLIP_SEC = 0.1;
const T0 = 1_000_000;
const CTX0 = 5;
const FRAME_MS = 10;

/** One pass as it sounds: beat 0 would fall at `anchorSec`; beats [fromBeat, toBeat) play. */
interface HeardPass { anchorSec: number; fromBeat?: number; toBeat?: number }

interface Run {
  heard: HeardPass[];
  /** When AlphaTab reports starting the tab over (useAlphaTabPlayer / useAlphaTabApi). */
  restarts: number[];
  source: AlphaTabSource | null;
  /** The other AlphaTab takes the sound at `atSec` (notation view toggled). */
  switchTo?: { atSec: number; source: AlphaTabSource };
  latencySec?: number;
}

/** Plays the run and returns every graded attack's offset from its note, in ms. */
function play({ heard, restarts, source, switchTo, latencySec = 0.15 }: Run): number[] {
  const audioRefs = {
    frequencyRef: { current: 0 },
    volumeRef: { current: 0 },
    rawVolumeRef: { current: 0 },
    lastOnsetTimeRef: { current: 0 },
    lastTickTimeRef: { current: 0 },
    confidenceRef: { current: 0 },
    noiseFloorRef: { current: 0 },
    noteEventsRef: { current: [] },
    lastAttackMsRef: { current: 0 },
  } as unknown as AudioRefs;

  let now = T0;
  const ctxTime = () => CTX0 + (now - T0) / 1000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  const audioContext = { get currentTime() { return ctxTime(); } } as AudioContext;
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.set(nextFrame, cb);
    return nextFrame++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { frames.delete(id); });

  const { result, rerender } = renderHook(
    ({ alphaTabSource }: { alphaTabSource: AlphaTabSource | null }) => useNoteMatching({
      isPlaying: true,
      startTime: T0,
      audioContext,
      audioStartTime: CTX0,
      alphaTabSource,
      effectiveBpm: BPM,
      rawBpm: BPM,
      activeTablature: tab,
      isMicEnabled: true,
      currentExerciseIndex: 0,
      speedMultiplier: 1,
      getLatencyMs: () => latencySec * 1000,
      audioRefs,
      getAdjustedTargetFreq: (_: number, f: number) => f,
    }),
    { initialProps: { alphaTabSource: source } },
  );

  // Each note as the mic reports it: played with the audio, heard a latency later.
  const attacks = heard.flatMap(({ anchorSec, fromBeat = 0, toBeat = FRETS.length }) =>
    FRETS.slice(fromBeat, toBeat).map((fret, i) => ({
      atSec: anchorSec + (fromBeat + i) * BEAT_SEC + latencySec,
      freq: getFrequencyFromTab(1, fret),
    })));
  let nextAttack = 0;
  let nextRestart = 0;
  let switched = false;
  const endSec = Math.max(...attacks.map((a) => a.atSec)) + PASS_SEC;

  while (ctxTime() < endSec) {
    act(() => {
      now += FRAME_MS;
      if (switchTo && !switched && ctxTime() >= switchTo.atSec - 1e-9) {
        switched = true;
        rerender({ alphaTabSource: switchTo.source });
      }
      while (nextRestart < restarts.length && ctxTime() >= restarts[nextRestart] - 1e-9) {
        result.current.markAlphaTabPassStart();
        nextRestart++;
      }
      while (nextAttack < attacks.length && ctxTime() >= attacks[nextAttack].atSec - 1e-9) {
        audioRefs.frequencyRef.current = attacks[nextAttack].freq;
        audioRefs.rawVolumeRef.current = 0.3;
        audioRefs.lastOnsetTimeRef.current = now;
        audioRefs.lastAttackMsRef!.current = now;
        nextAttack++;
      }
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((cb) => cb(now));
    });
  }
  return [...result.current.timingOffsetsRef.current];
}

/** `count` whole passes, each starting a slip after the previous one ran out. */
function slippingPasses(count: number): { heard: HeardPass[]; restarts: number[] } {
  const anchors = Array.from({ length: count }, (_, k) => CTX0 + k * (PASS_SEC + SLIP_SEC));
  return { heard: anchors.map((anchorSec) => ({ anchorSec })), restarts: anchors.slice(1) };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useNoteMatching — a tab looped by AlphaTab", () => {
  const PASSES = 8;

  // With more input latency than slip the restart is known before the judged
  // audio gets there; with less, the pass has to wait past its end for it.
  it.each([
    ["player", 0.15], ["player", 0.03], ["notation", 0.15], ["notation", 0.03],
  ] as const)("stays on the music through every pass (%s, input latency %s s)", (source, latencySec) => {
    const offsets = play({ ...slippingPasses(PASSES), source, latencySec });
    expect(offsets).toHaveLength(PASSES * FRETS.length);
    for (const ms of offsets) expect(Math.abs(ms)).toBeLessThanOrEqual(FRAME_MS + 1);
  });

  it("falls a slip further behind every pass on the metronome grid alone", () => {
    // What the reported run did: each pass reads one slip later than the one
    // before, until the notes fall out of their windows altogether.
    const offsets = play({ ...slippingPasses(PASSES), source: null });
    offsets.forEach((ms, i) => {
      const pass = Math.floor(i / FRETS.length);
      expect(Math.abs(ms - pass * SLIP_SEC * 1000)).toBeLessThanOrEqual(FRAME_MS + 1);
    });
    expect(offsets.length).toBeLessThan(PASSES * FRETS.length);
  });

  it("picks up on the grid when the notation view takes over mid-pass", () => {
    // The hidden player's second pass is cut off half-way by opening the
    // notation view, which seeks to where the metronome says the session is —
    // the grid — and from there loops with its own slip.
    const switchSec = CTX0 + 2 * PASS_SEC - BEAT_SEC * 2;
    const offsets = play({
      source: "player",
      switchTo: { atSec: switchSec, source: "notation" },
      heard: [
        { anchorSec: CTX0 },
        { anchorSec: CTX0 + PASS_SEC + SLIP_SEC, toBeat: 2 },
        { anchorSec: CTX0 + PASS_SEC, fromBeat: 2 },
        { anchorSec: CTX0 + 2 * PASS_SEC + SLIP_SEC },
        { anchorSec: CTX0 + 3 * PASS_SEC + 2 * SLIP_SEC },
      ],
      restarts: [CTX0 + PASS_SEC + SLIP_SEC, CTX0 + 2 * PASS_SEC + SLIP_SEC, CTX0 + 3 * PASS_SEC + 2 * SLIP_SEC],
    });
    expect(offsets).toHaveLength(4 + 2 + 2 + 4 + 4);
    for (const ms of offsets) expect(Math.abs(ms)).toBeLessThanOrEqual(FRAME_MS + 1);
  });
});
