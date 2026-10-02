// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DailyPrize } from "./DailyPrize";

afterEach(cleanup);

describe("DailyPrize", () => {
  it("names a mod and what it raises, nothing more", () => {
    render(
      <DailyPrize
        prize={{
          kind: "mod",
          modKind: "guitar",
          featureId: "low-action",
          label: "Pro low action",
          points: 4,
          statLabel: "Play Feeling",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Prize for #1" })).toBeTruthy();
    expect(screen.getByText("Pro low action mod")).toBeTruthy();
    expect(screen.getByText("+4 Play Feeling")).toBeTruthy();
    expect(screen.queryByText(/Top roll|Fits/)).toBeNull();
  });

  it("names a part by its tier", () => {
    render(<DailyPrize prize={{ kind: "part", partId: "pickup", label: "Pickup", tier: "Legendary" }} />);

    expect(screen.getByText("Legendary")).toBeTruthy();
    expect(screen.getByText(/Pickup/)).toBeTruthy();
  });
});
