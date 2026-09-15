// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InlineText } from "./InlineText";

// No global setup file wires this up, so each case tears down its own DOM.
afterEach(cleanup);

describe("InlineText", () => {
  it("renders bold without leaking its asterisks", () => {
    const { container } = render(<InlineText text='a **loud** word' />);
    expect(container.querySelector("strong")?.textContent).toBe("loud");
    expect(container.textContent).toBe("a loud word");
  });

  it("renders italics — the daily plan intro was printing them raw", () => {
    const { container } = render(
      <InlineText text='*what am I working on today* and *for how long*' />
    );
    expect(container.querySelectorAll("em")).toHaveLength(2);
    expect(container.textContent).not.toContain("*");
  });

  it("keeps an in-page anchor in the same tab, but opens external links in a new one", () => {
    render(
      <InlineText text='[the drill](#pentatonic-box1-up-down) and [a study](https://example.com/study)' />
    );
    const anchor = screen.getByRole("link", { name: "the drill" });
    expect(anchor.getAttribute("href")).toBe("#pentatonic-box1-up-down");
    expect(anchor.getAttribute("target")).toBeNull();

    const external = screen.getByRole("link", { name: "a study" });
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps emphasis working on both sides of a link", () => {
    render(
      <InlineText text='*before* [the plan](/daily-guitar-practice-plan) **after**' />
    );
    expect(
      screen.getByRole("link", { name: "the plan" }).getAttribute("href")
    ).toBe("/daily-guitar-practice-plan");
    expect(screen.getByText("before").tagName).toBe("EM");
    expect(screen.getByText("after").tagName).toBe("STRONG");
  });
});
