import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { describe, expect, it } from "vitest";

import {
  buildSupportMemberIndex,
  DEFAULT_SUPPORT_TITLE,
  getSupportLabel,
  sortSupportFirst,
} from "./supportTeam.utils";

const member = (
  uid: string,
  title: string | null = null,
): SupportTeamMember => ({
  uid,
  displayName: uid,
  avatar: null,
  title,
});

describe("getSupportLabel", () => {
  it("falls back to the generic label", () => {
    expect(getSupportLabel(member("a"))).toBe(DEFAULT_SUPPORT_TITLE);
    expect(getSupportLabel(member("a", "   "))).toBe(DEFAULT_SUPPORT_TITLE);
    expect(getSupportLabel(undefined)).toBe(DEFAULT_SUPPORT_TITLE);
  });

  it("uses the custom title when set", () => {
    expect(getSupportLabel(member("a", "Moderator"))).toBe("Moderator");
  });
});

describe("buildSupportMemberIndex", () => {
  it("indexes members by uid", () => {
    const index = buildSupportMemberIndex([member("a"), member("b", "Mod")]);
    expect(index.get("b")?.title).toBe("Mod");
    expect(index.has("c")).toBe(false);
  });
});

describe("sortSupportFirst", () => {
  it("moves support members to the front, keeping the rest in order", () => {
    const users = [{ uid: "a" }, { uid: "b" }, { uid: "c" }, { uid: "d" }];
    const isSupport = (uid: string) => uid === "b" || uid === "d";

    expect(sortSupportFirst(users, isSupport).map((u) => u.uid)).toEqual([
      "b",
      "d",
      "a",
      "c",
    ]);
  });

  it("does not mutate the input", () => {
    const users = [{ uid: "a" }, { uid: "b" }];
    sortSupportFirst(users, (uid) => uid === "b");
    expect(users.map((u) => u.uid)).toEqual(["a", "b"]);
  });
});
