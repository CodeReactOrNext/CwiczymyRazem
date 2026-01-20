import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { achievementsMap } from "feature/achievements/data/achievementsData";
import { achievementsRarity } from "feature/achievements/data/achievementsRarity";
import type { AchievementList } from "feature/achievements/types";
import { useTranslation } from "react-i18next";

const AchievementIcon = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsMap.get(id);
  const { Icon, rarity, description } = achievementData!;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div>
          <Icon
            className={`text-md cursor-help drop-shadow-md ${achievementsRarity[rarity].tailwindClass}`}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>{t(description as any)}</TooltipContent>
    </Tooltip>
  );
};

export default AchievementIcon;
