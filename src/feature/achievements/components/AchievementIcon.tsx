import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import type { AchievementList } from "feature/achievements/types";
import { achievementsData } from "feature/achievements/data/achievementsData";
import { achievementsRarity } from "feature/achievements/data/achievementsRarity";
import { useTranslation } from "react-i18next";

const AchievementIcon = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsData.find((achiv) => achiv.id === id);
  const { Icon, rarity, description } = achievementData!;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div>
          <Icon
            className='text-md cursor-help drop-shadow-md'
            color={achievementsRarity[rarity].color}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>{t(description as any)}</TooltipContent>
    </Tooltip>
  );
};

export default AchievementIcon;
