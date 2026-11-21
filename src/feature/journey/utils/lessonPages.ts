import type { JourneyStep, StepContentBlock } from "../types/journey.types";

export type LessonPage =
  | { kind: "content"; blocks: StepContentBlock[] }
  | { kind: "finish" };

type LessonSource = Pick<
  JourneyStep,
  "contentBlocks" | "fullDescription" | "checklist" | "songPicker" | "modalOnly"
>;

/** Pictures are read with the words that point at them, so they never open a page. */
const joinsPreviousPage = (block: StepContentBlock) =>
  block.type === "fretDiagram" || block.type === "image";

/**
 * A step's lesson, one idea per page. Each text or callout opens a page and a
 * diagram or image joins the page before it. A step written without blocks
 * reads its description on a single page.
 *
 * The last page is where the step gets finished: the checklist, the song to
 * pick, or how the exam is passed. A plain read-and-confirm step has none of
 * those, so its last content page carries the button instead.
 */
export function buildLessonPages(step: LessonSource): LessonPage[] {
  const blocks: StepContentBlock[] = step.contentBlocks?.length
    ? step.contentBlocks
    : step.fullDescription
      ? [{ type: "text", body: step.fullDescription }]
      : [];

  const pages: LessonPage[] = [];
  for (const block of blocks) {
    const last = pages[pages.length - 1];
    if (joinsPreviousPage(block) && last?.kind === "content")
      last.blocks.push(block);
    else pages.push({ kind: "content", blocks: [block] });
  }

  const needsFinish =
    !step.modalOnly || !!step.checklist?.length || !!step.songPicker?.length;
  if (needsFinish || pages.length === 0) pages.push({ kind: "finish" });
  return pages;
}
