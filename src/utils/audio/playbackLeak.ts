import { createFft, nextPowerOfTwo } from "./fft";

// Whether the mic hears the app's own playback. Played out of speakers, the
// tab's guitar would score as if the player had played it.
//
// Two signals ride on the tab sound's output:
//   • the probe — three soft rising drops in the band every speaker
//     reproduces, sent when the tab sound comes on. A matched filter finds the
//     whole figure however long the speaker → mic path takes (a Bluetooth
//     speaker alone adds 200–300 ms) and whatever the guitar plays over it.
//   • the pilot — a quiet near-ultrasonic tone for as long as the tab sound
//     plays, so a switch to speakers mid-run shows too. A whine in the room or
//     a headset's own crosstalk can sit at its pitch as well, so hearing it
//     only sends the probe again — the probe is what decides.

// ── Probe ──────────────────────────────────────────────────────────────────

interface ProbeDrop {
  atMs: number;
  fromHz: number;
  toHz: number;
}

/**
 * The probe's figure: three drops, each gliding up by a major sixth, starting
 * on a rising major triad, in an uneven rhythm. Every drop has to land at its
 * own pitch and its own moment, so a single sweep-like sound — a pick scrape,
 * a slide, a squeaking string — fills one slot of the three at best.
 */
export const PROBE_DROPS: readonly ProbeDrop[] = [
  { atMs: 0, fromHz: 1400, toHz: 2350 },
  { atMs: 115, fromHz: 1765, toHz: 2960 },
  { atMs: 275, fromHz: 2100, toHz: 3525 },
];
const DROP_MS = 100;
export const PROBE_MS = PROBE_DROPS[PROBE_DROPS.length - 1].atMs + DROP_MS;
/** Longest output → speaker → mic → app delay the probe is listened for. */
export const PROBE_MAX_DELAY_MS = 700;
/** Normalised correlation at or above which the probe was heard. Noise,
 *  guitar and the metronome stay well under it — see playbackLeak.test.ts. */
export const PROBE_HEARD_CORRELATION = 0.4;
/** What each drop must reach on its own. A lone drop-like sound fills one slot
 *  of the figure and leaves the other two empty. */
export const PROBE_DROP_HEARD_CORRELATION = 0.2;
/**
 * Quietest the tab sound may reach the mic (peak, full scale 1) for the leak to
 * count. The matched filter hears the probe far below anything the note
 * detector could score — headphones bleeding into a laptop mic, crosstalk in a
 * headset jack — and a leak that faint can't pass for the player's notes.
 */
export const LEAK_MIN_LEVEL = 0.01;

/** A struck attack, then a ring that dies away — a drop, not a whistle. */
const DROP_ATTACK_MS = 4;
const DROP_RING_MS = 60;
/** The tail's last stretch fades to silence so the drop ends without a click. */
const DROP_FADE_MS = 12;
/** The band the probe is compared in — the guitar's fundamentals sit below it. */
const PROBE_BAND_LOW_HZ = 1300;
const PROBE_BAND_HIGH_HZ = 4500;

/** Input samples to collect from the moment the probe is sent. */
export const probeCaptureLength = (sampleRate: number): number =>
  Math.ceil(((PROBE_MS + PROBE_MAX_DELAY_MS) / 1000) * sampleRate);

/** The probe: three drops, each an exponential glide under a struck envelope. Peak 1. */
export const createProbeSignal = (sampleRate: number): Float32Array => {
  const out = new Float32Array(Math.round((PROBE_MS / 1000) * sampleRate));
  const dropLength = Math.round((DROP_MS / 1000) * sampleRate);
  const attack = (DROP_ATTACK_MS / 1000) * sampleRate;
  const ring = (DROP_RING_MS / 1000) * sampleRate;
  const fade = (DROP_FADE_MS / 1000) * sampleRate;
  const seconds = DROP_MS / 1000;
  for (const { atMs, fromHz, toHz } of PROBE_DROPS) {
    const start = Math.round((atMs / 1000) * sampleRate);
    const rise = Math.log(toHz / fromHz);
    for (let n = 0; n < dropLength && start + n < out.length; n++) {
      const t = n / sampleRate;
      const left = dropLength - 1 - n;
      const envelope =
        (n < attack
          ? 0.5 - 0.5 * Math.cos((Math.PI * n) / attack)
          : Math.exp(-(n - attack) / ring)) *
        (left < fade ? 0.5 - 0.5 * Math.cos((Math.PI * left) / fade) : 1);
      // Frequency fromHz·(toHz/fromHz)^(t/T), integrated: an even glide on the ear's own scale.
      const phase =
        ((2 * Math.PI * fromHz * seconds) / rise) *
        (Math.exp((rise * t) / seconds) - 1);
      out[start + n] = envelope * Math.sin(phase);
    }
  }
  return out;
};

