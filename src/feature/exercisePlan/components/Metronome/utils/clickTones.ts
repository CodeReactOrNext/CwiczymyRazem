// Shared click sound definitions for the desktop (AudioWorklet) and mobile
// (setTimeout) metronome engines — kept in one place so a beat and a
// subdivision tick always sound the same regardless of which engine is
// running.
//
// Every sound is synthesised on the fly from oscillators / noise, so there
// are no sample files to load and the click can be scheduled sample-accurately
// on any AudioContext (including AlphaTab's adopted one).
export type ClickKind = "accent" | "beat" | "sub";

export type MetronomeSoundKey =
  | "classic"
  | "wood"
  | "digital"
  | "sticks"
  | "hihat"
  | "cowbell";

export interface MetronomeSound {
  label: string;
  desc: string;
  /**
   * Schedules one click of this sound at `time` on the given context, routed to
   * `destination`, peaking at `peak` (already scaled by the user's volume).
   */
  schedule: (
    context: BaseAudioContext,
    destination: AudioNode,
    time: number,
    kind: ClickKind,
    peak: number,
  ) => void;
}

/** Pitch of the classic click per beat kind — accent above beat above subdivision. */
export const CLICK_TONES: Record<
  ClickKind,
  { frequency: number; gainScale: number }
> = {
  accent: { frequency: 1200, gainScale: 1 },
  beat: { frequency: 800, gainScale: 1 },
  // Subdivision ticks (the clicks *between* beats) stay audibly softer and
  // lower-pitched than a real beat so the downbeat is never ambiguous.
  sub: { frequency: 600, gainScale: 0.5 },
};

/** Loudness of each click kind relative to the accent — shared by every sound. */
export const CLICK_GAIN_SCALE: Record<ClickKind, number> = {
  accent: CLICK_TONES.accent.gainScale,
  beat: CLICK_TONES.beat.gainScale,
  sub: CLICK_TONES.sub.gainScale,
};

/**
 * Pitch multiplier per click kind for the tuned sounds: the accent sits a bit
 * above the beat and the subdivision a bit below, mirroring the classic tone
 * ratios (1200 / 800 / 600 Hz) so the downbeat stays unmistakable.
 */
const PITCH_RATIO: Record<ClickKind, number> = {
  accent: 1.5,
  beat: 1,
  sub: 0.75,
};

/** A short pitched tone with an instant attack and exponential release. */
function tone(
  context: BaseAudioContext,
  destination: AudioNode,
  time: number,
  frequency: number,
  peak: number,
  duration: number,
  type: OscillatorType = "sine",
  pitchDropTo?: number,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  if (pitchDropTo !== undefined) {
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(
      pitchDropTo,
      time + duration,
    );
  }

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(time);
  oscillator.stop(time + duration);
}

// One shared burst of white noise per context — the buffer is tiny (100 ms)
// and identical every time, so there is no point re-filling it on every click.
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  const cached = noiseBuffers.get(context);
  if (cached) return cached;
  const length = Math.max(1, Math.floor(context.sampleRate * 0.1));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  // Deterministic LCG rather than Math.random: keeps every click identical,
  // and keeps the tests reproducible.
  let seed = 0x2f6e2b1;
  for (let i = 0; i < length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = (seed / 0xffffffff) * 2 - 1;
  }
  noiseBuffers.set(context, buffer);
  return buffer;
}

/** A filtered noise burst — the basis of the stick / hi-hat sounds. */
function noise(
  context: BaseAudioContext,
  destination: AudioNode,
  time: number,
  peak: number,
  duration: number,
  filterType: BiquadFilterType,
  filterFrequency: number,
): void {
  const source = context.createBufferSource();
  source.buffer = noiseBuffer(context);

  const filter = context.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFrequency, time);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(time);
  source.stop(time + duration);
}

