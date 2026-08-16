// @vitest-environment node
//
// Offline detection harness for fast passages.
//
// Renders synthetic plucked-note runs at increasing tempi, pushes them through
// the SHARED guitar DSP (the same createGuitarBufferProcessor used by both the
// browser AudioWorklet path and the Electron native path) and reports, per note:
// whether the correct pitch was ever reported, how late it appeared, and whether
// the PREVIOUS note's pitch was reported during it.
//
// Pitch is exact by construction (additive synthesis), so every cent of error
// measured here comes from the detector, not from the test signal.

import type { ExpectedAttack } from "feature/exercisePlan/views/PracticeSession/hooks/noteEventGrader";
import { assignAttacks } from "feature/exercisePlan/views/PracticeSession/hooks/noteEventGrader";
import { getCentsDistance } from "utils/audio/noteUtils";
import { describe, expect,it, vi } from "vitest";

import type { DetectedNoteEvent } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";

const SR = 48000;
const WINDOW = 2048;
const CENTS_TOLERANCE = 45; // same as useNoteMatching

// ── Signal generation ─────────────────────────────────────────────────────────

interface Note { f0: number; startSample: number; endSample: number }

/**
 * Additive plucked-string model: 12 harmonics with 1/h^1.2 rolloff, higher
 * harmonics decaying faster, a 2 ms attack ramp and a 3 ms broadband pick-noise
 * burst so the onset detectors have a real transient to fire on. Notes get a
 * 25 ms release tail past their end (a run doesn't get perfectly muted).
 */
function renderRun(notes: Note[], totalSamples: number, peak = 0.25): Float32Array {
  const out = new Float32Array(totalSamples);
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000 * 2 - 1;
  };

  for (const note of notes) {
    const releaseSamples = Math.round(0.025 * SR);
    const attackSamples = Math.round(0.002 * SR);
    const pickSamples = Math.round(0.003 * SR);
    const last = Math.min(totalSamples, note.endSample + releaseSamples);

    for (let n = note.startSample; n < last; n++) {
      const t = (n - note.startSample) / SR;
      const past = n > note.endSample ? (n - note.endSample) / SR : 0;
      // envelope: attack ramp → natural decay → faster release once "released"
      const attack = n - note.startSample < attackSamples
        ? (n - note.startSample) / attackSamples
        : 1;
      const release = past > 0 ? Math.exp(-past / 0.012) : 1;

      let s = 0;
      for (let h = 1; h <= 12; h++) {
        const f = note.f0 * h;
        if (f > SR / 2) break;
        const amp = Math.pow(h, -1.2);
        const decay = Math.exp(-t / (1.2 / Math.pow(h, 0.7))); // higher = faster
        s += amp * decay * Math.sin(2 * Math.PI * f * t);
      }
      if (n - note.startSample < pickSamples) s += rand() * 0.6;
      out[n] += s * attack * release;
    }
  }

  let max = 0;
  for (let i = 0; i < totalSamples; i++) max = Math.max(max, Math.abs(out[i]));
  const scale = max > 0 ? peak / max : 0;
  for (let i = 0; i < totalSamples; i++) out[i] = out[i] * scale + rand() * 0.001; // -60dBFS floor
  return out;
}

function buildRun(f0s: number[], bpm: number, subdivision: number, bars: number) {
  const noteMs = 60000 / bpm / subdivision;
  const noteSamples = Math.round((noteMs / 1000) * SR);
  const count = bars * subdivision * 4;
  const notes: Note[] = [];
  const leadIn = Math.round(0.2 * SR);
  for (let i = 0; i < count; i++) {
    const start = leadIn + i * noteSamples;
    notes.push({ f0: f0s[i % f0s.length], startSample: start, endSample: start + noteSamples });
  }
  const total = leadIn + count * noteSamples + Math.round(0.4 * SR);
  return { notes, noteMs, signal: renderRun(notes, total) };
}

