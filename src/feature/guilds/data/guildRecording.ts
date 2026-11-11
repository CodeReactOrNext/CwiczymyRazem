/**
 * Recording sessions: the guild as session musicians.
 *
 * A client walks into the guild's studio with a track and a fee to pay up
 * front. The track is a handful of parts — a riff, a bass line, a hook — and
 * every part is a tab the members record takes of. Each kept take lays its
 * points onto that part's tape; when every part's tape is full the track is
 * out, and whatever the guild lays down past that makes it a gold or a
 * platinum record before the week is over.
 *
 * Nothing in the room is needed to start: an empty garage records the first
 * client. The gear only helps (see `recordingPerks`) — more takes a day,
 * more points a take, shorter tapes, a better fee.
 *
 * A guild does not pick the client: it books a tier, and the client is drawn.
 *
 * The parts are not written out anywhere. They are dealt by
 * `recordingRiff.ts` from the seed each session draws when it is booked, so
 * this file only says what each one should be: its role, its register and
 * how busy it is.
 */

import type { StudioStyleId } from "feature/autoBacking/styles";

/** What a part is in the arrangement — it picks the generator. */
export type RecordingRole = "riff" | "bass" | "arp" | "hook" | "run";

/** Scales the generator and the generated band both know by name. */
export type RecordingScale =
  | "minor_pentatonic"
  | "major_pentatonic"
  | "minor"
  | "major"
  | "dorian"
  | "phrygian"
  | "mixolydian";

