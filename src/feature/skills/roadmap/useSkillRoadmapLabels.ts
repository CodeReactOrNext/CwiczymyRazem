import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

import type { RoadmapBranchConfig, RoadmapTierConfig } from "./skillRoadmap.data";

/**
 * The roadmap's tier and branch names keep their English in the data (tests and
 * the layout read it); this translates them at render, keyed by id.
 */
export const useSkillRoadmapLabels = () => {
  const { t } = useTranslation("skills");

  return useMemo(
    () => ({
      t,
      tierTitle: (tier: Pick<RoadmapTierConfig, "id" | "title">) =>
        t(`roadmap.tiers.${tier.id}.title`, tier.title),
      tierSubtitle: (tier: Pick<RoadmapTierConfig, "id" | "subtitle">) =>
        t(`roadmap.tiers.${tier.id}.subtitle`, tier.subtitle),
      branchLabel: (branch: Pick<RoadmapBranchConfig, "id" | "label">) =>
        t(`roadmap.branches.${branch.id}`, branch.label),
    }),
    [t],
  );
};
