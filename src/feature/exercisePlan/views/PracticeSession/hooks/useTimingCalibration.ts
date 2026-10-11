import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Which input path a measurement belongs to: the browser's getUserMedia or the
 *  desktop app's native capture. */
export type TimingInputPath = "web" | "native";

interface TimingMeasurement {
  /** Measured end-to-end latency; null = not calibrated, use the estimate. */
  latencyMs: number | null;
  /** When it was measured (ms since epoch). */
  measuredAt: number | null;
}

interface TimingCalibrationState {
  byPath: Record<TimingInputPath, TimingMeasurement>;
  setLatency: (path: TimingInputPath, latencyMs: number | null) => void;
}

const EMPTY: TimingMeasurement = { latencyMs: null, measuredAt: null };

/** v1 held a single measurement, taken in the browser — it moves to the web slot. */
export const migrateTimingCalibration = (persisted: unknown, version: number) => {
  if (version < 2) {
    const old = (persisted ?? {}) as Partial<TimingMeasurement>;
    return {
      byPath: {
        web: { latencyMs: old.latencyMs ?? null, measuredAt: old.measuredAt ?? null },
        native: EMPTY,
      },
    } as TimingCalibrationState;
  }
  return persisted as TimingCalibrationState;
};

/**
 * The player's measured timing latency (see utils/timingCalibration.ts), kept
 * apart per input path. The browser and the desktop app hear the guitar through
 * different chains — getUserMedia vs ASIO/WASAPI plus the IPC hand-off — so a
 * number measured in one says nothing about the other, and calibrating one never
 * touches the other.
 *
 * localStorage on purpose: it belongs to this machine's speakers, headphones and
 * input, not to the account — the same player on a laptop and a desktop needs
 * two different numbers.
 */
export const useTimingCalibration = create<TimingCalibrationState>()(
  persist(
    (setState) => ({
      byPath: { web: EMPTY, native: EMPTY },
      setLatency: (path, latencyMs) =>
        setState((s) => ({
          byPath: {
            ...s.byPath,
            [path]: { latencyMs, measuredAt: latencyMs === null ? null : Date.now() },
          },
        })),
    }),
    {
      name: "practice-timing-latency",
      version: 2,
      migrate: migrateTimingCalibration,
    },
  ),
);

export const timingInputPath = (isNative: boolean): TimingInputPath => (isNative ? "native" : "web");

/** The saved measurement for one input path; null = uncalibrated there. */
export const useCalibratedLatencyMs = (isNative: boolean) =>
  useTimingCalibration((s) => s.byPath[timingInputPath(isNative)].latencyMs);
