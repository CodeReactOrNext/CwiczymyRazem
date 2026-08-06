import type { ScrapBom } from "../types/arsenal.types";

/**
 * What each guitar physically holds, in salvage order.
 *
 * The list is a priority, not an inventory: rarity decides how far down it a
 * teardown reaches (1 slot from a Common, 4 from a Mythic) and how high each slot
 * lands on the tier ladder. Nothing is locked by rarity — a Common still gives up
 * its headline part, just at Standard.
 *
 * Construction is expressed by *omission*: a part a guitar cannot physically give
 * up simply has no slot. That, plus the differing slot order between archetypes,
 * is what keeps every model from yielding the same rows.
 *
 * The order also drives tier coverage: a part only ever reaches Legendary if it
 * sits in the first two slots of an archetype that exists at Legendary or Mythic.
 * `scrapYield.test.ts` asserts every part/tier pair stays reachable — reorder these
 * lists and that test will tell you what you broke.
 */

/** Three pickups on a full harness — Stratocaster layout, bolt-on neck. */
const STRAT: ScrapBom = [
  { partId: "pickup", qty: 3 },
  { partId: "neck", qty: 1 },
  { partId: "body", qty: 1 },
  { partId: "tuners", qty: 1 },
];

/**
 * Single-cut layout. No `neck` slot: these are set-neck builds, the neck is glued
 * into the body and cannot be salvaged.
 */
const SINGLECUT: ScrapBom = [
  { partId: "body", qty: 1 },
  { partId: "bridge", qty: 1 },
  { partId: "pickup", qty: 2 },
  { partId: "pot", qty: 2 },
];

/** Two pickups, bolt-on neck — covers Telecaster, superstrat and seven-string. */
const TWIN: ScrapBom = [
  { partId: "tuners", qty: 1 },
  { partId: "neck", qty: 1 },
  { partId: "screws", qty: 1 },
  { partId: "bridge", qty: 1 },
];

/** Three pickups but a stripped-down harness — modern superstrat. */
const SUPER_HSS: ScrapBom = [
  { partId: "neck", qty: 1 },
  { partId: "pot", qty: 1 },
  { partId: "pickup", qty: 3 },
  { partId: "tuners", qty: 1 },
];

/** Headless build — no headstock, so no tuner set to recover. */
const HEADLESS: ScrapBom = [
  { partId: "body", qty: 1 },
  { partId: "pickup", qty: 2 },
  { partId: "pot", qty: 1 },
];

export const GUITAR_BOMS: Record<number, ScrapBom> = {
  // Skalberg — headless
  1: HEADLESS,
  2: HEADLESS,
  // Velmora Aurelis — set-neck single-cut family
  3: SINGLECUT,
  4: SINGLECUT,
  5: SINGLECUT,
  // Driftwood / Fairmont
  6: TWIN,
  7: STRAT,
  8: STRAT,
  9: STRAT,
  // Grayson Monarch V — set-neck
  10: SINGLECUT,
  11: SINGLECUT,
  12: SINGLECUT,
  13: SINGLECUT,
  // Lewis Palmer — set-neck
  14: SINGLECUT,
  15: SINGLECUT,
  // Izanor Omega / JSC — bolt-on superstrat family
  16: TWIN,
  17: TWIN,
  18: TWIN,
  19: SINGLECUT,
  20: TWIN,
  // (21 intentionally absent — no such guitar definition)
  22: TWIN,
  23: TWIN,
  24: STRAT,
  25: TWIN,
  26: SINGLECUT,
  27: STRAT,
  28: TWIN,
  29: TWIN,
  30: TWIN,
  31: TWIN,
  32: SINGLECUT,
  33: TWIN,
  34: TWIN,
  35: SINGLECUT,
  36: STRAT,
  37: SUPER_HSS,
  38: SUPER_HSS,
  39: SUPER_HSS,
  40: TWIN,
  41: SINGLECUT,
  42: SINGLECUT,
  43: STRAT,
  44: STRAT,
  45: SINGLECUT,
  // Jazzcaster — offset, set-neck
  46: SINGLECUT,
  47: STRAT,
  48: STRAT,
  49: STRAT,
  50: STRAT,
  // Izanor VII — seven-string, bolt-on
  51: TWIN,
  52: TWIN,
  53: TWIN,
  54: SINGLECUT,
  55: SINGLECUT,
  56: STRAT,
  57: SINGLECUT,
  58: TWIN,
  59: STRAT,
};

/** Fallback for any guitar id added before its BOM is authored. */
export const DEFAULT_GUITAR_BOM: ScrapBom = TWIN;

export const getGuitarBom = (id: number | string): ScrapBom =>
  GUITAR_BOMS[Number(id)] ?? DEFAULT_GUITAR_BOM;
