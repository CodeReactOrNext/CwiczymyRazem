import type { StudioBoardStat } from "feature/guilds/data/guildStudio";
import {
  STUDIO_ITEMS,
  STUDIO_ROOM_LEVELS,
} from "feature/guilds/data/guildStudio";
import { awardNumber } from "feature/guilds/utils/guildStudio.utils";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

/**
 * The studio catalog — pieces, their levels, rooms, the board's categories —
 * in the player's language, keyed by id under `studio.*` in the guilds
 * namespace. The English in the catalog is only the fallback for an id the
 * locale file does not have yet.
 */
export const useStudioText = () => {
  const { t, i18n } = useTranslation("guilds");
  const locale = i18n.language;

  return useMemo(() => {
    const itemOf = (id: string) => STUDIO_ITEMS.find((item) => item.id === id);
    return {
      t,
      itemName: (id: string) =>
        t(`studio.items.${id}.name`, itemOf(id)?.name ?? id),
      levelName: (id: string, level: number) =>
        t(
          `studio.items.${id}.l${level}`,
          itemOf(id)?.levels[level - 1] ?? String(level),
        ),
      roomName: (level: number) =>
        t(`studio.rooms.r${level}`, STUDIO_ROOM_LEVELS[level - 1] ?? ""),
      awardTitle: (stat: StudioBoardStat) => t(`studio.awards.${stat}`),
      awardValue: (stat: StudioBoardStat, value: number) =>
        t(`studio.values.${stat}`, {
          value: awardNumber(stat, value, locale),
          count: Math.round(value),
        }),
    };
  }, [t, locale]);
};

export type StudioText = ReturnType<typeof useStudioText>;
