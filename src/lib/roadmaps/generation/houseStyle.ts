import staticRoadmaps from "data/roadmaps";
import type { StaticRoadmapStep } from "feature/aiCoach/types/roadmap.types";

/**
 * Two steps from the curated roadmaps, quoted verbatim as the bar every
 * generated description has to clear. Picked by id so the exemplar is the
 * hand-edited text, not whatever the generator wrote first.
 */
const EXEMPLAR_IDS = {
  /** Rhythm Guitar Basics — "Rests, long notes and clean stops": a conceptual skill. */
  conceptual: "bceb8c51-4e24-44fd-9d40-32e0e7bd6749",
  /** Hendrix — "Thumb over the neck": a physical skill. */
  physical: "2036bb36",
} as const;

const allSteps = staticRoadmaps.flatMap((roadmap) =>
  roadmap.phases.flatMap((phase) => phase.steps),
);

const findExemplar = (idPrefix: string): StaticRoadmapStep | undefined =>
  allSteps.find((step) => step.id.startsWith(idPrefix));

export interface Exemplar {
  title: string;
  description: string;
  successCriteria: string;
  sessionsRequired: number;
}

const toExemplar = (step: StaticRoadmapStep): Exemplar => ({
  title: step.title,
  description: step.description,
  successCriteria: step.successCriteria,
  sessionsRequired: step.sessionsRequired,
});

/** The exemplars that exist in the repo right now, in a fixed order. */
export const houseStyleExemplars = (): Exemplar[] =>
  [EXEMPLAR_IDS.physical, EXEMPLAR_IDS.conceptual]
    .map(findExemplar)
    .filter((step): step is StaticRoadmapStep => !!step)
    .map(toExemplar);

export const renderExemplars = (): string =>
  houseStyleExemplars()
    .map(
      (exemplar, index) =>
        `EXAMPLE ${index + 1} — "${exemplar.title}" (sessionsRequired: ${exemplar.sessionsRequired})
description:
${exemplar.description}
successCriteria:
${exemplar.successCriteria}`,
    )
    .join("\n\n");
