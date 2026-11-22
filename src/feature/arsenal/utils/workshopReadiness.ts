import { getFusionQuote, getMaxFusionCrafts } from "../data/fusion";
import { PART_TIERS } from "../data/partDefinitions";
import { getSalvagedModOptions } from "../data/salvage";
import type { WorkshopSubject } from "../data/workshop";
import {
  getBuildQuote,
  getModQuote,
  getRepairQuote,
} from "../data/workshop";
import type {
  PartId,
  PartTier,
  SalvagedMod,
  ScrapPart,
} from "../types/arsenal.types";
import type { WorkshopEntry } from "./workshopEntries";

/**
 * "Is there something to do on the bench right now?" — the question behind the
 * green hammer mark that the collection, the rack and the job cards all show.
 *
 * Only what the player can actually press today counts: a job whose bill the
 * wallet covers, or a free mod slot with a mod in the stash that fits it. A job
 * that is merely *possible some day* is not news, and saying so on every socket
 * would turn the mark into wallpaper.
 */
export interface BenchReadiness {
  repair: boolean;
  build: boolean;
  /** A free slot, and a mod in the stash that would go into it. */
  fit: boolean;
}

export const getBenchReadiness = (
  subject: WorkshopSubject,
  wallet: ScrapPart[],
  fame: number,
  salvagedMods: SalvagedMod[],
): BenchReadiness => {
  const { slots } = getModQuote(subject, wallet, fame);
  return {
    repair: getRepairQuote(subject, wallet).canRepair,
    build: getBuildQuote(subject, wallet, fame).canBuild,
    fit:
      slots.free > 0 &&
      getSalvagedModOptions(subject, salvagedMods).length > 0,
  };
};

export const isBenchReady = (readiness: BenchReadiness): boolean =>
  readiness.repair || readiness.build || readiness.fit;

/** Ids of the gear that has a bench job ready, for marking sockets and rows. */
export const getReadyGearIds = (
  entries: WorkshopEntry[],
  wallet: ScrapPart[],
  fame: number,
  salvagedMods: SalvagedMod[],
): Set<string> =>
  new Set(
    entries
      .filter((entry) =>
        isBenchReady(
          getBenchReadiness(entry.subject, wallet, fame, salvagedMods),
        ),
      )
      .map((entry) => entry.id),
  );

/**
 * Where each rescued mod in the stash could go right now: the first instrument
 * (in rack order — gear in service first) with a free slot that takes it. A mod
 * with nowhere to go is left out.
 */
export const getModTargets = (
  entries: WorkshopEntry[],
  wallet: ScrapPart[],
  fame: number,
  salvagedMods: SalvagedMod[],
): Map<string, WorkshopEntry> => {
  const targets = new Map<string, WorkshopEntry>();
  for (const entry of entries) {
    if (getModQuote(entry.subject, wallet, fame).slots.free === 0) continue;
    for (const option of getSalvagedModOptions(entry.subject, salvagedMods)) {
      if (!targets.has(option.salvagedId))
        targets.set(option.salvagedId, entry);
    }
  }
  return targets;
};

/**
 * How far a stack of parts is along to its next tier, for the bar under its
 * socket. `null` for a part that does not go any higher — screws, a pot at Epic,
 * anything already Unique — which gets no bar at all rather than an empty one.
 */
export interface TierProgress {
  outputTier: PartTier;
  /** Pieces one step up costs. */
  ratio: number;
  /** 0–1, capped: a stack of 34 against a ratio of 5 is simply full. */
  fill: number;
  /** Enough pieces and enough Fame for at least one step, right now. */
  ready: boolean;
}

export const getTierProgress = (
  part: ScrapPart,
  fame: number,
): TierProgress | null => {
  const quote = getFusionQuote(part.partId, part.tier);
  if (!quote) return null;
  return {
    outputTier: quote.outputTier,
    ratio: quote.ratio,
    fill: Math.min(1, part.qty / quote.ratio),
    ready: part.qty >= quote.ratio && fame >= quote.fame,
  };
};

/**
 * A part a job is short of, made from the tier under it: which tier to rework
 * and how many pieces to produce. Produces exactly the shortfall when the
 * wallet allows, fewer when it does not, and `null` when not even one can be
 * made — no lower tier, too few pieces of it, or too little Fame.
 */
export interface MakeOffer {
  partId: PartId;
  /** The tier that gets consumed — one below the one the job asks for. */
  fromTier: PartTier;
  crafts: number;
}

export const getMakeOffer = (
  wallet: ScrapPart[],
  partId: PartId,
  tier: PartTier,
  short: number,
  fame: number,
): MakeOffer | null => {
  if (short <= 0) return null;
  const fromTier = PART_TIERS[PART_TIERS.indexOf(tier) - 1];
  if (!fromTier) return null;
  const quote = getFusionQuote(partId, fromTier);
  if (!quote || quote.outputTier !== tier) return null;
  const crafts = Math.min(
    short,
    getMaxFusionCrafts(wallet, partId, fromTier, fame),
  );
  return crafts > 0 ? { partId, fromTier, crafts } : null;
};
