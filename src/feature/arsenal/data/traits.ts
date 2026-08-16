/**
 * Traits — the rolled affixes that pay Fame per hour of practice.
 *
 * A trait is printed on one guitar or pedal, it travels with that item through
 * the market, and it only pays while the item is in service (a guitar slot or
 * the pedalboard). Where `features` raise an item's *level* — and through it the
 * whole rig's base rate in `rigFame` — a trait adds Fame/h directly, on top,
 * and usually only when something outside the item is true.
 *
 * Six rules the table below is built to satisfy; every one of them replaced a
 * draft that read worse:
 *
 *  • **A trait follows from what the instrument is.** Pedal traits are gated by
 *    effect type, so a Delay teaches timing and a Fuzz pays for noise-making.
 *    A trait that could land anywhere reads as a lottery ticket taped to a card.
 *
 *  • **Fame/h, never a percentage.** The Arsenal header already states a Fame/h
 *    rate, so a trait that said "+30%" would be the one number on the card the
 *    player cannot compare to anything else.
 *
 *  • **15 minutes is the unit.** Every time gate is a multiple of it and
 *    practice time rounds down to whole blocks, so no trait can be farmed with a
 *    three-minute report.
 *
 *  • **One session, nothing else.** No streaks, no days, no history. `rate ×
 *    session time` is inherently split-proof — six 15-minute reports pay exactly
 *    what one 90-minute report pays — which is the same property
 *    `cumulativeRigFame` has to work for.
 *
 *  • **A condition never asks about the item carrying it.** "While this guitar
 *    is Mint" is a flat bonus wearing a costume: it is true at mint and stays
 *    true. Conditions look outward — at the board, the rig, the session.
 *
 *  • **Nothing unsatisfiable.** A condition nobody can meet is worse than no
 *    condition, because the card still advertises it. `traits.test.ts` proves
 *    every skill named here has real exercises behind it and every counter cap
 *    is reachable — see the note on `SKILL_MIN_EXERCISES` there.
 *
 * The steep spread of values is deliberate: an unconditional trait pays ~3
 * Fame/h and `Monk` — empty board, one guitar, a single-category session — pays
 * ~80. Very conditional has to pay very differently, or nobody builds for it.
 */

import type { GuitarSkillId } from "feature/skills/skills.types";

import type {
  EffectType,
  GuitarRarity,
  ItemTrait,
} from "../types/arsenal.types";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import { RARITY_LADDER } from "./itemStats";

export type PracticeCategory =
  | "technique"
  | "theory"
  | "hearing"
  | "creativity";

/** The four categories, in the order the rest of the app lists them. */
export const PRACTICE_CATEGORIES: PracticeCategory[] = [
  "technique",
  "theory",
  "hearing",
  "creativity",
];

/** Which minutes a trait's rate is paid on. */
export type TraitClock = "session" | PracticeCategory;

export type TraitKind = "guitar" | "effect";

/** Drive pedals — the "dirt" half of a board, referenced by several conditions. */
export const DRIVE_TYPES: EffectType[] = ["Overdrive", "Distortion", "Fuzz"];

/**
 * What has to be true for a trait to pay. Every branch looks outward from the
 * item carrying it — see the rules at the top of the file.
 */
export type TraitCondition =
  /** Minutes of one category in this session. */
  | { type: "category-min"; category: PracticeCategory; minutes: number }
  /** Total session length. */
  | { type: "session-min"; minutes: number }
  /** The whole session sits in one category. */
  | { type: "single-category" }
  /** At least `count` categories with `minutes` each. */
  | { type: "categories-min"; minutes: number; count: number }
  /** The session trained every one of these skills. */
  | { type: "skills"; skills: GuitarSkillId[] }
  | { type: "board-empty" }
  | { type: "board-max"; max: number }
  | { type: "board-min"; min: number }
  /** Every listed type is somewhere on the board. */
  | { type: "board-has-types"; types: EffectType[] }
  | { type: "board-no-drive" }
  /** At least `min` drive pedals on the board. */
  | { type: "board-drives"; min: number }
  /** A drive pedal other than this one shares the board. */
  | { type: "board-second-drive" }
  | { type: "board-rarity"; minRarity: GuitarRarity; min: number }
  /** This pedal sits left of every drive. */
  | { type: "chain-before-drives" }
  /** This pedal sits right of every drive. */
  | { type: "chain-after-drives" }
  | { type: "only-guitar" }
  | { type: "guitar-slots"; count: number }
  /** Another in-service item shares this one's brand. */
  | { type: "same-brand" }
  /** Every equipped guitar is the rolled brand. */
  | { type: "all-guitars-brand" }
  | { type: "items-before-year"; year: number; count: number }
  | { type: "all-items-before-year"; year: number }
  | { type: "all"; of: TraitCondition[] };

