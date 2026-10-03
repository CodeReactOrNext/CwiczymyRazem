import type {
  RoadmapIdea,
  RoadmapIdeaStatus,
} from "feature/supporterPanel/types/supporterPanel.types";

export type IdeaGroupKey = "open" | "shipped" | "declined";

export interface IdeaGroup {
  key: IdeaGroupKey;
  title: string;
  ideas: RoadmapIdea[];
}

const GROUP_OF: Record<RoadmapIdeaStatus, IdeaGroupKey> = {
  open: "open",
  planned: "open",
  in_progress: "open",
  shipped: "shipped",
  declined: "declined",
};

const GROUPS: { key: IdeaGroupKey; title: string }[] = [
  { key: "open", title: "Open" },
  { key: "shipped", title: "Shipped" },
  { key: "declined", title: "Not doing" },
];

/**
 * Splits the board into what can still be backed and what is already decided.
 * Each group keeps the board's own ranking; empty groups are left out.
 */
export const groupIdeas = (ideas: RoadmapIdea[]): IdeaGroup[] =>
  GROUPS.map(({ key, title }) => ({
    key,
    title,
    ideas: ideas.filter((idea) => GROUP_OF[idea.status] === key),
  })).filter((group) => group.ideas.length > 0);
