// @vitest-environment node
//
// Real DI recordings through the shared guitar DSP — opt-in benchmark.
//
// Every other harness here plays synthetic plucks, whose pitch is exact by
// construction but whose spectrum is too tidy: a real humbucker DI has dozens of
// harmonics, a pickup-position comb, inharmonic partials and a pick transient.
// This one reads the IDMT-SMT-Guitar dataset (Fraunhofer IDMT, CC BY-NC-ND 4.0
// — never commit its files) from IDMT_DIR and grades each annotated note the way
// the app's three consumers would:
//
//   • tuner — share of readings during the sustain within ±50 c of the note
//   • hunt  — useNoteHunt's rule: the right pitch class, same octave, on two
//             50 ms samples in a row, at any point during the note
//   • event — an onset-anchored note event within 80 ms of the annotated onset
//             whose pitch is within 50 c
//
// Run:  IDMT_DIR=<…/IDMT-SMT-GUITAR_V2> npx vitest run src/hooks/guitarBufferProcessor.realdi.test.ts

import fs from "node:fs";
import path from "node:path";

import type { ExpectedAttack } from "feature/exercisePlan/views/PracticeSession/hooks/noteEventGrader";
import { assignAttacks } from "feature/exercisePlan/views/PracticeSession/hooks/noteEventGrader";
import { correctOctaveForLowStrings, getAdaptiveVolumeGate, getDetectionGates, getExpectationBiasedTolerance, getNoteFromFrequency, getSustainVolumeGate } from "utils/audio/noteUtils";
import { describe, expect, it, vi } from "vitest";

import type { DetectedNoteEvent } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";
import { getDecimationFactor } from "./guitarInputWorklet";

const DIR = process.env.IDMT_DIR;
const WINDOW = 2048;
const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const cents = (freq: number, target: number) => 1200 * Math.log2(freq / target);

interface AnnotatedNote { pitch: number; onset: number; offset: number }

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

function readNotes(xmlFile: string): AnnotatedNote[] {
  const xml = fs.readFileSync(xmlFile, "utf8");
  return [...xml.matchAll(/<event>([\s\S]*?)<\/event>/g)].map(([, body]) => ({
    pitch: Number(/<pitch>([\d.]+)</.exec(body)![1]),
    onset: Number(/<onsetSec>([\d.]+)</.exec(body)![1]),
    offset: Number(/<offsetSec>([\d.]+)</.exec(body)![1]),
  }));
}

/** Upsample by an integer factor (windowed-sinc), standing in for an interface
 *  running at 88.2/176.4 kHz — the worklet then averages it back down. */
function upsample(x: Float32Array, factor: number): Float32Array {
  if (factor === 1) return x;
  const taps = 32;
  const out = new Float32Array(x.length * factor);
  for (let n = 0; n < out.length; n++) {
    const t = n / factor;
    const i0 = Math.floor(t);
    let s = 0;
    for (let k = i0 - taps + 1; k <= i0 + taps; k++) {
      if (k < 0 || k >= x.length) continue;
      const d = t - k;
      const sinc = d === 0 ? 1 : Math.sin(Math.PI * d) / (Math.PI * d);
      const w = 0.5 + 0.5 * Math.cos((Math.PI * d) / taps);
      s += x[k] * sinc * w;
    }
    out[n] = s;
  }
  return out;
}

/** The worklet's decimation: average every `factor` samples. */
function decimate(x: Float32Array, factor: number): Float32Array {
  if (factor === 1) return x;
  const out = new Float32Array(Math.floor(x.length / factor));
  for (let i = 0; i < out.length; i++) {
    let s = 0;
    for (let j = 0; j < factor; j++) s += x[i * factor + j];
    out[i] = s / factor;
  }
  return out;
}

/** Results go to IDMT_REPORT (a file) when set — vitest swallows passing tests' logs. */
function report(...lines: string[]) {
  const text = lines.join("\n");
  if (process.env.IDMT_REPORT) fs.appendFileSync(process.env.IDMT_REPORT, `${text}\n`);
  else console.log(text);
}

let aubio: any = null;

export interface Trace { t: number; freq: number; vol: number; rawVol: number; floor: number; conf: number }

