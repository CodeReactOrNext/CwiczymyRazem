import type { IconType } from "react-icons";
import {
  GiAngryEyes,
  GiClawSlashes,
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
  GiRegeneration,
  GiSoundWaves,
  GiSpiderWeb,
  GiStoneWall,
  GiTargetArrows,
  GiTheaterCurtains,
  GiTornado,
  GiWhirlwind,
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

/** The same threats as the colossus wears them — fists, dust, mending stone, petrify — and the changeling. */
const BOSS_ICONS: Partial<Record<BossId, Partial<Record<ThreatIconId, IconType>>>> = {
  colossus: {
    bites: GiPunch,
    weak_spots: GiCrackedShield,
    venom: GiDustCloud,
    regen: GiStoneWall,
    frenzy: GiEarthCrack,
    web: GiMedusaHead,
  },
  // Claws, rushes, dissonance, reshaping, whirlwinds and the curtain drawn.
  changeling: {
    bites: GiClawSlashes,
    quake: GiWhirlwind,
    venom: GiSoundWaves,
    regen: GiRegeneration,
    frenzy: GiTornado,
    web: GiTheaterCurtains,
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
