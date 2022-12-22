import ToolTip from "components/ToolTip";
import {
  AchievementsRarityType,
  achievementsRarity,
} from "data/achievementsRarity";
import { IconType } from "react-icons/lib";

interface AchievementProps extends AchievementsRarityType {
  Icon: IconType;
  description: string;
}
const Achievement = ({ Icon, rarity, description }: AchievementProps) => {
  return (
    <>
      <ToolTip />
      <Icon
        className='cursor-help '
        color={achievementsRarity[rarity].color}
        data-tip={description}
      />
    </>
  );
};

export default Achievement;
