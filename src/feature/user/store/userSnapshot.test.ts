// @vitest-environment jsdom
import type { StatisticsDataInterface } from "types/api.types";
import { beforeEach, describe, expect, it } from "vitest";

import {
  clearUserSnapshot,
  readUserSnapshot,
  USER_SNAPSHOT_MAX_AGE,
  writeUserSnapshot,
} from "./userSnapshot";

const snapshot = {
  userAuth: "uid-1",
  userInfo: { displayName: "Riffer" },
  currentUserStats: { points: 120, lvl: 3 } as unknown as StatisticsDataInterface,
};

describe("userSnapshot", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns what was saved for the same uid", () => {
    writeUserSnapshot(snapshot, 1_000);
    expect(readUserSnapshot("uid-1", 2_000)).toEqual(snapshot);
  });

  it("never hands one player's copy to another", () => {
    writeUserSnapshot(snapshot, 1_000);
    expect(readUserSnapshot("uid-2", 2_000)).toBeNull();
  });

  it("drops a copy older than the max age", () => {
    writeUserSnapshot(snapshot, 1_000);
    expect(readUserSnapshot("uid-1", 1_000 + USER_SNAPSHOT_MAX_AGE + 1)).toBeNull();
  });

  it("ignores a copy saved in another format", () => {
    window.localStorage.setItem(
      "rq:user-snapshot",
      JSON.stringify({ ...snapshot, v: 0, savedAt: 1_000 }),
    );
    expect(readUserSnapshot("uid-1", 2_000)).toBeNull();
  });

  it("survives garbage in storage", () => {
    window.localStorage.setItem("rq:user-snapshot", "{not json");
    expect(readUserSnapshot("uid-1")).toBeNull();
  });

  it("forgets the copy on clear", () => {
    writeUserSnapshot(snapshot, 1_000);
    clearUserSnapshot();
    expect(readUserSnapshot("uid-1", 2_000)).toBeNull();
  });
});
