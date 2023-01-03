import ToolTip from "components/ToolTip";
import {
  AchievementList,
  achievementsData,
} from "assets/achievements/achievementsData";
import { achievementsRarity } from "assets/achievements/achievementsRarity";
import { useTranslation } from "react-i18next";



const Achievement = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsData.find((achiv) => achiv.id === id);

  const { Icon, rarity, description } = achievementData!;
  return (
    <>
      <ToolTip />
      <Icon
        className='cursor-help drop-shadow-md	'
        color={achievementsRarity[rarity].color}
        data-tip={t(description )}
      />
    </>
  );
};

export default Achievement;