export const RECORDING_SCALES: Record<RecordingScale, readonly number[]> = {
  minor_pentatonic: [0, 3, 5, 7, 10],
  major_pentatonic: [0, 2, 4, 7, 9],
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

export interface RecordingPart {
  id: string;
  role: RecordingRole;
  /** English fallback; the locale files carry `recording.parts.<role>`. */
  name: string;
  /** The busiest the part gets: notes per beat (1 quarters … 4 sixteenths). */
  density: 1 | 2 | 3 | 4;
  /** The fret the part's box starts at. */
  position: number;
}

export type RecordingGenre =
  | "punk"
  | "blues"
  | "synth"
  | "folk"
  | "metal"
  | "fusion"
  | "funk"
  | "reggae"
  | "surf";

export interface RecordingContract {
  id: string;
  client: string;
  track: string;
  genre: RecordingGenre;
  /**
   * The band behind every take of this client — a session band, heard
   * nowhere but here (see STUDIO_STYLES). It comes with the contract: the
   * player cannot swap it for another.
   */
  band: StudioStyleId;
  /** The client, in one line, in their own voice. English fallback. */
  pitch: string;
  /** The tempo a take is worth its full points at. */
  bpm: number;
  root: string;
  /**
   * The key the band is told, and the one the session's chords are dealt
   * in (`sessionProgression`): seven notes, so every degree has a triad. The
   * key is the client's; the progression is each session's own.
   */
  scale: RecordingScale;
  /** What the melodic parts play out of, when it is narrower than the key. */
  leadScale?: RecordingScale;
  parts: readonly RecordingPart[];
}

const part = (
  id: string,
  role: RecordingRole,
  name: string,
  density: RecordingPart["density"],
  position: number,
): RecordingPart => ({ id, role, name, density, position });

/**
 * The clients. They are a pool, not a ladder: a guild books a tier (see
 * `RECORDING_TIERS`) and one of these walks in, drawn by the session's seed —
 * so the same tier is a different record, in a different style, every time.
 * Every client can be recorded at every tier; the tier decides how hard their
 * track is played, never which of them a guild may meet.
 *
 * A client's parts are listed with the ones a track cannot do without first:
 * a low tier records only the first few of them.
 */
export const RECORDING_CONTRACTS: readonly RecordingContract[] = [
  {
    id: "rust-buckets",
    client: "The Rust Buckets",
    track: "Parking Lot Anthem",
    genre: "punk",
    band: "garage",
    pitch:
      "Three chords, two takes, one afternoon. We can't play it clean, so you will.",
    bpm: 92,
    root: "E",
    scale: "minor",
    leadScale: "minor_pentatonic",
    parts: [
      part("riff", "riff", "Rhythm guitar", 2, 0),
      part("bass", "bass", "Bass line", 1, 0),
      part("hook", "hook", "Lead hook", 2, 7),
    ],
  },
  {
    id: "late-shift",
    client: "Sal & the Late Shift",
    track: "Last Call Blues",
    genre: "blues",
    band: "juke",
    pitch:
      "The band went home at two. The song still needs finishing, and the coffee is free.",
    bpm: 84,
    root: "A",
    scale: "dorian",
    leadScale: "minor_pentatonic",
    parts: [
      part("bass", "bass", "Walking bass", 1, 3),
      part("hook", "hook", "Lead licks", 3, 5),
      part("run", "run", "Turnaround", 3, 5),
    ],
  },
  {
    id: "neon-motel",
    client: "Neon Motel",
    track: "Vacancy",
    genre: "synth",
    band: "neon",
    pitch:
      "We do everything on machines. The label wants it to sound like somebody touched a string.",
    bpm: 104,
    root: "A",
    scale: "minor",
    parts: [
      part("arp", "arp", "Clean arpeggio", 2, 0),
      part("bass", "bass", "Pulse bass", 2, 3),
      part("hook", "hook", "Chorus hook", 2, 5),
      part("run", "run", "Bridge run", 3, 5),
    ],
  },
  {
    id: "paper-lanterns",
    client: "Paper Lanterns",
    track: "Kite Season",
    genre: "folk",
    band: "porch",
    pitch:
      "It was written on a porch. Keep the porch in it — and please, no solos longer than the verse.",
    bpm: 108,
    root: "G",
    scale: "major",
    leadScale: "major_pentatonic",
    parts: [
      part("arp", "arp", "Picked chords", 2, 0),
      part("bass", "bass", "Low line", 2, 2),
      part("hook", "hook", "Melody", 2, 7),
      part("run", "run", "Counter line", 4, 7),
    ],
  },
  {
    id: "iron-harvest",
    client: "Iron Harvest",
    track: "Scythe",
    genre: "metal",
    band: "forge",
    pitch:
      "Tight, loud and exactly on the grid. If it swings, we are not paying.",
    bpm: 132,
    root: "E",
    scale: "phrygian",
    leadScale: "minor",
    parts: [
      part("riff", "riff", "Main riff", 4, 0),
      part("bass", "bass", "Bass", 2, 0),
      part("hook", "hook", "Harmony lead", 2, 12),
      part("run", "run", "Solo run", 4, 12),
    ],
  },
  {
    id: "long-take",
    client: "Marlowe Vance",
    track: "The Long Take",
    genre: "fusion",
    band: "loft",
    pitch:
      "I have fired better bands than yours. Play it in one take and I may remember your name.",
    bpm: 120,
    root: "D",
    scale: "dorian",
    parts: [
      part("arp", "arp", "Wide arpeggios", 3, 5),
      part("bass", "bass", "Bass line", 2, 5),
      part("riff", "riff", "Comping line", 4, 5),
      part("hook", "hook", "Head", 3, 10),
      part("run", "run", "Solo", 4, 10),
    ],
  },
  {
    id: "loose-change",
    client: "The Loose Change",
    track: "Pocket Money",
    genre: "funk",
    band: "strut",
    pitch:
      "Nobody plays a note on the one unless I point at them. Everything else is yours.",
    bpm: 100,
    root: "E",
    scale: "dorian",
    leadScale: "minor_pentatonic",
    parts: [
      part("riff", "riff", "Scratch guitar", 4, 5),
      part("bass", "bass", "Bass line", 2, 5),
      part("hook", "hook", "Horn line", 2, 7),
      part("run", "run", "Break", 4, 7),
    ],
  },
  {
    id: "night-ferry",
    client: "Night Ferry Sound",
    track: "Harbour Lights",
    genre: "reggae",
    band: "yard",
    pitch:
      "Play less. Then play less than that. The space is the song, the rest is the echo.",
    bpm: 76,
    root: "G",
    scale: "major",
    leadScale: "major_pentatonic",
    parts: [
      part("bass", "bass", "Bass line", 2, 2),
      part("arp", "arp", "Picked chords", 2, 0),
      part("hook", "hook", "Melody", 2, 7),
    ],
  },
  {
    id: "riptides",
    client: "The Riptides",
    track: "Reef Break",
    genre: "surf",
    band: "tide",
    pitch:
      "Fast, wet and in a minor key. If the reverb tank isn't rattling, do it again.",
    bpm: 144,
    root: "A",
    scale: "minor",
    parts: [
      part("riff", "riff", "Rhythm guitar", 2, 0),
      part("bass", "bass", "Bass line", 2, 3),
      part("hook", "hook", "Lead melody", 2, 5),
      part("run", "run", "Tremolo run", 3, 5),
    ],
  },
];

export const getRecordingContract = (
  id: string | undefined,
): RecordingContract | undefined =>
  RECORDING_CONTRACTS.find((contract) => contract.id === id);

// ── Tiers ───────────────────────────────────────────────────────────────────

/**
 * What a guild books. A tier is how serious the session is: the higher it
 * is, the faster the track is cut, the more parts it has, the busier those
 * parts may get and the longer the tapes are — and the more the client pays.
 * Tier one is open to anybody; each one after it opens once the guild has
 * released a record on the tier before.
 */
export interface RecordingTier {
  /** 1 → 6. */
  tier: number;
  /** English fallback; the locale files carry `recording.tiers.t<n>`. */
  name: string;
  /** The track's tempo as a share of the client's own. */
  tempo: number;
  /** How many of the client's parts are recorded. */
  parts: number;
  /** The busiest a part may get: notes per beat (2 eighths … 4 sixteenths). */
  density: 2 | 3 | 4;
  /** Guild Fame the session costs to book, before the bench's discount. */
  fee: number;
  /** Points a part's tape holds before the track counts as recorded. */
  tape: number;
  /** Fame every member who played gets for a plain release. */
  fame: number;
}

export const RECORDING_TIERS: readonly RecordingTier[] = [
  {
    tier: 1,
    name: "Garage label",
    tempo: 0.8,
    parts: 3,
    density: 2,
    fee: 2_000,
    tape: 500,
    fame: 150,
  },
  {
    tier: 2,
    name: "Local label",
    tempo: 0.9,
    parts: 3,
    density: 2,
    fee: 4_000,
    tape: 800,
    fame: 220,
  },
  {
    tier: 3,
    name: "Indie label",
    tempo: 1,
    parts: 4,
    density: 3,
    fee: 7_000,
    tape: 850,
    fame: 320,
  },
  {
    tier: 4,
    name: "Major label",
    tempo: 1.08,
    parts: 4,
    density: 3,
    fee: 12_000,
    tape: 1_300,
    fame: 450,
  },
  {
    tier: 5,
    name: "World release",
    tempo: 1.12,
    parts: 5,
    density: 4,
    fee: 20_000,
    tape: 1_500,
    fame: 620,
  },
  {
    tier: 6,
    name: "Hall of fame",
    tempo: 1.2,
    parts: 5,
    density: 4,
    fee: 32_000,
    tape: 2_000,
    fame: 850,
  },
];

export const RECORDING_MAX_TIER = RECORDING_TIERS.length;

/**
 * What a decent take lays down, for sizing things in takes: a tape is long
 * on purpose — a part is not recorded in one go but in six or seven kept
 * takes at the least, and a whole track in a couple of dozen, which is what
 * makes a session the guild's work rather than one member's evening.
 */
export const RECORDING_TYPICAL_TAKE = 85;

/**
 * How the client takes what they hear, worst to best, by the average
 * accuracy of the kept takes: the floor of each mood, and the tip it adds to
 * the cheque when the track is released. A client who is merely satisfied
 * pays what was agreed; one who cannot believe their luck pays more.
 */
export const RECORDING_MOODS = [
  { id: "cold", from: 0, tip: 0 },
  { id: "listening", from: 65, tip: 0 },
  { id: "nodding", from: 78, tip: 5 },
  { id: "grinning", from: 88, tip: 10 },
  { id: "speechless", from: 95, tip: 20 },
] as const;

export type RecordingMood = (typeof RECORDING_MOODS)[number]["id"];

/** How many takes the last-takes list on the session keeps. */
export const RECORDING_LOG_LENGTH = 8;

/** The tier with this number; the first for anything that is not one. */
export const getRecordingTier = (tier: unknown): RecordingTier =>
  RECORDING_TIERS.find((entry) => entry.tier === tier) ?? RECORDING_TIERS[0];

export const isRecordingTier = (tier: unknown): tier is number =>
  RECORDING_TIERS.some((entry) => entry.tier === tier);

/** The tempo a take is worth its full points at: the client's, at this tier's pace. */
export const sessionBpm = (contract: RecordingContract, tier: number): number =>
  Math.round(contract.bpm * getRecordingTier(tier).tempo);

/**
 * The parts a session at this tier records: the client's first few, none of
 * them busier than the tier allows.
 */
export const sessionParts = (
  contract: RecordingContract,
  tier: number,
): RecordingPart[] => {
  const { parts, density } = getRecordingTier(tier);
  return contract.parts.slice(0, parts).map((entry) => ({
    ...entry,
    density: Math.min(entry.density, density) as RecordingPart["density"],
  }));
};

/** How a session ends, worst to best. */
export const RECORDING_RATINGS = [
  "shelved",
  "demo",
  "record",
  "gold",
  "platinum",
] as const;
export type RecordingRating = (typeof RECORDING_RATINGS)[number];

/** A session is open this long from the moment the fee is paid. */
export const RECORDING_DAYS = 7;
/** Kept takes a member may lay down a day, in an empty room. */
export const RECORDING_TAKES_PER_DAY = 3;
/** Kept takes a member needs in a session to be paid for it at all. */
export const RECORDING_MIN_TAKES_FOR_PAY = 3;
/**
 * Kept takes that earn a member the whole of their Fame. Under it they are
 * paid in proportion: a session is the guild's work, and whoever laid down
 * three takes of a hundred did not do what whoever laid down thirty did.
 */
export const RECORDING_FULL_SHARE_TAKES = 8;
/** Below this accuracy a take is scrapped: no points, no take used. */
export const RECORDING_KEEP_ACCURACY = 50;
/** A take shorter than this many judged notes is no take at all. */
export const RECORDING_MIN_NOTES = 16;
/** A part's tape stops counting at this many times its target. */
export const RECORDING_TAPE_CAP = 2.5;
/** Mean fill of the parts (each capped) a gold / platinum record needs. */
export const RECORDING_GOLD = 1.5;
export const RECORDING_PLATINUM = 2.2;
/** Mean fill a session that never finished needs to leave at least a demo. */
export const RECORDING_DEMO = 0.5;
/** Tempo, as a share of the track's own, a take may be played at. */
export const RECORDING_TEMPO_MIN = 0.5;
export const RECORDING_TEMPO_MAX = 1.3;
/** Seconds one take runs; the part loops under it. */
export const RECORDING_TAKE_SECONDS = 60;

/** Member Fame as a multiple of the plain release's. */
export const RECORDING_MEMBER_PAY: Record<RecordingRating, number> = {
  shelved: 0,
  demo: 0.3,
  record: 1,
  gold: 1.5,
  platinum: 2,
};

/** What the client pays into the guild's treasury, as a multiple of the fee. */
export const RECORDING_BANK_PAY: Record<RecordingRating, number> = {
  shelved: 0,
  demo: 0.5,
  record: 1.5,
  gold: 2.25,
  platinum: 3,
};

/**
 * What the room does for a session, per level of each piece. The weekly
 * board is the one piece left out — it already pays in names on the cork.
 */
export const RECORDING_GEAR = {
  /** More points on every take: the room simply sounds better. */
  sound: { items: ["amp", "drums", "mic", "monitors", "panels"], perLevel: 3 },
  /** Shorter tapes: a better machine wastes less of it. */
  tape: { item: "tape", perLevel: 3 },
  /** A bigger cheque from the client into the treasury. */
  desk: { item: "desk", perLevel: 5 },
  /** More Fame for every member who played. */
  walls: { item: "walls", perLevel: 5 },
  /** A cheaper session: the bench keeps the gear from needing a hired tech. */
  bench: { item: "bench", perLevel: 8 },
  /** Somewhere to rest: one more take a day from level 2, two at level 4. */
  sofa: { item: "sofa", takesAt: [2, 4] },
} as const;

export const recordingCoverSrc = (contractId: string): string =>
  `/images/guild-recording/${contractId}.webp`;
