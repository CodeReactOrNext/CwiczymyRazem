// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Exercise } from "../../../types/exercise.types";
import { useGeneratedExercise } from "./useGeneratedExercise";

afterEach(cleanup);

const exercise = (id: string) => ({ id, title: id }) as Exercise;
const SCALES = exercise("scale_practice_configurable");

const render = () =>
  renderHook(({ currentExercise, exerciseIndex }) => useGeneratedExercise({ currentExercise, exerciseIndex }), {
    initialProps: { currentExercise: SCALES, exerciseIndex: 0 },
  });

describe("useGeneratedExercise", () => {
  it("plays the exercise that was generated", () => {
    const { result } = render();
    expect(result.current.showScaleDialog).toBe(true);
    act(() => result.current.handleGenerated(exercise("a_minor")));
    expect(result.current.showScaleDialog).toBe(false);
    expect(result.current.activeExercise.id).toBe("a_minor");
  });

  it("drops it when the plan moves on", () => {
    const { result, rerender } = render();
    act(() => result.current.handleGenerated(exercise("a_minor")));
    rerender({ currentExercise: exercise("spider"), exerciseIndex: 1 });
    expect(result.current.activeExercise.id).toBe("spider");
    expect(result.current.showScaleDialog).toBe(false);
  });

  it("asks again for the same exercise further down the plan", () => {
    const { result, rerender } = render();
    act(() => result.current.handleGenerated(exercise("a_minor")));
    rerender({ currentExercise: SCALES, exerciseIndex: 1 });
    expect(result.current.activeExercise).toBe(SCALES);
    expect(result.current.showScaleDialog).toBe(true);
  });
});
