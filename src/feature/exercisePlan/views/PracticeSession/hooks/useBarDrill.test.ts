// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useBarDrill } from "./useBarDrill";

afterEach(cleanup);

const BAR: TablatureMeasure = {
  timeSignature: [2, 4],
  beats: [
    { duration: 1, notes: [{ string: 6, fret: 1 }] },
    { duration: 1, notes: [{ string: 6, fret: 2 }] },
  ],
};

const judge = (noteKey: string, hit: boolean) => ({ noteKey, hit, grade: null, perfect: false, combo: 0 });

describe("useBarDrill", () => {
  it("is done after three clean passes of the bar", () => {
    const { result } = renderHook(() => useBarDrill("spider"));
    act(() => result.current.start(2, BAR));
    expect(result.current.drill?.tablature).toEqual([BAR]);

    const pass = (hit: boolean) => act(() => {
      result.current.handleNoteJudged(judge("0-0-0", true));
      result.current.handleNoteJudged(judge("0-1-0", hit));
    });
    pass(true);
    pass(false);
    pass(true);
    expect(result.current.drill?.passes).toBe(2);
    expect(result.current.isDone).toBe(false);
    pass(true);
    expect(result.current.isDone).toBe(true);
  });

  it("does not outlive a move to another exercise", () => {
    const { result, rerender } = renderHook(({ id }) => useBarDrill(id), { initialProps: { id: "spider" } });
    act(() => result.current.start(0, BAR));
    rerender({ id: "legato" });
    expect(result.current.drill).toBeNull();
    rerender({ id: "spider" });
    expect(result.current.drill).toBeNull();
  });
});
