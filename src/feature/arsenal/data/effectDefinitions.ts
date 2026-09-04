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
 * Coordinates are fractions of the pedal's box, measured off the artwork the
 * same way `EFFECT_JACK_Y` measures the side-mounted ones: a socket nut stands
 * proud of the case, so the columns where an image's silhouette reaches highest
 * are the columns its sockets are drawn in. The first two from the left are
 * always the signal pair — every one of these enclosures prints its ins and
 * outs before its expression, USB and power.
 *
 * The `y` is a seating depth rather than a position. Those nuts reach the very
 * top row of their image, so a plug pushed in any deeper than the sliver that
 * hides the seam disappears behind the enclosure handle and all, which leaves
 * a dark stub standing on the pedal instead of a plug.
 */
const TOP_JACK_SEAT = 0.012;

/**
 * The `dc` on each of these is read off the same silkscreen the signal pair is.
 * Every one of them prints its power inlet at the end of the strip, after the
 * ins, the outs and whatever expression and USB it carries, so the DC cable
 * arrives well clear of the two instrument plugs standing beside it.
 */
const TOP_JACKS = {
  /** "L-IN · L-OUT · R-OUT · EXP · USB · 9V DC" — the wide Lab enclosures. */
  lab: {
    edge: "top",
    in: { x: 0.405, y: TOP_JACK_SEAT },
    out: { x: 0.496, y: TOP_JACK_SEAT },
    dc: { x: 0.86, y: TOP_JACK_SEAT },
  },
  /** "SOURCE IN · ECHO OUT · CONTROL CV · LINK MIDI" — Astral Reverberator. */
  astral: {
    edge: "top",
    in: { x: 0.232, y: TOP_JACK_SEAT },
    out: { x: 0.379, y: TOP_JACK_SEAT },
    dc: { x: 0.82, y: TOP_JACK_SEAT },
  },
  /** "L-IN · R-OUT · EXP · USB" — Cosmic Resonance. */
  cosmic: {
    edge: "top",
    in: { x: 0.239, y: TOP_JACK_SEAT },
    out: { x: 0.383, y: TOP_JACK_SEAT },
    dc: { x: 0.82, y: TOP_JACK_SEAT },
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
    // A compact echo in a single-width box, so it costs the brick far less than
    // the rack-sized delays further down this list.
    draw: 65,
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
    /** Half a board's worth of these still costs less than one digital box. */
    draw: 6,
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
    // Stereo, with a converter and a screen. Nothing about it is a chorus
    // pedal's usual twenty-five milliamps.
    draw: 180,
  },
  {
    id: 11,
    name: "Stereo Fuzz Lab",
    brand: "VelcroLab",
    type: "Fuzz",
    imageId: 11,
    rarity: "Legendary",
    jacks: TOP_JACKS.lab,
    /** A whole stereo rig in a box — it draws like one, fuzz or not. */
    draw: 250,
  },
  {
    id: 12,
    name: "Stereo Delay Lab",
    brand: "ChronosEcho",
    type: "Delay",
    imageId: 12,
    rarity: "Epic",
    jacks: TOP_JACKS.lab,
    /** The most expensive thing a board can carry, and worth every mA. */
    draw: 300,
  },
  {
    id: 13,
    name: "Overdrive Pro",
    brand: "AstraTone",
    type: "Overdrive",
    imageId: 13,
    rarity: "Mythic",
    jacks: TOP_JACKS.lab,
    /** Presets, a display and three footswitches. Not a passive dirt box. */
    draw: 200,
  },
  {
    id: 14,
    name: "Astral Reverberator",
    brand: "Gravinix",
    type: "Reverb",
    imageId: 15,
    rarity: "Legendary",
    jacks: TOP_JACKS.astral,
    /** Two of these do not fit on one brick, which is the whole point. */
    draw: 300,
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
    draw: 300,
  },
  {
    id: 25,
    name: "Astral Reverberator Ember",
    brand: "Gravinix",
    type: "Reverb",
    imageId: 26,
    rarity: "Legendary",
    jacks: TOP_JACKS.astral,
    draw: 300,
  },
  {
    id: 26,
    name: "Nova Drive",
    brand: "Astra-Path",
    type: "Overdrive",
    imageId: 27,
    rarity: "Rare",
  },

  // ─── Filling the empty stages (27-32) ──────────────────────────────────────
  // Four of these are the first pedal of their type in the game. Every one of
  // those types already had a stage in `signalChain`, a BOM in `effectBom` and a
  // mod pool in `effectStats` — the plumbing was written and simply had nothing
  // to run through it, so a by-the-book chain could never use those slots.
  {
    id: 27,
    name: "Level Keeper CM-8",
    brand: "Ronin",
    type: "Compressor",
    imageId: 28,
    rarity: "Common",
    // An optical compressor in a compact box: two transistors and a lamp.
    draw: 30,
  },
  {
    id: 28,
    name: "Shimmer Path",
    brand: "Astra-Path",
    type: "Chorus",
    imageId: 29,
    rarity: "Common",
    // A single bucket-brigade chip, which is all a chorus has ever needed.
    draw: 25,
  },
  {
    id: 29,
    name: "Rust Forge",
    brand: "Forge",
    type: "Fuzz",
    imageId: 30,
    rarity: "Rare",
    // Two germanium transistors and a battery clip. Nothing on a board asks the
    // brick for less, which is half of why a fuzz wants to go first.
    draw: 8,
  },
  {
    id: 30,
    name: "Tidal Flange",
    brand: "Aqua-Fab",
    type: "Flanger",
    imageId: 31,
    rarity: "Rare",
    // A longer delay line than a chorus runs, and it costs accordingly.
    draw: 45,
  },
  {
    id: 31,
    name: "Chronos Infinity",
    brand: "ChronosEcho",
    type: "Delay",
    imageId: 32,
    rarity: "Legendary",
    // Digital, with tails that outlive the switch. The converter is the drain.
    draw: 150,
  },
  {
    id: 32,
    name: "Ruin Machine",
    brand: "VelcroLab",
    type: "Distortion",
    imageId: 33,
    rarity: "Mythic",
    // Three clipping stages stacked, each with its own supply rail.
    draw: 60,
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
