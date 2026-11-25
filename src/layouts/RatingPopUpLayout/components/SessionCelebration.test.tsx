// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CELEBRATION_Z_INDEX, SessionCelebration } from "./SessionCelebration";

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/** The fixed layers a session summary opens inside (DesktopSessionView, the phone summary). */
const SESSION_LAYERS = [999_999, 999_999_999];

describe("SessionCelebration", () => {
  afterEach(cleanup);

  it("plays above the session screen the summary opens in", () => {
    render(
      <SessionCelebration points={12} fame={5} streak={3} onDone={() => undefined} />,
    );

    const moment = screen.getByRole("status", { name: "celebrate.title" });
    const zIndex = Number(moment.style.zIndex);
    for (const layer of SESSION_LAYERS) {
      expect(zIndex).toBeGreaterThan(layer);
    }
    expect(zIndex).toBe(CELEBRATION_Z_INDEX);
    // Still a valid 32-bit z-index.
    expect(zIndex).toBeLessThan(2 ** 31);
  });
});
