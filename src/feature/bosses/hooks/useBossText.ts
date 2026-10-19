import { useTranslation } from "hooks/useTranslation";

import type { BossDefinition } from "../types/boss.types";

/** Boss names keep their English in the data and are looked up by id at render. */
export const useBossText = (boss: BossDefinition) => {
  const { t } = useTranslation("bosses");
  return {
    t,
    bossName: t(`bosses.${boss.id}.name`, boss.name),
    bossTitle: t(`bosses.${boss.id}.title`, boss.title),
  };
};
