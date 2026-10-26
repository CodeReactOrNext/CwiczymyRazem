// @vitest-environment jsdom
//
// The opening of Dream Theater's "The Count of Tuscany" — a let-ring arpeggio,
// three or four strings sounding at every attack — played on a synthetic guitar
// and pushed through the real DSP, the real timed matcher and the real learn
// judge. The pitch detector follows the ringing bass: by pitch alone ~45% of the
// notes played right are credited on time and ~20% in learn mode.
//
// The attack route (attackTones.ts) may only add to that: every note the pitch
// credits must still count, and it must not add a single wrong note. Each run is
// therefore judged twice — as played, and with the attacks' spectra taken away,
// which is the pitch alone, as before.
//
// A synthetic guitar is a weak stand-in where it matters most: picking again a
// string that still rings changes a real string's spectrum less than this one's.
// A version that let the spectrum veto the pitch passed here and missed most of
// this passage on a real guitar — anything that can take a note away needs a
// real recording, not this.
//
// Strings are Karplus–Strong, started from the triangle a pick leaves (pick
// point and level vary per pluck, ±10 cents of tuning per string), thumb-heavy:
// the bass 0…-2 dB, the treble -3…-9 dB.

import { act, cleanup, renderHook } from "@testing-library/react";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import type { DetectedNoteEvent } from "hooks/guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "hooks/guitarBufferProcessor";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import type { Spectrum } from "utils/audio/chordTones";
import { midiToFrequency } from "utils/audio/noteUtils";
import { createPcmSpectrum } from "utils/audio/pcmSpectrum";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildLearnSteps, resolveLearnTargets } from "../utils/learnSteps";
import { createLearnJudge } from "./learnJudge";
import { useNoteMatching } from "./useNoteMatching";

const RATE = 48000;
const BPM = 100;
const BEAT_MS = 60000 / BPM;
const LEAD_MS = 600;
const FRAME_MS = 10;
const T0 = 1_000_000;
const OPEN = [0, 64, 59, 55, 50, 45, 40];

type Pos = [string: number, fret: number];
type Bar = { pos: Pos; dur: number }[];

/** Four bars of the intro: the bass moves G#2, B2, F#2, E2 under F#3, B3, A#3. */
const TUSCANY: Bar[] = ([[6, 4], [5, 2], [6, 2], [6, 0]] as Pos[]).map((bass) => {
  const half: Bar = [
    { pos: bass, dur: 0.5 }, { pos: [4, 4], dur: 0.5 }, { pos: [2, 0], dur: 1 }, { pos: [3, 3], dur: 0.5 }, { pos: [4, 4], dur: 0.5 },
  ];
  return [...half, ...half];
});
/** Eighths of one note on one string: every pick lands on its own ring. */
const REPEATED: Bar[] = Array.from({ length: 4 }, () => Array.from({ length: 12 }, () => ({ pos: [3, 2] as Pos, dur: 0.5 })));

const tablatureOf = (bars: Bar[]): TablatureMeasure[] => bars.map((beats) => ({
  timeSignature: [6, 4],
  beats: beats.map(({ pos: [string, fret], dur }) => ({ duration: dur, notes: [{ string, fret, midiNote: OPEN[string] + fret }] })),
})) as TablatureMeasure[];

interface Played { string: number; midi: number; atMs: number; key: string; bar: number }

/** What the player plays: the tab, with `instead` swapping in a wrong note here and there. */
function play(bars: Bar[], instead: (pos: Pos, index: number) => Pos | null = () => null): Played[] {
  const out: Played[] = [];
  let beat = 0;
  bars.forEach((beats, bar) => beats.forEach(({ pos, dur }, b) => {
    const [string, fret] = instead(pos, out.length) ?? pos;
    out.push({ string, midi: OPEN[string] + fret, atMs: LEAD_MS + beat * BEAT_MS, key: `${bar}-${b}-0`, bar });
    beat += dur;
  }));
  return out;
}

let seed = 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };

