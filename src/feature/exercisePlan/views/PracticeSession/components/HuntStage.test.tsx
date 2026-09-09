// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HuntTargetCard } from "./HuntStage";

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