/** Runs a recording through the processor; returns the 50 ms trace and the events. */
async function run(signal: Float32Array, rate: number, gain: number) {
  if (!aubio) {
    const loaded: any = await import("aubiojs");
    aubio = await (loaded.default || loaded)();
  }
  const detectors = createGuitarDetectors(aubio, rate);
  const targets = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 }, lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 },
    noiseFloorRef: { current: 0 }, noteEventsRef: { current: [] as DetectedNoteEvent[] },
    lastAttackMsRef: { current: 0 },
  };
  const T0 = 1_000_000;
  let now = T0;
  const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
  const process = createGuitarBufferProcessor({ detectors, targets, getGain: () => gain, sampleRate: rate });
  // Blocks land every ~43 ms; the consumers sample every 50 ms and see the
  // latest block — record one trace point per block, they're close enough.
  const trace: Trace[] = [];
  for (let off = 0; off + WINDOW <= signal.length; off += WINDOW) {
    now = T0 + ((off + WINDOW) / rate) * 1000;
    process(signal.subarray(off, off + WINDOW));
    trace.push({
      t: (off + WINDOW) / rate, freq: targets.frequencyRef.current, vol: targets.volumeRef.current,
      rawVol: targets.rawVolumeRef.current, floor: targets.noiseFloorRef.current, conf: targets.confidenceRef.current,
    });
  }
  clock.mockRestore();
  for (const d of Object.values(detectors)) (d as { delete?: () => void })?.delete?.();
  const raw = targets.noteEventsRef.current;
  const events = raw.map(e => ({ t: (e.onsetMs - T0) / 1000, hz: e.pitchHz }));
  return { trace, events, raw, T0 };
}

interface Grade { tunerShare: number; hunt: boolean; event: boolean; wrong: string; /** Signed ms from the annotated onset to the nearest event (NaN if none within 300 ms). */ eventDelta: number; eventCents: number }

