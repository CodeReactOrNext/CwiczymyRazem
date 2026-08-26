// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The visit allowance lives in module state, so every simulated visit needs a fresh module — the
 * persisted counter in `localStorage` is what carries over between them, exactly as in the app.
 */
const visit = async () => {
  vi.resetModules();
  const hint = await import("./useMotivateHint");
  const { result } = renderHook(() => hint.useMotivateHint());

  return { ...hint, shownHint: result.current };
};

beforeEach(() => {
  localStorage.clear();
});

describe("useMotivateHint", () => {
  it("nudges a user who has never motivated anyone", async () => {
    const { shownHint } = await visit();

    expect(shownHint).toBe(true);
  });

  it("stops nudging once the user motivates someone, in this visit and the next", async () => {
    const { markMotivateHintDone } = await visit();

    act(() => markMotivateHintDone());

    expect((await visit()).shownHint).toBe(false);
  });

  it("gives up after five visits the user did not act on", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await visit()).shownHint).toBe(true);
    }

    expect((await visit()).shownHint).toBe(false);
  });

  it("counts a visit once, however many feeds mount in it", async () => {
    vi.resetModules();
    const hint = await import("./useMotivateHint");

    for (let i = 0; i < 5; i += 1) {
      renderHook(() => hint.useMotivateHint());
    }

    expect(
      JSON.parse(localStorage.getItem("motivate-hint") ?? "{}").state
        .sessionsShown,
    ).toBe(1);
  });
});
