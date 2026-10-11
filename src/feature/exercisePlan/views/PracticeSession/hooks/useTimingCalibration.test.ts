import { beforeEach, describe, expect, it } from "vitest";

import { migrateTimingCalibration, useTimingCalibration } from "./useTimingCalibration";

describe("useTimingCalibration", () => {
  beforeEach(() => {
    useTimingCalibration.setState({
      byPath: { web: { latencyMs: null, measuredAt: null }, native: { latencyMs: null, measuredAt: null } },
    });
  });

  it("keeps the browser and desktop measurements apart", () => {
    const { setLatency } = useTimingCalibration.getState();
    setLatency("web", 120);
    setLatency("native", 35);
    expect(useTimingCalibration.getState().byPath.web.latencyMs).toBe(120);
    expect(useTimingCalibration.getState().byPath.native.latencyMs).toBe(35);

    setLatency("native", null);
    expect(useTimingCalibration.getState().byPath.native).toEqual({ latencyMs: null, measuredAt: null });
    expect(useTimingCalibration.getState().byPath.web.latencyMs).toBe(120);
  });

  it("migrates a v1 measurement to the browser slot", () => {
    expect(migrateTimingCalibration({ latencyMs: 140, measuredAt: 1000 }, 1)).toEqual({
      byPath: {
        web: { latencyMs: 140, measuredAt: 1000 },
        native: { latencyMs: null, measuredAt: null },
      },
    });
  });
});
