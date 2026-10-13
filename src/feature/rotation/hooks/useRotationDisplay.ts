import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import { Bookmark, Dumbbell, Music, Target } from "lucide-react";
import { useCallback } from "react";
import type { IconType } from "react-icons";

import { EXERCISES_BY_ID, SKILLS_BY_ID } from "../data/rotationCatalog";
import type { ItemFreshness, RotationItem } from "../types/rotation.types";
import { linkLabel } from "../utils/rotation.utils";

export interface RotationItemDisplay {
  title: string;
  subtitle: string;
  coverUrl?: string;
  Icon: IconType | LucideIcon;
}

/** Names, icons and "last played" wording for rotation items, in the player's language. */
export const useRotationDisplay = () => {
  const { t } = useTranslation(["rotation", "skills", "common"]);
  const localizeExercise = useLocalizeExercise();

  const skillName = useCallback(
    (skillId: string) => t(`skills:skills.${skillId}.name`),
    [t],
  );

  const describe = useCallback(
    (item: RotationItem): RotationItemDisplay => {
      if (item.type === "song") {
        return {
          title: item.title ?? "",
          subtitle: item.artist ?? t("types.song"),
          coverUrl: item.coverUrl,
          Icon: Music,
        };
      }

      if (item.type === "custom") {
        return {
          title: item.title ?? "",
          subtitle:
            item.note || (item.link ? linkLabel(item.link) : t("types.custom")),
          Icon: Bookmark,
        };
      }

      if (item.type === "skill") {
        return {
          title: skillName(item.id),
          subtitle: t("row.skill_hint"),
          Icon: SKILLS_BY_ID.get(item.id)?.icon ?? Target,
        };
      }

      const exercise = EXERCISES_BY_ID.get(item.id);
      const skillId = exercise?.relatedSkills[0];
      return {
        title: exercise ? localizeExercise(exercise).title : item.id,
        subtitle: skillId ? skillName(skillId) : t("types.exercise"),
        Icon: (skillId && SKILLS_BY_ID.get(skillId)?.icon) || Dumbbell,
      };
    },
    [localizeExercise, skillName, t],
  );

  const playedLabel = useCallback(
    (freshness: ItemFreshness) => {
      if (freshness.lastPracticedAt === null) return t("days.never");
      if (freshness.days === 0) return t("days.today");
      if (freshness.days === 1) return t("days.yesterday");
      return t("days.ago", { count: freshness.days });
    },
    [t],
  );

  return { describe, playedLabel, skillName, t };
};
