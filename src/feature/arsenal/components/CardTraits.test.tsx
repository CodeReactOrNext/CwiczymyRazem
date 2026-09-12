// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ResolvedTrait } from "feature/arsenal/data/traits";
import { afterEach, describe, expect, it } from "vitest";

import { CardTraits } from "./CardTraits";

afterEach(cleanup);

const trait = (id: string, value: number): ResolvedTrait =>
  ({
    def: { id },
    label: id,
    description: `${id} description`,
    value,
  }) as ResolvedTrait;

describe("CardTraits", () => {
  it("renders every trait when uncapped", () => {
    const traits = [trait("a", 1), trait("b", 5), trait("c", 3)];
    render(<CardTraits traits={traits} />);

    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText("b")).toBeTruthy();
    expect(screen.getByText("c")).toBeTruthy();
    expect(screen.queryByText(/more$/)).toBeNull();
  });

  it("caps to the highest-value traits and collapses the rest behind +N more", () => {
    const traits = [trait("low", 1), trait("high", 5), trait("mid", 3)];
    render(<CardTraits traits={traits} maxVisible={2} />);

    expect(screen.getByText("high")).toBeTruthy();
    expect(screen.getByText("mid")).toBeTruthy();
    expect(screen.queryByText("low")).toBeNull();
    expect(screen.getByText("+1 more")).toBeTruthy();
  });

  it("renders nothing for an item with no traits", () => {
    const { container } = render(<CardTraits traits={[]} maxVisible={2} />);
    expect(container.firstChild).toBeNull();
  });
});
