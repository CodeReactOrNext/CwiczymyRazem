import type {
  Roadmap,
  RoadmapVisibility,
} from "feature/aiCoach/types/roadmap.types";
import {
  ROADMAP_GENERATION_COST,
  ROADMAP_PRIVATE_GENERATION_COST,
} from "feature/supporterPanel/constants/supporterPanel.constants";

export const isRoadmapVisibility = (
  value: unknown,
): value is RoadmapVisibility => value === "public" || value === "private";

/** Roadmaps written before the choice existed were always on the board. */
export const visibilityOf = (
  roadmap: Pick<Roadmap, "visibility">,
): RoadmapVisibility => roadmap.visibility ?? "public";

/**
 * What generating a roadmap costs: the public price, or the private one for a
 * roadmap the community never gets to see. Priced here, on the server's side
 * of the line, so the card and the wallet always agree.
 */
export const roadmapGenerationCost = (visibility: RoadmapVisibility): number =>
  visibility === "private"
    ? ROADMAP_PRIVATE_GENERATION_COST
    : ROADMAP_GENERATION_COST;

/**
 * Whether every step has its text. A roadmap the player's assistant writes
 * (`source: "mcp"`) is saved as a plan first and filled in afterwards, so a
 * public one would otherwise sit on the board half empty.
 */
export const isRoadmapWritten = (roadmap: Pick<Roadmap, "phases">): boolean =>
  (roadmap.phases ?? []).every((phase) =>
    (phase.steps ?? []).every(
      (step) => !!step.description?.trim() && !!step.successCriteria?.trim(),
    ),
  );

/**
 * A private roadmap is its owner's alone; a public one is everybody's to read
 * — once it is written. Until then a public roadmap from an assistant is
 * still only its owner's.
 */
export const isRoadmapVisibleTo = (
  roadmap: Pick<Roadmap, "visibility" | "userId"> &
    Partial<Pick<Roadmap, "source" | "phases">>,
  viewerUid: string | null | undefined,
): boolean =>
  (!!viewerUid && roadmap.userId === viewerUid) ||
  (visibilityOf(roadmap) === "public" &&
    (roadmap.source !== "mcp" ||
      isRoadmapWritten({ phases: roadmap.phases ?? [] })));
