import type { BoonId } from "./boons";
import { BOON, stacksOf } from "./boons";
import type { BossFightState } from "./bossEngine";
import { chargeMaxFor, MAX_MULTIPLIER_STREAK, parryStreak, phaseBpm, WEAK_SPOT_CHARGE } from "./bossEngine";

export interface BoonPreview {
  from: number | string;
  to: number | string;
}

/** A strike from a full sword at no streak, with these blade and overdrive stacks. */
const fullStrike = (chargeMax: number, blade: number, overdrive: number) =>
  Math.round(chargeMax * (1 + BOON.bladeBonus * blade) * BOON.overdriveDamage ** overdrive);

/**
 * What taking a boon does to the player's own numbers right now — "62 → 97
 * HP", "a bite 7 → 5" — instead of a percentage to work out. Null for boons
 * that change a rule rather than a number.
 */
export const boonPreview = (fight: BossFightState, id: BoonId): BoonPreview | null => {
  const n = stacksOf(fight.boons, id);
  const plus = { ...fight.boons, [id]: n + 1 };
  switch (id) {
    case "armor": {
      const bite = fight.plan.rules.biteDamage;
      const cut = (stacks: number) => Math.max(1, Math.round(bite * (1 - BOON.armorCut) ** stacks));
      return { from: cut(n), to: cut(n + 1) };
    }
    case "shield":
      return { from: fight.shieldCharges, to: fight.shieldCharges + BOON.shieldCharges };
    case "vitality":
      return { from: fight.playerMaxHp, to: fight.playerMaxHp + BOON.vitalityHp };
    case "bandage":
      return { from: fight.playerHp, to: Math.min(fight.playerMaxHp, fight.playerHp + BOON.bandageHp) };
    case "lifesteal":
      return { from: n * BOON.lifestealHp, to: (n + 1) * BOON.lifestealHp };
    case "thorns": {
      const hit = (stacks: number) => Math.round(fight.bossMaxHp * BOON.thornsShare * stacks);
      return { from: hit(n), to: hit(n + 1) };
    }
    case "secondWind":
      return { from: fight.forgivenLeft, to: fight.forgivenLeft + BOON.secondWindMisses };
    case "steadyHand":
      return { from: parryStreak(fight), to: BOON.steadyHandStreak };
    case "blade": {
      const overdrive = stacksOf(fight.boons, "overdrive");
      return {
        from: fullStrike(fight.chargeMax, n, overdrive),
        to: fullStrike(fight.chargeMax, n + 1, overdrive),
      };
    }
    case "lightBlade":
      return { from: fight.chargeMax, to: chargeMaxFor(fight.plan, plus) };
    case "precision":
      return { from: 4, to: BOON.precisionPoints };
    case "momentum":
      return { from: MAX_MULTIPLIER_STREAK, to: BOON.momentumStreak };
    case "exploit":
      return { from: `×${WEAK_SPOT_CHARGE}`, to: `×${BOON.exploitCharge}` };
    case "slowDown":
    case "overdrive":
      return { from: phaseBpm(fight), to: phaseBpm({ ...fight, boons: plus }) };
    default:
      return null;
  }
};
