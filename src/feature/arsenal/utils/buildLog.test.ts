import { describe, expect, it } from "vitest";

import { appendBuildLog, BUILD_LOG_LIMIT, readBuildLog } from "./buildLog";

describe("readBuildLog", () => {
  it("reads legacy bare strings as undated entries", () => {
    expect(readBuildLog(["Hand-wound pickups", { label: "Bone nut", at: 5 }]))
      .toEqual([
        { label: "Hand-wound pickups" },
        { label: "Bone nut", at: 5 },
      ]);
  });

  it("treats a missing log as empty", () => {
    expect(readBuildLog(undefined)).toEqual([]);
  });
});

describe("appendBuildLog", () => {
  it("stamps the new entry and keeps the order", () => {
    const log = appendBuildLog([{ label: "first", at: 1 }], "second", 2);
    expect(log).toEqual([
      { label: "first", at: 1 },
      { label: "second", at: 2 },
    ]);
  });

  it("never grows past the limit, dropping the oldest work", () => {
    let log = appendBuildLog(undefined, "job 0", 0);
    for (let i = 1; i < BUILD_LOG_LIMIT + 5; i++) {
      log = appendBuildLog(log, `job ${i}`, i);
    }
    expect(log).toHaveLength(BUILD_LOG_LIMIT);
    expect(log[0].label).toBe("job 5");
    expect(log[log.length - 1].label).toBe(`job ${BUILD_LOG_LIMIT + 4}`);
  });

  it("migrates a long legacy log down to the limit on the next job", () => {
    const legacy = Array.from({ length: 40 }, (_, i) => `old ${i}`);
    const log = appendBuildLog(legacy, "new work", 99);
    expect(log).toHaveLength(BUILD_LOG_LIMIT);
    expect(log[log.length - 1]).toEqual({ label: "new work", at: 99 });
  });
});
