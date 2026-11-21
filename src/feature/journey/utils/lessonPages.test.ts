import { describe, expect, it } from "vitest";

import type { FretDiagramData } from "../types/journey.types";
import { buildLessonPages } from "./lessonPages";

const diagram: FretDiagramData = { startFret: 0, endFret: 3, strings: [] };

describe("buildLessonPages", () => {
  it("opens a page per text or callout and hangs diagrams on the page before", () => {
    const pages = buildLessonPages({
      fullDescription: "",
      contentBlocks: [
        { type: "text", body: "intro" },
        { type: "callout", label: "ruler", body: "frets" },
        { type: "fretDiagram", diagram },
        { type: "callout", label: "thirds", body: "letters" },
      ],
    });

    expect(
      pages.map((page) =>
        page.kind === "content" ? page.blocks.map((b) => b.type) : "finish",
      ),
    ).toEqual([["text"], ["callout", "fretDiagram"], ["callout"], "finish"]);
  });

  it("gives a leading diagram a page of its own", () => {
    const pages = buildLessonPages({
      fullDescription: "",
      modalOnly: true,
      contentBlocks: [
        { type: "fretDiagram", diagram },
        { type: "text", body: "after" },
      ],
    });

    expect(pages).toHaveLength(2);
    expect(pages.every((page) => page.kind === "content")).toBe(true);
  });

  it("reads the description on one page when a step has no blocks", () => {
    const pages = buildLessonPages({ fullDescription: "Just play it." });

    expect(pages[0]).toEqual({
      kind: "content",
      blocks: [{ type: "text", body: "Just play it." }],
    });
    expect(pages[1]).toEqual({ kind: "finish" });
  });

  it("ends an exam step, a checklist or a song pick on a finish page", () => {
    const text = [{ type: "text" as const, body: "x" }];
    expect(
      buildLessonPages({ fullDescription: "", contentBlocks: text }).at(-1)
        ?.kind,
    ).toBe("finish");
    expect(
      buildLessonPages({
        fullDescription: "",
        modalOnly: true,
        contentBlocks: text,
        checklist: [{ text: "ok" }],
      }).at(-1)?.kind,
    ).toBe("finish");
    expect(
      buildLessonPages({
        fullDescription: "",
        modalOnly: true,
        contentBlocks: text,
        songPicker: ["s1"],
      }).at(-1)?.kind,
    ).toBe("finish");
  });

  it("lets a plain read-and-confirm step finish on its last content page", () => {
    const pages = buildLessonPages({
      fullDescription: "",
      modalOnly: true,
      contentBlocks: [{ type: "text", body: "x" }],
    });

    expect(pages).toEqual([
      { kind: "content", blocks: [{ type: "text", body: "x" }] },
    ]);
  });

  it("never returns an empty lesson", () => {
    expect(buildLessonPages({ fullDescription: "", modalOnly: true })).toEqual([
      { kind: "finish" },
    ]);
  });
});