// ── Harness ───────────────────────────────────────────────────────────────────

interface Sample { timeMs: number; sampleIdx: number; freq: number; conf: number; volume: number; onsetMs: number }

/** Feeds the signal through the real processor in 2048-sample blocks with a
 *  virtual clock, capturing the refs after every block (= the real update rate,
 *  since nothing downstream can see a value the processor never wrote). */
async function runProcessor(signal: Float32Array, highRes: boolean) {
  const AubioModule: any = await import("aubiojs");
  const aubio = await (AubioModule.default || AubioModule)();
  const detectors = createGuitarDetectors(aubio, SR);
  // A/B switch: dropping pitchHigh restores the exact pre-A3 behaviour.
  if (!highRes) delete (detectors as any).pitchHigh;

  const targets = {
    frequencyRef: { current: 0 }, volumeRef: { current: 0 }, rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 }, lastOnsetTimeRef: { current: 0 }, lastTickTimeRef: { current: 0 },
    onsetChromaRef: { current: null }, noiseFloorRef: { current: 0 },
    noteEventsRef: { current: [] as DetectedNoteEvent[] },
  } as any;

  const startMs = 1_000_000;
  let virtualMs = startMs;
  const nowSpy = vi.spyOn(Date, "now").mockImplementation(() => virtualMs);

  const process = createGuitarBufferProcessor({
    detectors, targets, getGain: () => 3.0, analyser: null, sampleRate: SR,
  });

  const samples: Sample[] = [];
  const blockMs = (WINDOW / SR) * 1000;
  let cpuMs = 0;
  for (let off = 0; off + WINDOW <= signal.length; off += WINDOW) {
    // Date.now() must read as the instant the block's LAST sample arrived —
    // that is what the processor assumes when it walks an onset back to its hop.
    virtualMs = startMs + ((off + WINDOW) / SR) * 1000;
    const t0 = performance.now();
    process(signal.subarray(off, off + WINDOW));
    cpuMs += performance.now() - t0;
    samples.push({
      timeMs: virtualMs, sampleIdx: off + WINDOW,
      freq: targets.frequencyRef.current, conf: targets.confidenceRef.current,
      volume: targets.rawVolumeRef.current, onsetMs: targets.lastOnsetTimeRef.current,
    });
  }
  nowSpy.mockRestore();
  // Realtime budget: how much of each 42.7 ms block the DSP actually consumed.
  const loadPct = samples.length ? (cpuMs / (samples.length * blockMs)) * 100 : 0;
  return { samples, blockMs, startMs, loadPct, events: targets.noteEventsRef.current as DetectedNoteEvent[] };
}

interface Report {
  bpm: number; noteMs: number; notes: number;
  detected: number; detectedPct: number;
  /** Detected while the note was ACTUALLY sounding (no trailing-window slack). */
  detectedStrictPct: number;
  medianLatencyMs: number | null;
  staleNotes: number; staleP: number;
  onsets: number;
  meanConfidence: number;
}

