import type { IconType } from "react-icons";
import {
  GiAngryEyes,
  GiFangs,
  GiHammerDrop,
  GiHealing,
  GiPoisonBottle,
  GiSpiderWeb,
  GiTargetArrows,
} from "react-icons/gi";

import type { ThreatId } from "../utils/phaseChanges";

const THREAT_ICONS: Record<ThreatId | "bites", IconType> = {
  bites: GiFangs,
  slams: GiHammerDrop,
  weak_spots: GiTargetArrows,
  venom: GiPoisonBottle,
  regen: GiHealing,
  frenzy: GiAngryEyes,
  web: GiSpiderWeb,
};

export const ThreatIcon = ({ id, className }: { id: ThreatId | "bites"; className?: string }) => {
  const Icon = THREAT_ICONS[id];
  return <Icon aria-hidden className={className} />;
};
