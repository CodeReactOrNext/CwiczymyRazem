// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { PracticeBlueprint } from "./PracticeBlueprint";

const FOUR_BLOCKS =
  "Warm-Up::3,5,8::Stretches and a crawl|Technical Drills::5,10,20::Chord changes|Song Practice::5,12,25::Current song|Free Play::2,3,7::Anything";

describe("PracticeBlueprint", () => {
  afterEach(cleanup);

  it("ships every session length in the markup, since nothing hydrates", () => {
    // Post bodies render to static HTML at build time, so each panel has to exist
    // up front and CSS decides which one shows.
    render(
      <PracticeBlueprint blocks={FOUR_BLOCKS} lengths='15 min|30 min|60 min' />,
    );

    expect(screen.getByText("15 minutes total")).toBeTruthy();
    expect(screen.getByText("30 minutes total")).toBeTruthy();
    expect(screen.getByText("60 minutes total")).toBeTruthy();
  });

  it("checks the first length by default and moves the check when a tab is clicked", () => {
    render(
      <PracticeBlueprint blocks={FOUR_BLOCKS} lengths='15 min|30 min|60 min' />,
    );

    const fifteen = screen.getByLabelText("15 min") as HTMLInputElement;
    const sixty = screen.getByLabelText("60 min") as HTMLInputElement;
    expect(fifteen.checked).toBe(true);

    fireEvent.click(screen.getByText("60 min"));

    expect(sixty.checked).toBe(true);
    expect(fifteen.checked).toBe(false);
  });

  it("keeps a block's last value when it lists fewer lengths than there are tabs", () => {
    render(
      <PracticeBlueprint
        blocks='Warm-Up::3,5::Crawl|Cool-Down::2::Log the session'
        lengths='15 min|30 min'
      />,
    );

    // The cool-down stays 2 minutes at every length, so 5 + 2 rather than 5 alone.
    expect(screen.getByText("7 minutes total")).toBeTruthy();
  });

  it("drops the radios when the plan has a single length", () => {
    render(
      <PracticeBlueprint blocks='Warm-Up::2::Crawl|Drills::3::One drill' />,
    );

    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText("5 minutes total")).toBeTruthy();
  });

  it("appends the note to the total line", () => {
    render(
      <PracticeBlueprint
        blocks='Warm-Up::2::Crawl'
        note='Run this instead of skipping.'
      />,
    );

    expect(
      screen.getByText("2 minutes total. Run this instead of skipping."),
    ).toBeTruthy();
  });

  it("ignores malformed blocks rather than rendering an empty row", () => {
    render(
      <PracticeBlueprint blocks='Warm-Up::2::Crawl|::5::No label|Drills::not-a-number::Bad minutes' />,
    );

    expect(screen.getByText("Warm-Up")).toBeTruthy();
    expect(screen.queryByText("No label")).toBeNull();
    expect(screen.getByText("2 minutes total")).toBeTruthy();
  });

  it("gives two plans on one page separate radio groups", () => {
    const markup = renderToStaticMarkup(
      <div>
        <PracticeBlueprint
          title='First'
          blocks={FOUR_BLOCKS}
          lengths='15 min|30 min'
        />
        <PracticeBlueprint
          title='Second'
          blocks='Warm-Up::4,6::Crawl'
          lengths='15 min|30 min'
        />
      </div>,
    );

    const groups = new Set(
      Array.from(markup.matchAll(/name="([^"]+)"/g), (match) => match[1]),
    );
    expect(groups.size).toBe(2);
  });

  it("puts the radios before the tabs and panels so the sibling selector reaches them", () => {
    const markup = renderToStaticMarkup(
      <PracticeBlueprint blocks={FOUR_BLOCKS} lengths='15 min|30 min' />,
    );

    expect(markup.indexOf("<input")).toBeLessThan(markup.indexOf("<label"));
    expect(markup.indexOf("<label")).toBeLessThan(
      markup.indexOf("minutes total"),
    );
  });
});
