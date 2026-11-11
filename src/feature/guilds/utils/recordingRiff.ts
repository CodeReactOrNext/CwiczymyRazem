import type {
  Exercise,
  TablatureBeat,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";
import type {
  RecordingContract,
  RecordingPart,
  RecordingRole,
  RecordingScale,
} from "feature/guilds/data/guildRecording";
import {
  RECORDING_SCALES,
  RECORDING_TAKE_SECONDS,
  RECORDING_TEMPO_MAX,
  RECORDING_TEMPO_MIN,
  sessionBpm,
} from "feature/guilds/data/guildRecording";
import type { GuitarSkillId } from "feature/skills/skills.types";

/**
 * The parts of a recording session, dealt from a seed.
 *
 * A part is eight bars over the session's eight-bar progression, written
 * for one fretting-hand position so it can be played without looking away
 * from the tab. What it is made of depends on its role:
 *
 *  - `bass`  roots, fifths and thirds of each bar's chord, walking into the next
 *  - `riff`  a pedalled root with a short motif of accents on top
 *  - `arp`   the bar's chord picked across the strings in one fixed pattern
 *  - `hook`  a one-bar motif answered over each chord (A A' A B / A A' A end)
 *  - `run`   a scale sequence climbing the box and coming back down
 *
 * The seed is the session's own number, drawn when the client is booked and
 * kept with the session. Every member therefore gets the same part for as
 * long as the session lasts — a rehearsal is exactly what will be recorded —
 * and the next session, even with the same client, draws a new number and
 * with it new parts, a new progression and a new band behind them.
 *
 * Nothing is picked from a list of finished lines: a part is put together
 * from its rhythm (beat by beat), its notes (step by step) and its form
 * (which idea goes in which bar), each from a stream of its own, so the
 * number of parts a role can be dealt is far past anything a guild will see.
 *
 * A seed alone does not promise a good part, so each one is dealt up to
 * `ATTEMPTS` times — attempt n is its own stream off the same seed — and the
 * first one `partFlaws` finds nothing wrong with is kept. The choice is still
 * a pure function of the seed.
 */

export const RECORDING_BARS = 8;
const ATTEMPTS = 24;

/** Open strings in standard tuning, as MIDI notes, by string number. */
const OPEN: Record<number, number> = {
  6: 40,
  5: 45,
  4: 50,
  3: 55,
  2: 59,
  1: 64,
};

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

export interface RiffNote {
  string: number;
  fret: number;
  midi: number;
}

/** One sounded (or silent) slot of a bar. */
export interface RiffSlot {
  /** In beats; a triplet eighth is 1/3. */
  duration: number;
  triplet?: boolean;
  /** Null is a rest. */
  note: RiffNote | null;
}

export type RiffBar = RiffSlot[];

type Rng = () => number;

/** FNV-1a over the session's name: the same words always open the same stream. */
export const hashSeed = (text: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** mulberry32 — small, fast, and the same numbers for the same seed. */
const createRng = (seed: number): Rng => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T>(rng: Rng, items: readonly T[]): T =>
  items[Math.floor(rng() * items.length)];
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const shuffled = <T>(rng: Rng, items: readonly T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** One part's seed: the session's number, the client and the part. */
export const recordingSeed = (
  contractId: string,
  partId: string,
  sessionSeed: number,
): number => hashSeed(`${contractId}/${partId}/${sessionSeed >>> 0}`);

/**
 * The band's seed. One for the whole session, not per part: the same band,
 * with the same drummer's habits, sits behind every part of the track.
 */
export const recordingBackingSeed = (
  contractId: string,
  sessionSeed: number,
): string => `recording:${contractId}:${sessionSeed >>> 0}`;

// ── Harmony ─────────────────────────────────────────────────────────────────

/**
 * What a chord does in the key: it is home (tonic), it leaves home
 * (subdominant) or it pulls back toward it (dominant).
 */
type ChordFunction = "T" | "S" | "D";

/**
 * The chords of each key by what they do, as 0-based degrees of the scale,
 * the plainest first. Only the triads a band would actually play: the
 * diminished one of each scale is left out, and each mode keeps the chord
 * that makes it that mode — dorian its major IV, phrygian its bII.
 */
const FUNCTIONS: Partial<
  Record<RecordingScale, Record<ChordFunction, readonly number[]>>
> = {
  // I vi iii · IV ii · V
  major: { T: [0, 5, 2], S: [3, 1], D: [4] },
  // i III VI · iv VI · VII v
  minor: { T: [0, 2, 5], S: [3, 5], D: [6, 4] },
  // i III · IV ii · VII v
  dorian: { T: [0, 2], S: [3, 1], D: [6, 4] },
  // i III · iv VI · bII VII
  phrygian: { T: [0, 2], S: [3, 5], D: [1, 6] },
  // I vi · IV ii · VII v
  mixolydian: { T: [0, 5], S: [3, 1], D: [6, 4] },
};

/**
 * Eight bars as the functions they go through. Every one of them is a
 * sentence: it starts at home, its first half stops away from home (a
 * question), its second half goes through the dominant or the subdominant
 * and lands on the tonic in the last bar (the answer) — so the part ends
 * resolved, and the loop starts again from where it came to rest.
 * `t` is a tonic chord other than the tonic itself, where the key has one.
 */
const SENTENCES: readonly (readonly (ChordFunction | "t")[])[] = [
  ["T", "S", "D", "D", "T", "S", "D", "T"],
  ["T", "T", "S", "D", "T", "S", "D", "T"],
  ["T", "S", "T", "D", "S", "S", "D", "T"],
  ["T", "D", "S", "S", "T", "S", "D", "T"],
  ["T", "S", "S", "D", "t", "S", "D", "T"],
  ["T", "t", "S", "D", "T", "t", "D", "T"],
  ["T", "S", "D", "t", "S", "D", "D", "T"],
  ["T", "t", "S", "S", "T", "D", "S", "T"],
  ["T", "S", "t", "D", "t", "S", "D", "T"],
  ["T", "D", "t", "S", "T", "S", "D", "T"],
];

/**
 * The eight chords this session is recorded over, as degrees of the client's
 * key. Dealt from the session's seed, one stream for all its parts: a
 * sentence picks the function of every bar, and each function is given one of
 * the key's chords that does that job — the plainest more often than its
 * substitutes, and not the chord of the bar before unless the sentence itself
 * stays put. Bars one and eight are always the tonic.
 */
export const sessionProgression = (
  contract: RecordingContract,
  sessionSeed: number,
): readonly number[] => {
  const rng = createRng(
    hashSeed(`${contract.id}/progression/${sessionSeed >>> 0}`),
  );
  const functions = FUNCTIONS[contract.scale] ?? FUNCTIONS.major!;
  const sentence = pick(rng, SENTENCES);
  const degrees: number[] = [];

  sentence.forEach((role, bar) => {
    if (bar === 0 || bar === sentence.length - 1) {
      degrees.push(0);
      return;
    }
    const pool =
      role === "t"
        ? functions.T.filter((degree) => degree !== 0)
        : functions[role];
    const previous = degrees[bar - 1];
    // A sentence that repeats a function may hold the chord for two bars;
    // otherwise the harmony moves.
    const mayHold = sentence[bar - 1] === role && rng() < 0.35;
    const fresh = pool.filter((degree) => degree !== previous);
    const options = mayHold || fresh.length === 0 ? pool : fresh;
    // The first of a function's chords is the one the ear expects: twice as
    // likely as any substitute.
    const weighted = options.flatMap((degree, i) =>
      i === 0 ? [degree, degree] : [degree],
    );
    degrees.push(weighted.length ? pick(rng, weighted) : 0);
  });
  return degrees;
};

/**
 * A stream of its own for one concern of one attempt. Rhythm and melody draw
 * from different streams, so tuning how one of them is dealt never reshuffles
 * the other.
 */
const stream = (seed: number, attempt: number, concern: string): Rng =>
  createRng(hashSeed(`${seed}:${attempt}:${concern}`));

// ── The fretboard ───────────────────────────────────────────────────────────

const STRINGS: Record<RecordingRole, readonly number[]> = {
  bass: [6, 5, 4],
  riff: [6, 5, 4],
  arp: [5, 4, 3, 2, 1],
  hook: [4, 3, 2, 1],
  run: [4, 3, 2, 1],
};

/** Frets one hand position covers: four fingers and a stretch. */
const BOX = 4;

/**
 * Every note of `pitchClasses` inside the box, low to high. Where two strings
 * give the same pitch the lower fret wins, which keeps the hand still.
 */
const boxNotes = (
  strings: readonly number[],
  position: number,
  pitchClasses: ReadonlySet<number>,
): RiffNote[] => {
  const byMidi = new Map<number, RiffNote>();
  for (const string of strings) {
    for (let fret = position; fret <= position + BOX; fret++) {
      const midi = OPEN[string] + fret;
      if (!pitchClasses.has(midi % 12)) continue;
      const known = byMidi.get(midi);
      if (!known || fret < known.fret) byMidi.set(midi, { string, fret, midi });
    }
  }
  return [...byMidi.values()].sort((a, b) => a.midi - b.midi);
};

interface Harmony {
  /** Pitch class of the bar's chord root. */
  root: number;
  /** Root, third and fifth, as pitch classes. */
  triad: ReadonlySet<number>;
}

/** The chord of each of the eight bars, built in thirds on the key's scale. */
const harmonyOf = (
  contract: RecordingContract,
  sessionSeed: number,
): Harmony[] => {
  const tonic = NOTE_INDEX[contract.root] ?? 0;
  const scale = RECORDING_SCALES[contract.scale];
  const progression = sessionProgression(contract, sessionSeed);
  const degree = (index: number) =>
    (tonic + scale[((index % scale.length) + scale.length) % scale.length]) %
    12;
  return Array.from({ length: RECORDING_BARS }, (_, bar) => {
    const d = progression[bar % progression.length];
    return {
      root: degree(d),
      triad: new Set([degree(d), degree(d + 2), degree(d + 4)]),
    };
  });
};

const pitchSet = (root: string, intervals: readonly number[]): Set<number> => {
  const tonic = NOTE_INDEX[root] ?? 0;
  return new Set(intervals.map((interval) => (tonic + interval) % 12));
};

/** Index of the note of `notes` closest to `from` that `accept` takes; `from` if none. */
const nearest = (
  notes: readonly RiffNote[],
  from: number,
  accept: (note: RiffNote) => boolean,
): number => {
  let best = -1;
  for (let i = 0; i < notes.length; i++) {
    if (!accept(notes[i])) continue;
    if (best < 0 || Math.abs(i - from) < Math.abs(best - from)) best = i;
  }
  return best < 0 ? clamp(from, 0, notes.length - 1) : best;
};

// ── Rhythm ──────────────────────────────────────────────────────────────────

type Cell = readonly RiffSlot[];
const slot = (duration: number, triplet = false): RiffSlot => ({
  duration,
  ...(triplet && { triplet: true }),
  note: null,
});

/** One beat's worth of notes, in each of the shapes a bar is built from. */
const BEAT = {
  quarter: [slot(1)],
  eighths: [slot(0.5), slot(0.5)],
  triplet: [slot(1 / 3, true), slot(1 / 3, true), slot(1 / 3, true)],
  sixteenths: [slot(0.25), slot(0.25), slot(0.25), slot(0.25)],
  gallop: [slot(0.5), slot(0.25), slot(0.25)],
  reverseGallop: [slot(0.25), slot(0.25), slot(0.5)],
} as const;
type BeatShape = keyof typeof BEAT;

/** Bars as four beat shapes, per density. Steady first: it is the one a role falls back on. */
const BAR_SHAPES: Record<1 | 2 | 3 | 4, readonly (readonly BeatShape[])[]> = {
  1: [
    ["quarter", "quarter", "quarter", "quarter"],
    ["quarter", "quarter", "quarter", "eighths"],
    ["quarter", "eighths", "quarter", "quarter"],
    ["quarter", "quarter", "eighths", "quarter"],
  ],
  2: [
    ["eighths", "eighths", "eighths", "eighths"],
    ["quarter", "eighths", "quarter", "eighths"],
    ["eighths", "quarter", "eighths", "quarter"],
    ["quarter", "eighths", "eighths", "quarter"],
    ["eighths", "eighths", "quarter", "quarter"],
  ],
  3: [
    ["triplet", "triplet", "triplet", "triplet"],
    ["quarter", "triplet", "quarter", "triplet"],
    ["triplet", "quarter", "triplet", "quarter"],
    ["triplet", "triplet", "quarter", "quarter"],
  ],
  4: [
    ["sixteenths", "sixteenths", "sixteenths", "sixteenths"],
    ["gallop", "gallop", "gallop", "gallop"],
    ["eighths", "sixteenths", "eighths", "sixteenths"],
    ["gallop", "gallop", "sixteenths", "eighths"],
    ["reverseGallop", "eighths", "reverseGallop", "eighths"],
  ],
};

const barOf = (shapes: readonly BeatShape[]): Cell =>
  shapes.flatMap((shape) => BEAT[shape]);

const steadyBar = (density: 1 | 2 | 3 | 4): Cell =>
  barOf(BAR_SHAPES[density][0]);
const dealBar = (rng: Rng, density: 1 | 2 | 3 | 4): Cell =>
  barOf(pick(rng, BAR_SHAPES[density]));

/** A cell with its notes filled in by position. */
const fill = (
  cell: Cell,
  noteAt: (index: number) => RiffNote | null,
): RiffBar => cell.map((entry, index) => ({ ...entry, note: noteAt(index) }));

// ── Roles ───────────────────────────────────────────────────────────────────

interface Deal {
  contract: RecordingContract;
  part: RecordingPart;
  harmony: Harmony[];
  rhythm: Rng;
  melody: Rng;
  form: Rng;
}

/**
 * Which idea each of the eight bars plays. Every form says its main idea
 * first, answers in the fourth bar and the last, and brings the second idea
 * in somewhere different — so the second half is never the first one again.
 */
type Idea = "main" | "alt" | "answer";
const FORMS: readonly (readonly Idea[])[] = [
  ["main", "main", "main", "answer", "main", "alt", "main", "answer"],
  ["main", "alt", "main", "answer", "main", "alt", "alt", "answer"],
  ["main", "main", "alt", "answer", "alt", "main", "main", "answer"],
  ["main", "alt", "main", "answer", "alt", "main", "alt", "answer"],
  ["main", "main", "alt", "answer", "main", "alt", "alt", "answer"],
];

/** A step up a ladder of `length` notes that turns round at the ends instead of sticking. */
const bounce = (step: number, length: number): number => {
  if (length <= 1) return 0;
  const period = 2 * (length - 1);
  const at = ((step % period) + period) % period;
  return at < length ? at : period - at;
};

/** The chord's notes in the box from its lowest root up — root, third, fifth, octave… */
const chordLadder = (
  notes: readonly RiffNote[],
  chord: Harmony,
): RiffNote[] => {
  const tones = notes.filter((note) => chord.triad.has(note.midi % 12));
  const rootAt = tones.findIndex((note) => note.midi % 12 === chord.root);
  // Without a root low enough to build on, the ladder starts on whatever the
  // box has: an inversion still spells the chord.
  return rootAt > 0 && tones.length - rootAt >= 4 ? tones.slice(rootAt) : tones;
};

/**
 * The same for the bass, which has to stand on the root whatever the box
 * gives it: the root first, the chord above it, then what lies under it.
 */
const bassLadder = (notes: readonly RiffNote[], chord: Harmony): RiffNote[] => {
  const tones = notes.filter((note) => chord.triad.has(note.midi % 12));
  const rootAt = tones.findIndex((note) => note.midi % 12 === chord.root);
  if (rootAt <= 0) return tones;
  return [...tones.slice(rootAt), ...tones.slice(0, rootAt).reverse()];
};

/**
 * Bass: each bar stands on its chord's root, moves through the chord after
 * it — which steps, in which rhythm, is the idea the seed deals — and its
 * last note steps into the next bar's root.
 */
const dealBass = ({
  contract,
  part,
  harmony,
  rhythm,
  melody,
  form,
}: Deal): RiffBar[] => {
  const key = pitchSet(contract.root, RECORDING_SCALES[contract.scale]);
  const notes = boxNotes(STRINGS.bass, part.position, key);
  const density = part.density === 1 ? 1 : 2;
  // Ladder steps: 0 root, 1 third, 2 fifth, 3 octave (or what lies under).
  const idea = () => {
    const cell = dealBar(rhythm, density);
    return {
      cell,
      steps: cell.map((_, index) =>
        index === 0 ? 0 : pick(melody, [0, 0, 1, 2, 2, 3]),
      ),
    };
  };
  const ideas: Record<Idea, ReturnType<typeof idea>> = {
    main: idea(),
    alt: idea(),
    answer: idea(),
  };
  const plan = pick(form, FORMS);

  return harmony.map((chord, bar) => {
    const ladder = bassLadder(notes, chord);
    const { cell, steps } = ideas[plan[bar]];
    const next = harmony[(bar + 1) % harmony.length];
    const nextRoot = nearest(notes, 0, (note) => note.midi % 12 === next.root);
    return fill(cell, (index) => {
      const last = index === cell.length - 1;
      // The approach: the scale note just under (or over) the next root.
      if (last && next.root !== chord.root) {
        const under = notes[nextRoot - 1] ?? notes[nextRoot + 1];
        if (under) return under;
      }
      return ladder[Math.min(steps[index], ladder.length - 1)];
    });
  });
};

/**
 * Riff: the chord's root pedalled on every note, and a motif of two or three
 * scale tones above it landing on the same accents in every bar.
 */
const dealRiff = ({
  contract,
  part,
  harmony,
  rhythm,
  melody,
}: Deal): RiffBar[] => {
  const key = pitchSet(contract.root, RECORDING_SCALES[contract.scale]);
  const notes = boxNotes(STRINGS.riff, part.position, key);
  const density = part.density === 3 ? 2 : part.density;
  const cell = dealBar(rhythm, density);
  const turn = dealBar(rhythm, density);

  // Accents: never the downbeat (the root owns it), two to four a bar.
  const accentCount = clamp(Math.round(cell.length / 3), 2, 4);
  const candidates = cell.map((_, index) => index).filter((index) => index > 0);
  const accents = new Set<number>();
  while (accents.size < Math.min(accentCount, candidates.length))
    accents.add(pick(rhythm, candidates));
  // How far above the root each accent reaches, in scale steps.
  const motif = Array.from({ length: 4 }, () => pick(melody, [1, 2, 2, 3, 4]));

  return harmony.map((chord, bar) => {
    const root = nearest(notes, 0, (note) => note.midi % 12 === chord.root);
    const isTurn = bar % 4 === 3;
    const shape = isTurn ? turn : cell;
    let accent = 0;
    return fill(shape, (index) => {
      // The turn walks down the scale from above the root into the next bar.
      if (isTurn && index >= shape.length - 3) {
        const down = shape.length - 1 - index;
        return notes[clamp(root + down + 1, 0, notes.length - 1)];
      }
      if (!isTurn && accents.has(index)) {
        const reach = motif[accent++ % motif.length];
        return notes[clamp(root + reach, 0, notes.length - 1)];
      }
      return notes[root];
    });
  });
};

/**
 * Arpeggio: a picking pattern — a walk up and down the chord, a note or two
 * at a time — moved from chord to chord. The seed deals the walk and the
 * rhythm it is picked in.
 */
const dealArp = ({
  contract,
  part,
  harmony,
  rhythm,
  melody,
  form,
}: Deal): RiffBar[] => {
  const key = pitchSet(contract.root, RECORDING_SCALES[contract.scale]);
  const wide = part.density >= 3;
  const notes = boxNotes(
    wide ? STRINGS.arp : STRINGS.arp.slice(0, 4),
    part.position,
    key,
  );
  const density = part.density === 1 ? 2 : part.density;
  const idea = () => {
    // Steady picking as often as not: it is what an arpeggio mostly is.
    const cell = rhythm() < 0.5 ? steadyBar(density) : dealBar(rhythm, density);
    const steps = [0];
    let direction = 1;
    while (steps.length < cell.length) {
      if (melody() < 0.22) direction = -direction;
      // Never the note just played: a walk that stands still is no pattern.
      const jump = pick(melody, [1, 1, 1, 2]);
      steps.push(steps[steps.length - 1] + direction * jump);
    }
    return { cell, steps };
  };
  const ideas: Record<Idea, ReturnType<typeof idea>> = {
    main: idea(),
    alt: idea(),
    answer: idea(),
  };
  const plan = pick(form, FORMS);

  return harmony.map((chord, bar) => {
    const ladder = chordLadder(notes, chord);
    const { cell, steps } = ideas[plan[bar]];
    return fill(cell, (index) => ladder[bounce(steps[index], ladder.length)]);
  });
};

/**
 * Hook: a one-bar motif — a rhythm and a contour — that starts on a note of
 * the bar's chord every time it comes round, a second idea in the fourth
 * bar, and a long last note on the tonic.
 */
const dealHook = ({
  contract,
  part,
  harmony,
  rhythm,
  melody,
}: Deal): RiffBar[] => {
  const scale = RECORDING_SCALES[contract.leadScale ?? contract.scale];
  const notes = boxNotes(
    STRINGS.hook,
    part.position,
    pitchSet(contract.root, scale),
  );
  const tonic = NOTE_INDEX[contract.root] ?? 0;
  const density = part.density === 4 ? 2 : part.density;
  const motifCell = dealBar(rhythm, density);
  const answerCell = dealBar(rhythm, density);
  const contour = (length: number) =>
    Array.from({ length }, () => pick(melody, [-2, -1, -1, 1, 1, 2]));
  const motif = contour(motifCell.length);
  const answer = contour(answerCell.length).map((step) => Math.abs(step));
  // The motif the second time round: the same rhythm, its second half turned
  // upside down, so the line answers itself instead of saying it twice.
  const reply = motif.map((step, index) =>
    index >= motif.length / 2 ? -step : step,
  );
  const home = Math.floor(notes.length / 2);

  const phrase = (
    cell: Cell,
    steps: readonly number[],
    chord: Harmony,
    startNear: number,
  ) => {
    let at = nearest(notes, startNear, (note) =>
      chord.triad.has(note.midi % 12),
    );
    return fill(cell, (index) => {
      if (index > 0) {
        const to = at + steps[index];
        // Turn round at the edges of the box instead of sitting on them.
        at = to < 0 || to >= notes.length ? at - steps[index] : to;
        at = clamp(at, 0, notes.length - 1);
      }
      return notes[at];
    });
  };

  return harmony.map((chord, bar) => {
    if (bar === RECORDING_BARS - 1) {
      // The ending: down the scale onto the tonic, held, then a breath.
      const end = nearest(notes, home, (note) => note.midi % 12 === tonic);
      const cell: Cell = [slot(0.5), slot(0.5), slot(2), slot(1)];
      return fill(cell, (index) =>
        index === 3
          ? null
          : notes[clamp(end + (2 - index), 0, notes.length - 1)],
      );
    }
    if (bar % 4 === 3) return phrase(answerCell, answer, chord, home - 2);
    return bar % 4 === 1
      ? phrase(motifCell, reply, chord, home + 2)
      : phrase(motifCell, motif, chord, home);
  });
};

/**
 * Run: a sequence — groups of three or four scale notes in a shape of their
 * own, each group a step or two on from the last — up the box and back,
 * resolving on the tonic. The seed deals the shapes, how far each group
 * moves, where the line starts and where it stops for breath.
 */
const dealRun = ({
  contract,
  part,
  harmony,
  melody,
  form,
}: Deal): RiffBar[] => {
  const scale = RECORDING_SCALES[contract.leadScale ?? contract.scale];
  const notes = boxNotes(
    STRINGS.run,
    part.position,
    pitchSet(contract.root, scale),
  );
  const tonic = NOTE_INDEX[contract.root] ?? 0;
  const density = part.density < 3 ? 3 : part.density;
  const cell = steadyBar(density);
  const size = density === 3 ? 3 : 4;

  const idea = () => {
    // Any order of the group's notes; now and then one of them comes back.
    const shape = shuffled(melody, [0, 1, 2, 3]).slice(0, size);
    if (size === 4 && melody() < 0.3) shape[3] = shape[1];
    return {
      shape,
      stride: pick(melody, [1, 1, 2]),
      // The bar's last beat held as one note instead of another group.
      breath: melody() < 0.35,
    };
  };
  const ideas: Record<Idea, ReturnType<typeof idea>> = {
    main: idea(),
    alt: idea(),
    answer: idea(),
  };
  const plan = pick(form, FORMS);

  const top = Math.max(0, notes.length - 4);
  const tonics = notes
    .map((note, index) => (note.midi % 12 === tonic ? index : -1))
    .filter((index) => index >= 0 && index <= top);
  let at = tonics.length ? pick(melody, tonics) : 0;
  let direction = at > top / 2 ? -1 : 1;

  return harmony.map((chord, bar) => {
    const last = bar === RECORDING_BARS - 1;
    const { shape, stride, breath } = ideas[plan[bar]];
    const filled: RiffBar = [];
    for (let group = 0; group < 4; group++) {
      if (group === 3 && (last || breath)) {
        // Land on the tonic at the very end, on the bar's chord before it.
        const rest = nearest(notes, at, (note) =>
          last ? note.midi % 12 === tonic : chord.triad.has(note.midi % 12),
        );
        filled.push({ duration: 1, note: notes[rest] });
        break;
      }
      for (let i = 0; i < size; i++) {
        const offset = direction > 0 ? shape[i] : 3 - shape[i];
        filled.push({
          ...cell[group * size + i],
          note: notes[clamp(at + offset, 0, notes.length - 1)],
        });
      }
      if (at + direction * stride > top || at + direction * stride < 0)
        direction = -direction;
      at = clamp(at + direction * stride, 0, top);
    }
    return filled;
  });
};

const DEALERS: Record<RecordingRole, (deal: Deal) => RiffBar[]> = {
  bass: dealBass,
  riff: dealRiff,
  arp: dealArp,
  hook: dealHook,
  run: dealRun,
};

// ── Quality ─────────────────────────────────────────────────────────────────

const sounded = (bars: readonly RiffBar[]): RiffNote[] =>
  bars.flat().flatMap((entry) => (entry.note ? [entry.note] : []));

/**
 * What is wrong with a dealt part, in words — empty when it is fit to record.
 * These are the things that make a generated line feel generated: a bar that
 * does not add up, a melody stuck on one note or leaping about, a part that
 * never uses its box.
 */
export const partFlaws = (
  role: RecordingRole,
  bars: readonly RiffBar[],
): string[] => {
  const flaws: string[] = [];
  if (bars.length !== RECORDING_BARS) flaws.push("not eight bars");
  bars.forEach((bar, index) => {
    const beats = bar.reduce((sum, entry) => sum + entry.duration, 0);
    if (Math.abs(beats - 4) > 1e-6)
      flaws.push(`bar ${index + 1} is ${beats} beats`);
  });

  const notes = sounded(bars);
  if (notes.some((note) => note.fret < 0 || note.fret > 17))
    flaws.push("off the neck");
  const frets = notes.filter((note) => note.fret > 0).map((note) => note.fret);
  if (frets.length && Math.max(...frets) - Math.min(...frets) > BOX)
    flaws.push("wider than one position");

  const distinct = new Set(notes.map((note) => note.midi)).size;
  const wanted: Record<RecordingRole, number> = {
    bass: 4,
    riff: 3,
    arp: 5,
    hook: 5,
    run: 6,
  };
  if (distinct < wanted[role]) flaws.push(`only ${distinct} different notes`);

  if (role === "hook" || role === "run") {
    let repeats = 0;
    let longest = 0;
    let leaps = 0;
    for (let i = 1; i < notes.length; i++) {
      const gap = Math.abs(notes[i].midi - notes[i - 1].midi);
      repeats = gap === 0 ? repeats + 1 : 0;
      longest = Math.max(longest, repeats);
      if (gap > 9) leaps++;
    }
    if (longest >= 2) flaws.push("stuck on one note");
    if (leaps > 2) flaws.push("leaps about");
  }
  if (role === "hook") {
    const pitches = notes.map((note) => note.midi);
    if (Math.max(...pitches) - Math.min(...pitches) < 7) flaws.push("no range");
    const line = (bar: RiffBar) =>
      bar.map((entry) => entry.note?.midi ?? "r").join(",");
    if (bars.length > 1 && line(bars[0]) === line(bars[1]))
      flaws.push("says it twice");
  }
  if (role === "bass") {
    // Roots alone are a metronome with pitches: a third of the notes, at
    // least, have to be somewhere else in the chord.
    const onRoot = bars.reduce(
      (count, bar) =>
        count +
        bar.filter((entry) => entry.note?.midi === bar[0].note?.midi).length,
      0,
    );
    if (onRoot / notes.length > 0.67) flaws.push("only roots");
  }
  if (role === "arp") {
    let stalls = 0;
    for (let i = 1; i < notes.length; i++)
      if (notes[i].midi === notes[i - 1].midi) stalls++;
    if (stalls / notes.length > 0.15) flaws.push("stalls");
  }
  if (role === "riff") {
    // The motif has to be heard: at least a fifth of the notes off the pedal.
    const roots = new Map<number, number>();
    for (const note of notes)
      roots.set(note.midi, (roots.get(note.midi) ?? 0) + 1);
    const pedal = Math.max(...roots.values());
    if (pedal / notes.length > 0.8) flaws.push("all pedal");
  }
  return flaws;
};

/** The part as dealt, bar by bar, and which attempt was kept. */
export const dealRecordingPart = (
  contract: RecordingContract,
  part: RecordingPart,
  sessionSeed: number,
): { bars: RiffBar[]; attempt: number; flaws: string[] } => {
  const seed = recordingSeed(contract.id, part.id, sessionSeed);
  const harmony = harmonyOf(contract, sessionSeed);
  let fallback: { bars: RiffBar[]; attempt: number; flaws: string[] } | null =
    null;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const bars = DEALERS[part.role]({
      contract,
      part,
      harmony,
      rhythm: stream(seed, attempt, "rhythm"),
      melody: stream(seed, attempt, "melody"),
      form: stream(seed, attempt, "form"),
    });
    const flaws = partFlaws(part.role, bars);
    if (flaws.length === 0) return { bars, attempt, flaws };
    if (!fallback || flaws.length < fallback.flaws.length)
      fallback = { bars, attempt, flaws };
  }
  // Every attempt had something: the least flawed one still plays.
  return fallback!;
};

const PITCH_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/** The bar's chord as a tab names it: "Em", "C", "F#dim". */
const chordName = ({ root, triad }: Harmony): string => {
  const has = (interval: number) => triad.has((root + interval) % 12);
  const quality = has(4) ? "" : has(7) ? "m" : "dim";
  return `${PITCH_NAMES[root]}${quality}`;
};

/** The chord each of the session's eight bars is written over. */
export const sessionChords = (
  contract: RecordingContract,
  sessionSeed: number,
): string[] => harmonyOf(contract, sessionSeed).map(chordName);

/**
 * The bars as a tab. Each bar names its chord on its first beat: the player
 * reads what they are playing over, and the band behind the take plays those
 * chords rather than guessing them from one part's notes — so every part of
 * a session is recorded over the same harmony.
 */
const toMeasures = (
  bars: readonly RiffBar[],
  chords: readonly string[],
): TablatureMeasure[] =>
  bars.map((bar, index) => ({
    timeSignature: [4, 4],
    beats: bar.map(
      (entry, beat): TablatureBeat => ({
        ...(beat === 0 && { chordName: chords[index] }),
        duration: entry.duration,
        notes: entry.note
          ? [{ string: entry.note.string, fret: entry.note.fret }]
          : [],
        ...(entry.triplet && { tuplet: 3 }),
      }),
    ),
  }));

/** The part as a tab. */
export const buildRecordingTablature = (
  contract: RecordingContract,
  part: RecordingPart,
  sessionSeed: number,
): TablatureMeasure[] =>
  toMeasures(
    dealRecordingPart(contract, part, sessionSeed).bars,
    sessionChords(contract, sessionSeed),
  );

/** Notes one pass of the part has — what the server sizes a whole take on. */
export const recordingPartNotes = (
  contract: RecordingContract,
  part: RecordingPart,
  sessionSeed: number,
): number =>
  sounded(dealRecordingPart(contract, part, sessionSeed).bars).length;

const SKILLS: Record<RecordingRole, GuitarSkillId[]> = {
  bass: ["rhythm"],
  riff: ["rhythm", "alternate_picking"],
  arp: ["chords", "string_skipping"],
  hook: ["phrasing"],
  run: ["scales", "alternate_picking"],
};

export const RECORDING_EXERCISE_PREFIX = "recording-";

/** The tempo range a take may be played at, around the session's own. */
export const recordingTempoRange = (
  bpm: number,
): { min: number; max: number; recommended: number } => ({
  min: Math.round(bpm * RECORDING_TEMPO_MIN),
  max: Math.round(bpm * RECORDING_TEMPO_MAX),
  recommended: bpm,
});

/**
 * The part as a session exercise, at the tempo of the session's tier; `part`
 * is one of `sessionParts`, so the tier has already said how busy it may
 * get. Generated, not in the catalogue:
 * `_generatorConfig` keeps it off the leaderboards and out of goals, and
 * carries what the generated band behind the take goes by: the track's key,
 * the session's own seed and the client's band — a session band, which the
 * volume menu then shows locked.
 */
export const buildRecordingExercise = (
  contract: RecordingContract,
  part: RecordingPart,
  sessionSeed: number,
  options: { title: string; rehearsal: boolean; tier: number },
): Exercise => ({
  id: `${RECORDING_EXERCISE_PREFIX}${contract.id}-${part.id}`,
  title: options.title,
  description: `${contract.client} — ${contract.track}`,
  difficulty:
    options.tier <= 2 ? "easy" : options.tier <= 4 ? "medium" : "hard",
  category: "technique",
  // A take is one minute on the clock; a rehearsal is as long as it needs.
  timeInMinutes: options.rehearsal ? 10 : RECORDING_TAKE_SECONDS / 60,
  instructions: [],
  tips: [],
  metronomeSpeed: recordingTempoRange(sessionBpm(contract, options.tier)),
  relatedSkills: SKILLS[part.role],
  tablature: buildRecordingTablature(contract, part, sessionSeed),
  isHiddenFromLibrary: true,
  _generatorConfig: {
    kind: "recording",
    rootNote: contract.root,
    scaleType: contract.scale,
    backingSeed: recordingBackingSeed(contract.id, sessionSeed),
    bandStyle: contract.band,
  },
});
