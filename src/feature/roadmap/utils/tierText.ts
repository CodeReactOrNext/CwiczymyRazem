import type { RoadmapTier } from "feature/roadmap/data/roadmap.data";
import type { Translate } from "lib/i18n/translate";
import { translateOr } from "lib/i18n/translate";

/** Content tiers repeat the same few labels, so they translate by shape, not by id. */
const CONTENT_LABEL =
  /^\+(\d+) New (Exercises?|Guitars & Pedals|Achievements)$/;

const baseLabel = (tier: RoadmapTier, t?: Translate): string => {
  const match =
    tier.kind === "content" ? tier.label.match(CONTENT_LABEL) : null;
  if (match) {
    const count = Number(match[1]);
    const key = match[2].startsWith("Guitars")
      ? "gear"
      : match[2] === "Achievements"
        ? "achievements"
        : count === 1
          ? "exercise_one"
          : "exercises";
    return translateOr(t, `supporter:tiers.content.${key}`, tier.label, {
      count,
    });
  }
  return translateOr(t, `supporter:tiers.${tier.id}.label`, tier.label);
};

/** "+3 New Exercises: Chord Changes" — the topic is what tells two packs apart. */
export const tierLabel = (tier: RoadmapTier, t?: Translate): string => {
  const label = baseLabel(tier, t);
  if (!tier.topic) return label;
  return `${label}: ${translateOr(t, `supporter:tiers.${tier.id}.topic`, tier.topic)}`;
};

export const tierDescription = (
  tier: RoadmapTier,
  t?: Translate,
): string | undefined =>
  tier.description
    ? translateOr(t, `supporter:tiers.${tier.id}.description`, tier.description)
    : undefined;