function pluck(out: Float32Array, startMs: number, freq: number, gain: number, stopMs: number) {
  const period = Math.max(2, Math.round(RATE / freq - 0.5));
  const line = new Float32Array(period);
  const at = 0.18 + rnd() * 0.1;
  let mean = 0;
  for (let i = 0; i < period; i++) {
    const x = i / period;
    line[i] = (x < at ? x / at : (1 - x) / (1 - at)) + 0.05 * (rnd() * 2 - 1);
    mean += line[i] / period;
  }
  let smooth = 0;
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < period; i++) line[i] = smooth = 0.6 * smooth + 0.4 * (line[i] - (pass === 0 ? mean : 0));
  const start = Math.round((startMs / 1000) * RATE);
  const stop = Math.round((stopMs / 1000) * RATE);
  for (let n = start, i = 0; n < out.length; n++) {
    const fade = n < stop ? 1 : Math.max(0, 1 - (n - stop) / (0.01 * RATE));
    if (fade === 0) break;
    const a = line[i];
    const b = line[(i + 1) % period];
    out[n] += gain * fade * a;
    line[i] = 0.997 * 0.5 * (a + b);
    i = (i + 1) % period;
  }
}

/**
 * Let ring: a string sounds until it is struck again, or until a bar that
 * doesn't use it begins. `mono` stops every note at the next one instead.
 */
function render(played: Played[], mono = false): Float32Array {
  const bars = played[played.length - 1].bar + 1;
  const audio = new Float32Array(Math.round(((played[played.length - 1].atMs + 1500) / 1000) * RATE));
  const detune = OPEN.map(() => (rnd() * 2 - 1) * 10);
  played.forEach((p, i) => {
    const next = played.slice(i + 1).find((q) => q.string === p.string);
    let stopMs = next ? next.atMs : Infinity;
    const usedNextBar = played.some((q) => q.bar === p.bar + 1 && q.string === p.string);
    if (!usedNextBar && p.bar + 1 < bars) stopMs = Math.min(stopMs, LEAD_MS + (p.bar + 1) * 6 * BEAT_MS);
    if (mono && played[i + 1]) stopMs = played[i + 1].atMs;
    const db = p.string >= 5 ? -2 * rnd() : -3 - 6 * rnd();
    pluck(audio, p.atMs, midiToFrequency(p.midi) * Math.pow(2, detune[p.string] / 1200), Math.pow(10, db / 20), stopMs);
  });
  let max = 0;
  for (const s of audio) max = Math.max(max, Math.abs(s));
  for (let i = 0; i < audio.length; i++) audio[i] = (audio[i] / max) * 0.25 + (rnd() * 2 - 1) * 0.0005;
  return audio;
}

interface Frame {
  now: number; freq: number; conf: number; volume: number; noiseFloor: number;
  lastOnset: number; lastTick: number; lastAttack: number;
  events: DetectedNoteEvent[]; spectrum: Spectrum | null;
}

let aubio: any = null;

/** The DSP's refs every FRAME_MS, as the matchers' frame loops see them. */
async function listen(audio: Float32Array): Promise<Frame[]> {
  if (!aubio) {
    const loaded: any = await import("aubiojs");
    aubio = await (loaded.default || loaded)();
  }
  const pcm = createPcmSpectrum(RATE);
  const targets = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 }, lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 },
    noiseFloorRef: { current: 0 }, noteEventsRef: { current: [] as DetectedNoteEvent[] }, lastAttackMsRef: { current: 0 },
  };
  let now = T0;
  const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
  const detectors = createGuitarDetectors(aubio, RATE);
  const process = createGuitarBufferProcessor({ detectors, targets, getGain: () => 3, sampleRate: RATE, spectrum: pcm });
  const frames: Frame[] = [];
  let fed = 0;
  for (let t = FRAME_MS; Math.round((t / 1000) * RATE) <= audio.length; t += FRAME_MS) {
    while (fed + 2048 <= Math.round((t / 1000) * RATE)) {
      now = T0 + ((fed + 2048) / RATE) * 1000;
      process(audio.subarray(fed, fed + 2048));
      fed += 2048;
    }
    now = T0 + t;
    frames.push({
      now, freq: targets.frequencyRef.current, conf: targets.confidenceRef.current,
      volume: targets.rawVolumeRef.current, noiseFloor: targets.noiseFloorRef.current,
      lastOnset: targets.lastOnsetTimeRef.current, lastTick: targets.lastTickTimeRef.current,
      lastAttack: targets.lastAttackMsRef.current,
      // By value: an attack's spectra land on its event later, and a frame
      // must not see what was only known after it.
      events: targets.noteEventsRef.current.map((event) => ({ ...event })),
      spectrum: pcm.read(),
    });
  }
  clock.mockRestore();
  for (const detector of Object.values(detectors)) (detector as { delete?: () => void })?.delete?.();
  return frames;
}