/** A trait whose rate is multiplied by how many of something the rig holds. */
export type TraitCounter =
  /** In-service items of the rolled brand. */
  | { type: "brand-items"; cap: number }
  | { type: "board-pedals"; cap: number }
  | { type: "other-guitars"; cap: number }
  | { type: "items-before-year"; year: number; cap: number }
  | { type: "board-rarity"; minRarity: GuitarRarity; cap: number }
  /** Build levels on every *other* item in the rig. */
  | { type: "other-build-levels"; cap: number }
  /** Every *other* trait in the rig. */
  | { type: "other-traits"; cap: number };

/**
 * Flat Fame/h handed to other traits. Flat, never a multiplier — that is what
 * keeps an amplifier from scaling with the very thing it amplifies.
 */
export type TraitAmp =
  | { type: "other-pedals" }
  | { type: "category-traits"; categories: PracticeCategory[] }
  | { type: "skill-traits" }
  /** Pedals further right in the chain than this one. */
  | { type: "pedals-right" }
  /** Traits on items sharing this item's brand. */
  | { type: "same-brand" }
  /** The single highest-paying trait in the rig. */
  | { type: "highest" };

export type TraitPenalty =
  | { type: "others-minus"; amount: number }
  | { type: "others-zero" };

export interface TraitDef {
  id: string;
  /** Card title. `{brand}` is substituted from the rolled params. */
  label: string;
  /** Card copy. States what the player has to do, in full. */
  description: string;
  kind: TraitKind;
  /** Pedal types this can roll on. Omitted = every type. */
  appliesTo?: EffectType[];
  /** Minutes the rate is paid on. Counters and amps ignore it. */
  clock: TraitClock;
  condition?: TraitCondition;
  counter?: TraitCounter;
  amp?: TraitAmp;
  penalty?: TraitPenalty;
  /** Inclusive Fame/h range. Per unit when the trait has a counter. */
  min: number;
  max: number;
  /** Rarity window this may roll in — the three Straight-to-Amp tiers use it. */
  minRarity?: GuitarRarity;
  maxRarity?: GuitarRarity;
  /** Needs a `{brand}` rolled alongside it. */
  brandParam?: boolean;
}

// ─── The table ───────────────────────────────────────────────────────────────

