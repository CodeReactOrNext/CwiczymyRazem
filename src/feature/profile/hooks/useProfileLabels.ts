import type { AchievementList } from "feature/achievements/types";
import { RARITY_LABELS } from "feature/profile/components/TrophyCase";
import { ACHIEVEMENT_TITLES } from "feature/profile/data/achievementTitles";
import type { ProfileBannerDefinition } from "feature/profile/data/profileBanners";
import type { ProfileSectionDefinition } from "feature/profile/data/profileSectionCatalog";
import {
  PROFILE_ACCENT_COLORS,
  PROFILE_BADGE_LABELS,
  PROFILE_FACT_LABELS,
} from "feature/profile/data/profileSectionCatalog";
import type {
  ProfileAccent,
  ProfileBadgeId,
  ProfileFactId,
} from "feature/profile/types/profileLayout.types";
import { ACCENT_UNLOCKS } from "feature/profile/utils/profileLayout";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

type Rarity = keyof typeof RARITY_LABELS;

/**
 * The profile's catalogues (sections, facts, accents, banners, titles) are
 * defined in English next to their logic; this resolves each one in the
 * reader's language, falling back to the English definition.
 */
export const useProfileLabels = () => {
  const { t } = useTranslation("profile");
  return useMemo(
    () => ({
      t,
      sectionTitle: (definition: ProfileSectionDefinition) =>
        t(`layout.sections.${definition.id}.title`, definition.title),
      sectionDescription: (definition: ProfileSectionDefinition) =>
        t(`layout.sections.${definition.id}.description`, definition.description),
      fact: (id: ProfileFactId) =>
        t(`layout.facts.${id}`, PROFILE_FACT_LABELS[id]),
      badge: (id: ProfileBadgeId) =>
        t(`layout.badges.${id}`, PROFILE_BADGE_LABELS[id]),
      accent: (id: ProfileAccent) =>
        t(`layout.accents.${id}`, PROFILE_ACCENT_COLORS[id].label),
      accentRequirement: (id: ProfileAccent) =>
        t(`layout.accent_unlocks.${id}`, ACCENT_UNLOCKS[id].requirement),
      bannerLabel: (banner: ProfileBannerDefinition) =>
        t(`layout.banners.${banner.id}.label`, banner.label),
      bannerRequirement: (banner: ProfileBannerDefinition) =>
        t(`layout.banners.${banner.id}.requirement`, banner.requirement),
      rarity: (rarity: Rarity) =>
        t(`layout.rarity.${rarity}`, RARITY_LABELS[rarity]),
      achievementTitle: (id: AchievementList) =>
        t(`layout.titles.${id}`, ACHIEVEMENT_TITLES[id]),
    }),
    [t],
  );
};
