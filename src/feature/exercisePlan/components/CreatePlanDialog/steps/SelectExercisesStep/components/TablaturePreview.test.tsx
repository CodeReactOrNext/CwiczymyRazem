import { render } from "@testing-library/react";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { TablaturePreview } from "./TablaturePreview";

const measure = (notes: TablatureMeasure["beats"]): TablatureMeasure[] => [
  { timeSignature: [4, 4], beats: notes },
];

describe("TablaturePreview", () => {
  it("renders dead notes as an X, not their (meaningless) fret number", () => {
    const { container } = render(
      <TablaturePreview
        measures={measure([
          { duration: 1, notes: [{ string: 3, fret: 0, isDead: true }] },
        ])}
      />,
    );

    const labels = Array.from(container.querySelectorAll("text")).map((node) => node.textContent);
    expect(labels).toContain("×");
    expect(labels).not.toContain("0");
  });

  it("still renders the fret number for normal notes", () => {
    const { container } = render(
      <TablaturePreview
        measures={measure([
          { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
          { duration: 0.5, notes: [{ string: 2, fret: 12 }] },
        ])}
      />,
    );

    const labels = Array.from(container.querySelectorAll("text")).map((node) => node.textContent);
    expect(labels).toContain("0");
    expect(labels).toContain("12");
  });
});