function grade(note: AnnotatedNote, trace: Trace[], events: { t: number; hz: number }[]): Grade {
  const f0 = midiHz(note.pitch);
  const truth = getNoteFromFrequency(f0)!;
  // Tuner: the sustain from 150 ms after the attack to the note's end.
  const sustain = trace.filter(p => p.t > note.onset + 0.15 && p.t < note.offset);
  const heard = sustain.filter(p => p.freq > 40 && p.vol > 0.005);
  const good = heard.filter(p => Math.abs(cents(correctOctaveForLowStrings(p.freq, f0), f0)) <= 50);
  const wrongNotes = new Map<string, number>();
  for (const p of heard) {
    if (Math.abs(cents(correctOctaveForLowStrings(p.freq, f0), f0)) > 50) {
      const n = getNoteFromFrequency(p.freq);
      const k = n ? `${n.note}${n.octave}` : "?";
      wrongNotes.set(k, (wrongNotes.get(k) ?? 0) + 1);
    }
  }
  // Hunt: same note + octave on 2 consecutive samples above the hunt's 0.01 gate.
  let streak = 0, hunt = false;
  for (const p of trace.filter(q => q.t > note.onset && q.t < note.offset + 0.1)) {
    const n = p.freq > 40 && p.vol > 0.01 ? getNoteFromFrequency(p.freq) : null;
    streak = n && n.note === truth.note && n.octave === truth.octave ? streak + 1 : 0;
    if (streak >= 2) { hunt = true; break; }
  }
  const event = events.some(e => Math.abs(e.t - note.onset) <= 0.08 && e.hz > 0 && Math.abs(cents(e.hz, f0)) <= 50);
  const near = events.filter(e => Math.abs(e.t - note.onset) <= 0.3).sort((a, b) => Math.abs(a.t - note.onset) - Math.abs(b.t - note.onset))[0];
  return {
    eventDelta: near ? (near.t - note.onset) * 1000 : NaN,
    eventCents: near && near.hz > 0 ? cents(near.hz, f0) : NaN,
    tunerShare: sustain.length ? good.length / sustain.length : 0,
    hunt, event,
    wrong: [...wrongNotes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${k}×${v}`).join(" "),
  };
}

/**
 * How far a held tab note's green fill gets — useNoteMatching's sustain rule:
 * past the hit, the fill advances only while rawVolume clears the volume gate
 * AND the pitch reads within tolerance, and it never rewinds, so it ends at the
 * last moment both held. `reach` is that moment as a share of the note,
 * `breakBy` what first stopped it.
 */
function sustainReach(f0: number, start: number, end: number, trace: Trace[]) {
  // The hit itself clears the attack gate; from then on the sustain gate applies.
  const holds = (p: Trace, held: boolean): "ok" | "volume" | "pitch" => {
    const base = held ? getSustainVolumeGate(p.floor, 0.005) : p.floor > 0 ? getAdaptiveVolumeGate(p.floor) : 0.005;
    if (p.rawVol <= getDetectionGates(f0, base).volumeGate) return "volume";
    const baseTol = f0 < 100 ? 70 : f0 < 165 ? 60 : 45;
    const tol = getExpectationBiasedTolerance(baseTol, p.conf);
    const freq = correctOctaveForLowStrings(p.freq, f0);
    return freq > 20 && Math.abs(cents(freq, f0)) <= tol ? "ok" : "pitch";
  };
  const span = trace.filter(p => p.t > start && p.t <= end);
  const hitAt = span.findIndex(p => holds(p, false) === "ok");
  if (hitAt < 0) return { reach: 0, breakBy: "never hit" };
  let last = span[hitAt].t;
  let breakBy = "";
  for (const p of span.slice(hitAt + 1)) {
    const h = holds(p, true);
    if (h === "ok") last = p.t;
    else if (!breakBy) breakBy = h;
  }
  // The last block before `end` covers up to one window past `last`.
  return { reach: Math.min(1, (last - start) / (end - start)), breakBy };
}

function sustainSummary(label: string, rows: { reach: number; breakBy: string }[]) {
  const reaches = rows.map(r => r.reach).sort((a, b) => a - b);
  const full = rows.filter(r => r.reach >= 0.9).length;
  const why = new Map<string, number>();
  for (const r of rows.filter(x => x.reach < 0.9)) why.set(r.breakBy, (why.get(r.breakBy) ?? 0) + 1);
  return `  sustain ${label}: ≥90% of the note ${full}/${rows.length}, median reach ${(reaches[reaches.length >> 1] * 100).toFixed(0)}%, ` +
    `p10 ${(reaches[Math.floor(rows.length * 0.1)] * 100).toFixed(0)}%  short ones stopped by: ${[...why].map(([k, v]) => `${k}×${v}`).join(" ") || "—"}`;
}

const name = (midi: number) => { const n = getNoteFromFrequency(midiHz(midi))!; return `${n.note}${n.octave}`; };

function collect(sub: string) {
  const root = path.join(DIR!, sub);
  const audio = path.join(root, "audio");
  return fs.readdirSync(audio).filter(f => f.endsWith(".wav")).map(f => ({
    wav: path.join(audio, f),
    xml: path.join(root, "annotation", f.replace(/\.wav$/, ".xml")),
  })).filter(x => fs.existsSync(x.xml));
}

/** IDMT_RATES=1,2,4 also runs each file upsampled ×2/×4 (an interface at 88.2/176.4 kHz) through the worklet's averaging. */
const UPS = (process.env.IDMT_RATES ?? "1").split(",").map(Number);
/** IDMT_LEVEL_DB=-20 plays every file that much quieter, with the input gain
 *  raised to match — an interface preamp set low, made up for by auto-gain. */
const LEVEL = Math.pow(10, Number(process.env.IDMT_LEVEL_DB ?? 0) / 20);
const atLevel = (x: Float32Array) => (LEVEL === 1 ? x : x.map(v => v * LEVEL));

const pct = (a: number, n: number) => `${((a / n) * 100).toFixed(1)}%`;
function deltaStats(deltas: number[]): string {
  const d = deltas.filter(x => !Number.isNaN(x)).sort((a, b) => a - b);
  if (!d.length) return "no events near onsets";
  const q = (p: number) => d[Math.min(d.length - 1, Math.floor(p * d.length))].toFixed(0);
  return `event Δ vs onset: p10 ${q(0.1)}  median ${q(0.5)}  p90 ${q(0.9)} ms (${d.length} found)`;
}

describe.skipIf(!DIR)("real DI recordings (IDMT-SMT-Guitar)", () => {
  for (const pickup of ["Ibanez Power Strat Clean Bridge HU", "Ibanez Power Strat Clean Neck HU"]) {
    it(`single notes — ${pickup}`, async () => {
      const files = collect(path.join("dataset1", pickup));
      for (const up of UPS) {
        const rows: string[] = [];
        const deltas: number[] = [];
        let tuner = 0, hunts = 0, evs = 0, n = 0;
        const held1s: { reach: number; breakBy: string }[] = [];
        const held2s: { reach: number; breakBy: string }[] = [];
        for (const { wav, xml } of files) {
          const { sr, data } = readWav(wav);
          const note = readNotes(xml)[0];
          const rate = sr * up;
          const dec = getDecimationFactor(rate);
          const signal = decimate(upsample(data, up), dec);
          const { trace, events } = await run(atLevel(signal), rate / dec, 1 / LEVEL);
          const g = grade(note, trace, events);
          tuner += g.tunerShare; hunts += +g.hunt; evs += +g.event; n++;
          deltas.push(g.eventDelta);
          // These notes ring out untouched for ~2.3 s — as a tab's half and whole note.
          const f0 = midiHz(note.pitch);
          held1s.push(sustainReach(f0, note.onset, note.onset + 1, trace));
          held2s.push(sustainReach(f0, note.onset, Math.min(note.offset, note.onset + 2), trace));
          if (g.tunerShare < 0.9 || !g.hunt) {
            rows.push(`  ${name(note.pitch).padEnd(4)} ${path.basename(wav).padEnd(24)} tuner ${(g.tunerShare * 100).toFixed(0).padStart(3)}%  hunt ${g.hunt ? "ok " : "MISS"}  ${g.wrong}`);
          }
        }
        report(`[${pickup} @ ${(44.1 * up).toFixed(1)}k] notes ${n}  tuner ${pct(tuner, n)}  hunt ${hunts}/${n}  event ${evs}/${n}`, `  ${deltaStats(deltas)}`,
          sustainSummary("1 s note", held1s), sustainSummary("2 s note", held2s), ...rows);
      }
      expect(true).toBe(true);
    }, 600_000);
  }

  it.skipIf(!process.env.IDMT_DEBUG)("debug one file", async () => {
    const wav = path.join(DIR!, process.env.IDMT_DEBUG!);
    const xml = wav.replace(/[\\/]audio[\\/]/, "/annotation/").replace(/\.wav$/, ".xml");
    const { sr, data } = readWav(wav);
    const notes = readNotes(xml);
    const { trace, events } = await run(data, sr, 1);
    const lines: string[] = [];
    for (const note of notes.slice(0, 8)) {
      const evs = events.filter(e => e.t > note.onset - 0.5 && e.t < note.offset + 0.3)
        .map(e => `${((e.t - note.onset) * 1000).toFixed(0)}ms/${e.hz > 0 ? name(Math.round(69 + 12 * Math.log2(e.hz / 440))) : "-"}`);
      const vol = trace.filter(p => p.t > note.onset - 0.2 && p.t < note.onset + 0.3)
        .map(p => `${((p.t - note.onset) * 1000).toFixed(0)}:${p.vol.toFixed(3)}`);
      lines.push(`${name(note.pitch)} on ${note.onset.toFixed(3)} off ${note.offset.toFixed(3)}  events [${evs.join(" ")}]`, `   vol ${vol.join(" ")}`);
    }
    report(...lines);
    expect(true).toBe(true);
  }, 120_000);

  it("fret runs 0–20 on each string", async () => {
    const files = collect("dataset2").filter(f => /_fret_0-20[.]wav$/.test(f.wav));
    const rows: string[] = [];
    const deltas: number[] = [];
    let n = 0, tuner = 0, hunts = 0, evs = 0, strays = 0, credited = 0, onTime = 0;
    const held: { reach: number; breakBy: string }[] = [];
    for (const { wav, xml } of files) {
      const { sr, data } = readWav(wav);
      const notes = readNotes(xml);
      const { trace, events, raw, T0 } = await run(atLevel(data), sr, 1 / LEVEL);
      // What the tab actually scores: the attack grader (useNoteMatching's
      // window for notes a second apart), each note due at its waveform attack
      // — this set annotates onsets ~40 ms early (see strays below).
      const expected: ExpectedAttack[] = notes.map((note, i) => {
        const f0 = midiHz(note.pitch);
        return {
          key: `n${i}`, timeMs: T0 + (note.onset + 0.04) * 1000, targetFreq: f0,
          toleranceCents: f0 < 100 ? 70 : f0 < 165 ? 60 : 45, volumeGate: 0.005, readsAttack: true,
        };
      });
      const assigned = assignAttacks(raw, expected, 300);
      credited += assigned.length;
      onTime += assigned.filter(a => Math.abs(a.deltaMs) <= 70).length;
      let ft = 0, fh = 0, fe = 0;
      const misses: string[] = [];
      for (const note of notes) {
        const g = grade(note, trace, events);
        ft += g.tunerShare; fh += +g.hunt; fe += +g.event;
        deltas.push(g.eventDelta);
        // Held from its waveform attack (+40 ms, see above) to where the player let go.
        held.push(sustainReach(midiHz(note.pitch), note.onset + 0.04, note.offset, trace));
        if (!g.hunt) misses.push(`${name(note.pitch)}(${g.wrong || "silent"})`);
      }
      n += notes.length; tuner += ft; hunts += fh; evs += fe;
      // An event with no attack near it — a fake onset the grader would take
      // for an early (or late) hit. This set's onsets are annotated ~40 ms
      // before the waveform's attack, hence the lopsided window.
      strays += events.filter(e => !notes.some(note => e.t - note.onset > -0.06 && e.t - note.onset < 0.14)).length;
      rows.push(`  ${path.basename(wav).padEnd(22)} tuner ${pct(ft, notes.length).padStart(6)}  hunt ${fh}/${notes.length}  event ${fe}/${notes.length}  ${misses.slice(0, 5).join(" ")}`);
    }
    report(`[fret runs] notes ${n}  tuner ${pct(tuner, n)}  hunt ${hunts}/${n}  event ${evs}/${n}  stray events ${strays}`, `  tab grader: credited ${credited}/${n}, on time (±70 ms) ${onTime}/${n}`, `  ${deltaStats(deltas)}`,
      sustainSummary("held to release", held), ...rows);
    expect(true).toBe(true);
  }, 600_000);
});
