import { describe, expect, it } from "vitest";

import { gpLoadingSteps, isStillLoading } from "./SessionLoadingSteps";

const labels = { file: "file", parse: "parse", sound: "sound" };
const states = (input: Parameters<typeof gpLoadingSteps>[0]) => gpLoadingSteps(input, labels).map((step) => step.state);

describe("gpLoadingSteps", () => {
  it("has nothing to wait for without a Guitar Pro file", () => {
    const steps = gpLoadingSteps({ fetching: false, hasFile: false, parsing: false, audioReady: true }, labels);
    expect(steps).toEqual([]);
    expect(isStillLoading(steps)).toBe(false);
  });

  it("downloads first, then reads the tracks and loads the sounds side by side", () => {
    expect(states({ fetching: true, hasFile: false, parsing: false, audioReady: false })).toEqual(["running", "waiting", "waiting"]);
    expect(states({ fetching: false, hasFile: true, parsing: true, audioReady: false })).toEqual(["done", "running", "running"]);
    expect(states({ fetching: false, hasFile: true, parsing: false, audioReady: false })).toEqual(["done", "done", "running"]);
  });

  it("is done only once the sounds and the song are loaded too", () => {
    const loading = gpLoadingSteps({ fetching: false, hasFile: true, parsing: false, audioReady: false }, labels);
    const ready = gpLoadingSteps({ fetching: false, hasFile: true, parsing: false, audioReady: true }, labels);
    expect(isStillLoading(loading)).toBe(true);
    expect(isStillLoading(ready)).toBe(false);
  });
});
