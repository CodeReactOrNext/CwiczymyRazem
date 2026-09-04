/**
 * Gear achievements — what the player has built and collected, rather than what
 * they have practised.
 *
 * Every check reads `ctx.arsenal`, the flat summary from
 * `feature/arsenal/data/arsenalSummary`. Nothing here resolves a model id, so
 * the guitar and effect definition tables stay out of the report bundle.
 *
 * All of it is derived from what is owned *now*. Because an achievement is never
 * revoked once granted, selling the Mythic that earned the badge cannot take the
 * badge back — "owns one" and "has ever owned one" differ only in the moment the
 * badge first lands.
 */
import { achivFactor } from "feature/achievements/data/achievementsData.utils";
import { AchievementRequirement } from "feature/achievements/utils/AchievementRequirement";
import { DROPPABLE_RARITIES } from "feature/arsenal/data/arsenalSummary";
import {
  GiAmplitude,
  GiBatteryPack,
  GiChainLightning,
  GiCircuitry,
  GiCrown,
  GiCrownedSkull,
  GiCutDiamond,
  GiEarthAmerica,
  GiElectricalResistance,
  GiGreekTemple,
  GiMineralPearls,
  GiPocketWatch,
  GiPowerLightning,
  GiSparkles,
  GiStack,
  GiStarMedal,
} from "react-icons/gi";

/** Distinct production countries needed for `globetrotter`, out of the 11 that exist. */
const GLOBETROTTER_COUNTRIES = 8;

/** Museum-grade items needed for `museum_5`. */
const MUSEUM_SHELF = 5;

/**
 * The year a guitar has to predate for `vintage_1970`. Nineteen models in the
 * pool can roll under it, so it is a hunt rather than a lottery.
 */
const VINTAGE_YEAR = 1970;

export const rigAchievements = [
  // ─── Rig Level ─────────────────────────────────────────────────────────────
  achivFactor("rig_50", GiCircuitry, "common", AchievementRequirement.rigLevel(50), AchievementRequirement.getProgressFor.rigLevel(50)),
  achivFactor("rig_150", GiElectricalResistance, "rare", AchievementRequirement.rigLevel(150), AchievementRequirement.getProgressFor.rigLevel(150)),
  achivFactor("rig_300", GiBatteryPack, "rare", AchievementRequirement.rigLevel(300), AchievementRequirement.getProgressFor.rigLevel(300)),
  achivFactor("rig_500", GiAmplitude, "veryRare", AchievementRequirement.rigLevel(500), AchievementRequirement.getProgressFor.rigLevel(500)),
  achivFactor("rig_800", GiPowerLightning, "epic", AchievementRequirement.rigLevel(800), AchievementRequirement.getProgressFor.rigLevel(800)),
  achivFactor("rig_1000", GiChainLightning, "epic", AchievementRequirement.rigLevel(1000), AchievementRequirement.getProgressFor.rigLevel(1000)),

  // ─── Rarity ────────────────────────────────────────────────────────────────
  achivFactor("first_rare", GiMineralPearls, "common", AchievementRequirement.ownsRarity("Rare")),
  achivFactor("first_epic", GiCutDiamond, "rare", AchievementRequirement.ownsRarity("Epic")),
  achivFactor("first_legendary", GiCrown, "veryRare", AchievementRequirement.ownsRarity("Legendary")),
  achivFactor("first_mythic", GiCrownedSkull, "epic", AchievementRequirement.ownsRarity("Mythic")),
  achivFactor(
    "rarity_full_set",
    GiStack,
    "epic",
    (ctx) => DROPPABLE_RARITIES.every((rarity) => ctx.arsenal.ownedByRarity[rarity] > 0),
    (ctx) => ({
      current: DROPPABLE_RARITIES.filter((rarity) => ctx.arsenal.ownedByRarity[rarity] > 0).length,
      max: DROPPABLE_RARITIES.length,
    }),
  ),

  // ─── Condition & vintage ───────────────────────────────────────────────────
  achivFactor("museum_1", GiGreekTemple, "rare", (ctx) => ctx.arsenal.museumCount >= 1),
  achivFactor(
    "museum_5",
    GiSparkles,
    "veryRare",
    (ctx) => ctx.arsenal.museumCount >= MUSEUM_SHELF,
    (ctx) => ({ current: ctx.arsenal.museumCount, max: MUSEUM_SHELF, unit: "items" }),
  ),
  // The very first one off the line for its model — a global counter, so exactly
  // one account in the game can ever hold a given `#0001`.
  achivFactor("serial_one", GiStarMedal, "epic", (ctx) => ctx.arsenal.bestSerial === 1),
  achivFactor(
    "globetrotter",
    GiEarthAmerica,
    "veryRare",
    (ctx) => ctx.arsenal.countryCount >= GLOBETROTTER_COUNTRIES,
    (ctx) => ({ current: ctx.arsenal.countryCount, max: GLOBETROTTER_COUNTRIES, unit: "countries" }),
  ),
  achivFactor(
    "vintage_1970",
    GiPocketWatch,
    "rare",
    (ctx) =>
      ctx.arsenal.oldestGuitarYear !== null && ctx.arsenal.oldestGuitarYear < VINTAGE_YEAR,
  ),
];
