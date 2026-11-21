// @vitest-environment node
//
// The bass exercises, played with REAL bass notes: single finger-style notes
// from IDMT-SMT-Bass (Fraunhofer IDMT, Zenodo 7188892, CC BY-NC-ND — never
// commit its files), laid end to end along each exercise's own tab. Every
// note is the recording of that very string and fret, at the level the
// instrument gave it, so the strings keep their real balance and decay — which
// a synthesised line (guitarBufferProcessor.bassring.test.ts) can only guess at.
//
// Two ways of playing each line:
//   • ring — a string sounds until it is played again, the way a line comes out
//     when nothing is muted;
//   • damp — a note stops when the next one starts.
// Each at the exercise's recommended tempo and at its top one. The same playing
// is also held against a tab a fret or two off: what that credits is wrong.
//
// Skipped unless IDMT_BASS_DIR points at the dataset's PS/FS folder.
// Run (PowerShell, from a G:\ path):
//   $env:IDMT_BASS_DIR="G:/cw/sss/audio-testdata/IDMT-SMT-BASS/PS/FS"; $env:IDMT_REPORT="bass.txt"
//   npx vitest run src/hooks/guitarBufferProcessor.realbass.test.ts
// IDMT_BASS_VERBOSE=1 lists every note that went unheard.

import * as fs from "node:fs";
import * as path from "node:path";

import {
  bassBluesWalkExercise,
  bassEighthNoteDriveExercise,
  bassMajorScaleExercise,
  bassOctaveGrooveExercise,
  bassRootAndFifthExercise,
  bassWalkingLineExercise,
} from "feature/exercisePlan/data/exerises/bassFoundations/bassFoundations";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import type { ExpectedAttack } from "feature/exercisePlan/views/PracticeSession/hooks/noteEventGrader";
import { assignAttacks } from "feature/exercisePlan/views/PracticeSession/hooks/noteEventGrader";
import { correctOctaveForLowStrings, getBaseToleranceCents, getCentsDistance } from "utils/audio/noteUtils";
import { describe, expect, it, vi } from "vitest";

import type { DetectedNoteEvent } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";

const DIR = process.env.IDMT_BASS_DIR;
const REPORT = process.env.IDMT_REPORT;
const VERBOSE = process.env.IDMT_BASS_VERBOSE === "1";

const LEAD_SEC = 0.5;
const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
/** Bass open strings, string 1 (G) to 4 (E). */
const OPEN = [0, 43, 38, 33, 28];

function readWav(file: string): { sr: number; data: Float32Array } {
  const b = fs.readFileSync(file);
  let p = 12, sr = 44100, ch = 1, bits = 16;
  while (p < b.length - 8) {
    const id = b.toString("ascii", p, p + 4);
    const len = b.readUInt32LE(p + 4);
    if (id === "fmt ") { ch = b.readUInt16LE(p + 10); sr = b.readUInt32LE(p + 12); bits = b.readUInt16LE(p + 22); }
    if (id === "data") {
      const frames = Math.floor(len / (ch * bits / 8));
      const out = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        const o = p + 8 + i * ch * (bits / 8);
        out[i] = bits === 16 ? b.readInt16LE(o) / 32768 : bits === 24 ? b.readIntLE(o, 3) / 8388608 : b.readInt32LE(o) / 2147483648;
      }
      return { sr, data: out };
    }
    p += 8 + len + (len & 1);
  }
  throw new Error(`no data chunk in ${file}`);
}

interface Sample { data: Float32Array; attack: number; sr: number }

/** Level of one frequency in a stretch of signal (Goertzel). */
function levelAt(data: Float32Array, from: number, length: number, hz: number, sr: number): number {
  const coeff = 2 * Math.cos((2 * Math.PI * hz) / sr);
  let s1 = 0, s2 = 0;
  for (let i = from; i < Math.min(data.length, from + length); i++) {
    const s0 = data[i] + coeff * s1 - s2;
    s2 = s1; s1 = s0;
  }
  return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2));
}

/**
 * Whether the recording is the note its file name says. One set in the dataset
 * (BS_3_EQ_1, strings A to G) holds other notes than labelled — E2 under "A
 * string open" — and a line built from those says nothing about the detector.
 */
