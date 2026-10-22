// @vitest-environment jsdom
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";

import {
  clearQuerySnapshot,
  isPersistedQueryKey,
  restoreQuerySnapshot,
  writeQuerySnapshot,
} from "./querySnapshot";

const layoutKey = ["dashboard-layout", "uid-1"];

describe("querySnapshot", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists only listed keys", () => {
    expect(isPersistedQueryKey(["dashboard-layout", "uid-1"])).toBe(true);
    expect(isPersistedQueryKey(["arsenal", "inventory"])).toBe(true);
    expect(isPersistedQueryKey(["arsenal", "user", "uid-1"])).toBe(false);
    expect(isPersistedQueryKey(["user-songs", "uid-1"])).toBe(false);
  });

  it("restores saved data with its original fetch time, so it refetches", () => {
    const source = new QueryClient();
    source.setQueryData(layoutKey, { widgets: ["daily-quests"] }, { updatedAt: 1_000 });
    source.setQueryData(["user-songs", "uid-1"], [{ id: "s1" }]);
    writeQuerySnapshot(source, "uid-1", 2_000);

    const target = new QueryClient();
    restoreQuerySnapshot(target, "uid-1", 3_000);

    expect(target.getQueryData(layoutKey)).toEqual({ widgets: ["daily-quests"] });
    expect(target.getQueryState(layoutKey)?.dataUpdatedAt).toBe(1_000);
    expect(target.getQueryData(["user-songs", "uid-1"])).toBeUndefined();
  });

  it("never restores another player's copy", () => {
    const source = new QueryClient();
    source.setQueryData(layoutKey, { widgets: [] }, { updatedAt: 1_000 });
    writeQuerySnapshot(source, "uid-1", 2_000);

    const target = new QueryClient();
    restoreQuerySnapshot(target, "uid-2", 3_000);

    expect(target.getQueryData(layoutKey)).toBeUndefined();
  });

  it("does not overwrite data fetched after the copy was saved", () => {
    const source = new QueryClient();
    source.setQueryData(layoutKey, { widgets: ["old"] }, { updatedAt: 1_000 });
    writeQuerySnapshot(source, "uid-1", 2_000);

    const target = new QueryClient();
    target.setQueryData(layoutKey, { widgets: ["fresh"] }, { updatedAt: 5_000 });
    restoreQuerySnapshot(target, "uid-1", 6_000);

    expect(target.getQueryData(layoutKey)).toEqual({ widgets: ["fresh"] });
  });

  it("forgets the copy on clear", () => {
    const source = new QueryClient();
    source.setQueryData(layoutKey, { widgets: [] }, { updatedAt: 1_000 });
    writeQuerySnapshot(source, "uid-1", 2_000);
    clearQuerySnapshot();

    const target = new QueryClient();
    restoreQuerySnapshot(target, "uid-1", 3_000);

    expect(target.getQueryData(layoutKey)).toBeUndefined();
  });
});
