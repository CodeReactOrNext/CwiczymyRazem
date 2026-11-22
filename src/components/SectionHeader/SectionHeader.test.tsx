// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SectionHeader, SectionLink } from "./SectionHeader";

describe("SectionHeader", () => {
  afterEach(() => cleanup());

  it("renders the title as an h2 by default", () => {
    render(<SectionHeader title='Recent songs' />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("Recent songs");
    expect(heading.className).toContain("text-base");
  });

  it("keeps the heading level it is given and grows with size lg", () => {
    render(<SectionHeader title='Trophies' as='h3' size='lg' />);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading.className).toContain("text-lg");
  });

  it("shows the count after the title", () => {
    render(<SectionHeader title='Members' count={12} />);
    const count = screen.getByText("12");
    expect(count.className).toContain("text-zinc-500");
    expect(screen.getByRole("heading").textContent).toBe("Members12");
  });

  it("renders a count of zero", () => {
    render(<SectionHeader title='Members' count={0} />);
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("renders the description and the action", () => {
    render(
      <SectionHeader
        title='Plans'
        description='Your saved plans'
        action={<SectionLink href='/plans'>See all</SectionLink>}
      />,
    );
    expect(screen.getByText("Your saved plans")).toBeTruthy();
    const link = screen.getByRole("link", { name: "See all" });
    expect(link.getAttribute("href")).toBe("/plans");
  });
});
