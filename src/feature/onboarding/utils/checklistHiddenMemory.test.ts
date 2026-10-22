// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { readChecklistMemory, writeChecklistMemory } from "./checklistHiddenMemory";

describe("checklistHiddenMemory", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("knows nothing about a player it has not seen", () => {
    expect(readChecklistMemory("uid-1")).toBeNull();
    expect(readChecklistMemory(null)).toBeNull();
  });

  it("remembers the checklist per player", () => {
    writeChecklistMemory("uid-1", true);
    writeChecklistMemory("uid-2", false);

    expect(readChecklistMemory("uid-1")).toBe("hidden");
    expect(readChecklistMemory("uid-2")).toBe("visible");
    expect(readChecklistMemory("uid-3")).toBeNull();
  });

  it("follows the checklist when it comes back", () => {
    writeChecklistMemory("uid-1", true);
    writeChecklistMemory("uid-1", false);

    expect(readChecklistMemory("uid-1")).toBe("visible");
  });
});
