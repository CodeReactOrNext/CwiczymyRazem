import ToolTip from "components/ToolTip";
import {
  achievementsRarityType,
  achievementsRarity,
} from "constants/achievementsRarity";
import { IconType } from "react-icons/lib";

interface AchievementProps extends achievementsRarityType {
  Icon: IconType;
  description: string;
}
const Achievement = ({ Icon, rarity, description }: AchievementProps) => {
  return (
    <>
      <ToolTip />
      <Icon color={achievementsRarity[rarity].color} data-tip={description} />
    </>
  );
};

export default Achievement;
