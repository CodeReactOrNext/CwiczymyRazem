// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FRETWEAVER } from "../data/fretweaver";
import { useBossFightStore } from "../store/bossFightStore";
import { EMPTY_RECORD } from "../utils/bossProgress";
import { useBossFight } from "./useBossFight";

const miss = { noteKey: "0-0-0", hit: false, grade: null, perfect: false, combo: 0 };

describe("useBossFight", () => {
  it("banks a run the player walks away from", () => {
    const onRunEnd = vi.fn();
    const { unmount } = renderHook(() =>
      useBossFight({ boss: FRETWEAVER, record: EMPTY_RECORD, onRunEnd }),
    );
    act(() => useBossFightStore.getState().judge(miss));
    unmount();
    expect(onRunEnd).toHaveBeenCalledWith({ phase: 1, damage: 0 });
  });

  it("banks nothing for a run that never started", () => {
    const onRunEnd = vi.fn();
    const { unmount } = renderHook(() =>
      useBossFight({ boss: FRETWEAVER, record: EMPTY_RECORD, onRunEnd }),
    );
    unmount();
    expect(onRunEnd).not.toHaveBeenCalled();
  });

  it("banks a lost run once, and calls a better one a new record", () => {
    const onRunEnd = vi.fn();
    const record = { bestPhase: 0, bestDamage: 0, runs: 2 };
    const { unmount } = renderHook(() => useBossFight({ boss: FRETWEAVER, record, onRunEnd }));
    act(() => {
      useBossFightStore.setState((state) => ({
        fight: { ...state.fight, outcome: "lost", hits: 10, totalDamage: 120 },
      }));
    });
    expect(onRunEnd).toHaveBeenCalledOnce();
    expect(onRunEnd).toHaveBeenCalledWith({ phase: 1, damage: 120 });
    expect(useBossFightStore.getState().newRecord).toBe(true);
    unmount();
    expect(onRunEnd).toHaveBeenCalledOnce();
  });
});
