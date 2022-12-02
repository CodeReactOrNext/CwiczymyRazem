import { IconType } from "react-icons/lib";
import ReactTooltip from "react-tooltip";

interface AchievementProps {
  Icon: IconType;
  rarity: string;
  description: string;
}
const Achievement = ({ Icon, rarity, description }: AchievementProps) => {
  return (
    <>
      <ReactTooltip />
      <Icon color={rarity} data-tip={description} />
    </>
  );
};

export default Achievement;
