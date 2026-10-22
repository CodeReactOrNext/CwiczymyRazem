import type { IconType } from "react-icons";
import {
  GiAngryEyes,
  GiCrackedShield,
  GiDustCloud,
  GiEarthCrack,
  GiFangs,
  GiHammerDrop,
  GiHealing,
  GiMedusaHead,
  GiPoisonBottle,
  GiPunch,
  GiQuakeStomp,
  GiSpiderWeb,
  GiStoneWall,
  GiTargetArrows,
} from "react-icons/gi";

import type { BossId } from "../types/boss.types";
import type { ThreatId } from "../utils/phaseChanges";

type ThreatIconId = ThreatId | "bites";

const THREAT_ICONS: Record<ThreatIconId, IconType> = {
  bites: GiFangs,
  slams: GiHammerDrop,
  quake: GiQuakeStomp,
  weak_spots: GiTargetArrows,
  venom: GiPoisonBottle,
  regen: GiHealing,
  frenzy: GiAngryEyes,
  web: GiSpiderWeb,
};

/** The same threats as the colossus wears them: fists, dust, mending stone, petrify. */
const BOSS_ICONS: Partial<Record<BossId, Partial<Record<ThreatIconId, IconType>>>> = {
  colossus: {
    bites: GiPunch,
    weak_spots: GiCrackedShield,
    venom: GiDustCloud,
    regen: GiStoneWall,
    frenzy: GiEarthCrack,
    web: GiMedusaHead,
  },
};

export const ThreatIcon = ({
  id,
  boss,
  className,
}: {
  id: ThreatIconId;
  boss?: BossId;
  className?: string;
}) => {
  const Icon = (boss && BOSS_ICONS[boss]?.[id]) ?? THREAT_ICONS[id];
  return <Icon aria-hidden className={className} />;
};