async function measure(label: string, f0s: number[], bpm: number, subdivision: number, bars: number, highRes = false): Promise<Report> {
  const { notes, noteMs, signal } = buildRun(f0s, bpm, subdivision, bars);
  const { samples, blockMs, startMs, loadPct } = await runProcessor(signal, highRes);

  // Map each captured block to the audio time at its END (that is the newest
  // audio the detector could possibly have seen when it wrote the ref).
  const blockAudioMs = (s: Sample) => (s.sampleIdx / SR) * 1000;

  let detected = 0, detectedStrict = 0, stale = 0;
  const latencies: number[] = [];

  notes.forEach((note, idx) => {
    const noteStart = (note.startSample / SR) * 1000;
    const noteEnd = (note.endSample / SR) * 1000;
    const prev = idx > 0 ? notes[idx - 1] : null;

    let hit: number | null = null;
    let hitStrict = false;
    let sawStale = false;
    for (const s of samples) {
      const at = blockAudioMs(s);
      // grade over the note's own span plus one block of slack, since a block
      // boundary can land anywhere inside the note
      if (at < noteStart || at > noteEnd + blockMs) continue;
      if (s.freq > 20 && Math.abs(getCentsDistance(s.freq, note.f0)) <= CENTS_TOLERANCE) {
        if (hit === null) hit = at - noteStart;
        if (at <= noteEnd) hitStrict = true;
      } else if (prev && s.freq > 20 && Math.abs(getCentsDistance(s.freq, prev.f0)) <= CENTS_TOLERANCE) {
        sawStale = true;
      }
    }
    if (hit !== null) { detected++; latencies.push(hit); }
    if (hitStrict) detectedStrict++;
    if (sawStale) stale++;
  });

  const voiced = samples.filter(s => s.freq > 20);
  const meanConfidence = voiced.length
    ? voiced.reduce((a, s) => a + s.conf, 0) / voiced.length
    : 0;

  const onsetTimes = new Set(samples.map(s => s.onsetMs).filter(t => t > 0));
  const sortedLat = [...latencies].sort((a, b) => a - b);

  const report: Report = {
    bpm, noteMs: Math.round(noteMs * 10) / 10, notes: notes.length,
    detected, detectedPct: Math.round((detected / notes.length) * 1000) / 10,
    detectedStrictPct: Math.round((detectedStrict / notes.length) * 1000) / 10,
    medianLatencyMs: sortedLat.length ? Math.round(sortedLat[Math.floor(sortedLat.length / 2)]) : null,
    staleNotes: stale, staleP: Math.round((stale / notes.length) * 1000) / 10,
    onsets: onsetTimes.size,
    meanConfidence: Math.round(meanConfidence * 1000) / 1000,
  };
  console.log(
    `${label} | ${String(bpm).padStart(3)} BPM | nuta ${String(report.noteMs).padStart(5)}ms` +
    ` | w oknie ${String(report.detectedPct).padStart(5)}%` +
    ` | W TRAKCIE NUTY ${String(report.detectedStrictPct).padStart(5)}%` +
    ` | lat. ${String(report.medianLatencyMs).padStart(3)}ms` +
    ` | stale ${String(report.staleP).padStart(5)}%` +
    ` | onsety ${report.onsets}/${notes.length}` +
    ` | CPU ${loadPct.toFixed(1)}%`
  );
  void startMs;
  return report;
}

// ── End-to-end grading (B1 + B2) ──────────────────────────────────────────────

/**
 * Runs the full chain the app runs — synthetic audio → real DSP → onset-anchored
 * events → the real assignment grader — and reports how many notes would actually
 * be credited. This is the number a player feels; everything above it is a
 * component measurement.
 */
