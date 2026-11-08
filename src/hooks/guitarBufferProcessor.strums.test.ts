// @vitest-environment node
//
// Real strummed rhythm guitar through the onset detectors — opt-in benchmark.
//
// IDMT-SMT-Guitar dataset4 (Fraunhofer IDMT, CC BY-NC-ND 4.0 — never commit its
// files) has electric rhythm parts in several styles with every attack
// annotated, plus a beat grid (the chord annotation lists every beat). A strum
// on a beat is a down stroke; one halfway between two beats is the "and" — the
// up stroke of a down-up pattern.
//
// Each variant is graded twice: as raw detection (an annotated attack found
// within -60..+100 ms) and through useStrummingMatcher's rules — the grid cut
// into 8ths (16ths where the part has any), a slot is a strum when an attack
// lands within its tolerance and a rest otherwise, one verdict per slot.
//
// Variants: "method:threshold[:wN][:cN][:mN]" (aubio Onset; w adaptive
// whitening, c log compression, m min inter-onset ms), "a+b" for a union, and
// "strong|soft" for the matcher's split — the soft detector may credit a strum,
// never call a rest wrong.
//
// 2026-11-08, 62 takes (Career SG + Ibanez 2820, fast: country/folk, latin,
// metal, pop), matcher view:
//   hfc:0.3 (before)          on-beat 79.8%  off-beat 75.7%  (pop 98.1 / 81.8)  wrong on rests 3.6%
//   hfc:0.3|specflux:0.6      on-beat 93.7%  off-beat 94.1%  (pop 99.2 / 97.3)  wrong on rests 3.6%
//                             soft attack on a rest (would credit a skipped strum) 15.0%
//   specflux at 0.15 as soft: 96.4% / 95.9%, but 24.6% on rests. specflux alone as
//   strong: ~90% / 90%, and 22% of the rests called wrong (palm mutes ~150–200 ms
//   after a chord, fingers lifting ~100 ms before a change). No aubio setting
//   (thresholds, whitening, compression, other methods) and no high-band level
//   rise helped hfc: through a compressed or driven tone an up stroke raises the
//   level ×1.1–1.5 at most, only its spectrum changes.
//
// Run:  IDMT_DIR=<…/IDMT-SMT-GUITAR_V2> npx vitest run src/hooks/guitarBufferProcessor.strums.test.ts
//       STRUM_VARIANTS="hfc:0.3;hfc:0.3|specflux:0.6"  STRUM_VERBOSE=1 (misses per take)
//       STRUM_DEBUG="Ibanez 2820/pop/pop_1_160BPM" (every attack of one take)

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const DIR = process.env.IDMT_DIR;
const HOP = 512;
const WINDOW = 2048;

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

const readTimes = (file: string) => fs.readFileSync(file, "utf8").split(/\r?\n/)
  .map(l => parseFloat(l.split(/[\t,]/)[0])).filter(Number.isFinite);

type Kind = "down" | "up" | "16th" | "other";

/** Where an attack falls against the beat grid. */
function classify(t: number, beats: number[]): Kind | null {
  if (t < beats[0] - 0.08) return null; // count-in before the first chord
  let i = beats.findIndex((_, k) => k === beats.length - 1 || beats[k + 1] > t);
  if (i < 0) i = beats.length - 1;
  const span = i + 1 < beats.length ? beats[i + 1] - beats[i] : beats[i] - beats[i - 1];
  const phase = (t - beats[i]) / span;
  const near = (x: number) => Math.abs(phase - x) <= 0.1;
  if (near(0) || near(1) || phase < 0) return "down";
  if (near(0.5)) return "up";
  if (near(0.25) || near(0.75)) return "16th";
  return "other";
}

interface Track { name: string; wav: string; onsets: number[]; beats: number[] }

function collect(): Track[] {
  const out: Track[] = [];
  const root = path.join(DIR!, "dataset4");
  if (!fs.existsSync(root)) return out;
  for (const guitar of fs.readdirSync(root)) {
    const fast = path.join(root, guitar, "fast");
    if (!fs.existsSync(fast)) continue;
    for (const style of fs.readdirSync(fast)) {
      const audio = path.join(fast, style, "audio");
      if (!fs.existsSync(audio)) continue;
      for (const f of fs.readdirSync(audio).filter(x => x.endsWith(".wav"))) {
        const base = f.replace(/\.wav$/, "");
        const on = path.join(fast, style, "annotation", "onsets", `${base}.txt`);
        const ch = path.join(fast, style, "annotation", "chords", `${base}.csv`);
        if (!fs.existsSync(on) || !fs.existsSync(ch)) continue;
        out.push({ name: `${guitar}/${style}/${base}`, wav: path.join(audio, f), onsets: readTimes(on), beats: readTimes(ch) });
      }
    }
  }
  return out;
}

let aubio: any = null;
async function loadAubio() {
  if (!aubio) {
    const loaded: any = await import("aubiojs");
    aubio = await (loaded.default || loaded)();
  }
  return aubio;
}

