// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HuntPromptCard, HuntTargetCard } from "./HuntStage";

// No global setup file in this project, so cleanup is explicit — otherwise the
// second render finds the first one's tile still in the document.
afterEach(cleanup);

describe("HuntTargetCard", () => {
  const renderValue = (value: string) => {
    render(<HuntTargetCard value={value} complete={false} foundCount={0} />);
    return screen.getByText(value);
  };

  it("keeps note names at the full display size", () => {
    expect(renderValue("A").className).toContain("text-5xl");
    cleanup();
    expect(renderValue("C#").className).toContain("text-5xl");
  });

  // The tile is a fixed square with overflow hidden: a chord symbol at the note
  // size ran off the edge and the player saw "Cmaj" with the 7 clipped away.
  it("steps chord symbols down so they fit the tile", () => {
    expect(renderValue("Cmaj7").className).toContain("text-2xl");
    cleanup();
    expect(renderValue("Bm7b5").className).toContain("text-2xl");
    cleanup();
    expect(renderValue("Am7").className).toContain("text-3xl");
  });

  it("never wraps the value onto a second line", () => {
    expect(renderValue("Cmaj7").className).toContain("whitespace-nowrap");
  });
});

describe("HuntPromptCard", () => {
  const renderPrompt = (props: Partial<Parameters<typeof HuntPromptCard>[0]> = {}) =>
    render(<HuntPromptCard title='G7' label='5th' complete={false} foundCount={0} {...props} />);

  // The whole point of the pair: the degree used to be a text-xs chip next to a
  // text-5xl chord, and the half that actually has to be worked out read as a
  // footnote to the half that doesn't.
  it("sets a short degree at the same size as the chord beside it", () => {
    renderPrompt();
    expect(screen.getByText("G7").className).toContain("text-5xl");
    // The ordinal renders as digit + small suffix, so the digit carries the size.
    expect(screen.getByText("5", { exact: false }).className).toContain("text-5xl");
  });

  it("names both tiles so the pair reads as a question", () => {
    renderPrompt();
    expect(screen.getByText("chord")).toBeTruthy();
    expect(screen.getByText("degree")).toBeTruthy();
  });

  it("calls the first tile a root when the question is about a single note", () => {
    renderPrompt({ title: "A", label: "Perfect 5th ↑" });
    expect(screen.getByText("root")).toBeTruthy();
    expect(screen.getByText("interval")).toBeTruthy();
  });

  // Spelled-out interval names are three times the width of "5th" — at the note
  // size they would run off the tile, so they step down and wrap instead.
  it("steps spelled-out interval names down instead of clipping them", () => {
    renderPrompt({ title: "A", label: "Perfect 5th ↑" });
    const label = screen.getByText("Perfect 5th ↑");
    expect(label.className).toContain("text-3xl");
    expect(label.className).toContain("whitespace-normal");
  });

  // The answer belongs where the question stood; the degree drops to the caption
  // so the solved pair still reads "the 5th of G7 is D".
  it("reveals the answer in the degree's tile and keeps the degree as its caption", () => {
    renderPrompt({ answer: "D", complete: true, foundCount: 1 });
    expect(screen.getByText("D")).toBeTruthy();
    expect(screen.getByText("5th")).toBeTruthy();
    expect(screen.queryByText("degree")).toBeNull();
  });
});
