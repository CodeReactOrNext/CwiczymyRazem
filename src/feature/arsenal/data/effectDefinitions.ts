import type {
  EffectDefinition,
  EffectJackLayout,
} from "../types/arsenal.types";

/**
 * Pedals whose signal sockets are silkscreened along the top edge rather than
 * on the sides, so the board's cable comes up and over them instead of running
 * straight in from the neighbour.
 *
 * Only pedals whose artwork puts the *signal* in and out up there are listed.
 * Several others (the Friedman and Ronin enclosures) carry a top strip too, but
 * theirs holds stereo, expression and power while the mono in and out stay on
 * the sides where their own arrows point — those keep the default.
 *
 * Coordinates are fractions of the pedal's box, read off the artwork, so they
 * land on the socket the label belongs to at any board size. They are eyeballed
 * rather than measured: near enough that the cable meets the right hole, not so
 * exact that redrawing a pedal would demand new numbers.
 */
const TOP_JACKS = {
  /** "L-IN · L-OUT · R-OUT · EXP · USB · 9V DC" — the wide Lab enclosures. */
  lab: {
    edge: "top",
    in: { x: 0.39, y: 0.045 },
    out: { x: 0.49, y: 0.045 },
  },
  /** "SOURCE IN · ECHO OUT · CONTROL CV · LINK MIDI" — Astral Reverberator. */
  astral: {
    edge: "top",
    in: { x: 0.25, y: 0.035 },
    out: { x: 0.41, y: 0.035 },
  },
  /** "L-IN · R-OUT · EXP · USB" — Cosmic Resonance. */
  cosmic: {
    edge: "top",
    in: { x: 0.24, y: 0.04 },
    out: { x: 0.4, y: 0.04 },
  },
} satisfies Record<string, EffectJackLayout>;

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  {
    id: 1,
    name: "EchoPath",
    brand: "EchoPath",
    type: "Delay",
    imageId: 1,
    rarity: "Uncommon",
  },
  {
    id: 2,
    name: "TS-808 Overdrive",
    brand: "K",
    type: "Overdrive",
    imageId: 2,
    rarity: "Common",
  },
  {
    id: 3,
    name: "Amber Forge",
    brand: "Forge",
    type: "Overdrive",
    imageId: 3,
    rarity: "Rare",
  },
  {
    id: 4,
    name: "Amber Forge AF",
    brand: "Friedman",
    type: "Overdrive",
    imageId: 4,
    rarity: "Epic",
  },
  {
    id: 5,
    name: "Amber Forge Wood",
    brand: "Forge",
    type: "Overdrive",
    imageId: 5,
    rarity: "Uncommon",
  },
  {
    id: 6,
    name: "Stellar OD",
    brand: "JHS",
    type: "Overdrive",
    imageId: 6,
    rarity: "Rare",
  },
  {
    id: 7,
    name: "Red Forge Mini",
    brand: "Forge",
    type: "Overdrive",
    imageId: 7,
    rarity: "Common",
  },
  {
    id: 8,
    name: "Forest Drive",
    brand: "Forge",
    type: "Overdrive",
    imageId: 8,
    rarity: "Uncommon",
  },
  {
    id: 9,
    name: "Orange Forge",
    brand: "Forge",
    type: "Phaser",
    imageId: 9,
    rarity: "Epic",
  },
  {
    id: 10,
    name: "Cosmic Resonance",
    brand: "Astra-Path",
    type: "Chorus",
    imageId: 10,
    rarity: "Epic",
    jacks: TOP_JACKS.cosmic,
  },
  {
    id: 11,
    name: "Stereo Fuzz Lab",
    brand: "VelcroLab",
    type: "Fuzz",
    imageId: 11,
    rarity: "Legendary",
    jacks: TOP_JACKS.lab,
  },
  {
    id: 12,
    name: "Stereo Delay Lab",
    brand: "ChronosEcho",
    type: "Delay",
    imageId: 12,
    rarity: "Epic",
    jacks: TOP_JACKS.lab,
  },
  {
    id: 13,
    name: "Overdrive Pro",
    brand: "AstraTone",
    type: "Overdrive",
    imageId: 13,
    rarity: "Mythic",
    jacks: TOP_JACKS.lab,
  },
  {
    id: 14,
    name: "Astral Reverberator",
    brand: "Gravinix",
    type: "Reverb",
    imageId: 15,
    rarity: "Legendary",
    jacks: TOP_JACKS.astral,
  },
  // New batch (15-19) — marki są placeholderami, do poprawki
  {
    id: 15,
    name: "Cymatic Current",
    brand: "Gravinix",
    type: "Vibrato",
    imageId: 16,
    rarity: "Rare",
  },
  {
    id: 16,
    name: "Deep Echo",
    brand: "Gravinix",
    type: "Reverb",
    imageId: 17,
    rarity: "Epic",
  },
  {
    id: 17,
    name: "Professional Overdrive OD-5",
    brand: "Ronin",
    type: "Overdrive",
    imageId: 18,
    rarity: "Uncommon",
  },
  {
    id: 18,
    name: "Chromatic Tuner AT-10",
    brand: "Ronin",
    type: "Tuner",
    imageId: 19,
    rarity: "Common",
  },
  {
    id: 19,
    name: "Graphic EQ GE-10",
    brand: "Ronin",
    type: "EQ",
    imageId: 20,
    rarity: "Uncommon",
  },
  // New batch (21-27)
  {
    id: 20,
    name: "Aethernaut",
    brand: "Aethernaut",
    type: "Boost",
    imageId: 21,
    rarity: "Uncommon",
  },
  {
    id: 21,
    name: "The Sunken Bell",
    brand: "Aqua-Fab",
    type: "Delay",
    imageId: 22,
    rarity: "Epic",
  },
  {
    id: 22,
    name: "The Astral Forge",
    brand: "Friedman",
    type: "Fuzz",
    imageId: 23,
    rarity: "Legendary",
  },
  {
    id: 23,
    name: "The Cobalt Cavern",
    brand: "Friedman",
    type: "Delay",
    imageId: 24,
    rarity: "Epic",
  },
  {
    id: 24,
    name: "Astral Reverberator Verdant",
    brand: "Gravinix",
    type: "Reverb",
    imageId: 25,
    rarity: "Legendary",
    jacks: TOP_JACKS.astral,
  },
  {
    id: 25,
    name: "Astral Reverberator Ember",
    brand: "Gravinix",
    type: "Reverb",
    imageId: 26,
    rarity: "Legendary",
    jacks: TOP_JACKS.astral,
  },
  {
    id: 26,
    name: "Nova Drive",
    brand: "Astra-Path",
    type: "Overdrive",
    imageId: 27,
    rarity: "Rare",
  },
];

export const EFFECTS_BY_ID = new Map<number | string, EffectDefinition>(
  EFFECT_DEFINITIONS.map((e) => [e.id, e]),
);

export const EFFECTS_BY_RARITY = EFFECT_DEFINITIONS.reduce(
  (acc, e) => {
    if (!acc[e.rarity]) acc[e.rarity] = [];
    acc[e.rarity].push(e);
    return acc;
  },
  {} as Record<string, EffectDefinition[]>,
);
