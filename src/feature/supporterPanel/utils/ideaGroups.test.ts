import type {
  RoadmapIdea,
  RoadmapIdeaStatus,
} from "feature/supporterPanel/types/supporterPanel.types";
import { describe, expect, it } from "vitest";

import { groupIdeas } from "./ideaGroups";

const idea = (id: string, status: RoadmapIdeaStatus): RoadmapIdea => ({
  id,
  title: id,
  description: "",
  status,
  icon: "idea",
  authorUid: "u",
  authorName: "u",
  authorAvatar: null,
  voteCount: 0,
  backerCount: 0,
  backers: [],
  createdAt: "2026-01-01",
});

const ids = (ideas: RoadmapIdea[]) => ideas.map((item) => item.id);

describe("groupIdeas", () => {
  it("keeps planned and in-progress ideas with the open ones", () => {
    const groups = groupIdeas([
      idea("a", "open"),
      idea("b", "planned"),
      idea("c", "in_progress"),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("open");
    expect(ids(groups[0].ideas)).toEqual(["a", "b", "c"]);
  });

  it("orders groups open, shipped, not doing and keeps the board ranking", () => {
    const groups = groupIdeas([
      idea("s1", "shipped"),
      idea("d1", "declined"),
      idea("o1", "open"),
      idea("s2", "shipped"),
      idea("o2", "planned"),
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      "open",
      "shipped",
      "declined",
    ]);
    expect(ids(groups[0].ideas)).toEqual(["o1", "o2"]);
    expect(ids(groups[1].ideas)).toEqual(["s1", "s2"]);
    expect(ids(groups[2].ideas)).toEqual(["d1"]);
  });

  it("leaves out empty groups", () => {
    expect(
      groupIdeas([idea("s", "shipped")]).map((group) => group.key),
    ).toEqual(["shipped"]);
    expect(groupIdeas([])).toEqual([]);
  });
});
