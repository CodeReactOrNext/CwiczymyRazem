// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DexCornerMark, DexMarks } from "./DexMarks";

afterEach(cleanup);

describe("DexMarks", () => {
  it("wears both marks for a model still in the cabinet", () => {
    render(<DexMarks status={{ isOwned: true, inDex: true }} />);

    expect(screen.getByText("Owned")).toBeTruthy();
    expect(screen.getByText("Dex")).toBeTruthy();
    expect(screen.queryByText("New for your collection")).toBeNull();
  });

  it("wears the Dex mark alone for a model that was had and is gone", () => {
    render(<DexMarks status={{ isOwned: false, inDex: true }} />);

    expect(screen.queryByText("Owned")).toBeNull();
    expect(screen.getByText("Dex")).toBeTruthy();
    expect(screen.queryByText("New for your collection")).toBeNull();
  });

  // The point of the change: a first is said out loud rather than left blank,
  // which read the same as a surface that never asked the question.
  it("says so when the model would be a first", () => {
    render(<DexMarks status={{ isOwned: false, inDex: false }} />);

    expect(screen.getByText("New for your collection")).toBeTruthy();
    expect(screen.queryByText("Owned")).toBeNull();
    expect(screen.queryByText("Dex")).toBeNull();
  });
});

describe("DexCornerMark", () => {
  it("draws one glyph per state, owned winning over the record", () => {
    const { rerender } = render(
      <DexCornerMark status={{ isOwned: true, inDex: true }} />,
    );
    expect(screen.getByLabelText("Owned")).toBeTruthy();
    expect(screen.queryByLabelText("In Dex")).toBeNull();

    rerender(<DexCornerMark status={{ isOwned: false, inDex: true }} />);
    expect(screen.getByLabelText("In Dex")).toBeTruthy();

    rerender(<DexCornerMark status={{ isOwned: false, inDex: false }} />);
    expect(screen.getByLabelText("New for your collection")).toBeTruthy();
  });
});
