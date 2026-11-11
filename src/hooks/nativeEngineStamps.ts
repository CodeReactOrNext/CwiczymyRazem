// The shell's own detection (guitarDspEngine.ts) stamps a window with when its
// last sample reached the shell. The window's own detection always stamped it
// with when that sample reached the *window* — one hand-off later — and that
// is the clock everything downstream is set to: the latency formula adds the
// measured hand-off, and a player's timing calibration was measured on it. So
// the shell's times are moved onto that clock here, by the measured hand-off.
import type { EngineDspMessage } from "./guitarDspEngine";

/** Times remembered, at most — far more than the events and readings still in play. */
const KEPT_TIMES = 512;

/**
 * Returns a function that gives back a message with its times `shiftMs` later.
 * The message itself is left alone (what crosses the shell's bridge may not be
 * written to), and the events in the result are the caller's own to keep.
 *
 * A time is moved by the hand-off measured when it was first seen, and by
 * that same amount ever after: the same attack comes back window after window
 * (the latest onset, an event's attack spectrum arriving later), and readers
 * tell attacks apart by their time.
 */
export function createStampShifter() {
  const moved = new Map<number, number>();
  const move = (timeMs: number, shiftMs: number): number => {
    // 0 is "never happened", not a time.
    if (!(timeMs > 0)) return timeMs;
    let to = moved.get(timeMs);
    if (to === undefined) {
      if (moved.size >= KEPT_TIMES) moved.clear();
      to = timeMs + shiftMs;
      moved.set(timeMs, to);
    }
    return to;
  };

  return function shift(message: EngineDspMessage, shiftMs: number): EngineDspMessage {
    const { readings } = message;
    return {
      ...message,
      readings: {
        ...readings,
        lastOnsetTime: move(readings.lastOnsetTime, shiftMs),
        lastTickTime: move(readings.lastTickTime, shiftMs),
        lastAttackMs: move(readings.lastAttackMs, shiftMs),
        lastLowAttackMs: move(readings.lastLowAttackMs, shiftMs),
        lastSoftAttackMs: move(readings.lastSoftAttackMs, shiftMs),
      },
      events: message.events.map((event) => ({ ...event, onsetMs: move(event.onsetMs, shiftMs) })),
      attacks: message.attacks.map((attack) => ({ ...attack, onsetMs: move(attack.onsetMs, shiftMs) })),
      timeMs: move(message.timeMs, shiftMs),
    };
  };
}
