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

/** A private roadmap is its owner's alone; a public one is everybody's to read. */
export const isRoadmapVisibleTo = (
  roadmap: Pick<Roadmap, "visibility" | "userId">,
  viewerUid: string | null | undefined,
): boolean =>
  visibilityOf(roadmap) === "public" ||
  (!!viewerUid && roadmap.userId === viewerUid);
