import { useTranslation } from "react-i18next";

import ToolTip from "components/ToolTip";

import {
  achievementList,
  achievementsData,
} from "assets/achievements/achievementsData";
import { achievementsRarity } from "assets/achievements/achievementsRarity";

const Achievement = ({ id }: { id: achievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsData.find((achiv) => achiv.id === id);
  const { Icon, rarity, description } = achievementData!;

  return (
    <>
      <ToolTip />
      <Icon
        className='text-md cursor-help	drop-shadow-md'
        color={achievementsRarity[rarity].color}
        data-tip={t(description)}
      />
    </>
  );
};

export default Achievement;
