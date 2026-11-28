// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { registerStageCameraElement, stageCameraTransform } from "./stageCamera";

describe("stageCameraTransform", () => {
  it("leaves the room where it is for an eye looking straight ahead", () => {
    expect(stageCameraTransform(0, 0)).toBe(
      "translate3d(0.000vw, 0.000vw, 0) rotateY(0.000deg) rotateX(0.000deg)",
    );
  });

  it("slides the room against the eye and turns it with it", () => {
    expect(stageCameraTransform(1, -1)).toBe(
      "translate3d(-4.000vw, 1.200vw, 0) rotateY(3.000deg) rotateX(1.600deg)",
    );
  });
});

describe("registerStageCameraElement", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("runs one frame loop for every element and stops it with the last one", () => {
    const request = vi.fn(() => 7);
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);

    const room = document.createElement("div");
    const tab = document.createElement("div");
    const leaveRoom = registerStageCameraElement(room);
    const leaveTab = registerStageCameraElement(tab);

    expect(request).toHaveBeenCalledTimes(1);
    expect(room.style.transform).toBe(tab.style.transform);
    expect(room.style.transform).not.toBe("");

    leaveRoom();
    expect(room.style.transform).toBe("");
    expect(cancel).not.toHaveBeenCalled();

    leaveTab();
    expect(cancel).toHaveBeenCalledWith(7);
  });
});