export const METRONOME_SOUNDS: Record<MetronomeSoundKey, MetronomeSound> = {
  classic: {
    label: "Classic",
    desc: "Clean sine beep, the one the app shipped with",
    schedule: (context, destination, time, kind, peak) => {
      tone(context, destination, time, CLICK_TONES[kind].frequency, peak, 0.1);
    },
  },
  wood: {
    label: "Wood block",
    desc: "Warm hollow knock, easy on long sessions",
    schedule: (context, destination, time, kind, peak) => {
      const base = 900 * PITCH_RATIO[kind];
      // A fast pitch drop is what makes a sine read as "wood" rather than "beep".
      tone(context, destination, time, base, peak, 0.07, "sine", base * 0.45);
      tone(
        context,
        destination,
        time,
        base * 2.4,
        peak * 0.25,
        0.025,
        "triangle",
      );
    },
  },
  digital: {
    label: "Digital",
    desc: "Sharp square-wave blip, like a DAW click",
    schedule: (context, destination, time, kind, peak) => {
      tone(
        context,
        destination,
        time,
        1000 * PITCH_RATIO[kind],
        peak * 0.6,
        0.035,
        "square",
      );
    },
  },
  sticks: {
    label: "Sticks",
    desc: "Dry drumstick tap, cuts through a loud amp",
    schedule: (context, destination, time, kind, peak) => {
      noise(
        context,
        destination,
        time,
        peak,
        0.02,
        "highpass",
        2500 * PITCH_RATIO[kind],
      );
      // A little body under the crack, so it does not disappear on small speakers.
      tone(
        context,
        destination,
        time,
        1800 * PITCH_RATIO[kind],
        peak * 0.5,
        0.015,
        "triangle",
      );
    },
  },
  hihat: {
    label: "Hi-hat",
    desc: "Closed hi-hat, sits naturally in a drum groove",
    schedule: (context, destination, time, kind, peak) => {
      noise(
        context,
        destination,
        time,
        peak * 0.8,
        kind === "accent" ? 0.09 : 0.05,
        "highpass",
        7000,
      );
    },
  },
  cowbell: {
    label: "Cowbell",
    desc: "Two detuned squares — more cowbell",
    schedule: (context, destination, time, kind, peak) => {
      // The classic 808 cowbell is two square waves a minor sixth-ish apart
      // through a band-pass; the ratio is what gives it the clank.
      const base = 587 * PITCH_RATIO[kind];
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(base * 1.4, time);
      filter.Q.setValueAtTime(2, time);
      filter.connect(destination);
      tone(context, filter, time, base, peak * 0.5, 0.12, "square");
      tone(context, filter, time, base * 1.44, peak * 0.5, 0.12, "square");
    },
  },
};

export const METRONOME_SOUND_ORDER: readonly MetronomeSoundKey[] = [
  "classic",
  "wood",
  "digital",
  "sticks",
  "hihat",
  "cowbell",
];

export const DEFAULT_METRONOME_SOUND: MetronomeSoundKey = "classic";

/** Guards a value read out of localStorage — anything unknown means the classic beep. */
export function normalizeMetronomeSound(value: unknown): MetronomeSoundKey {
  return typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(METRONOME_SOUNDS, value)
    ? (value as MetronomeSoundKey)
    : DEFAULT_METRONOME_SOUND;
}

/**
 * Schedules one metronome click. `volume` is the user's 0–1 metronome level;
 * the per-kind loudness (subdivisions softer than beats) is applied here so
 * both engines stay in step.
 */
export function scheduleClick(
  context: BaseAudioContext,
  destination: AudioNode,
  time: number,
  kind: ClickKind,
  volume: number,
  sound: MetronomeSoundKey,
): void {
  const peak = 0.85 * volume * CLICK_GAIN_SCALE[kind];
  if (peak <= 0.0001) return;
  METRONOME_SOUNDS[normalizeMetronomeSound(sound)].schedule(
    context,
    destination,
    time,
    kind,
    peak,
  );
}
