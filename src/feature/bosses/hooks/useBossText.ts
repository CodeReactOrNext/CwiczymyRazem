import { useTranslation } from "hooks/useTranslation";
import type { Translate } from "lib/i18n/translate";
import { useMemo } from "react";

import type { BossDefinition } from "../types/boss.types";

/**
 * Boss names keep their English in the data and are looked up by id at
 * render. The rest of the copy is shared, and a boss may word any of it its
 * own way under `bosses.<id>` — the colossus quakes where the spider slams —
 * so `t` tries the boss's own key before the shared one.
 */
export const useBossText = (boss: BossDefinition) => {
  const { t: shared } = useTranslation("bosses");
  const t = useMemo<Translate>(() => {
    const prefix = `bosses.${boss.id}.`;
    return (key, options) => {
      const own = shared(prefix + key, options);
      return own === prefix + key ? shared(key, options) : own;
    };
  }, [shared, boss.id]);
  return {
    t,
    bossName: shared(`bosses.${boss.id}.name`, boss.name),
    bossTitle: shared(`bosses.${boss.id}.title`, boss.title),
  };
};
