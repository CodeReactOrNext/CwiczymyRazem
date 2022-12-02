import {
  achievementsRarityType,
  achievementsRarity,
} from "constants/achievementsRarity";

import { IconType } from "react-icons/lib";
import ReactTooltip from "react-tooltip";

interface AchievementProps extends achievementsRarityType {
  Icon: IconType;
  description: string;
}
const Achievement = ({ Icon, rarity, description }: AchievementProps) => {
  return (
    <>
      <ReactTooltip />
      <Icon color={achievementsRarity[rarity].color} data-tip={description} />
    </>
  );
};

export default Achievement;