function soundsAs(sample: Sample, hz: number): boolean {
  const from = sample.attack + Math.round(0.05 * sample.sr);
  const comb = (f0: number) => [1, 2, 3, 4].reduce((sum, h) => sum + levelAt(sample.data, from, 16384, f0 * h, sample.sr), 0);
  const own = comb(hz);
  for (let semitones = -7; semitones <= 7; semitones++) {
    if (semitones !== 0 && comb(hz * Math.pow(2, semitones / 12)) > own) return false;
  }
  return true;
}
const sampleCache = new Map<string, Sample | null>();

/** The recording of `fret` on `string` (the app's numbering: 1 = G … 4 = E; the dataset's runs the other way). */
function sampleOf(bass: string, string: number, fret: number): Sample | null {
  const file = path.join(DIR!, `${bass}_FS_NO_${5 - string}_${fret}.wav`);
  if (sampleCache.has(file)) return sampleCache.get(file)!;
  let sample: Sample | null = null;
  if (fs.existsSync(file)) {
    const { sr, data } = readWav(file);
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    let attack = 0;
    while (attack < data.length && Math.abs(data[attack]) < 0.1 * peak) attack++;
    sample = { data, attack, sr };
    if (!soundsAs(sample, midiHz(OPEN[string] + fret))) sample = null;
  }
  sampleCache.set(file, sample);
  return sample;
}

interface LineNote { string: number; fret: number; atSec: number; lengthSec: number }

function lineOf(exercise: Exercise, bpm: number): LineNote[] {
  const beatSec = 60 / bpm;
  const out: LineNote[] = [];
  let beats = 0;
  for (const measure of exercise.tablature ?? []) {
    for (const beat of measure.beats) {
      const note = beat.notes[0];
      if (note) out.push({ string: note.string, fret: note.fret, atSec: beats * beatSec, lengthSec: beat.duration * beatSec });
      beats += beat.duration;
    }
  }
  return out;
}

function render(bass: string, line: LineNote[], ring: boolean): { signal: Float32Array; sr: number } | null {
  const first = sampleOf(bass, line[0].string, line[0].fret);
  if (!first) return null;
  const sr = first.sr;
  const last = line[line.length - 1];
  const out = new Float32Array(Math.round((LEAD_SEC + last.atSec + last.lengthSec + 1) * sr));
  const fade = Math.round(0.03 * sr);
  for (let i = 0; i < line.length; i++) {
    const note = line[i];
    const sample = sampleOf(bass, note.string, note.fret);
    if (!sample) return null;
    const start = Math.round((LEAD_SEC + note.atSec) * sr);
    // Where the note is stopped: the next note on its own string, or just the next note.
    const stopper = ring ? line.find((later, j) => j > i && later.string === note.string) : line[i + 1];
    const end = stopper ? Math.round((LEAD_SEC + stopper.atSec) * sr) : out.length;
    // From a little before the attack, so its own rise is all there.
    const pre = Math.min(sample.attack, Math.round(0.005 * sr));
    for (let n = -pre; start + n < Math.min(end + fade, out.length) && sample.attack + n < sample.data.length; n++) {
      const at = start + n;
      if (at < 0) continue;
      const gain = at > end ? Math.max(0, 1 - (at - end) / fade) : 1;
      out[at] += 0.3 * gain * sample.data[sample.attack + n];
    }
  }
  return { signal: out, sr };
}

let aubio: any = null;

interface Result { wrong: number; wrongByPitch: number; total: number; credited: number; viaLive: number; viaAttack: number; events: number; up: [number, number]; down: [number, number]; same: [number, number]; missed: string[] }

