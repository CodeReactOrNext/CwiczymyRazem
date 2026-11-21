import type { PickStroke, TablatureNote } from "../../types/exercise.types";

// ── Room ──────────────────────────────────────────────────────────────────────

/**
 * A synthetic impulse response: noise decaying exponentially, decorrelated per
 * channel. Not a real room, but enough of one that a plucked note stops
 * sounding like it was recorded inside a cardboard box.
 */
export function renderRoomImpulse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.max(1, Math.ceil(ctx.sampleRate * seconds));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

/** Shorter and drier than the note preview's room: this one sits under a whole
 *  tab at tempo, and a long tail would smear fast passages into each other. */
const ROOM_SECONDS = 1.1;
const ROOM_DECAY = 3.2;
/** How much of a guitar track is sent to the room. */
export const GUITAR_ROOM_SEND = 0.16;

/** The room a tab's sampled guitars share — one convolver for every track. */
export function createGuitarRoom(ctx: AudioContext, output: AudioNode): ConvolverNode {
  const room = ctx.createConvolver();
  room.buffer = renderRoomImpulse(ctx, ROOM_SECONDS, ROOM_DECAY);
  room.connect(output);
  return room;
}

/**
 * How hard the samples are pushed into the amp stage. The GM guitar is quiet —
 * a note peaks near −23 dBFS as recorded, −27 at the note gain it is played
 * with — so this is most of the track's level too: a single note leaves the
 * stage about 11 dB up, peaking near −16 dBFS ahead of the fader.
 */
const AMP_DRIVE = 3.8;
/** The steepness of the amp's curve: the higher, the sooner a chord is squeezed. */
const AMP_CURVE = 2.5;
/**
 * How far the sampled notes sit below the fallback synth's (see synth.guitar):
 * a synth note sent through the same stage is turned down by this first.
 */
export const SYNTH_GUITAR_TRIM = 0.16;

let ampCurve: Float32Array<ArrayBuffer> | null = null;

/**
 * tanh(k·x) / k: unity gain for a quiet signal, bending over to a ceiling of
 * 1 / k. One note at AMP_DRIVE stays within half a decibel of clean; a full
 * chord, six notes summing several times higher, is rounded off instead of
 * clipping — which is also what gives it an amp's bite.
 */
export function ampCurveValue(x: number): number {
  return Math.tanh(AMP_CURVE * x) / AMP_CURVE;
}

function getAmpCurve(): Float32Array<ArrayBuffer> {
  if (!ampCurve) {
    const samples = 1024;
    ampCurve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
    for (let i = 0; i < samples; i++) ampCurve[i] = ampCurveValue((i * 2) / (samples - 1) - 1);
  }
  return ampCurve;
}

/**
 * What a sampled guitar's notes go into ahead of the track's fader: a small
 * amp. The GM samples are a guitar straight off the pickups and band-limited
 * with it — measured, next to nothing above 5 kHz on the low strings, most of
 * the energy between 250 Hz and 1 kHz — which is the boxed-in, "MIDI" part of
 * their sound. So: a rumble cut, a gentle overdriven stage that puts harmonics
 * back in proportion to how hard it's hit, a dip in the box and a lift in the
 * presence a speaker would give, and a roll-off for what the stage adds on top.
 *
 * Six small nodes per guitar track. No compressor on purpose — Chrome's delays
 * its signal by 6 ms, and this is the track the player keeps time against;
 * the curve does the levelling with no delay at all.
 */
export function createGuitarToneInput(ctx: AudioContext, fader: AudioNode): AudioNode {
  const filter = (type: BiquadFilterType, frequency: number, q: number, gainDb = 0) => {
    const node = ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = q;
    node.gain.value = gainDb;
    return node;
  };
  // Nothing musical lives below a seven-string's low B.
  const rumbleCut = filter("highpass", 55, 0.7);
  const drive = ctx.createGain();
  drive.gain.value = AMP_DRIVE;
  const amp = ctx.createWaveShaper();
  amp.curve = getAmpCurve();
  amp.oversample = "2x";
  const box = filter("peaking", 420, 1.0, -2.5);
  const presence = filter("peaking", 3000, 0.9, 4);
  const speaker = filter("lowpass", 6500, 0.7);

  rumbleCut.connect(drive);
  drive.connect(amp);
  amp.connect(box);
  box.connect(presence);
  presence.connect(speaker);
  speaker.connect(fader);
  return rumbleCut;
}

// ── Humanising ────────────────────────────────────────────────────────────────

/** Time between one string and the next as a pick crosses a chord. */
const STRUM_STEP_SEC = 0.005;
/** A strum never trails further than this behind its beat. */
const STRUM_MAX_SEC = 0.024;

/**
 * How long after the beat each note of a chord sounds (seconds, in the notes'
 * own order). A pick crosses the strings one after another — low string first
 * on a downstroke, high string first on an upstroke — and every string landing
 * on the same sample is what makes a sampled chord sound like a keyboard.
 *
 * The spread stays inside a few milliseconds: it is heard as a strum, not as a
 * late note, and the first string still lands exactly on the beat.
 */
