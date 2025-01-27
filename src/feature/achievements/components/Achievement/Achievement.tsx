import { ToolTip } from "components/UI";
import type { AchievementList } from "feature/achievements/achievementsData";
import { achievementsData } from "feature/achievements/achievementsData";
import { achievementsRarity } from "feature/achievements/achievementsRarity";
import { useTranslation } from "react-i18next";

const Achievement = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsData.find((achiv) => achiv.id === id);
  const { Icon, rarity, description } = achievementData!;

  return (
    <>
      <ToolTip />
      <div data-tip={t(description)}>
        <Icon
          className='text-md cursor-help	drop-shadow-md'
          color={achievementsRarity[rarity].color}
        />
      </div>
    </>
  );
};

export default Achievement;