/** The notes the timed matcher credits, played along on the metronome. */
function timed(tablature: TablatureMeasure[], frames: Frame[]): Set<string> {
  let now = T0;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { callbacks.set(nextId, cb); return nextId++; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { callbacks.delete(id); });
  const refs = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 }, confidenceRef: { current: 0 },
    noiseFloorRef: { current: 0 }, noteEventsRef: { current: [] as DetectedNoteEvent[] }, lastAttackMsRef: { current: 0 },
    readSpectrum: (): Spectrum | null => null,
  };
  const { result, unmount } = renderHook(() => useNoteMatching({
    isPlaying: true, startTime: T0 + LEAD_MS, effectiveBpm: BPM, rawBpm: BPM, activeTablature: tablature,
    isMicEnabled: true, currentExerciseIndex: 0, speedMultiplier: 1, getLatencyMs: () => 0,
    audioRefs: refs as unknown as AudioRefs, getAdjustedTargetFreq: (_: number, f: number) => f,
  }));
  const totalBeats = tablature.reduce((sum, m) => sum + m.beats.reduce((s, b) => s + b.duration, 0), 0);
  const endMs = T0 + LEAD_MS + totalBeats * BEAT_MS - 50; // before the tab loops
  for (const f of frames) {
    if (f.now < T0 + LEAD_MS || f.now > endMs) continue;
    act(() => {
      now = f.now;
      refs.frequencyRef.current = f.freq; refs.rawVolumeRef.current = f.volume; refs.confidenceRef.current = f.conf;
      refs.lastOnsetTimeRef.current = f.lastOnset; refs.lastTickTimeRef.current = f.lastTick;
      refs.lastAttackMsRef.current = f.lastAttack; refs.noiseFloorRef.current = f.noiseFloor;
      refs.noteEventsRef.current = f.events; refs.readSpectrum = () => f.spectrum;
      const due = [...callbacks.values()];
      callbacks.clear();
      due.forEach((cb) => cb(now));
    });
  }
  const credited = new Set(Object.keys(result.current.hitNotes));
  unmount();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  return credited;
}

/** The notes learn mode accepts, each waited on from just before it is played until the next one is. */
function learned(tablature: TablatureMeasure[], tab: Played[], frames: Frame[]): Set<string> {
  const steps = buildLearnSteps(tablature);
  const accepted = new Set<string>();
  tab.forEach((p, i) => {
    if (i === 0) return; // waited on from the start, not right after a note
    const judge = createLearnJudge();
    const targets = resolveLearnTargets(steps[i], undefined, (_s, f) => f);
    let armed = false;
    for (const f of frames) {
      if (f.now < T0 + p.atMs - 20 || f.now >= T0 + (tab[i + 1]?.atMs ?? p.atMs + 600)) continue;
      const frame = {
        now: f.now, freq: f.freq, volume: f.volume, volumeGateBase: 0.005, lastOnsetMs: f.lastOnset,
        lastTickMs: f.lastTick, readSpectrum: () => f.spectrum, events: f.events, lastAttackMs: f.lastAttack,
      };
      if (!armed) { judge.arm(frame); armed = true; continue; }
      if (judge.judge(targets, frame)) { accepted.add(p.key); break; }
    }
  });
  return accepted;
}

const SEEDS = [0x5eed, 0xcafe];

