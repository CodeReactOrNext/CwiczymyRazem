import { createFft, nextPowerOfTwo } from "./fft";

// Whether the mic hears the app's own playback. Played out of speakers, the
// tab's guitar would score as if the player had played it.
//
// Two signals ride on the tab sound's output:
//   • the probe — a short chirp in the band every speaker reproduces, sent when
//     the tab sound comes on. A matched filter finds it however long the
//     speaker → mic path takes (a Bluetooth speaker alone adds 200–300 ms) and
//     whatever the guitar plays over it.
//   • the pilot — a quiet near-ultrasonic tone for as long as the tab sound
//     plays, so a switch to speakers mid-run shows too. Plenty of speakers and
//     Bluetooth links cut it off, so hearing it proves a leak while not hearing
//     it proves nothing — the probe is the check that can say "no speakers".

// ── Probe ──────────────────────────────────────────────────────────────────

export const PROBE_START_HZ = 1500;
export const PROBE_END_HZ = 5000;
export const PROBE_MS = 250;
/** Longest output → speaker → mic → app delay the probe is listened for. */
export const PROBE_MAX_DELAY_MS = 700;
/** Normalised correlation at or above which the probe was heard. Noise and
 *  guitar stay well under it — see playbackLeak.test.ts. */
export const PROBE_HEARD_CORRELATION = 0.3;

const PROBE_FADE_MS = 15;
/** The band the probe is compared in — the guitar's fundamentals sit below it. */
const PROBE_BAND_LOW_HZ = 1300;
const PROBE_BAND_HIGH_HZ = 5500;

/** Input samples to collect from the moment the probe is sent. */
export const probeCaptureLength = (sampleRate: number): number =>
  Math.ceil(((PROBE_MS + PROBE_MAX_DELAY_MS) / 1000) * sampleRate);

/** The probe: a linear chirp with short fades, so it starts and stops without a click. Peak 1. */
export const createProbeSignal = (sampleRate: number): Float32Array => {
  const length = Math.round((PROBE_MS / 1000) * sampleRate);
  const fade = Math.round((PROBE_FADE_MS / 1000) * sampleRate);
  const sweep = (PROBE_END_HZ - PROBE_START_HZ) / (length / sampleRate);
  const out = new Float32Array(length);
  for (let n = 0; n < length; n++) {
    const t = n / sampleRate;
    const edge = Math.min(n, length - 1 - n);
    const envelope =
      edge >= fade ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * edge) / fade);
    out[n] =
      envelope *
      Math.sin(2 * Math.PI * (PROBE_START_HZ * t + 0.5 * sweep * t * t));
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

/**
 * How strongly the probe shows up anywhere in `recording`: the peak normalised
 * cross-correlation, 0–1, over every delay the recording allows. Both sides are
 * band-limited to the probe's band first, so a loud guitar under it doesn't
 * dilute the reading.
 */
export const probeCorrelation = (
  recording: Float32Array,
  sampleRate: number,
): number => {
  const probe = toProbeBand(createProbeSignal(sampleRate), sampleRate);
  const heard = toProbeBand(recording, sampleRate);
  const length = probe.length;
  if (heard.length < length) return 0;

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
  for (let lag = 0; lag + length <= heard.length; lag++) {
    if (lag > 0) {
      const enter = heard[lag + length - 1];
      const leave = heard[lag - 1];
      windowEnergy = Math.max(0, windowEnergy + enter * enter - leave * leave);
    }
    if (windowEnergy < 1e-12) continue;
    const correlation =
      Math.abs(xr[lag] / size) / Math.sqrt(probeEnergy * windowEnergy);
    if (correlation > best) best = correlation;
  }
  return Math.min(1, best);
};

// ── Pilot ──────────────────────────────────────────────────────────────────

/** As far as the band gets from every harmonic of the metronome's sounds (176 Hz
 *  clear): the "digital" click's 750 Hz square wave alone has its 25th right on
 *  18 750 Hz, and the metronome plays out of the speakers for honest players too. */
export const PILOT_HZ = 19200;
/** Narrowband level of the pilot over its neighbourhood that counts as hearing it. */
export const PILOT_SNR_DB = 12;
/** The pilot must stand this long without a break — a pick's click is broadband and short. */
export const PILOT_HOLD_MS = 400;
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
