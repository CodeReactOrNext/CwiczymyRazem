import { cn } from "assets/lib/utils";
import type { IconType } from "react-icons";
import {
  GiBandageRoll,
  GiBreastplate,
  GiBroadsword,
  GiBullseye,
  GiCheckedShield,
  GiCrackedShield,
  GiEyeTarget,
  GiFeather,
  GiFlame,
  GiHealthPotion,
  GiHeartPlus,
  GiLungs,
  GiOpenPalm,
  GiSnail,
  GiSpikedArmor,
  GiSprint,
  GiVampireDracula,
} from "react-icons/gi";

import type { BoonId, BoonRarity } from "../utils/boons";
import { boonDef } from "../utils/boons";

/** Game-icons art per boon — content icons, like the guild emblems. */
const BOON_ICONS: Record<BoonId, IconType> = {
  armor: GiBreastplate,
  shield: GiCheckedShield,
  vitality: GiHeartPlus,
  bandage: GiBandageRoll,
  lifesteal: GiVampireDracula,
  thorns: GiSpikedArmor,
  secondWind: GiLungs,
  steadyHand: GiOpenPalm,
  antidote: GiHealthPotion,
  clearSight: GiEyeTarget,
  blade: GiBroadsword,
  lightBlade: GiFeather,
  precision: GiBullseye,
  momentum: GiSprint,
  exploit: GiCrackedShield,
  slowDown: GiSnail,
  overdrive: GiFlame,
};

/** Rarity is the one colour a boon wears. */
export const RARITY_TEXT: Record<BoonRarity, string> = {
  common: "text-zinc-300",
  rare: "text-purple-400",
  epic: "text-amber-400",
};

export const BoonIcon = ({ id, className }: { id: BoonId; className?: string }) => {
  const Icon = BOON_ICONS[id];
  return <Icon aria-hidden className={cn(RARITY_TEXT[boonDef(id).rarity], className)} />;
};
