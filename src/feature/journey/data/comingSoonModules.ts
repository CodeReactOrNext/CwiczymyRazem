import type { RoadmapTier } from "feature/roadmap/data/roadmap.data";
import { ROADMAP_TIERS } from "feature/roadmap/data/roadmap.data";

/** A Journey module that is on the public roadmap but not built yet. */
export interface ComingSoonModule {
  id: string;
  title: string;
  subtitle: string;
}

const JOURNEY_TIER_PREFIX = "journey-";

/**
 * The Journey modules still waiting on the roadmap, in roadmap order, so the
 * module list promises exactly what /roadmap does and nothing else.
 * "Journey: Chords & Triads" becomes "Chords & Triads", and the description
 * loses its "A new Journey module:" lead-in.
 */
export const getComingSoonModules = (
  tiers: readonly RoadmapTier[] = ROADMAP_TIERS,
): ComingSoonModule[] =>
  tiers
    .filter((tier) => tier.id.startsWith(JOURNEY_TIER_PREFIX) && !tier.done)
    .map((tier) => {
      const subtitle = (tier.description ?? "")
        .replace(/^A new Journey module:\s*/i, "")
        .trim();
      return {
        id: tier.id,
        title: tier.label.replace(/^Journey:\s*/i, "").trim(),
        subtitle: subtitle.charAt(0).toUpperCase() + subtitle.slice(1),
      };
    });
