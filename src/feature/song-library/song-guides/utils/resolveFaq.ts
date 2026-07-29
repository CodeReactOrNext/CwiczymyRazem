import { getSongTier } from "feature/songs/utils/getSongTier";

import type { GuideFaqEntry, GuideLiveData, SongGuide } from "../types";

/**
 * FAQ copy uses {{difficulty}} / {{tier}} placeholders instead of a written-out
 * number so answers stay accurate as community ratings change, while still
 * reading as self-contained facts once resolved — required for featured
 * snippets, AI Overviews, and the FAQPage JSON-LD, all of which strip an
 * answer out of the page's surrounding context (a reference like "see the
 * badge above" is meaningless there).
 */
export const resolveGuideFaq = (
  guide: SongGuide,
  liveData: GuideLiveData
): GuideFaqEntry[] => {
  const difficulty = liveData.song?.avgDifficulty || guide.editorial.difficulty;
  const tier = getSongTier(difficulty);
  const difficultyStr = difficulty.toFixed(1);

  return guide.faq.map((entry) => ({
    title: entry.title,
    message: entry.message
      .replaceAll("{{difficulty}}", difficultyStr)
      .replaceAll("{{tier}}", tier.label),
  }));
};
