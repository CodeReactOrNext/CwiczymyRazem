// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DailyPrizeName } from "./DailyPrize";

afterEach(cleanup);

describe("DailyPrizeName", () => {
  it("names a mod and what it raises, nothing more", () => {
    render(
      <DailyPrizeName
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

    expect(screen.getByText("Pro low action mod")).toBeTruthy();
    expect(screen.getByText("+4 Play Feeling")).toBeTruthy();
    expect(screen.queryByText(/Top roll|Fits/)).toBeNull();
  });

  it("names a part by its tier", () => {
    render(<DailyPrizeName prize={{ kind: "part", partId: "pickup", label: "Pickup", tier: "Legendary" }} />);

    expect(screen.getByText("Legendary")).toBeTruthy();
    expect(screen.getByText(/Pickup/)).toBeTruthy();
  });
});