async function play(bass: string, line: LineNote[], ring: boolean, bpm: number): Promise<Result | null> {
  if (!aubio) {
    const loaded: any = await import("aubiojs");
    aubio = await (loaded.default || loaded)();
  }
  const rendered = render(bass, line, ring);
  if (!rendered) return null;
  const { signal, sr } = rendered;
  const detectors = createGuitarDetectors(aubio, sr);
  const targets = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 }, lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 },
    noiseFloorRef: { current: 0 }, noteEventsRef: { current: [] as DetectedNoteEvent[] },
  };
  const T0 = 1_000_000;
  let now = T0;
  const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
  const process = createGuitarBufferProcessor({ detectors, targets, getGain: () => 1, sampleRate: sr, isBass: () => true });
  const events: DetectedNoteEvent[] = [];
  const frames: { ms: number; hz: number; attack: number }[] = [];
  const step = (window: Float32Array) => {
    process(window);
    for (const event of targets.noteEventsRef.current) if (!events.includes(event)) events.push(event);
    frames.push({ ms: now, hz: targets.frequencyRef.current, attack: Math.max(targets.lastOnsetTimeRef.current, targets.lastTickTimeRef.current) });
  };
  for (let off = 0; off + 2048 <= signal.length; off += 2048) {
    now = T0 + ((off + 2048) / sr) * 1000;
    step(signal.subarray(off, off + 2048));
  }
  clock.mockRestore();
  for (const detector of Object.values(detectors)) (detector as { delete?: () => void })?.delete?.();

  // The session's own windows (useNoteMatching): how late a note may be credited,
  // and how recent an attack has to be for a live reading to count.
  const beatMs = 60000 / bpm;
  const windowMs = Math.min(420, Math.max(130, beatMs * 0.3)) + 50;
  const recencyMs = Math.min(800, Math.max(200, beatMs * 0.8));
  const expected: ExpectedAttack[] = line.map((note, i) => {
    const targetFreq = midiHz(OPEN[note.string] + note.fret);
    return {
      key: String(i), timeMs: T0 + (LEAD_SEC + note.atSec) * 1000, targetFreq,
      toleranceCents: getBaseToleranceCents(targetFreq), volumeGate: 0, readsAttack: true,
    };
  });
  const viaAttack = new Set(assignAttacks(events, expected, windowMs).map(a => a.key));
  const viaLive = new Set(expected.filter((e, i) => frames.some(frame => {
    if (frame.ms < e.timeMs || frame.ms > e.timeMs + line[i].lengthSec * 1000 + windowMs) return false;
    if (frame.ms - frame.attack >= recencyMs) return false;
    const heard = correctOctaveForLowStrings(frame.hz, e.targetFreq);
    return heard > 20 && Math.abs(getCentsDistance(heard, e.targetFreq)) <= e.toleranceCents;
  })).map(e => e.key));

  // The same playing held against a tab that asks for other notes: what gets
  // credited here is credited wrongly.
  let wrong = 0;
  let wrongByPitch = 0;
  for (const semitones of [-2, -1, 1, 2]) {
    const shifted = expected.map(e => {
      const targetFreq = e.targetFreq * Math.pow(2, semitones / 12);
      return { ...e, targetFreq, toleranceCents: getBaseToleranceCents(targetFreq) };
    });
    wrong += assignAttacks(events, shifted, windowMs).length;
    wrongByPitch += assignAttacks(events, shifted.map(e => ({ ...e, readsAttack: false })), windowMs).length;
  }

  const result: Result = { wrong, wrongByPitch, total: line.length, credited: 0, viaLive: viaLive.size, viaAttack: viaAttack.size, events: events.length, up: [0, 0], down: [0, 0], same: [0, 0], missed: [] };
  line.forEach((note, i) => {
    const hit = viaLive.has(String(i)) || viaAttack.has(String(i));
    const before = line[i - 1];
    // "Up" is toward the first (thinnest) string.
    const way = !before || before.string === note.string ? result.same : note.string < before.string ? result.up : result.down;
    way[1]++;
    if (hit) { result.credited++; way[0]++; } else result.missed.push(`${i}:${note.string}/${note.fret}`);
  });
  return result;
}

const EXERCISES: Exercise[] = [
  bassRootAndFifthExercise, bassEighthNoteDriveExercise, bassWalkingLineExercise,
  bassOctaveGrooveExercise, bassMajorScaleExercise, bassBluesWalkExercise,
];
const BASSES = ["BS_1_EQ_1", "BS_1_EQ_2", "BS_2_EQ_1", "BS_2_EQ_2", "BS_3_EQ_1", "BS_3_EQ_2"];

