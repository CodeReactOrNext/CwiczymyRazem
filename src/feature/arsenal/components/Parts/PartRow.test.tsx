import { cleanup, render, screen } from "@testing-library/react";
import { Star } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";

import { PartRow } from "./PartRow";

afterEach(cleanup);

describe("PartRow", () => {
  it("puts a part in a socket lit by its tier, the way the stash hangs it", () => {
    const { container } = render(
      <PartRow partId='neck' tier='Epic' need={3} have={30} />,
    );

    // The plate is the tier made visible: a part with no coloured hollow around
    // it is exactly the row this was meant to replace.
    const plate = container.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(plate).not.toBeNull();
    // Epic is #a855f7, which the DOM hands back as rgb components.
    expect(plate!.style.backgroundImage).toContain("168, 85, 247");
  });

  it("leaves a cost that is not a part unsocketed", () => {
    // Fame brings its own emblem and has no tier to show.
    const { container } = render(
      <PartRow
        label='Fame'
        icon={<Star data-testid='fame' />}
        need={40}
        have={452}
      />,
    );

    expect(screen.getByTestId("fame")).toBeTruthy();
    expect(container.querySelector('[style*="radial-gradient"]')).toBeNull();
  });

  it("drains the socket when the wallet is short", () => {
    const { container } = render(
      <PartRow partId='pickup' tier='Legendary' need={4} have={1} />,
    );

    const plate = container.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(plate!.className).toContain("grayscale");
    expect(screen.getByText(/3 short/)).toBeTruthy();
  });
});