export const TRAIT_DEFINITIONS: TraitDef[] = [
  // 1. Unconditional — the floor. Deliberately dull.
  {
    id: "workhorse",
    label: "Workhorse",
    description: "Fame/h on any practice, whatever you play.",
    kind: "guitar",
    clock: "session",
    min: 1.5,
    max: 3.5,
  },
  {
    id: "long-take",
    label: "Long Take",
    description: "Fame/h on any practice, whatever you play.",
    kind: "effect",
    appliesTo: ["Reverb"],
    clock: "session",
    min: 1.5,
    max: 3.5,
  },
  {
    id: "reliable",
    label: "Reliable",
    description: "Fame/h on any practice. No conditions, no surprises.",
    kind: "guitar",
    clock: "session",
    min: 2,
    max: 4,
  },

  // 2. Category engines — the clock runs only on their own category.
  {
    id: "shred-machine",
    label: "Shred Machine",
    description: "Fame/h on technique practice.",
    kind: "guitar",
    clock: "technique",
    min: 3.5,
    max: 8,
  },
  {
    id: "jazz-box",
    label: "Jazz Box",
    description: "Fame/h on theory practice. Built for chords, not for speed.",
    kind: "guitar",
    clock: "theory",
    min: 3.5,
    max: 8,
  },
  {
    id: "songbook",
    label: "Songbook",
    description: "Fame/h on creativity practice.",
    kind: "guitar",
    clock: "creativity",
    min: 3.5,
    max: 8,
  },
  {
    id: "intonation-monster",
    label: "Intonation Monster",
    description:
      "Fame/h on ear training. It holds pitch all the way up the neck.",
    kind: "guitar",
    clock: "hearing",
    min: 3.5,
    max: 8,
  },
  {
    id: "ear-trainer",
    label: "Ear Trainer",
    description: "Fame/h on ear training. Set a repeat and chase it.",
    kind: "effect",
    appliesTo: ["Delay"],
    clock: "hearing",
    min: 3,
    max: 7.5,
  },
  {
    id: "timing-trainer",
    label: "Timing Trainer",
    description: "Fame/h on technique practice. Lock the repeats to your tempo.",
    kind: "effect",
    appliesTo: ["Delay"],
    clock: "technique",
    min: 3,
    max: 7.5,
  },
  {
    id: "frequency-work",
    label: "Frequency Work",
    description: "Fame/h on ear training. Learn where the bands sit.",
    kind: "effect",
    appliesTo: ["EQ"],
    clock: "hearing",
    min: 3.5,
    max: 8,
  },
  {
    id: "harmony-bench",
    label: "Harmony Bench",
    description: "Fame/h on theory practice.",
    kind: "effect",
    appliesTo: ["EQ"],
    clock: "theory",
    min: 3,
    max: 7.5,
  },
  {
    id: "texture-lab",
    label: "Texture Lab",
    description: "Fame/h on creativity practice.",
    kind: "effect",
    appliesTo: ["Chorus", "Phaser", "Vibrato"],
    clock: "creativity",
    min: 3.5,
    max: 8,
  },
  {
    id: "noise-session",
    label: "Noise Session",
    description: "Fame/h on creativity practice.",
    kind: "effect",
    appliesTo: ["Fuzz"],
    clock: "creativity",
    min: 4,
    max: 8.5,
  },
  {
    id: "pitch-reference",
    label: "Pitch Reference",
    description: "Fame/h on ear training.",
    kind: "effect",
    appliesTo: ["Tuner"],
    clock: "hearing",
    min: 3,
    max: 7.5,
  },

  // 3. Skills — one named skill trained anywhere in the session.
  {
    id: "picking-bench",
    label: "Picking Bench",
    description: "Fame/h while the session trains Alternate Picking.",
    kind: "guitar",
    clock: "session",
    condition: { type: "skills", skills: ["alternate_picking"] },
    min: 7,
    max: 16,
  },
  {
    id: "legato-neck",
    label: "Legato Neck",
    description: "Fame/h while the session trains Legato.",
    kind: "guitar",
    clock: "session",
    condition: { type: "skills", skills: ["legato"] },
    min: 7,
    max: 16,
  },
  {
    id: "bender",
    label: "Bender",
    description: "Fame/h while the session trains Bending.",
    kind: "guitar",
    clock: "session",
    condition: { type: "skills", skills: ["bending"] },
    min: 6,
    max: 15,
  },
  {
    id: "vibrato-arm",
    label: "Vibrato Arm",
    description: "Fame/h while the session trains Vibrato.",
    kind: "guitar",
    clock: "session",
    condition: { type: "skills", skills: ["vibrato"] },
    min: 6,
    max: 15,
  },
  {
    id: "chord-shop",
    label: "Chord Shop",
    description: "Fame/h while the session trains Chords.",
    kind: "guitar",
    clock: "session",
    condition: { type: "skills", skills: ["chords"] },
    min: 7,
    max: 16,
  },
  {
    id: "scale-runner",
    label: "Scale Runner",
    description: "Fame/h while the session trains Scales.",
    kind: "guitar",
    clock: "session",
    condition: { type: "skills", skills: ["scales"] },
    min: 7,
    max: 16,
  },
  {
    id: "metronome",
    label: "Metronome",
    description: "Fame/h while the session trains Rhythm.",
    kind: "effect",
    appliesTo: ["Delay"],
    clock: "session",
    condition: { type: "skills", skills: ["rhythm"] },
    min: 8,
    max: 17,
  },
  {
    id: "phrase-repeat",
    label: "Phrase Repeat",
    description:
      "Fame/h while the session trains Phrasing. A delay hands your own phrase back to you.",
    kind: "effect",
    appliesTo: ["Delay"],
    clock: "session",
    condition: { type: "skills", skills: ["phrasing"] },
    min: 8,
    max: 17,
  },
  {
    id: "harmony-ear",
    label: "Harmony Ear",
    description: "Fame/h while the session trains Harmony Ear.",
    kind: "effect",
    appliesTo: ["EQ"],
    clock: "session",
    condition: { type: "skills", skills: ["harmony-ear"] },
    min: 9,
    max: 18,
  },
  {
    id: "interval-trainer",
    label: "Interval Trainer",
    description: "Fame/h while the session trains Ear Training.",
    kind: "effect",
    appliesTo: ["Tuner"],
    clock: "session",
    condition: { type: "skills", skills: ["ear_training"] },
    min: 8,
    max: 17,
  },
  {
    id: "improv-pedal",
    label: "Improv Pedal",
    description: "Fame/h while the session trains Improvisation.",
    kind: "effect",
    appliesTo: ["Fuzz"],
    clock: "session",
    condition: { type: "skills", skills: ["improvisation"] },
    min: 8,
    max: 17,
  },
  {
    id: "phrase-machine",
    label: "Phrase Machine",
    description: "Fame/h while the session trains Phrasing.",
    kind: "effect",
    appliesTo: ["Chorus", "Phaser"],
    clock: "session",
    condition: { type: "skills", skills: ["phrasing"] },
    min: 8,
    max: 17,
  },
  {
    id: "improv-room",
    label: "Improv Room",
    description: "Fame/h while the session trains Improvisation.",
    kind: "effect",
    appliesTo: ["Reverb"],
    clock: "session",
    condition: { type: "skills", skills: ["improvisation"] },
    min: 9,
    max: 18,
  },
  {
    id: "theory-board",
    label: "Theory Board",
    description: "Fame/h while the session trains Music Theory.",
    kind: "effect",
    appliesTo: ["EQ"],
    clock: "session",
    condition: { type: "skills", skills: ["music_theory"] },
    min: 8,
    max: 17,
  },

  // 4. Counters — the rate is per unit of something the rig holds.
  {
    id: "brand-endorsement",
    label: "{brand} Endorsement",
    description:
      "Fame/h for every {brand} item you have in service. Up to three count.",
    kind: "guitar",
    clock: "session",
    counter: { type: "brand-items", cap: 3 },
    brandParam: true,
    min: 2,
    max: 4,
  },
  {
    id: "pedal-platform",
    label: "Pedal Platform",
    description:
      "Fame/h for every pedal on your board. Up to six count. It does not fight what you put in front of it.",
    kind: "guitar",
    clock: "session",
    counter: { type: "board-pedals", cap: 6 },
    min: 1,
    max: 2,
  },
  {
    id: "backline",
    label: "Backline",
    description: "Fame/h for every other guitar in your slots.",
    kind: "guitar",
    clock: "session",
    counter: { type: "other-guitars", cap: 2 },
    min: 2,
    max: 4,
  },
  {
    id: "vintage-row",
    label: "Vintage Row",
    description:
      "Fame/h for every item in service built before 1985. Up to four count.",
    kind: "guitar",
    clock: "session",
    counter: { type: "items-before-year", year: 1985, cap: 4 },
    min: 1.5,
    max: 3.5,
  },
  {
    id: "boutique-row",
    label: "Boutique Row",
    description:
      "Fame/h for every Epic-or-better pedal on your board. Up to four count.",
    kind: "effect",
    clock: "session",
    counter: { type: "board-rarity", minRarity: "Epic", cap: 4 },
    min: 2,
    max: 4,
  },
  {
    id: "bench-boss",
    label: "Bench Boss",
    description:
      "Fame/h for every build level on the other items in your rig. Up to twenty count.",
    kind: "guitar",
    clock: "session",
    counter: { type: "other-build-levels", cap: 20 },
    min: 0.3,
    max: 0.7,
  },
  {
    id: "well-equipped",
    label: "Well Equipped",
    description:
      "Fame/h for every other trait in your rig. Up to eight count.",
    kind: "effect",
    clock: "session",
    counter: { type: "other-traits", cap: 8 },
    min: 1.5,
    max: 3.5,
  },

  // 5. Rig conditions — one thing outside the item has to be true.
  {
    id: "wants-dirt",
    label: "Wants Dirt",
    description:
      "Fame/h while any Overdrive, Distortion or Fuzz sits on your board. Passive humbuckers need something to push them.",
    kind: "guitar",
    clock: "session",
    condition: { type: "board-drives", min: 1 },
    min: 4.5,
    max: 9.5,
  },
  {
    id: "clean-machine",
    label: "Clean Machine",
    description:
      "Fame/h while your board carries no drive pedal at all. Everything your hands do is audible.",
    kind: "guitar",
    clock: "session",
    condition: { type: "board-no-drive" },
    min: 5.5,
    max: 10.5,
  },
  {
    id: "solo-act",
    label: "Solo Act",
    description: "Fame/h while this is the only guitar you have equipped.",
    kind: "guitar",
    clock: "session",
    condition: { type: "only-guitar" },
    min: 6,
    max: 12,
  },
  {
    id: "straight-to-amp",
    label: "Straight to Amp",
    description: "Fame/h while your pedalboard is completely empty.",
    kind: "guitar",
    clock: "session",
    condition: { type: "board-empty" },
    maxRarity: "Epic",
    min: 8,
    max: 16,
  },
  {
    id: "cable-and-amp",
    label: "Cable and Amp",
    description:
      "Fame/h while your pedalboard is completely empty. Nothing between the strings and the speaker.",
    kind: "guitar",
    clock: "session",
    condition: { type: "board-empty" },
    minRarity: "Legendary",
    maxRarity: "Legendary",
    min: 18,
    max: 30,
  },
  {
    id: "nothing-but-the-guitar",
    label: "Nothing But the Guitar",
    description:
      "Fame/h while your pedalboard is completely empty. It does not need help and it never did.",
    kind: "guitar",
    clock: "session",
    condition: { type: "board-empty" },
    minRarity: "Mythic",
    min: 30,
    max: 50,
  },
  {
    id: "matched-set",
    label: "Matched Set",
    description:
      "Fame/h while another item of the same brand is in service.",
    kind: "guitar",
    clock: "session",
    condition: { type: "same-brand" },
    min: 4,
    max: 8,
  },
  {
    id: "ambient-pair",
    label: "Ambient Pair",
    description:
      "Fame/h while a Delay and a Reverb are both on the board. Apart they do half the job.",
    kind: "effect",
    appliesTo: ["Delay", "Reverb"],
    clock: "session",
    condition: { type: "board-has-types", types: ["Delay", "Reverb"] },
    min: 4.5,
    max: 9.5,
  },
  {
    id: "gain-stack",
    label: "Gain Stack",
    description:
      "Fame/h while a second drive pedal shares the board. Stacking drives is a method, not an accident.",
    kind: "effect",
    appliesTo: ["Overdrive", "Boost"],
    clock: "session",
    condition: { type: "board-second-drive" },
    min: 4.5,
    max: 9.5,
  },
  {
    id: "front-of-chain",
    label: "Front of Chain",
    description:
      "Fame/h while this pedal sits to the left of every drive on the board. Fuzz and compression want the raw pickup.",
    kind: "effect",
    appliesTo: ["Fuzz"],
    clock: "session",
    condition: { type: "chain-before-drives" },
    min: 4,
    max: 8,
  },
  {
    id: "tail-of-chain",
    label: "Tail of Chain",
    description:
      "Fame/h while this pedal sits to the right of every drive on the board. Time effects go last or it turns to mud.",
    kind: "effect",
    appliesTo: ["Delay", "Reverb"],
    clock: "session",
    condition: { type: "chain-after-drives" },
    min: 4,
    max: 8,
  },
  {
    id: "purist",
    label: "Purist",
    description: "Fame/h while your board holds two pedals or fewer.",
    kind: "effect",
    clock: "session",
    condition: { type: "board-max", max: 2 },
    min: 7,
    max: 13,
  },
  {
    id: "full-board",
    label: "Full Board",
    description: "Fame/h while your board holds six pedals or more.",
    kind: "effect",
    clock: "session",
    condition: { type: "board-min", min: 6 },
    min: 5.5,
    max: 10.5,
  },

  // 6. Heavy — a rig condition and a session condition at once.
  {
    id: "metal-rig",
    label: "Metal Rig",
    description:
      "Fame/h when two or more drive pedals are on the board and the session has at least 45 minutes of technique.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-drives", min: 2 },
        { type: "category-min", category: "technique", minutes: 45 },
      ],
    },
    min: 16,
    max: 32,
  },
  {
    id: "ambient-study",
    label: "Ambient Study",
    description:
      "Fame/h when a Reverb shares the board and the session has at least 30 minutes of ear training.",
    kind: "effect",
    appliesTo: ["Delay"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-has-types", types: ["Reverb"] },
        { type: "category-min", category: "hearing", minutes: 30 },
      ],
    },
    min: 18,
    max: 34,
  },
  {
    id: "writing-room",
    label: "Writing Room",
    description:
      "Fame/h when your board holds two pedals or fewer and the session has at least 45 minutes of creativity.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-max", max: 2 },
        { type: "category-min", category: "creativity", minutes: 45 },
      ],
    },
    min: 16,
    max: 32,
  },
  {
    id: "practice-room",
    label: "Practice Room",
    description:
      "Fame/h when this is your only equipped guitar and the session runs 60 minutes or longer.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [{ type: "only-guitar" }, { type: "session-min", minutes: 60 }],
    },
    min: 15,
    max: 30,
  },
  {
    id: "theory-desk",
    label: "Theory Desk",
    description:
      "Fame/h when a Tuner shares the board and the session has at least 30 minutes of theory.",
    kind: "effect",
    appliesTo: ["EQ"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-has-types", types: ["Tuner"] },
        { type: "category-min", category: "theory", minutes: 30 },
      ],
    },
    min: 17,
    max: 33,
  },
  {
    id: "session-rig",
    label: "Session Rig",
    description:
      "Fame/h when all three guitar slots are filled and the session has at least 15 minutes in three different categories.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "guitar-slots", count: 3 },
        { type: "categories-min", minutes: 15, count: 3 },
      ],
    },
    min: 19,
    max: 37,
  },
  {
    id: "fuzz-workout",
    label: "Fuzz Workout",
    description:
      "Fame/h when this pedal sits before every other drive and the session has at least 45 minutes of technique.",
    kind: "effect",
    appliesTo: ["Fuzz"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "chain-before-drives" },
        { type: "category-min", category: "technique", minutes: 45 },
      ],
    },
    min: 18,
    max: 34,
  },
  {
    id: "modulation-study",
    label: "Modulation Study",
    description:
      "Fame/h when a Delay shares the board and the session trains Phrasing.",
    kind: "effect",
    appliesTo: ["Chorus", "Phaser"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-has-types", types: ["Delay"] },
        { type: "skills", skills: ["phrasing"] },
      ],
    },
    min: 19,
    max: 35,
  },
  {
    id: "vintage-session",
    label: "Vintage Session",
    description:
      "Fame/h when three items in service were built before 1985 and the session runs 45 minutes or longer.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "items-before-year", year: 1985, count: 3 },
        { type: "session-min", minutes: 45 },
      ],
    },
    min: 17,
    max: 33,
  },
  {
    id: "stack-study",
    label: "Stack Study",
    description:
      "Fame/h when a second drive pedal shares the board and the session trains Alternate Picking.",
    kind: "effect",
    appliesTo: ["Overdrive"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-second-drive" },
        { type: "skills", skills: ["alternate_picking"] },
      ],
    },
    min: 15,
    max: 31,
  },
  {
    id: "tone-lab",
    label: "Tone Lab",
    description:
      "Fame/h when four or more pedals are on the board and the session has at least 30 minutes of creativity.",
    kind: "effect",
    appliesTo: ["Fuzz"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-min", min: 4 },
        { type: "category-min", category: "creativity", minutes: 30 },
      ],
    },
    min: 18,
    max: 34,
  },
  {
    id: "quiet-room",
    label: "Quiet Room",
    description:
      "Fame/h when your board is empty and the session has at least 45 minutes of ear training.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-empty" },
        { type: "category-min", category: "hearing", minutes: 45 },
      ],
    },
    min: 16,
    max: 32,
  },

  // 7. Extreme — three or more conditions, and they exclude other builds.
  {
    id: "monk",
    label: "Monk",
    description:
      "Fame/h when your pedalboard is empty, this is your only equipped guitar, and the session is a single category.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-empty" },
        { type: "only-guitar" },
        { type: "single-category" },
      ],
    },
    minRarity: "Mythic",
    min: 60,
    max: 100,
  },
  {
    id: "virtuoso",
    label: "Virtuoso",
    description:
      "Fame/h when the session trains Alternate Picking, Legato and Sweep Picking, and has at least 60 minutes of technique.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        {
          type: "skills",
          skills: ["alternate_picking", "legato", "sweep_picking"],
        },
        { type: "category-min", category: "technique", minutes: 60 },
      ],
    },
    minRarity: "Legendary",
    min: 32,
    max: 56,
  },
  {
    id: "conservatory",
    label: "Conservatory",
    description:
      "Fame/h when the session trains Music Theory, Harmony and Chords, and runs 60 minutes or longer.",
    kind: "effect",
    appliesTo: ["EQ"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "skills", skills: ["music_theory", "harmony", "chords"] },
        { type: "session-min", minutes: 60 },
      ],
    },
    minRarity: "Legendary",
    min: 30,
    max: 54,
  },
  {
    id: "total-recall",
    label: "Total Recall",
    description:
      "Fame/h when the session trains Ear Training and Harmony Ear, and a Reverb and a Tuner are both on the board.",
    kind: "effect",
    appliesTo: ["Delay"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "skills", skills: ["ear_training", "harmony-ear"] },
        { type: "board-has-types", types: ["Reverb", "Tuner"] },
      ],
    },
    minRarity: "Legendary",
    min: 32,
    max: 56,
  },
  {
    id: "brand-artist",
    label: "{brand} Artist",
    description:
      "Fame/h when every guitar in your slots is {brand} and the session runs 45 minutes or longer.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "all-guitars-brand" },
        { type: "session-min", minutes: 45 },
      ],
    },
    brandParam: true,
    minRarity: "Legendary",
    min: 28,
    max: 52,
  },
  {
    id: "wall-of-sound",
    label: "Wall of Sound",
    description:
      "Fame/h when six or more pedals are on the board, three of them Epic or better, and the session runs 60 minutes or longer.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "board-min", min: 6 },
        { type: "board-rarity", minRarity: "Epic", min: 3 },
        { type: "session-min", minutes: 60 },
      ],
    },
    minRarity: "Legendary",
    min: 28,
    max: 48,
  },
  {
    id: "time-capsule",
    label: "Time Capsule",
    description:
      "Fame/h when every item in service was built before 1985 and the session runs 45 minutes or longer.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "all-items-before-year", year: 1985 },
        { type: "session-min", minutes: 45 },
      ],
    },
    minRarity: "Legendary",
    min: 26,
    max: 46,
  },
  {
    id: "one-man-band",
    label: "One Man Band",
    description:
      "Fame/h when the session has at least 15 minutes in all four categories and your board holds four pedals or more.",
    kind: "guitar",
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "categories-min", minutes: 15, count: 4 },
        { type: "board-min", min: 4 },
      ],
    },
    minRarity: "Legendary",
    min: 30,
    max: 54,
  },
  {
    id: "arranger",
    label: "Arranger",
    description:
      "Fame/h when the session trains Improvisation, Phrasing and Harmony, and runs 60 minutes or longer.",
    kind: "effect",
    appliesTo: ["Reverb"],
    clock: "session",
    condition: {
      type: "all",
      of: [
        { type: "skills", skills: ["improvisation", "phrasing", "harmony"] },
        { type: "session-min", minutes: 60 },
      ],
    },
    minRarity: "Legendary",
    min: 30,
    max: 54,
  },

  // 8. Amplifiers — flat Fame/h handed to other traits.
  {
    id: "signal-booster",
    label: "Signal Booster",
    description:
      "Every other pedal on your board pays this much more Fame/h on each of its traits.",
    kind: "effect",
    appliesTo: ["Boost"],
    clock: "session",
    amp: { type: "other-pedals" },
    min: 1,
    max: 2,
  },
  {
    id: "master-class",
    label: "Master Class",
    description:
      "Every ear-training and theory trait in your rig pays this much more Fame/h.",
    kind: "guitar",
    clock: "session",
    amp: { type: "category-traits", categories: ["hearing", "theory"] },
    min: 2,
    max: 4,
  },
  {
    id: "drive-trainer",
    label: "Drive Trainer",
    description: "Every technique trait in your rig pays this much more Fame/h.",
    kind: "effect",
    appliesTo: ["Overdrive"],
    clock: "session",
    amp: { type: "category-traits", categories: ["technique"] },
    min: 2,
    max: 4,
  },
  {
    id: "skill-coach",
    label: "Skill Coach",
    description:
      "Every skill-based trait in your rig pays this much more Fame/h.",
    kind: "guitar",
    clock: "session",
    amp: { type: "skill-traits" },
    min: 3,
    max: 5,
  },
  {
    id: "patchbay",
    label: "Patchbay",
    description:
      "Every pedal to the right of this one pays this much more Fame/h on each of its traits.",
    kind: "effect",
    clock: "session",
    amp: { type: "pedals-right" },
    min: 1.5,
    max: 3,
  },
  {
    id: "house-band",
    label: "House Band",
    description:
      "Every trait on items sharing this guitar's brand pays this much more Fame/h.",
    kind: "guitar",
    clock: "session",
    amp: { type: "same-brand" },
    min: 1.5,
    max: 3,
  },
  {
    id: "session-leader",
    label: "Session Leader",
    description:
      "Your single highest-paying trait pays this much more Fame/h.",
    kind: "guitar",
    clock: "session",
    amp: { type: "highest" },
    min: 3.5,
    max: 6.5,
  },

  // 9. Risk — big rates that cost something real.
  {
    id: "temperamental",
    label: "Temperamental",
    description:
      "Fame/h, but pays nothing when the session runs under 30 minutes.",
    kind: "guitar",
    clock: "session",
    condition: { type: "session-min", minutes: 30 },
    minRarity: "Epic",
    min: 45,
    max: 75,
  },
  {
    id: "diva",
    label: "Diva",
    description:
      "Fame/h, but every trait on your other equipped items pays 9.0 Fame/h less.",
    kind: "guitar",
    clock: "session",
    penalty: { type: "others-minus", amount: 9 },
    minRarity: "Legendary",
    min: 50,
    max: 82,
  },
  {
    id: "prima-donna",
    label: "Prima Donna",
    description: "Fame/h, but every other trait in your rig pays nothing.",
    kind: "guitar",
    clock: "session",
    penalty: { type: "others-zero" },
    minRarity: "Mythic",
    min: 90,
    max: 150,
  },
];

