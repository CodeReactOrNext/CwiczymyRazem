import { describe, expect, it } from "vitest";

import {
  getTourCtaHref,
  getTourHref,
  getTourSteps,
  NO_GUITAR_HREF,
  parseTourQuery,
  placeBubble,
} from "./tourSteps";

const journey = { goal: "journey" as const, href: "/journey" };

describe("getTourSteps", () => {
  it("ends on the player's goal, pointing at its row in the Practice hub", () => {
    const steps = getTourSteps(
      { destination: journey, noGuitar: false },
      { isDesktop: true },
    );
    const ids = steps.map((s) => s.id);

    expect(ids[0]).toBe("welcome");
    expect(ids.slice(-2)).toEqual(["start", "done"]);
    expect(steps.find((s) => s.id === "start")?.target).toBe(
      "mode-learning_path",
    );
  });

  it("leaves the sidebar-only step out on a phone", () => {
    const desktop = getTourSteps(
      { destination: journey, noGuitar: false },
      { isDesktop: true },
    ).map((s) => s.id);
    const phone = getTourSteps(
      { destination: journey, noGuitar: false },
      { isDesktop: false },
    ).map((s) => s.id);

    expect(desktop).toContain("community");
    expect(phone).not.toContain("community");
  });

  it("has no 'your start' step when replayed without a goal", () => {
    const ids = getTourSteps(
      { destination: null, noGuitar: false },
      { isDesktop: true },
    ).map((s) => s.id);

    expect(ids).not.toContain("start");
    expect(ids.at(-1)).toBe("done");
  });

  it("asks the player to press Practice themselves before leaving Home", () => {
    const steps = getTourSteps(
      { destination: journey, noGuitar: false },
      { isDesktop: true },
    );
    const click = steps.find((s) => s.advanceOnClick);
    const next = steps[steps.indexOf(click!) + 1];

    expect(click?.path).toBe("/dashboard");
    expect(next.path).toBe("/timer");
  });
});

describe("getTourCtaHref", () => {
  it("sends a player without a guitar to exercises that need none", () => {
    expect(getTourCtaHref({ destination: journey, noGuitar: true })).toBe(
      NO_GUITAR_HREF,
    );
  });

  it("sends everyone else to their answer, and a replay nowhere", () => {
    expect(getTourCtaHref({ destination: journey, noGuitar: false })).toBe(
      "/journey",
    );
    expect(getTourCtaHref({ destination: null, noGuitar: false })).toBeNull();
  });
});

describe("the link from the onboarding", () => {
  it("round-trips the goal, the destination and the guitar answer", () => {
    const href = getTourHref({
      goal: "plans",
      next: "/timer/plans/abc?x=1",
      noGuitar: true,
    });
    const query = Object.fromEntries(
      new URL(href, "https://x.test").searchParams,
    );

    expect(href.startsWith("/dashboard?")).toBe(true);
    expect(parseTourQuery(query)).toEqual({
      destination: { goal: "plans", href: "/timer/plans/abc?x=1" },
      noGuitar: true,
    });
  });

  it("starts a tour without a goal from a skipped onboarding", () => {
    expect(getTourHref(null)).toBe("/dashboard?tour=1");
    expect(parseTourQuery({ tour: "1" })).toEqual({
      destination: null,
      noGuitar: false,
    });
  });

  it("does nothing without the flag", () => {
    expect(parseTourQuery({ goal: "journey", next: "/journey" })).toBeNull();
  });

  it("never sends the player off the app", () => {
    for (const next of ["//evil.test", "https://evil.test", "/\\evil.test"]) {
      expect(
        parseTourQuery({ tour: "1", goal: "journey", next })?.destination,
      ).toBeNull();
    }
    expect(
      parseTourQuery({ tour: "1", goal: "hacking", next: "/journey" })
        ?.destination,
    ).toBeNull();
  });
});

describe("placeBubble", () => {
  const viewport = { width: 1440, height: 900, bottomInset: 0 };
  const bubble = { width: 340, height: 220 };

  it("puts the bubble right of the sidebar and points Kostek back at it", () => {
    const placement = placeBubble(
      { left: 16, top: 120, width: 220, height: 400 },
      bubble,
      viewport,
      { compact: false },
    );

    expect(placement.x).toBe(16 + 220 + 16);
    expect(placement.lookAt).toBe("left");
  });

  it("goes below an element with no room on its right", () => {
    const placement = placeBubble(
      { left: 900, top: 20, width: 500, height: 60 },
      bubble,
      viewport,
      { compact: false },
    );

    expect(placement.y).toBe(20 + 60 + 16);
    expect(placement.lookAt).toBe("up");
  });

  it("keeps the bubble on screen", () => {
    const placement = placeBubble(
      { left: 0, top: 0, width: 1440, height: 900 },
      bubble,
      viewport,
      { compact: false },
    );

    expect(placement.x).toBeGreaterThanOrEqual(12);
    expect(placement.x + bubble.width).toBeLessThanOrEqual(1440 - 12);
    expect(placement.y + bubble.height).toBeLessThanOrEqual(900 - 12);
  });

  it("docks at the edge away from the element on a phone, above the bottom bar", () => {
    const phone = { width: 390, height: 844, bottomInset: 64 };
    const nearBottom = placeBubble(
      { left: 0, top: 780, width: 390, height: 64 },
      bubble,
      phone,
      { compact: true },
    );
    const nearTop = placeBubble(
      { left: 0, top: 40, width: 390, height: 80 },
      bubble,
      phone,
      { compact: true },
    );

    expect(nearBottom.y).toBe(12);
    expect(nearTop.y).toBe(844 - 64 - 220 - 12);
  });

  it("centres a card with nothing to point at", () => {
    const placement = placeBubble(null, bubble, viewport, { compact: false });

    expect(placement.x).toBe((1440 - 340) / 2);
    expect(placement.y).toBe((900 - 220) / 2);
  });
});
