// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PhotoCompare } from "./PhotoCompare";

const props = {
  wrongSrc: "/images/blog/wrong.webp",
  wrongAlt: "Slouched posture",
  wrongLabel: "Spine curved",
  rightSrc: "/images/blog/right.webp",
  rightAlt: "Straight posture",
  rightLabel: "Back straight",
};

describe("PhotoCompare", () => {
  afterEach(cleanup);

  it("renders both photos with their own alt text", () => {
    render(<PhotoCompare {...props} />);

    expect(screen.getByAltText("Slouched posture")).toBeTruthy();
    expect(screen.getByAltText("Straight posture")).toBeTruthy();
  });

  it("labels the fault and the fix rather than saying wrong and right", () => {
    render(<PhotoCompare {...props} />);

    expect(screen.getByText("Spine curved")).toBeTruthy();
    expect(screen.getByText("Back straight")).toBeTruthy();
  });

  it("keeps the fault on the error accent and the fix on the success accent", () => {
    render(<PhotoCompare {...props} />);

    expect(screen.getByText("Spine curved").className).toContain(
      "text-red-400",
    );
    expect(screen.getByText("Back straight").className).toContain(
      "text-emerald-400",
    );
  });

  it("marks both photos zoomable, since the drawn lines are thin", () => {
    const { container } = render(<PhotoCompare {...props} />);

    expect(container.querySelectorAll("[data-zoomable]").length).toBe(2);
  });

  it("renders the caption only when one is given", () => {
    const { rerender } = render(<PhotoCompare {...props} />);
    expect(screen.queryByText(/red line/)).toBeNull();

    rerender(
      <PhotoCompare
        {...props}
        caption='The red line follows the collapsed spine.'
      />,
    );
    expect(
      screen.getByText("The red line follows the collapsed spine."),
    ).toBeTruthy();
  });
});
