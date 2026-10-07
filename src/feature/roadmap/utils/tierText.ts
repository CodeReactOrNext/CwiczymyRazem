import type { RoadmapTier } from "feature/roadmap/data/roadmap.data";
import type { Translate } from "lib/i18n/translate";
import { translateOr } from "lib/i18n/translate";

/** Content tiers repeat the same few labels, so they translate by shape, not by id. */
const CONTENT_LABEL = /^\+(\d+) New (Exercises?|Guitars & Pedals)$/;

export const tierLabel = (tier: RoadmapTier, t?: Translate): string => {
  const match = tier.kind === "content" ? tier.label.match(CONTENT_LABEL) : null;
  if (match) {
    const count = Number(match[1]);
    const key = match[2].startsWith("Guitars")
      ? "gear"
      : count === 1
        ? "exercise_one"
        : "exercises";
    return translateOr(t, `supporter:tiers.content.${key}`, tier.label, { count });
  }
  return translateOr(t, `supporter:tiers.${tier.id}.label`, tier.label);
};

export const tierDescription = (
  tier: RoadmapTier,
  t?: Translate,
): string | undefined =>
  tier.description
    ? translateOr(t, `supporter:tiers.${tier.id}.description`, tier.description)
    : undefined;
