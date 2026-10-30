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
 * Several others (the Forge and Ronin enclosures) carry a top strip too, but
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
 * The `dc` on each of these is read off the same silkscreen the signal pair is,
 * and lands on the socket the artwork actually draws for power — not merely
 * somewhere along the strip. The Lab and Astral boxes print theirs last, after
 * the ins, the outs and whatever expression and USB they carry; the Cosmic
 * Resonance sinks a flat barrel inlet into the strip between its `R-OUT` and
 * `EXP`, so its `y` is a real depth (see `EFFECT_DC_JACK`) rather than the
 * seating sliver. Either way the DC plug stands clear of the two instrument
 * plugs.
 */
const TOP_JACKS = {
  /** "L-IN · L-OUT · R-OUT · EXP · USB · 9V DC" — the wide Lab enclosures. */
  lab: {
    edge: "top",
    in: { x: 0.405, y: TOP_JACK_SEAT },
    out: { x: 0.496, y: TOP_JACK_SEAT },
    // The last port on the strip. The one before it, at `0.85`, is the USB.
    dc: { x: 0.92, y: TOP_JACK_SEAT },
  },
  /** "SOURCE IN · ECHO OUT · CONTROL CV · LINK MIDI" — Astral Reverberator. */
  astral: {
    edge: "top",
    in: { x: 0.232, y: TOP_JACK_SEAT },
    out: { x: 0.379, y: TOP_JACK_SEAT },
    // The fourth nut, the one the silhouette measures at `0.846`.
    dc: { x: 0.846, y: TOP_JACK_SEAT },
  },
  /** "L-IN · R-OUT · EXP · USB" — Cosmic Resonance. */
  cosmic: {
    edge: "top",
    in: { x: 0.239, y: TOP_JACK_SEAT },
    out: { x: 0.383, y: TOP_JACK_SEAT },
    // The unlabelled barrel inlet set flush into the strip, not the USB nut —
    // so the plug's tip goes to the far lip of that hole, not to the edge.
    dc: { x: 0.51, y: 0.052 },
  },
} satisfies Record<string, EffectJackLayout>;

