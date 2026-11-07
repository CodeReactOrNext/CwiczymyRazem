import { describe, expect, it } from "vitest";

import { parseGuildTab } from "./guildTab";

describe("parseGuildTab", () => {
  it("opens the tab the link names", () => {
    expect(parseGuildTab("quests")).toBe("quests");
  });

  it("falls back to the guild list for a missing or unknown tab", () => {
    expect(parseGuildTab(undefined)).toBe("browse");
    expect(parseGuildTab("treasury")).toBe("browse");
    expect(parseGuildTab(["quests", "chat"])).toBe("browse");
  });
});
