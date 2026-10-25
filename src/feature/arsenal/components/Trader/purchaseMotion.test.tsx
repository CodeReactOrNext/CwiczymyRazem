// @vitest-environment jsdom

import { cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GainCount, useTakenHere } from "./purchaseMotion";

afterEach(cleanup);

describe("useTakenHere", () => {
  it("is false for an offer that loaded already taken", () => {
    const { result } = renderHook(({ available }) => useTakenHere(available), {
      initialProps: { available: false },
    });
    expect(result.current).toBe(false);
  });

  it("is true once an offer is taken on this screen", () => {
    const { result, rerender } = renderHook(
      ({ available }) => useTakenHere(available),
      { initialProps: { available: true } },
    );
    expect(result.current).toBe(false);

    rerender({ available: false });
    expect(result.current).toBe(true);
  });
});

describe("GainCount", () => {
  it("throws off nothing on load, and the gain on a purchase", () => {
    const { rerender } = render(<GainCount value={40} />);
    expect(screen.queryByText(/^\+/)).toBeNull();

    rerender(<GainCount value={45} />);
    expect(screen.getByText("+5")).toBeTruthy();
  });
});