describe.skipIf(!DIR)("bass exercises on real bass notes (IDMT-SMT-Bass)", () => {
  it("credits the lines, going up the strings as well as down", async () => {
    const lines: string[] = [];
    const wrongTotals = [0, 0, 0, 0];
    const totals = { ring: { up: [0, 0], down: [0, 0], same: [0, 0] }, damp: { up: [0, 0], down: [0, 0], same: [0, 0] } };
    for (const exercise of EXERCISES) {
      for (const bpm of [exercise.metronomeSpeed?.recommended ?? 80, exercise.metronomeSpeed?.max ?? 140]) {
      const line = lineOf(exercise, bpm);
      for (const ring of [true, false]) {
        const sum = { total: 0, credited: 0, live: 0, attack: 0, events: 0, basses: 0, wrong: 0 };
        for (const bass of BASSES) {
          const result = await play(bass, line, ring, bpm);
          if (!result) continue;
          sum.basses++; sum.wrong += result.wrong; wrongTotals[ring ? 0 : 1] += result.wrong; wrongTotals[ring ? 2 : 3] += result.wrongByPitch;
          sum.total += result.total; sum.credited += result.credited; sum.live += result.viaLive; sum.attack += result.viaAttack; sum.events += result.events;
          const bucket = totals[ring ? "ring" : "damp"];
          for (const way of ["up", "down", "same"] as const) { bucket[way][0] += result[way][0]; bucket[way][1] += result[way][1]; }
          if (VERBOSE && result.missed.length) lines.push(`    ${bass} ${ring ? "ring" : "damp"} missed ${result.missed.join(" ")}`);
        }
        lines.push(`${exercise.id} @${bpm} ${ring ? "ring" : "damp"}: ${sum.credited}/${sum.total} (live ${sum.live}, attack ${sum.attack}, events ${sum.events}, wrong ${sum.wrong}/${4 * sum.total})`);
      }
      }
    }
    const share = ([hit, all]: number[]) => `${hit}/${all} ${all ? ((100 * hit) / all).toFixed(1) : "-"}%`;
    for (const mode of ["ring", "damp"] as const) {
      lines.push(`TOTAL ${mode}: up ${share(totals[mode].up)} | down ${share(totals[mode].down)} | same string ${share(totals[mode].same)}`);
    }
    const asked = 4 * (totals.ring.up[1] + totals.ring.down[1] + totals.ring.same[1]);
    lines.push(`WRONG NOTES credited (tab a fret or two off): ring ${wrongTotals[0]}/${asked}, damp ${wrongTotals[1]}/${asked}; by the pitch alone: ring ${wrongTotals[2]}, damp ${wrongTotals[3]}`);
    if (REPORT) fs.writeFileSync(REPORT, `${lines.join("\n")}\n`);

    const rate = ([hit, all]: number[]) => (all ? hit / all : 1);
    // Measured 2026-11-21 on five sets (three basses): damp 100% / 99.7% / 100%,
    // ring 97.8% up, 93.4% down, 98.6% on the same string; a tab a fret or two
    // off credited on 5.0% of the asks with the strings ringing and 1.4% damped,
    // nearly all of it by the pitch read, not by the attack's spectrum.
    // Before the bass window and the soft attacks: ring 93.3% / 94.2% / 98.8%,
    // and 28% of the wrong asks credited.
    expect(rate(totals.damp.up)).toBeGreaterThanOrEqual(0.98);
    expect(rate(totals.damp.down)).toBeGreaterThanOrEqual(0.98);
    expect(rate(totals.damp.same)).toBeGreaterThanOrEqual(0.98);
    expect(rate(totals.ring.up)).toBeGreaterThanOrEqual(0.95);
    expect(rate(totals.ring.down)).toBeGreaterThanOrEqual(0.9);
    expect(rate(totals.ring.same)).toBeGreaterThanOrEqual(0.96);
    expect(wrongTotals[0] / asked).toBeLessThanOrEqual(0.08);
    expect(wrongTotals[1] / asked).toBeLessThanOrEqual(0.03);
  }, 900_000);
});
