// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const record = vi.fn();
vi.mock("feature/communityExercises/services/communityExerciseService", () => ({
  recordCommunityExercisePlay: (...args: unknown[]) => record(...args),
}));

import {
  resolveCommunityPlayId,
  useCommunityPlayCount,
} from "feature/communityExercises/hooks/useCommunityPlayCount";

describe("resolveCommunityPlayId", () => {
  it("strips the prefix plans and goals use", () => {
    expect(resolveCommunityPlayId("community-abc")).toBe("abc");
  });

  it("accepts the bare id the Community tab starts with", () => {
    expect(resolveCommunityPlayId("abc", "abc")).toBe("abc");
  });

  it("ignores library exercises", () => {
    expect(resolveCommunityPlayId("alternate_picking_1")).toBeNull();
    expect(resolveCommunityPlayId("alternate_picking_1", "abc")).toBeNull();
    expect(resolveCommunityPlayId(undefined)).toBeNull();
  });
});

describe("useCommunityPlayCount", () => {
  beforeEach(() => record.mockReset());

  it("counts a community exercise once per session, even when revisited", () => {
    const { rerender } = renderHook(
      ({ id }) => useCommunityPlayCount(id, "user-1"),
      { initialProps: { id: "community-a" } },
    );
    rerender({ id: "library_ex" });
    rerender({ id: "community-b" });
    rerender({ id: "community-a" });

    expect(record).toHaveBeenCalledTimes(2);
    expect(record).toHaveBeenNthCalledWith(1, "a", "user-1");
    expect(record).toHaveBeenNthCalledWith(2, "b", "user-1");
  });

  it("does nothing signed out", () => {
    renderHook(() => useCommunityPlayCount("community-a", null));
    expect(record).not.toHaveBeenCalled();
  });
});
