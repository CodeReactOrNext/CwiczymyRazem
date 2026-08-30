import type { GuitarSpec } from "../types/arsenal.types";

/**
 * What each guitar physically is, as opposed to what comes off it on a teardown.
 *
 * Sister file to `guitarBom.ts`, and deliberately not derived from it. The BOM is a
 * salvage priority; this is hardware. Gating mods on the BOM confused the two and
 * produced the exact opposite of what it meant to: a Stratocaster could not be
 * fitted with a brass tremolo block (its BOM lists no bridge) while a Telecaster
 * and a Les Paul could, and no set-neck guitar in the game could take fret work,
 * because a glued-in neck is never salvaged.
 *
 * The constants below are named for their *hardware*, not their silhouette — a
 * Les Paul, an SG, a Flying V and an Explorer are one entry here, because nothing
 * a bench does to them differs. The comment on each says which models it covers.
 *
 * Nothing here is a map keyed by id, and deliberately so: the archetypes are
 * spread straight onto the entries in `guitarDefinitions.ts`, where `spec` is a
 * required field. A new guitar therefore cannot ship unclassified — it is a
 * compile error, not a silent default. `guitarBom.ts` takes the other route,
 * falling back to `TWIN`, and has quietly made every unauthored guitar a Telecaster.
 */

/** Base every solid electric shares — the fields below only override what differs. */
const SOLID_ELECTRIC = {
  construction: "solid",
  electronics: "passive",
  headstock: true,
} as const;

/** Stratocaster, three singles, six-screw synchronised tremolo. */
export const S_TYPE: GuitarSpec = {
  ...SOLID_ELECTRIC,
  bridge: "vintage-trem",
  pickups: "SSS",
  neckJoint: "bolt-on",
};

/** The same, on a modern two-point tremolo. */
export const S_TYPE_MODERN: GuitarSpec = { ...S_TYPE, bridge: "modern-trem" };

/** Two-point tremolo with humbuckers at both ends — the HSH Strat. */
export const S_TYPE_MODERN_HSH: GuitarSpec = {
  ...S_TYPE_MODERN,
  pickups: "HSH",
};

/** Telecaster: two singles, ashtray bridge, no tremolo of any kind. */
export const T_TYPE: GuitarSpec = {
  ...SOLID_ELECTRIC,
  bridge: "hardtail",
  pickups: "SS",
  neckJoint: "bolt-on",
};

/** Superstrat on a double-locking tremolo — the whole Izanor line and its cousins. */
export const SUPERSTRAT: GuitarSpec = {
  ...SOLID_ELECTRIC,
  bridge: "floyd",
  pickups: "HSH",
  neckJoint: "bolt-on",
};

/** The same build without the middle single. */
export const SUPERSTRAT_HH: GuitarSpec = { ...SUPERSTRAT, pickups: "HH" };

/**
 * Glued-in neck, tune-o-matic and a stop bar.
 *
 * One entry for the single-cuts, the SGs, the PRS double-cuts, the Flying Vs and
 * the Explorers: different outlines, identical hardware, so identical rules.
 */
export const SET_NECK_TOM: GuitarSpec = {
  ...SOLID_ELECTRIC,
  bridge: "tom-stopbar",
  pickups: "HH",
  neckJoint: "set-neck",
};

/** The same, ordered with the maker's own vibrato instead of a stop bar. */
export const SET_NECK_TREM: GuitarSpec = {
  ...SET_NECK_TOM,
  bridge: "modern-trem",
};

/** The same again on a one-piece wraparound. */
export const SET_NECK_WRAP: GuitarSpec = {
  ...SET_NECK_TOM,
  bridge: "wraparound",
};

/** Thinline archtop with f-holes — there is no solid wood left to chamber. */
export const SEMI_HOLLOW: GuitarSpec = {
  ...SET_NECK_TOM,
  construction: "semi-hollow",
};

/** Offset body, bolt-on neck, humbuckers into a tune-o-matic. */
export const OFFSET_TOM: GuitarSpec = {
  ...SOLID_ELECTRIC,
  bridge: "tom-stopbar",
  pickups: "HH",
  neckJoint: "bolt-on",
};

/**
 * The Jazzmaster arrangement: a rocking bridge under a floating tremolo.
 *
 * The tremolo is a plate on the top with no block sunk into the body, which is why
 * it is its own bridge type rather than a `vintage-trem` — there is nothing in
 * there to swap for brass.
 */
export const OFFSET_FLOATING: GuitarSpec = {
  ...OFFSET_TOM,
  bridge: "floating-offset",
  pickups: "SS",
};

/** Offset with a pair of soapbars — single coils, so nothing to split. */
export const OFFSET_P90: GuitarSpec = { ...OFFSET_TOM, pickups: "P90" };

/** No headstock: the tuners are at the bridge, so there are none to lock. */
export const HEADLESS: GuitarSpec = {
  ...SOLID_ELECTRIC,
  bridge: "hardtail",
  pickups: "HH",
  neckJoint: "neck-thru",
  headstock: false,
};

/**
 * Resonator: an acoustic with a spun cone under a biscuit bridge.
 *
 * The only guitar in the roster with no magnetic pickups and no harness, which
 * takes the entire Pickups category off it. See `guitarSpecs.test.ts` — its
 * eligible pool is the tightest in the game and is asserted against its slot count.
 */
export const RESONATOR: GuitarSpec = {
  bridge: "biscuit",
  pickups: "none",
  construction: "resonator",
  electronics: "none",
  neckJoint: "set-neck",
  headstock: true,
};
