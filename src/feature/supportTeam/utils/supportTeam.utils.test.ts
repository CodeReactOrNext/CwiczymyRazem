import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { describe, expect, it } from "vitest";

import {
  buildSupportMemberIndex,
  DEFAULT_SUPPORT_TITLE,
  getSupportLabel,
  getSupportTooltip,
  sortSupporterWall,
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
    expect(getSupportLabel(member("a", "Patron"))).toBe("Patron");
  });

  it("names the donor, not a helpdesk role", () => {
    expect(DEFAULT_SUPPORT_TITLE).toBe("Supporter");
  });
});

describe("getSupportTooltip", () => {
  it("spells out that the badge is about donating", () => {
    expect(getSupportTooltip(member("a"))).toBe(
      "Supporter — supports Riff Quest with a donation",
    );
    expect(getSupportTooltip(member("a", "Patron"))).toBe(
      "Patron — supports Riff Quest with a donation",
    );
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

describe("sortSupporterWall", () => {
  const withLevel = (uid: string, lvl: number | null): SupportTeamMember => ({
    ...member(uid),
    lvl,
  });

  it("puts the highest level first", () => {
    const sorted = sortSupporterWall([
      withLevel("a", 3),
      withLevel("b", 12),
      withLevel("c", 7),
    ]);
    expect(sorted.map(({ uid }) => uid)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by name and keeps unknown levels at the back", () => {
    const sorted = sortSupporterWall([
      withLevel("zoe", null),
      withLevel("bob", 5),
      withLevel("amy", 5),
    ]);
    expect(sorted.map(({ uid }) => uid)).toEqual(["amy", "bob", "zoe"]);
  });

  it("leaves the input array alone", () => {
    const members = [withLevel("a", 1), withLevel("b", 9)];
    sortSupporterWall(members);
    expect(members.map(({ uid }) => uid)).toEqual(["a", "b"]);
  });
});
