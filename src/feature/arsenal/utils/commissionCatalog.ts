import type { CommissionTarget } from "../data/commission";
import { getTargetSubject, isCommissionableModel } from "../data/commission";
import { EFFECT_DEFINITIONS } from "../data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "../data/guitarDefinitions";
import { RARITY_LADDER } from "../data/itemStats";
import type { ArsenalUserData } from "../types/arsenal.types";
import { buildDiscoveredSet } from "./dex";

export interface CommissionCatalogEntry {
  key: string;
  target: CommissionTarget;
}

/**
 * Everything the bench could build for this account right now: every model
 * missing from the Dex, minus the ones it never builds (roadmap trophies).
 *
 * Rarest first, because that is where a commission earns its price — the low
 * tiers are a pull or two from a case, the last Mythics are not. Inside a
 * rarity the catalogue keeps its own order, the one the Dex numbers it by.
 */
export const getCommissionCatalog = (
  data:
    | Pick<
        ArsenalUserData,
        "inventory" | "effectInventory" | "dexGuitars" | "dexEffects"
      >
    | undefined,
): CommissionCatalogEntry[] => {
  const discoveredGuitars = buildDiscoveredSet(
    data?.dexGuitars,
    data?.inventory,
    (i) => i.guitarId,
  );
  const discoveredEffects = buildDiscoveredSet(
    data?.dexEffects,
    data?.effectInventory,
    (i) => i.effectId,
  );

  const targets: CommissionTarget[] = [
    ...GUITAR_DEFINITIONS.filter((def) => !discoveredGuitars.has(def.id)).map(
      (def): CommissionTarget => ({ kind: "guitar", def }),
    ),
    ...EFFECT_DEFINITIONS.filter((def) => !discoveredEffects.has(def.id)).map(
      (def): CommissionTarget => ({ kind: "effect", def }),
    ),
  ];

  return (
    targets
      .filter((target) => isCommissionableModel(getTargetSubject(target)))
      // Stable, so a rarity keeps the catalogue's own order.
      .sort(
        (a, b) =>
          RARITY_LADDER.indexOf(b.def.rarity) -
          RARITY_LADDER.indexOf(a.def.rarity),
      )
      .map((target) => ({ key: `${target.kind}-${target.def.id}`, target }))
  );
};