export const TRAITS_BY_ID = new Map(TRAIT_DEFINITIONS.map((t) => [t.id, t]));

// ─── Rolling ─────────────────────────────────────────────────────────────────

/** Chance each available slot actually gets a trait. Flat across rarities. */
export const TRAIT_CHANCE = 0.2;

/**
 * Slots an item of this rarity can carry. One for everything; Epic and up get a
 * second. Rarity moves *which* traits can land (see `minRarity`) far more than
 * how many, which is what keeps a lucky Rare worth keeping.
 */
export const getTraitSlots = (rarity: GuitarRarity): number =>
  RARITY_LADDER.indexOf(rarity) >= RARITY_LADDER.indexOf("Epic") ? 2 : 1;

const rarityRank = (rarity: GuitarRarity): number =>
  RARITY_LADDER.indexOf(rarity);

/** Brands with enough models that a whole-rig brand condition is reachable. */
export const GUITAR_BRANDS_FOR_TRAITS: string[] = Object.entries(
  GUITAR_DEFINITIONS.reduce<Record<string, number>>((acc, g) => {
    acc[g.brand] = (acc[g.brand] ?? 0) + 1;
    return acc;
  }, {}),
)
  .filter(([, count]) => count >= 3)
  .map(([brand]) => brand);

/** Pedal brands, for the pedal half of `{brand}` traits. */
export const EFFECT_BRANDS_FOR_TRAITS: string[] = Array.from(
  new Set(EFFECT_DEFINITIONS.map((e) => e.brand)),
);

