import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it, vi } from "vitest";

import { clampZoom, createZoom, stepZoom, ZOOM_STEPS } from "./zoom";

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "zoom-test-"));
afterAll(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

let fileNo = 0;
const freshFile = () => path.join(tmpRoot, `zoom-${++fileNo}.json`);

const fakeWindow = () => {
  const webContents = { setZoomFactor: vi.fn(), send: vi.fn() };
  return { isDestroyed: () => false, webContents };
};

describe("stepZoom", () => {
  it("walks the ladder both ways from 100%", () => {
    expect(stepZoom(1, 1)).toBe(1.1);
    expect(stepZoom(1, -1)).toBe(0.9);
  });

  it("stays put at either end", () => {
    expect(stepZoom(ZOOM_STEPS[ZOOM_STEPS.length - 1], 1)).toBe(2);
    expect(stepZoom(ZOOM_STEPS[0], -1)).toBe(0.5);
  });

  it("snaps an off-ladder factor to the next step", () => {
    expect(stepZoom(1.05, 1)).toBe(1.1);
    expect(stepZoom(1.05, -1)).toBe(1);
  });
});

describe("clampZoom", () => {
  it("keeps a saved factor on the ladder's range", () => {
    expect(clampZoom(50)).toBe(2);
    expect(clampZoom(0)).toBe(0.5);
    expect(clampZoom(Number.NaN)).toBe(1);
  });
});

describe("createZoom", () => {
  it("zooms the page, tells the title bar and remembers it for the next launch", () => {
    const win = fakeWindow();
    const filePath = freshFile();
    const zoom = createZoom({ getWindow: () => win, filePath });

    expect(zoom.zoomIn()).toBe(1.1);
    expect(win.webContents.setZoomFactor).toHaveBeenLastCalledWith(1.1);
    expect(win.webContents.send).toHaveBeenLastCalledWith("window:zoom-changed", 1.1);

    const nextLaunch = createZoom({ getWindow: () => win, filePath });
    expect(nextLaunch.get()).toBe(1.1);
  });

  it("resets to 100%", () => {
    const zoom = createZoom({ getWindow: fakeWindow, filePath: freshFile() });
    zoom.zoomOut();
    zoom.zoomOut();
    expect(zoom.reset()).toBe(1);
  });

  it("starts at 100% without a saved file, and survives a missing window", () => {
    const zoom = createZoom({ getWindow: () => null, filePath: freshFile() });
    expect(zoom.get()).toBe(1);
    expect(zoom.zoomIn()).toBe(1.1);
  });
});