/** A second-order section (RBJ cookbook), Butterworth Q. */
const biquad = (
  input: Float32Array,
  sampleRate: number,
  cutoffHz: number,
  kind: "lowpass" | "highpass",
): Float32Array => {
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  const b1 = (kind === "lowpass" ? 1 - cos : -(1 + cos)) / a0;
  const b0 = b1 * (kind === "lowpass" ? 0.5 : -0.5);
  const b2 = b0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  const out = new Float32Array(input.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let n = 0; n < input.length; n++) {
    const x = input[n];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    out[n] = y;
  }
  return out;
};

const toProbeBand = (samples: Float32Array, sampleRate: number): Float32Array =>
  biquad(
    biquad(samples, sampleRate, PROBE_BAND_LOW_HZ, "highpass"),
    sampleRate,
    PROBE_BAND_HIGH_HZ,
    "lowpass",
  );

export interface ProbeMatch {
  /** Peak normalised cross-correlation, 0–1: how surely the probe is there. */
  correlation: number;
  /** The same, drop by drop at that delay, for the drop that came through worst. */
  weakestDrop: number;
  /** How loud it came back at that delay, as a multiple of the probe as sent
   *  (peak 1) — the speaker → mic path's gain. */
  level: number;
}

/**
 * How strongly the probe shows up anywhere in `recording`, over every delay the
 * recording allows, and how loud it is where it shows best. Both sides are
 * band-limited to the probe's band first, so a loud guitar under it doesn't
 * dilute the reading.
 */
export const probeMatch = (
  recording: Float32Array,
  sampleRate: number,
): ProbeMatch => {
  const probe = toProbeBand(createProbeSignal(sampleRate), sampleRate);
  const heard = toProbeBand(recording, sampleRate);
  const length = probe.length;
  if (heard.length < length)
    return { correlation: 0, weakestDrop: 0, level: 0 };

  const size = nextPowerOfTwo(heard.length + length);
  const fft = createFft(size);
  const xr = new Float64Array(size);
  const xi = new Float64Array(size);
  const pr = new Float64Array(size);
  const pi = new Float64Array(size);
  xr.set(heard);
  pr.set(probe);
  fft(xr, xi);
  fft(pr, pi);
  // Cross-correlation is X·conj(P) transformed back; the inverse transform is
  // the forward one applied to the conjugate (only the real part is needed).
  for (let k = 0; k < size; k++) {
    const re = xr[k] * pr[k] + xi[k] * pi[k];
    const im = xi[k] * pr[k] - xr[k] * pi[k];
    xr[k] = re;
    xi[k] = -im;
  }
  fft(xr, xi);

  let probeEnergy = 0;
  for (let n = 0; n < length; n++) probeEnergy += probe[n] * probe[n];
  let windowEnergy = 0;
  for (let n = 0; n < length; n++) windowEnergy += heard[n] * heard[n];

  let best = 0;
  let bestLag = -1;
  for (let lag = 0; lag + length <= heard.length; lag++) {
    if (lag > 0) {
      const enter = heard[lag + length - 1];
      const leave = heard[lag - 1];
      windowEnergy = Math.max(0, windowEnergy + enter * enter - leave * leave);
    }
    if (windowEnergy < 1e-12) continue;
    const correlation =
      Math.abs(xr[lag] / size) / Math.sqrt(probeEnergy * windowEnergy);
    if (correlation > best) {
      best = correlation;
      bestLag = lag;
    }
  }
  if (bestLag < 0) return { correlation: 0, weakestDrop: 0, level: 0 };

  // Each drop on its own, at that same delay and in the same polarity as the
  // whole — the figure counts only if none of it is missing.
  const dot = xr[bestLag] / size;
  const dropLength = Math.round((DROP_MS / 1000) * sampleRate);
  let weakestDrop = 1;
  for (const { atMs } of PROBE_DROPS) {
    const start = Math.round((atMs / 1000) * sampleRate);
    const end = Math.min(length, start + dropLength);
    let dropDot = 0;
    let dropEnergy = 0;
    let heardEnergy = 0;
    for (let n = start; n < end; n++) {
      const x = heard[bestLag + n];
      dropDot += x * probe[n];
      dropEnergy += probe[n] * probe[n];
      heardEnergy += x * x;
    }
    const dropCorrelation =
      heardEnergy < 1e-12
        ? 0
        : (Math.sign(dot) * dropDot) / Math.sqrt(dropEnergy * heardEnergy);
    weakestDrop = Math.min(weakestDrop, Math.max(0, dropCorrelation));
  }

  return {
    correlation: Math.min(1, best),
    weakestDrop,
    // Least-squares gain of the probe in that window.
    level: Math.abs(dot) / probeEnergy,
  };
};