export const isTraitEligible = (
  trait: TraitDef,
  kind: TraitKind,
  rarity: GuitarRarity,
  effectType?: EffectType,
): boolean => {
  if (trait.kind !== kind) return false;
  if (trait.minRarity && rarityRank(rarity) < rarityRank(trait.minRarity))
    return false;
  if (trait.maxRarity && rarityRank(rarity) > rarityRank(trait.maxRarity))
    return false;
  if (trait.appliesTo && (!effectType || !trait.appliesTo.includes(effectType)))
    return false;
  return true;
};

/**
 * Fame/h a trait rolls at.
 *
 * The step is chosen so the card never prints a number nobody can compare at a
 * glance — whole points on the big traits, halves in the middle, and tenths on
 * the narrow per-unit ranges like `Bench Boss` (0.3–0.7), where a half-point
 * step both overshoots the maximum and leaves only two possible rolls.
 */
export const rollTraitValue = (
  trait: Pick<TraitDef, "min" | "max">,
  rng: () => number = Math.random,
): number => {
  const span = trait.max - trait.min;
  const step = trait.max >= 20 ? 1 : span < 2 ? 0.1 : 0.5;
  // Floor, not round: a step that does not divide the span evenly must never
  // produce a value above `max`.
  const steps = Math.floor(span / step + 1e-9);
  const value = trait.min + step * Math.floor(rng() * (steps + 1));
  return Math.round(value * 10) / 10;
};