/** aubiojs binds a few of these names with a trailing space. */
const call = (o: any, name: string, v: number | boolean) => (o[name] ?? o[`${name} `]).call(o, v);

function makeDetector(a: any, spec: string, sr: number) {
  const [method, threshold, ...opts] = spec.split(":");
  const o = new a.Onset(method, WINDOW, HOP, sr);
  o.setThreshold(Number(threshold));
  for (const opt of opts) {
    const v = Number(opt.slice(1));
    if (opt[0] === "w") call(o, "setAwhitening", v > 0);
    if (opt[0] === "c") call(o, "setCompression", v);
    if (opt[0] === "m") call(o, "setMinioiMs", v);
  }
  return o;
}

/** Attacks one aubio detector reports, dated like the processor's: the hop's
 *  end, back by the analysis window. */
function aubioTimes(a: any, spec: string, signal: Float32Array, sr: number): number[] {
  const o = makeDetector(a, spec, sr);
  const times: number[] = [];
  for (let off = 0; off + HOP <= signal.length; off += HOP) {
    if (o.do(signal.subarray(off, off + HOP))) times.push((off + HOP - WINDOW) / sr);
  }
  o.delete?.();
  return times;
}

/** A union of detectors: reports less than 30 ms apart are one attack. */
function unionTimes(a: any, spec: string, signal: Float32Array, sr: number): number[] {
  const all = spec.split("+").flatMap(p => aubioTimes(a, p, signal, sr)).sort((x, y) => x - y);
  const merged: number[] = [];
  for (const t of all) if (!merged.length || t - merged[merged.length - 1] >= 0.03) merged.push(t);
  return merged;
}

interface Variant { label: string; strong: string; soft?: string }

const VARIANTS: Variant[] = (process.env.STRUM_VARIANTS ?? "hfc:0.3;hfc:0.3|specflux:0.6")
  .split(";").map(label => ({ label, strong: label.split("|")[0], soft: label.split("|")[1] }));

const emptySim = () => ({ onBeat: [0, 0], offBeat: [0, 0], wrong: [0, 0], softRest: [0, 0] });
type Sim = ReturnType<typeof emptySim>;

/** useStrummingMatcher's verdicts on this take (see the header). */
function simulateMatcher(t: Track, strong: number[], soft: number[]): Sim {
  const sub = t.onsets.some(on => classify(on, t.beats) === "16th") ? 4 : 2;
  const slots: { at: number; tol: number; strum: boolean; offbeat: boolean }[] = [];
  for (let i = 0; i + 1 < t.beats.length; i++) {
    const span = (t.beats[i + 1] - t.beats[i]) / sub;
    for (let j = 0; j < sub; j++) {
      const at = t.beats[i] + j * span, tol = span * 0.37;
      slots.push({ at, tol, strum: t.onsets.some(on => Math.abs(on - at) <= tol), offbeat: j > 0 });
    }
  }
  const judged = new Map<number, "hit" | "wrong">();
  const softOnRest = new Set<number>();
  const reports = [...strong.map(x => ({ x, soft: false })), ...soft.map(x => ({ x, soft: true }))].sort((p, q) => p.x - q.x);
  for (const { x, soft: isSoft } of reports) {
    let k = -1;
    for (let i = 0; i < slots.length; i++) if (k < 0 || Math.abs(slots[i].at - x) < Math.abs(slots[k].at - x)) k = i;
    if (k < 0 || Math.abs(slots[k].at - x) > slots[k].tol || judged.has(k)) continue;
    // A soft attack may credit a strum, never call a rest wrong. One that lands
    // on a rest is what would credit a strum the player skipped.
    if (isSoft && !slots[k].strum) { softOnRest.add(k); continue; }
    judged.set(k, slots[k].strum ? "hit" : "wrong");
  }
  const strums = slots.filter(sl => sl.strum);
  const rests = slots.length - strums.length;
  const hitOn = (off: boolean) => slots.filter((sl, i) => sl.strum && sl.offbeat === off && judged.get(i) === "hit").length;
  return {
    onBeat: [hitOn(false), strums.filter(sl => !sl.offbeat).length],
    offBeat: [hitOn(true), strums.filter(sl => sl.offbeat).length],
    wrong: [[...judged.values()].filter(v => v === "wrong").length, rests],
    softRest: [[...softOnRest].filter(k => !judged.has(k)).length, rests],
  };
}

const pct = (a: number, n: number) => (n ? `${((a / n) * 100).toFixed(1)}%` : "—");
const simLine = (s: Sim) => `on-beat ${pct(s.onBeat[0], s.onBeat[1])}  off-beat (up) ${pct(s.offBeat[0], s.offBeat[1])}  ` +
  `wrong on rests ${pct(s.wrong[0], s.wrong[1])}  soft on rests ${pct(s.softRest[0], s.softRest[1])}`;