/** Each run on its own synthetic guitar: the same seed, the same strings. */
async function perform(tab: Played[], runSeed: number, mono = false) {
  seed = runSeed;
  return listen(render(tab, mono));
}

const share = (part: number, whole: number) => part / whole;

/** The same run with the attacks' spectra taken away: the pitch alone, as before attackTones.ts. */
const pitchOnly = (frames: Frame[]): Frame[] =>
  frames.map((frame) => ({ ...frame, events: frame.events.map((event) => ({ ...event, attack: null })) }));

const missing = (from: Set<string>, all: Set<string>) => [...all].filter((key) => !from.has(key));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("a let-ring arpeggio (The Count of Tuscany)", () => {
  const tablature = tablatureOf(TUSCANY);
  const right = play(TUSCANY);

  it("credits every note played right the pitch credits, and more", async () => {
    let onTime = 0, inLearn = 0, onTimeBefore = 0, inLearnBefore = 0;
    for (const runSeed of SEEDS) {
      const frames = await perform(right, runSeed);
      const [now, before] = [timed(tablature, frames), timed(tablature, pitchOnly(frames))];
      const [learnNow, learnBefore] = [learned(tablature, right, frames), learned(tablature, right, pitchOnly(frames))];
      expect(missing(now, before)).toEqual([]);
      expect(missing(learnNow, learnBefore)).toEqual([]);
      onTime += now.size; onTimeBefore += before.size;
      inLearn += learnNow.size; inLearnBefore += learnBefore.size;
    }
    expect(onTime).toBeGreaterThan(onTimeBefore);
    expect(inLearn).toBeGreaterThan(inLearnBefore);
    expect(share(onTime, right.length * SEEDS.length)).toBeGreaterThanOrEqual(0.75);
    expect(share(inLearn, (right.length - 1) * SEEDS.length)).toBeGreaterThanOrEqual(0.75);
  }, 120_000);

  it.each([
    // A3 where the tab has A#3 (B3 ringing beside it), and the bass a fret high.
    ["a fret off", (([s, f]) => (s === 3 ? [3, 2] : s >= 5 ? [s, f + 1] : null)) as (pos: Pos, i: number) => Pos | null],
    // F3 on the A string where the second F#3 of each half-bar goes, the first
    // still ringing on the D string.
    ["over the right note still ringing", (([s], i) => (s === 4 && i % 5 === 4 ? [5, 8] : null)) as (pos: Pos, i: number) => Pos | null],
  ])("credits no wrong note played %s that the pitch alone wouldn't", async (_, instead) => {
    const wrongTab = play(TUSCANY, instead);
    const wrong = new Set(wrongTab.filter((p, i) => p.midi !== right[i].midi).map((p) => p.key));
    const wrongIn = (credited: Set<string>) => new Set([...credited].filter((key) => wrong.has(key)));
    for (const runSeed of SEEDS) {
      const frames = await perform(wrongTab, runSeed);
      expect(missing(wrongIn(timed(tablature, pitchOnly(frames))), wrongIn(timed(tablature, frames)))).toEqual([]);
      expect(missing(wrongIn(learned(tablature, right, pitchOnly(frames))), wrongIn(learned(tablature, right, frames)))).toEqual([]);
    }
  }, 120_000);
});

describe("one note at a time — as before", () => {
  it("credits a melody without let ring", async () => {
    const tablature = tablatureOf(TUSCANY);
    const tab = play(TUSCANY);
    for (const runSeed of SEEDS) {
      const frames = await perform(tab, runSeed, true);
      expect(timed(tablature, frames).size).toBeGreaterThanOrEqual(tab.length - 1);
    }
  }, 120_000);

  it("credits a note picked again while it still rings", async () => {
    const tablature = tablatureOf(REPEATED);
    const tab = play(REPEATED);
    for (const runSeed of SEEDS) {
      const frames = await perform(tab, runSeed, true);
      expect(timed(tablature, frames).size).toBeGreaterThanOrEqual(tab.length - 1);
      expect(learned(tablature, tab, frames).size).toBeGreaterThanOrEqual(tab.length - 2);
    }
  }, 120_000);
});
