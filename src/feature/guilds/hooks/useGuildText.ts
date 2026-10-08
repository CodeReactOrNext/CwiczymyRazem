import type { GuildCosmeticItem } from "feature/guilds/data/guildCosmetics";
import type { QuestUnit } from "feature/guilds/data/guildQuests";
import {
  describeQuest,
  formatQuestAmount,
  questAskOfEach,
  questById,
  romanNumeral,
  scaleQuest,
} from "feature/guilds/data/guildQuests";
import type { GuildQuestProgress } from "feature/guilds/types/guild.types";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

/**
 * The guild catalog — quests, chapters, kit — in the player's language.
 *
 * The API sends quest names and asks already worded, in English, because the
 * ledger stores them that way. Everything worded here is rebuilt from the
 * catalog id and the lap instead, so it can be said in any language; the
 * server's text is only the fallback for an id this build does not know.
 */
export const useGuildText = () => {
  const { t } = useTranslation("guilds");

  return useMemo(() => {
    const questName = (questId: string, fallback: string, lap = 1) => {
      const spec = questById(questId);
      if (!spec) return fallback;
      const name = t(`quests.items.${questId}.name`, spec.name);
      return lap > 1 ? `${name} ${romanNumeral(lap)}` : name;
    };

    const questBlurb = (quest: GuildQuestProgress) => {
      const spec = questById(quest.questId);
      if (!spec) return quest.blurb;
      if (quest.lap <= 1) return t(`quests.items.${spec.id}.blurb`, spec.blurb);
      const scaled = scaleQuest(spec, quest.lap);
      return describeQuest(scaled.measure, scaled.target, t);
    };

    const questAsk = (quest: GuildQuestProgress, fallback: string) => {
      const spec = questById(quest.questId);
      if (!spec) return fallback;
      return questAskOfEach(scaleQuest(spec, quest.lap), t) ?? fallback;
    };

    return {
      t,
      questName,
      questBlurb,
      questAsk,
      amount: (unit: QuestUnit, value: number) =>
        formatQuestAmount(unit, value, t),
      chapterName: (index: number, fallback: string) =>
        t(`quests.chapters.${index}.name`, fallback),
      chapterBlurb: (index: number, fallback: string) =>
        t(`quests.chapters.${index}.blurb`, fallback),
      cosmeticName: (item: Pick<GuildCosmeticItem, "id" | "name">) =>
        t(`cosmetics.items.${item.id.replace(":", "_")}.name`, item.name),
      cosmeticBlurb: (item: Pick<GuildCosmeticItem, "id" | "blurb">) =>
        t(`cosmetics.items.${item.id.replace(":", "_")}.blurb`, item.blurb),
      slotLabel: (slot: string, fallback: string) =>
        t(`cosmetics.slots.${slot}.label`, fallback),
      slotBlurb: (slot: string, fallback: string) =>
        t(`cosmetics.slots.${slot}.blurb`, fallback),
      motifGroup: (id: string, fallback: string) =>
        t(`cosmetics.motif_groups.${id}`, fallback),
      motifIcon: (key: string, fallback: string) =>
        t(`cosmetics.motif_icons.${key}`, fallback),
    };
  }, [t]);
};
