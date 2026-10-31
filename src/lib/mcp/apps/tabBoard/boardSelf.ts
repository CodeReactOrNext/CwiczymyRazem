/**
 * What the tab worker takes for `self` inside the MCP preview.
 *
 * The preview runs the worker module on the page's own thread — a sandboxed
 * iframe can't spawn a worker from another origin — and the bundle rewrites
 * every `self` in it to this object (see scripts/buildMcpTabBoard.mjs). The
 * worker sets `onmessage` on it, which is how the board talks to it, and loads
 * its music font into the page's font set from `bravuraUrl`.
 *
 * Imported first by the entry, so it exists before the worker module runs.
 */
export interface BoardSelf {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown) => void;
  fonts: FontFaceSet;
  bravuraUrl?: string;
}

export const boardSelf: BoardSelf = {
  onmessage: null,
  // The worker reports rests for the session's "rest" chip, which the preview hasn't got.
  postMessage: () => {},
  fonts: document.fonts,
  bravuraUrl: (globalThis as { RIFF_TAB_BRAVURA_URL?: string }).RIFF_TAB_BRAVURA_URL,
};

(globalThis as { __tabBoardSelf?: BoardSelf }).__tabBoardSelf = boardSelf;