async function measureScoring(label: string, f0s: number[], bpm: number, subdivision: number, bars: number) {
  const { notes, noteMs, signal } = buildRun(f0s, bpm, subdivision, bars);
  const { startMs, events } = await runProcessor(signal, true);

  // Same window the matcher derives from tempo (useNoteMatching).
  const beatDurationMs = 60000 / bpm;
  const maxDeltaMs = Math.min(420, Math.max(130, beatDurationMs * 0.30));

  const expected: ExpectedAttack[] = notes.map((note, i) => ({
    key: `n${i}`,
    timeMs: startMs + (note.startSample / SR) * 1000,
    targetFreq: note.f0,
    toleranceCents: CENTS_TOLERANCE,
    volumeGate: 0.005,
  }));

  const assignments = assignAttacks(events, expected, maxDeltaMs);
  const creditedPct = Math.round((assignments.length / notes.length) * 1000) / 10;
  // SIGNED, so a systematic reporting lag shows up as a bias rather than hiding
  // inside an absolute average.
  const signed = assignments.map(a => a.deltaMs).sort((x, y) => x - y);
  const medianDelta = signed.length ? Math.round(signed[signed.length >> 1]) : null;
  const resolved = events.filter(e => e.pitchHz > 20).length;

  console.log(
    `${label} | ${String(bpm).padStart(3)} BPM | nuta ${String(Math.round(noteMs * 10) / 10).padStart(5)}ms` +
    ` | ZALICZONE ${String(creditedPct).padStart(5)}% (${assignments.length}/${notes.length})` +
    ` | Δt ${String(medianDelta).padStart(4)}ms` +
    ` | zdarzeń ${events.length}, z pitchem ${resolved}`
  );
  return { creditedPct, medianDelta, events: events.length, notes: notes.length };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const HIGH = [329.63, 392.00, 440.00, 493.88]; // E4 G4 A4 B4 — pentatonic run, strings 1–2
const LOW = [82.41, 98.00, 110.00, 123.47];    // E2 G2 A2 B2 — same shape, low strings

describe("fast-passage detection baseline", () => {
  it("control: sustained single notes are detected accurately", async () => {
    const results = await measure("KONTROLA  (ćwierćnuty, wysoko)", HIGH, 90, 1, 2);
    // If this fails the generator or harness is wrong, not the detector.
    expect(results.detectedPct).toBeGreaterThan(90);
  }, 120_000);

  it("high register: 16th-note run across tempi", async () => {
    const base: Report[] = [];
    const a3: Report[] = [];
    for (const bpm of [100, 140, 180, 220, 260]) {
      base.push(await measure("WYSOKO base", HIGH, bpm, 4, 2, false));
      a3.push(await measure("WYSOKO  A3 ", HIGH, bpm, 4, 2, true));
    }
    // A3 may only ever help in the high register.
    a3.forEach((r, i) => expect(r.detectedStrictPct).toBeGreaterThanOrEqual(base[i].detectedStrictPct));
  }, 300_000);

  // Thresholds are set from measurement, not aspiration: ≥90% is the guarantee
  // through 180 BPM sixteenths (where the live-pitch path scored 3%), and the
  // extreme tempi are pinned only against regression.
  it("end-to-end: notes actually credited, high register", async () => {
    for (const bpm of [100, 140, 180]) {
      expect((await measureScoring("SCORE WYSOKO", HIGH, bpm, 4, 2)).creditedPct).toBeGreaterThan(90);
    }
    for (const bpm of [220, 260]) {
      expect((await measureScoring("SCORE WYSOKO", HIGH, bpm, 4, 2)).creditedPct).toBeGreaterThan(70);
    }
  }, 300_000);

  it("end-to-end: notes actually credited, low register", async () => {
    for (const bpm of [100, 140, 180, 220]) {
      expect((await measureScoring("SCORE NISKO ", LOW, bpm, 4, 2)).creditedPct).toBeGreaterThan(90);
    }
    expect((await measureScoring("SCORE NISKO ", LOW, 260, 4, 2)).creditedPct).toBeGreaterThan(70);
  }, 300_000);

  it("attributes attacks with timing accurate to a few ms", async () => {
    // Guards ONSET_REPORT_LAG_MS: without it every attack was reported a full
    // analysis window (~43 ms) late, which at fast tempi pushed events closer to
    // the next note than to their own.
    const r = await measureScoring("SCORE TIMING", HIGH, 140, 4, 2);
    expect(Math.abs(r.medianDelta ?? 999)).toBeLessThan(20);
  }, 120_000);

  it("low register: A3 must not disturb the long-window path", async () => {
    const base: Report[] = [];
    const a3: Report[] = [];
    for (const bpm of [100, 140, 180, 220, 260]) {
      base.push(await measure("NISKO  base", LOW, bpm, 4, 2, false));
      a3.push(await measure("NISKO   A3 ", LOW, bpm, 4, 2, true));
    }
    // The short window aliases low notes an octave or two up; the register guards
    // must keep it out of the low path entirely.
    a3.forEach((r, i) => expect(r.detectedStrictPct).toBe(base[i].detectedStrictPct));
  }, 300_000);
});
