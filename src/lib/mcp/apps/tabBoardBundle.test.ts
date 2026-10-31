import { checkTab } from "lib/mcp/tablature/tabJson";
import { describe, expect, it } from "vitest";

import { bundleTabBoard, moduleSource } from "../../../../scripts/buildMcpTabBoard.mjs";
import { TAB_BOARD_JS } from "./generated/tabBoardBundle";
import { defaultBoard } from "./tabPreview";
import { TAB_PREVIEW_HTML } from "./tabPreviewHtml";

// Node, not jsdom: esbuild refuses to run under jsdom's TextEncoder.
// Mounting the bundle is tested in tabBoard/tabBoard.test.ts.

describe("MCP tab board bundle", () => {
  it("is up to date with the board and the session's worker", async () => {
    // Out of date: run `node scripts/buildMcpTabBoard.mjs` and commit the result.
    expect(moduleSource(TAB_BOARD_JS)).toBe(moduleSource(await bundleTabBoard()));
  }, 30_000);

  it("is inlined into the preview page without closing its script", () => {
    expect(TAB_PREVIEW_HTML).toContain(TAB_BOARD_JS);
    expect(TAB_BOARD_JS).not.toMatch(/<\/script/i);
  });
});

describe("defaultBoard", () => {
  it("draws a bass tab on four lines with its tuning in the gutter", () => {
    const { measures } = checkTab(
      { measures: [{ timeSignature: "4/4", beats: [{ duration: "whole", notes: [{ string: 4, fret: 0 }] }] }] },
      "bass",
    );
    const board = defaultBoard(measures, 100, "bass");
    expect(board.style.stringCount).toBe(4);
    expect(board.tuningStrings.map((s) => s.label)).toEqual(["G", "D", "A", "E"]);
  });

  it("keeps the guitar on the session's default look", () => {
    const { measures } = checkTab(
      { measures: [{ timeSignature: "4/4", beats: [{ duration: "whole", notes: [{ string: 6, fret: 0 }] }] }] },
      "guitar",
    );
    const board = defaultBoard(measures, 90, "guitar");
    expect(board.style.stringCount).toBeUndefined();
    expect(board.style.background).toBe("#09090b");
    expect(board.tuningStrings).toHaveLength(6);
  });
});
