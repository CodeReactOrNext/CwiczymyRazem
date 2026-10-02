import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimingCalibrationState {
  /** Measured end-to-end latency; null = not calibrated, use the estimate. */
  latencyMs: number | null;
  /** When it was measured (ms since epoch). */
  measuredAt: number | null;
  setLatency: (latencyMs: number | null) => void;
}

/**
 * The player's measured timing latency (see utils/timingCalibration.ts) — for
 * the browser input path only. The desktop app's native capture computes its
 * own latency from the driver and the measured IPC hand-off, which holds up, so
 * it is never calibrated.
 *
 * localStorage on purpose: it belongs to this machine's speakers, headphones and
 * browser, not to the account — the same player on a laptop and a desktop needs
 * two different numbers.
 */
export const useTimingCalibration = create<TimingCalibrationState>()(
  persist(
    (setState) => ({
      latencyMs: null,
      measuredAt: null,
      setLatency: (latencyMs) =>
        setState({ latencyMs, measuredAt: latencyMs === null ? null : Date.now() }),
    }),
    { name: "practice-timing-latency", version: 1 },
  ),
);
