/**
 * A gain envelope that knows its own curve, so it can say what level it is at
 * any moment and start the next move exactly from there.
 *
 * Web Audio can't be asked for a parameter's future value, and the one call
 * that holds it — cancelAndHoldAtTime — is missing in Firefox. Cutting a pad
 * mid-attack or tying a held note over would then jump. So every change here
 * is anchored with an explicit setValueAtTime at the level worked out from
 * the curve: the same result in every browser.
 */

type EnvelopeEvent =
  | { kind: "set"; time: number; value: number }
  | { kind: "ramp"; time: number; value: number }
  | { kind: "target"; time: number; value: number; tau: number };

/** The slice of AudioParam the envelope drives — a fake in tests. */
export interface ParamLike {
  setValueAtTime(value: number, time: number): unknown;
  linearRampToValueAtTime(value: number, time: number): unknown;
  setTargetAtTime(target: number, time: number, tau: number): unknown;
  cancelScheduledValues(time: number): unknown;
}

export class Envelope {
  private events: EnvelopeEvent[] = [];

  constructor(private readonly param: ParamLike) {}

  /** The level the scheduled curve has at `time`. */
  levelAt(time: number): number {
    let value = 0;
    let since = -Infinity;
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      if (event.kind === "ramp") {
        // A ramp runs from the previous event to its own time.
        if (time < event.time) {
          const span = event.time - since;
          return span > 0
            ? value + (event.value - value) * ((time - since) / span)
            : event.value;
        }
        value = event.value;
        since = event.time;
        continue;
      }
      if (time < event.time) return value;
      if (event.kind === "set") {
        value = event.value;
        since = event.time;
        continue;
      }
      // A target curve holds until the next event, which then starts from
      // wherever the curve had got to.
      const next = this.events[i + 1];
      const until = next && next.time <= time ? next.time : time;
      value =
        event.value +
        (value - event.value) * Math.exp(-(until - event.time) / event.tau);
      since = until;
      if (!next || next.time > time) return value;
    }
    return value;
  }

  private drop(from: number) {
    this.param.cancelScheduledValues(from);
    this.events = this.events.filter((event) => event.time < from);
  }

  set(value: number, time: number) {
    this.param.setValueAtTime(value, time);
    this.events.push({ kind: "set", time, value });
  }

  rampTo(value: number, time: number) {
    this.param.linearRampToValueAtTime(value, time);
    this.events.push({ kind: "ramp", time, value });
  }

  approach(value: number, time: number, tau: number) {
    this.param.setTargetAtTime(value, time, tau);
    this.events.push({ kind: "target", time, value, tau });
  }

  /** Head for `value` from wherever the curve is at `time`. */
  moveTo(value: number, time: number, tau: number) {
    const level = this.levelAt(time);
    this.drop(time);
    this.set(level, time);
    this.approach(value, time, tau);
  }

  /** Start fading to silence at `time` from wherever the curve is then. */
  fadeOut(time: number, tau: number) {
    this.moveTo(0, time, tau);
  }

  /**
   * Fold everything before `time` into the level the curve has there, so an
   * envelope that lives as long as the session (the sidechain duck) doesn't
   * keep every move it ever made. The AudioParam is untouched — only the
   * envelope's own copy of its past.
   */
  forget(time: number) {
    const past = this.events.filter((event) => event.time < time);
    if (past.length < 32) return;
    const level = this.levelAt(time);
    const last = past[past.length - 1];
    const carry: EnvelopeEvent[] = [{ kind: "set", time, value: level }];
    // A curve still on its way somewhere keeps going after the fold.
    if (last.kind === "target") carry.push({ ...last, time });
    this.events = [
      ...carry,
      ...this.events.filter((event) => event.time >= time),
    ];
  }

  /** Glide from wherever the curve is at `time` to `value` over `seconds`. */
  glideTo(value: number, time: number, seconds: number) {
    const level = this.levelAt(time);
    this.drop(time);
    this.set(level, time);
    this.rampTo(value, time + seconds);
  }
}