export function strumDelays(notes: readonly TablatureNote[], pickStroke?: PickStroke): number[] {
  if (notes.length < 2) return notes.map(() => 0);
  const order = notes
    .map((note, index) => ({ index, string: note.string }))
    .sort((a, b) => (pickStroke === "up" ? a.string - b.string : b.string - a.string));
  const step = Math.min(STRUM_STEP_SEC, STRUM_MAX_SEC / (notes.length - 1));
  const delays = new Array<number>(notes.length).fill(0);
  order.forEach(({ index }, rank) => { delays[index] = rank * step; });
  return delays;
}

/** At or above this loudness a note plays as sampled — no filter is put in. */
const FULL_BRIGHTNESS_FROM = 0.9;

/**
 * A softly picked string is duller, not only quieter — the samples have one
 * dynamic layer, so the difference is put back with a low-pass. Returns the
 * cutoff (Hz) for a note of the given loudness (1 = a normal note), or null
 * when it should be left as recorded.
 */
export function brightnessCutoffHz(gainScale: number): number | null {
  if (gainScale >= FULL_BRIGHTNESS_FROM) return null;
  return 1400 * Math.pow(2, 3.2 * Math.max(0, gainScale));
}

export interface VoiceVariation {
  /** Multiplies the note's gain. */
  gain: number;
  /** Added to the note's pitch. */
  detuneCents: number;
}

const GAIN_SPREAD = 0.07;
const DETUNE_SPREAD_CENTS = 3;

/**
 * No two picked notes are the same. The same sample fired again and again at
 * the same level is the "machine gun" of repeated notes; a few percent of
 * level and a few cents of pitch — well under what reads as out of tune —
 * break the copies apart. Timing is deliberately left alone: the player is
 * playing along to this.
 */
export function voiceVariation(random: () => number = Math.random): VoiceVariation {
  return {
    gain: 1 + (random() * 2 - 1) * GAIN_SPREAD,
    detuneCents: (random() * 2 - 1) * DETUNE_SPREAD_CENTS,
  };
}

// ── Articulation ──────────────────────────────────────────────────────────────

/** What was last played on a string. */
export interface StringNote {
  midi: number;
  /** When it started, on the audio clock. */
  time: number;
  slideOut?: number;
}

export interface Articulation {
  /** Fade-in in place of the sample's own attack; undefined = picked as recorded. */
  attackSec?: number;
  /** Multiplies the note's loudness. */
  gain: number;
  /** Where the pitch starts, relative to the note (cents); 0 = on the note. */
  glideFromCents: number;
  glideSec: number;
}

/** Long enough to take the pick's click out of a sample, short enough to stay on the beat. */
const LEGATO_ATTACK_SEC = 0.035;
/** A hammered or pulled note has less behind it than a picked one. */
const LEGATO_GAIN = 0.8;
const SLIDE_SEC = 0.09;
/** A slide into a note from nowhere in particular covers about this much. */
const SLIDE_IN_CENTS = 200;
/** A slide between notes further apart than this is heard as a jump anyway. */
const MAX_SLIDE_CENTS = 1200;
/** The note a slide comes from must still be the one sounding. */
const SLIDE_FROM_WITHIN_SEC = 2;

/** GP's slide-out kinds that land on the next note: 1 = shift (re-picked), 2 = legato (not). */
const SLIDE_SHIFT = 1;
const SLIDE_LEGATO = 2;

/**
 * How a note is reached, other than by picking it. A hammer-on, pull-off or
 * tap has no pick in it — played with the sample's full attack it is just
 * another picked note, which is most of what makes a legato line sound
 * sequenced. A slide's pitch travels to the note instead of jumping there.
 *
 * Returns null for a plainly picked note.
 */
export function articulationFor(
  note: Pick<TablatureNote, "isHammerOn" | "isPullOff" | "isTap" | "slideIn">,
  midi: number,
  time: number,
  previous?: StringNote,
): Articulation | null {
  const from = previous && time > previous.time && time - previous.time <= SLIDE_FROM_WITHIN_SEC ? previous : undefined;
  const slidFrom = from && (from.slideOut === SLIDE_SHIFT || from.slideOut === SLIDE_LEGATO) && from.midi !== midi ? from : undefined;

  let glideFromCents = 0;
  if (slidFrom) {
    glideFromCents = Math.max(-MAX_SLIDE_CENTS, Math.min(MAX_SLIDE_CENTS, (slidFrom.midi - midi) * 100));
  } else if (note.slideIn === 1) {
    glideFromCents = -SLIDE_IN_CENTS;
  } else if (note.slideIn === 2) {
    glideFromCents = SLIDE_IN_CENTS;
  }

  const unpicked = !!(note.isHammerOn || note.isPullOff || note.isTap) || slidFrom?.slideOut === SLIDE_LEGATO;
  if (!unpicked && glideFromCents === 0) return null;
  return {
    attackSec: unpicked ? LEGATO_ATTACK_SEC : undefined,
    gain: unpicked ? LEGATO_GAIN : 1,
    glideFromCents,
    glideSec: SLIDE_SEC,
  };
}