/**
 * Roll traits for a newly minted item.
 *
 * Takes an optional PRNG for the same reason the other rollers do: the trader
 * has to mint exactly the instance its shop card advertised, so it passes the
 * seeded generator and gets the same trait on the server that the client drew.
 */
export const rollItemTraits = (
  rarity: GuitarRarity,
  kind: TraitKind,
  effectType?: EffectType,
  rng: () => number = Math.random,
): ItemTrait[] | undefined => {
  const pool = TRAIT_DEFINITIONS.filter((t) =>
    isTraitEligible(t, kind, rarity, effectType),
  );
  if (pool.length === 0) return undefined;

  // Fisher–Yates so the two slots of an Epic never draw the same trait twice.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const slots = getTraitSlots(rarity);
  const traits: ItemTrait[] = [];
  for (let i = 0; i < slots && i < pool.length; i++) {
    if (rng() >= TRAIT_CHANCE) continue;
    const def = pool[i];
    const trait: ItemTrait = {
      id: def.id,
      value: rollTraitValue(def, rng),
    };
    if (def.brandParam) {
      const brands =
        kind === "guitar" ? GUITAR_BRANDS_FOR_TRAITS : EFFECT_BRANDS_FOR_TRAITS;
      trait.params = { brand: brands[Math.floor(rng() * brands.length)] };
    }
    traits.push(trait);
  }

  return traits.length > 0 ? traits : undefined;
};

// ─── Display ─────────────────────────────────────────────────────────────────

export interface ResolvedTrait {
  def: TraitDef;
  /** `{brand}` already substituted. */
  label: string;
  description: string;
  value: number;
  params?: Record<string, string>;
}

const substitute = (text: string, params?: Record<string, string>): string =>
  params
    ? Object.entries(params).reduce(
        (acc, [key, val]) => acc.split(`{${key}}`).join(val),
        text,
      )
    : text;

/** Resolved traits for display. Unknown ids are dropped, not rendered blank. */
export const getItemTraits = (
  item: { traits?: ItemTrait[] } | null | undefined,
): ResolvedTrait[] =>
  (item?.traits ?? [])
    .map((t): ResolvedTrait | null => {
      const def = TRAITS_BY_ID.get(t.id);
      if (!def) return null;
      return {
        def,
        label: substitute(def.label, t.params),
        description: substitute(def.description, t.params),
        value: t.value,
        ...(t.params ? { params: t.params } : {}),
      };
    })
    .filter((t): t is ResolvedTrait => t !== null);

/** "+5.5 Fame/h" — one decimal only when it earns one. */
export const formatTraitValue = (value: number): string =>
  Number.isInteger(value) ? `+${value}` : `+${value.toFixed(1)}`;
