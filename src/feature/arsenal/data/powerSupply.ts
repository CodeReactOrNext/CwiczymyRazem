/**
 * The power brick, and the one thing it is for: making the player choose.
 *
 * One rule, and only one — a pedal takes an output, and the brick has as many
 * outputs as the rig has paid for (`SUPPLY_TIERS`). No milliamps, no per-pedal
 * appetite, nothing to add up: a board either has a hole left or it does not,
 * which is a limit a player can see on the brick itself rather than one they
 * have to work out.
 *
 * A pedal with no cable to the brick is dead, everywhere the game reads a rig:
 * it is out of the signal chain (`data/signalChain`), it adds nothing to the rig
 * level (`data/rigLevel`) and its traits pay nothing (`data/traitEval`). All
 * three ask the same question through `poweredPredicateOf` below, which is what
 * makes the brick's budget a real choice rather than a drawing of one.
 *
 * Free of anything React, so the report API can score a stored rig with exactly
 * the rules the board draws.
 */

import type {
  PedalboardPlacement,
  PowerLink,
  RigSetup,
} from "../types/arsenal.types";
import { inChainOrder } from "../utils/pedalboardLayout";
import type { RailGeometry } from "../utils/powerLayout";
import type { SupplyTier } from "./rigHardware";
import { supplyTierOf } from "./rigHardware";

export interface PowerState {
  /** The links that survived: on the board, on a real output, one each. */
  links: PowerLink[];
  /** Fast membership test — what the signal chain and the board both read. */
  poweredIds: Set<string>;
  outputsUsed: number;
  outputsFree: number;
  /** Boarded pedals with no cable to the brick, in the order they are read. */
  unpoweredIds: string[];
}

/**
 * Reads the stored links against the board that is actually there.
 *
 * Everything that could have gone stale is dropped rather than trusted: a link
 * to a pedal that has been sold, two cables claiming the same output, and an
 * output number off a bigger brick than the one the rig owns.
 */
export const readPowerState = (
  supply: SupplyTier,
  boarded: PedalboardPlacement[],
  links: PowerLink[] | null | undefined,
): PowerState => {
  const byId = new Map((links ?? []).map((link) => [link.itemId, link]));
  const taken = new Set<number>();
  const kept: PowerLink[] = [];
  const unpoweredIds: string[] = [];

  for (const item of boarded) {
    const link = byId.get(item.itemId);
    const usable =
      link !== undefined &&
      Number.isInteger(link.out) &&
      link.out >= 0 &&
      link.out < supply.outputs &&
      !taken.has(link.out);

    if (!usable) {
      unpoweredIds.push(item.itemId);
      continue;
    }
    taken.add(link.out);
    kept.push({ itemId: item.itemId, out: link.out });
  }

  return {
    links: kept,
    poweredIds: new Set(kept.map((link) => link.itemId)),
    outputsUsed: kept.length,
    outputsFree: supply.outputs - kept.length,
    unpoweredIds,
  };
};

/**
 * The free output nearest the pedal, so a cable takes the short way there.
 *
 * `null` when the brick is full, which is the only reason a pedal can be
 * refused.
 */
export const pickOutput = (
  rail: RailGeometry,
  placement: PedalboardPlacement,
  wPct: number,
  taken: Set<number>,
): number | null => {
  const centre = ((placement.xPct + wPct / 2) / 100) * rail.geo.viewW;
  const free = rail.sockets.filter((socket) => !taken.has(socket.index));
  if (free.length === 0) return null;

  return free.reduce((best, socket) =>
    Math.abs(socket.x - centre) < Math.abs(best.x - centre) ? socket : best,
  ).index;
};

/**
 * Fills every output the brick still has, in signal order.
 *
 * Signal order rather than array order so the result is stable and reads the
 * way the board does: a brick with four holes powers the first four pedals the
 * signal meets, not whichever four the save file happened to list first.
 */
export const autoPatch = (
  rail: RailGeometry,
  boarded: PedalboardPlacement[],
  links: PowerLink[] | null | undefined,
  widthOf: (itemId: string) => number,
): PowerLink[] => {
  const state = readPowerState(rail.supply, boarded, links);
  const next = [...state.links];
  const taken = new Set(next.map((link) => link.out));
  const powered = new Set(state.poweredIds);

  for (const item of inChainOrder(rail.geo, boarded)) {
    if (powered.has(item.itemId)) continue;
    const out = pickOutput(rail, item, widthOf(item.itemId), taken);
    if (out === null) break;
    taken.add(out);
    powered.add(item.itemId);
    next.push({ itemId: item.itemId, out });
  }

  return next;
};

/** Why a pedal cannot be plugged in — `null` when it can. */
export const refusalFor = (
  supply: SupplyTier,
  state: PowerState,
): string | null =>
  state.outputsFree === 0
    ? `Every output on the ${supply.name} is taken — unplug something first.`
    : null;

/** Just enough of a stored rig to work out what has power. */
export type PoweredRigLike = Partial<
  Pick<RigSetup, "pedalboardItems" | "power" | "supplyTier">
>;

/**
 * Which of a stored rig's pedals have power — the one answer every scorer asks.
 *
 * `undefined` — a board saved before the brick existed — means "everything", so
 * a migration can never quietly cost somebody Fame they had already earned. An
 * array, even an empty one, is taken at its word: that board has been patched,
 * and whatever is not on it is off.
 *
 * The links are read through `readPowerState` rather than trusted, so a cable to
 * a sold pedal, two cables claiming one output, or an output number off a bigger
 * brick than the rig owns all come out as no power at all — exactly what the
 * board itself draws.
 */
export const poweredPredicateOf = (
  rig: PoweredRigLike | null | undefined,
): ((itemId: string) => boolean) | undefined => {
  const links = rig?.power;
  if (!Array.isArray(links)) return undefined;

  const { poweredIds } = readPowerState(
    supplyTierOf(rig?.supplyTier),
    rig?.pedalboardItems ?? [],
    links,
  );

  return (itemId: string) => poweredIds.has(itemId);
};

/** The same test with the legacy case resolved: no links stored, all powered. */
export const isPoweredIn = (
  rig: PoweredRigLike | null | undefined,
): ((itemId: string) => boolean) => poweredPredicateOf(rig) ?? (() => true);
