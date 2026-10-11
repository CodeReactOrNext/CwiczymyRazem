// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  NoteMatchingHandle,
  NoteMatchingSnapshot,
} from "../contexts/NoteMatchingContext";
import type { GoalRunConfig } from "../PracticeSession";
import { useGoalRunVerdict } from "./useGoalRunVerdict";

afterEach(cleanup);

const handleWith = (snapshot: Partial<NoteMatchingSnapshot>) => ({
  current: {
    resetGame: vi.fn(),
    snapshot: () => ({
      score: 0,
      accuracy: 0,
      maxCombo: 0,
      maxPossibleScore: 0,
      noteTimeline: [],
      ...snapshot,
    }),
  } as NoteMatchingHandle,
});

const goalRunWith = (
  onRunComplete: GoalRunConfig["onRunComplete"],
): GoalRunConfig => ({
  targetBpm: 115,
  onRunComplete,
  pendingContent: "saving",
});

describe("useGoalRunVerdict", () => {
  it("judges a finished run once, at the tempo it was scored at", async () => {
    const onRunComplete = vi.fn().mockResolvedValue("clean");
    const noteMatchingHandle = handleWith({
      minScoredBpm: 114.6,
      accuracy: 93,
    });
    const { result, rerender } = renderHook(
      (props: { showSuccessView: boolean }) =>
        useGoalRunVerdict({
          goalRun: goalRunWith(onRunComplete),
          isMicEnabled: true,
          noteMatchingHandle,
          ...props,
        }),
      { initialProps: { showSuccessView: false } },
    );

    expect(onRunComplete).not.toHaveBeenCalled();
    rerender({ showSuccessView: true });
    expect(result.current.verdict).toBe("saving");
    await waitFor(() => expect(result.current.verdict).toBe("clean"));
    expect(onRunComplete).toHaveBeenCalledTimes(1);
    expect(onRunComplete).toHaveBeenCalledWith({
      bpm: 115,
      accuracy: 93,
      timing: null,
    });
  });

  it("hands over how tightly the run sat on the beat", async () => {
    const onRunComplete = vi.fn().mockResolvedValue("clean");
    const timingPrecision = {
      medianOffsetMs: 18,
      biasMs: -6,
      measuredNotes: 64,
    };
    renderHook(() =>
      useGoalRunVerdict({
        goalRun: goalRunWith(onRunComplete),
        showSuccessView: true,
        isMicEnabled: true,
        noteMatchingHandle: handleWith({
          minScoredBpm: 115,
          accuracy: 96,
          timingPrecision,
        }),
      }),
    );
    await waitFor(() =>
      expect(onRunComplete).toHaveBeenCalledWith({
        bpm: 115,
        accuracy: 96,
        timing: timingPrecision,
      }),
    );
  });

  it("hands over no tempo when the mic wasn't scoring", async () => {
    const onRunComplete = vi.fn().mockResolvedValue("not scored");
    renderHook(() =>
      useGoalRunVerdict({
        goalRun: goalRunWith(onRunComplete),
        showSuccessView: true,
        isMicEnabled: false,
        noteMatchingHandle: handleWith({ minScoredBpm: 120, accuracy: 100 }),
      }),
    );
    await waitFor(() =>
      expect(onRunComplete).toHaveBeenCalledWith({
        bpm: null,
        accuracy: 100,
        timing: null,
      }),
    );
  });

  it("judges the next run again after rearm", async () => {
    const onRunComplete = vi.fn().mockResolvedValue("judged");
    const noteMatchingHandle = handleWith({ minScoredBpm: 115, accuracy: 95 });
    const { result, rerender } = renderHook(
      (props: { showSuccessView: boolean }) =>
        useGoalRunVerdict({
          goalRun: goalRunWith(onRunComplete),
          isMicEnabled: true,
          noteMatchingHandle,
          ...props,
        }),
      { initialProps: { showSuccessView: true } },
    );
    await waitFor(() => expect(result.current.verdict).toBe("judged"));

    act(() => result.current.rearm());
    rerender({ showSuccessView: false });
    rerender({ showSuccessView: true });
    await waitFor(() => expect(onRunComplete).toHaveBeenCalledTimes(2));
  });

  it("stays out of the way outside goal mode", () => {
    const { result } = renderHook(() =>
      useGoalRunVerdict({
        goalRun: undefined,
        showSuccessView: true,
        isMicEnabled: true,
        noteMatchingHandle: handleWith({}),
      }),
    );
    expect(result.current.verdict).toBeUndefined();
  });
});
