import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { achievementsMap } from "feature/achievements/data/achievementsData";
import { achievementsRarity } from "feature/achievements/data/achievementsRarity";
import type { AchievementList } from "feature/achievements/types";
import { useTranslation } from "hooks/useTranslation";

const AchievementIcon = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsMap.get(id);
  // The ids reaching here come out of Firestore — a user's achievement list, or a
  // log entry written months ago — so one of them naming an achievement the
  // catalog no longer defines is a data question, not an impossible state. It used
  // to be asserted away with `!`, which turned that stale id into a render crash
  // that took the whole leaderboard or logs feed down with it. Drop the icon
  // instead, exactly as AchievementCard already does.
  if (!achievementData) return null;

  const { Icon, rarity, description } = achievementData;

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