function report(...lines: string[]) {
  const text = lines.join("\n");
  if (process.env.IDMT_REPORT) fs.appendFileSync(process.env.IDMT_REPORT, `${text}\n`);
  else console.log(text);
}

describe.skipIf(!DIR)("strummed rhythm guitar (IDMT-SMT-Guitar dataset4)", () => {
  it("finds the down and the up strokes", async () => {
    const a = await loadAubio();
    const tracks = collect();
    expect(tracks.length).toBeGreaterThan(0);
    const signals = tracks.map(t => ({ t, ...readWav(t.wav) }));
    const MATCH_EARLY = 0.06, MATCH_LATE = 0.1, DOUBLE_S = 0.16;
    for (const v of VARIANTS) {
      const found: Record<Kind, number> = { down: 0, up: 0, "16th": 0, other: 0 };
      const total: Record<Kind, number> = { down: 0, up: 0, "16th": 0, other: 0 };
      let strays = 0, doubles = 0, detections = 0;
      const sim = emptySim();
      const byStyle = new Map<string, Sim>();
      const misses: string[] = [];
      for (const { t, sr, data } of signals) {
        const times = unionTimes(a, v.strong, data, sr);
        const soft = v.soft ? unionTimes(a, v.soft, data, sr) : [];
        const style = t.name.split("/")[1];
        if (!byStyle.has(style)) byStyle.set(style, emptySim());
        const m = simulateMatcher(t, times, soft);
        for (const k of Object.keys(sim) as (keyof Sim)[]) {
          for (const into of [sim, byStyle.get(style)!]) { into[k][0] += m[k][0]; into[k][1] += m[k][1]; }
        }
        // Raw detection, strong detector only.
        const used = new Set<number>();
        let missed = 0, n = 0;
        for (const on of t.onsets) {
          const kind = classify(on, t.beats);
          if (!kind) continue;
          total[kind]++; n++;
          let best = -1;
          for (let i = 0; i < times.length; i++) {
            const d = times[i] - on;
            if (used.has(i) || d < -MATCH_EARLY || d > MATCH_LATE) continue;
            if (best < 0 || Math.abs(d) < Math.abs(times[best] - on)) best = i;
          }
          if (best >= 0) { used.add(best); found[kind]++; } else missed++;
        }
        for (const x of times.filter(y => y >= t.beats[0] - 0.08)) {
          detections++;
          if (t.onsets.some(on => x - on >= -MATCH_EARLY && x - on <= MATCH_LATE)) continue;
          // A second report from the same strum lands in a slot already judged.
          if (t.onsets.some(on => x - on > MATCH_LATE && x - on <= DOUBLE_S)) doubles++;
          else strays++;
        }
        if (missed) misses.push(`   miss ${t.name} ${missed}/${n}`);
      }
      report(
        `[${v.label}] strong detector: down ${pct(found.down, total.down)} of ${total.down}  up ${pct(found.up, total.up)} of ${total.up}  ` +
        `16th ${pct(found["16th"], total["16th"])} of ${total["16th"]}  stray ${strays} double ${doubles} of ${detections}`,
        `   matcher: ${simLine(sim)}`,
        ...[...byStyle].map(([st, x]) => `     ${st.padEnd(13)} ${simLine(x)}`),
        ...(process.env.STRUM_VERBOSE ? misses : []),
      );
    }
  }, 1_200_000);

  it.skipIf(!process.env.STRUM_DEBUG)("prints every attack of one take", async () => {
    const a = await loadAubio();
    const t = collect().find(x => x.name.includes(process.env.STRUM_DEBUG!))!;
    const { sr, data } = readWav(t.wav);
    const hfc = aubioTimes(a, "hfc:0.3", data, sr);
    const flux = aubioTimes(a, "specflux:0.6", data, sr);
    const near = (xs: number[], on: number) => {
      const d = xs.map(x => x - on).find(x => x >= -0.06 && x <= 0.1);
      return d === undefined ? "--" : (d * 1000).toFixed(0);
    };
    const lines = [t.name, "attack  kind   hfc Δms  specflux Δms"];
    for (const on of t.onsets) {
      const kind = classify(on, t.beats);
      if (kind) lines.push(`${on.toFixed(3)} ${kind.padEnd(5)}  ${near(hfc, on).padStart(4)}  ${near(flux, on).padStart(4)}`);
    }
    lines.push("specflux reports with no attack within -60..+100 ms:");
    for (const x of flux) {
      if (x < t.beats[0] - 0.08 || t.onsets.some(on => x - on >= -0.06 && x - on <= 0.1)) continue;
      const nearest = t.onsets.reduce((b, on) => (Math.abs(on - x) < Math.abs(b - x) ? on : b), t.onsets[0]);
      lines.push(`  ${x.toFixed(3)}  nearest attack ${((x - nearest) * 1000).toFixed(0)} ms`);
    }
    report(...lines);
    expect(true).toBe(true);
  }, 120_000);
});
