import ToolTip from "components/ToolTip";
import { AchievementList, achievements } from "data/achievements";
import { achievementsRarity } from "data/achievementsRarity";

const Achievement = ({ id }: { id: AchievementList }) => {
  const achievementData = achievements.find((achiv) => achiv.id === id);

  const { Icon, rarity, description } = achievementData!;
  return (
    <>
      <ToolTip />
      <Icon
        className='cursor-help drop-shadow-md	'
        color={achievementsRarity[rarity].color}
        data-tip={description}
      />
    </>
  );
};

export default Achievement;