// Board scale follows enclosure size, not the diameter of illustrated sockets.
// 1 = standard single pedal; 0.8 = mini; 1.55 = full-length expression treadle.
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
    name: "Moss Drive",
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
    brand: "Forge",
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
    brand: "Stellar",
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
    /** Eats ~1.5x the board width of an ordinary pedal — Item Level pays for it. */
    levelBonus: 3,
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
    /** Eats ~1.5x the board width of an ordinary pedal — Item Level pays for it. */
    levelBonus: 3,
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
    /** Eats ~1.5x the board width of an ordinary pedal — Item Level pays for it. */
    levelBonus: 3,
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
    brand: "Forge",
    type: "Fuzz",
    imageId: 23,
    rarity: "Legendary",
  },
  {
    id: 23,
    name: "The Cobalt Cavern",
    brand: "Forge",
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
  {
    id: 33,
    name: "Blender Fuzz",
    brand: "Flanders",
    type: "Fuzz",
    description:
      "A vintage-style fuzz with a blend control that mixes a raw, saturated signal back into your clean tone.",
    imageId: 34,
    rarity: "Legendary",
    draw: 15,
  },
  {
    id: 34,
    name: "Octave Drift",
    boardScale: 1.55,
    brand: "Astra-Path",
    type: "Vibrato",
    description:
      "Bend notes in real time with the expression treadle, then jump between octaves for dramatic dives and harmonies.",
    imageId: 35,
    rarity: "Mythic",
    // The signal pair is the upper set of side sockets on this enclosure. Their
    // nuts stand a good way proud of the case, so the plugs go on past them to
    // the case wall and cover the nut rather than butting against its tip.
    jacks: {
      edge: "side",
      in: { x: 0.974, y: 0.295 },
      out: { x: 0.024, y: 0.295 },
      nut: 0.033,
      // No inlet is drawn, so power goes into the middle of the control
      // section's flat top — below the treadle's, which is the box's top edge.
      dc: { x: 0.275, y: 0.103, edge: true },
    },
    draw: 300,
    levelBonus: 3,
  },
  {
    id: 35,
    imageId: 36,
    name: "Desert Cry",
    brand: "Ronin",
    type: "Wah",
    rarity: "Common",
    draw: 8,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1.55,
    jacks: {
      edge: "side",
      in: { x: 0.994, y: 0.4506 },
      out: { x: 0.003, y: 0.45 },
      nut: 0.059,
      dc: { x: 0.5, y: 0.0275 },
    },
  },
  {
    id: 36,
    imageId: 37,
    name: "Tidal Sweep",
    brand: "Aqua-Fab",
    type: "Wah",
    rarity: "Rare",
    draw: 12,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1.55,
    jacks: {
      edge: "side",
      in: { x: 0.9942, y: 0.46 },
      out: { x: 0.0029, y: 0.4594 },
      nut: 0.061,
      dc: { x: 0.496, y: 0.048 },
    },
  },
  {
    id: 37,
    imageId: 38,
    name: "Astral Voice",
    brand: "Gravinix",
    type: "Wah",
    rarity: "Epic",
    draw: 20,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1.55,
    jacks: {
      edge: "side",
      in: { x: 0.9942, y: 0.4288 },
      out: { x: 0.0029, y: 0.4288 },
      nut: 0.045,
      dc: { x: 0.5, y: 0.06 },
    },
  },
  {
    id: 38,
    imageId: 39,
    name: "Silk Press",
    brand: "Ronin",
    type: "Compressor",
    rarity: "Uncommon",
    draw: 25,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.9978, y: 0.5319 },
      out: { x: 0, y: 0.5313 },
      nut: 0.059,
    },
  },
  {
    id: 39,
    imageId: 40,
    name: "Velvet Clamp",
    brand: "VelcroLab",
    type: "Compressor",
    rarity: "Epic",
    draw: 80,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1.05,
    jacks: {
      edge: "side",
      in: { x: 0.9958, y: 0.5006 },
      out: { x: 0.0021, y: 0.5006 },
      nut: 0.059,
    },
  },
  {
    id: 40,
    imageId: 41,
    name: "Iron Bite",
    brand: "Forge",
    type: "Distortion",
    rarity: "Uncommon",
    draw: 15,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.9958, y: 0.5019 },
      out: { x: 0.0021, y: 0.5019 },
      nut: 0.071,
    },
  },
  {
    id: 41,
    imageId: 42,
    name: "Crimson Siege",
    brand: "Ronin",
    type: "Distortion",
    rarity: "Rare",
    draw: 25,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.9954, y: 0.4387 },
      out: { x: 0.0023, y: 0.4381 },
      nut: 0.058,
    },
  },
  {
    id: 42,
    imageId: 43,
    name: "Jetstream",
    brand: "Aqua-Fab",
    type: "Flanger",
    rarity: "Uncommon",
    draw: 40,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.996, y: 0.5144 },
      out: { x: 0.002, y: 0.5144 },
      nut: 0.065,
    },
  },
  {
    id: 43,
    imageId: 44,
    name: "Mercury Orbit",
    brand: "Gravinix",
    type: "Flanger",
    rarity: "Epic",
    draw: 65,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.995, y: 0.4831 },
      out: { x: 0.0025, y: 0.4831 },
      nut: 0.063,
    },
  },
  {
    id: 44,
    imageId: 45,
    name: "Dune Phase",
    brand: "Forge",
    type: "Phaser",
    rarity: "Common",
    draw: 12,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 0.95,
    jacks: {
      edge: "side",
      in: { x: 0.998, y: 0.5031 },
      out: { x: 0.002, y: 0.5025 },
      nut: 0.061,
    },
  },
  {
    id: 45,
    imageId: 46,
    name: "Lunar Wheel",
    brand: "Astra-Path",
    type: "Phaser",
    rarity: "Rare",
    draw: 25,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.9959, y: 0.4806 },
      out: { x: 0, y: 0.4813 },
      nut: 0.06,
    },
  },
  {
    id: 46,
    imageId: 47,
    name: "Spark Lift",
    brand: "Forge",
    type: "Boost",
    rarity: "Common",
    draw: 5,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 0.8,
    jacks: {
      edge: "side",
      in: { x: 0.9976, y: 0.4831 },
      out: { x: 0.0024, y: 0.4825 },
      nut: 0.094,
    },
  },
  {
    id: 47,
    imageId: 48,
    name: "Beacon Preamp",
    brand: "AstraTone",
    type: "Boost",
    rarity: "Epic",
    draw: 30,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.9955, y: 0.4969 },
      out: { x: 0.0023, y: 0.4963 },
      nut: 0.068,
    },
  },
  {
    id: 48,
    imageId: 49,
    name: "Contour Six",
    brand: "Ronin",
    type: "EQ",
    rarity: "Common",
    draw: 20,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.9963, y: 0.5288 },
      out: { x: 0.0018, y: 0.5288 },
      nut: 0.059,
    },
  },
  {
    id: 49,
    imageId: 50,
    name: "Spectrum Ten",
    brand: "AstraTone",
    type: "EQ",
    rarity: "Rare",
    draw: 45,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1.1,
    jacks: {
      edge: "side",
      in: { x: 0.9964, y: 0.5194 },
      out: { x: 0.0018, y: 0.5188 },
      nut: 0.052,
    },
  },
  {
    id: 50,
    imageId: 51,
    name: "Pitch Lantern",
    brand: "Ronin",
    type: "Tuner",
    rarity: "Uncommon",
    draw: 40,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 0.95,
    jacks: {
      edge: "side",
      in: { x: 0.995, y: 0.4931 },
      out: { x: 0, y: 0.4931 },
      nut: 0.056,
    },
  },
  {
    id: 51,
    imageId: 52,
    name: "Polaris Tune",
    brand: "Astra-Path",
    type: "Tuner",
    rarity: "Epic",
    draw: 65,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 0.95,
    jacks: {
      edge: "side",
      in: { x: 0.9956, y: 0.5019 },
      out: { x: 0.0022, y: 0.5019 },
      nut: 0.081,
    },
  },
  {
    id: 52,
    imageId: 53,
    name: "Lagoon Choir",
    brand: "Aqua-Fab",
    type: "Chorus",
    rarity: "Uncommon",
    draw: 30,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.9958, y: 0.4863 },
      out: { x: 0.0021, y: 0.4869 },
      nut: 0.064,
    },
  },
  {
    id: 53,
    imageId: 54,
    name: "Willow Sway",
    brand: "Gravinix",
    type: "Vibrato",
    rarity: "Uncommon",
    draw: 35,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1,
    jacks: {
      edge: "side",
      in: { x: 0.9956, y: 0.52 },
      out: { x: 0.0022, y: 0.52 },
      nut: 0.06,
    },
  },
  {
    id: 54,
    imageId: 55,
    name: "Chapel Mist",
    brand: "ChronosEcho",
    type: "Reverb",
    rarity: "Rare",
    draw: 100,
    // Socket centres and nut depth measured from the shipped transparent art.
    boardScale: 1.1,
    jacks: {
      edge: "side",
      in: { x: 0.9954, y: 0.525 },
      out: { x: 0.0023, y: 0.5306 },
      nut: 0.059,
    },
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