/** Whether a match is the probe: the whole figure, with every drop in it. */
export const isProbeHeard = (match: ProbeMatch): boolean =>
  match.correlation >= PROBE_HEARD_CORRELATION &&
  match.weakestDrop >= PROBE_DROP_HEARD_CORRELATION;

// ── Pilot ──────────────────────────────────────────────────────────────────

/** As far as the band gets from every harmonic of the metronome's sounds (176 Hz
 *  clear): the "digital" click's 750 Hz square wave alone has its 25th right on
 *  18 750 Hz, and the metronome plays out of the speakers for honest players too. */
export const PILOT_HZ = 19200;
/** Narrowband level of the pilot over its neighbourhood that counts as hearing it. */
export const PILOT_SNR_DB = 12;
/** The pilot must stand this long without a break before the probe goes out to
 *  check — a pick's click is broadband and short, a passing whine not much longer. */
export const PILOT_HOLD_MS = 1000;
/** Where the neighbourhood is read: clear of the pilot's main lobe, close enough to share its noise. */
const PILOT_NEIGHBOUR_OFFSETS_HZ = [-600, -350, 350, 600];

/** Whether input at this rate can carry the pilot at all (a 16 kHz headset mic can't). */
export const canHearPilot = (sampleRate: number): boolean =>
  sampleRate / 2 > PILOT_HZ + 1000;

const hannCache = new Map<number, Float32Array>();
const hann = (length: number): Float32Array => {
  let taper = hannCache.get(length);
  if (!taper) {
    taper = new Float32Array(length);
    for (let n = 0; n < length; n++)
      taper[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (length - 1));
    hannCache.set(length, taper);
  }
  return taper;
};

/** Windowed single-frequency DFT power (Goertzel). */
const goertzelPower = (
  samples: Float32Array,
  taper: Float32Array,
  sampleRate: number,
  freq: number,
): number => {
  const coeff = 2 * Math.cos((2 * Math.PI * freq) / sampleRate);
  let s1 = 0;
  let s2 = 0;
  for (let n = 0; n < samples.length; n++) {
    const s0 = samples[n] * taper[n] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
};

/** How far the pilot stands out of its neighbourhood in one window (dB), or
 *  null where the input can't carry it. Silence reads 0. */
export const pilotSnrDb = (
  samples: Float32Array,
  sampleRate: number,
): number | null => {
  if (!canHearPilot(sampleRate) || samples.length < 256) return null;
  const taper = hann(samples.length);
  const pilot = goertzelPower(samples, taper, sampleRate, PILOT_HZ);
  let neighbourhood = 0;
  for (const offset of PILOT_NEIGHBOUR_OFFSETS_HZ) {
    neighbourhood += goertzelPower(
      samples,
      taper,
      sampleRate,
      PILOT_HZ + offset,
    );
  }
  neighbourhood /= PILOT_NEIGHBOUR_OFFSETS_HZ.length;
  return 10 * Math.log10((pilot + 1e-20) / (neighbourhood + 1e-20));
};

/** Follows the pilot window by window; heard once it has stood for PILOT_HOLD_MS unbroken. */
export const createPilotTracker = () => {
  let heardMs = 0;
  return {
    push(snrDb: number | null, windowMs: number): boolean {
      heardMs =
        snrDb !== null && snrDb >= PILOT_SNR_DB ? heardMs + windowMs : 0;
      return heardMs >= PILOT_HOLD_MS;
    },
    reset() {
      heardMs = 0;
    },
  };
};
