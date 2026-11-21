/**
 * A Bluetooth headset opened as a microphone runs in its call mode: 8 or 16 kHz,
 * through noise suppression made for speech. A held guitar note is steady, so
 * that suppression takes it for background and mutes it. Measured on an iPhone
 * with earbuds connected (2026-11-21): 53–81% of the input was digital silence
 * and a note came through for 100–400 ms at a time — no gate or gain setting
 * can hold a note that isn't there. The phone's own microphone, opened instead,
 * followed the same notes for about two seconds.
 *
 * The browser hands the headset over as the default input the moment it is
 * connected, so the player never chose it.
 *
 * The sample rate alone doesn't name the headset: with one connected, iOS runs
 * the whole audio session at 16 kHz, the phone's own microphone included — and
 * that microphone is fine. What gives the headset away is the silence itself:
 * stretches of samples that are exactly zero, which a real microphone's noise
 * never produces. So an input at a call-mode rate is watched for a few seconds
 * and judged by that.
 */

/** At or under this sample rate an input may be a headset in call mode. */
export const CALL_MODE_MAX_RATE = 16000;
/** Zeros in a row that count as muted, not as a wave crossing zero. */
const MUTED_RUN_SECONDS = 0.02;
/** How much input is judged, from its first sample that isn't zero. */
const WATCH_SECONDS = 3;
/**
 * Share of the watched input spent muted that names a call-mode headset. The
 * headset measured 38–90% over any 5 s; the phone's microphone 0%.
 */
const MUTED_SHARE = 0.25;

export const isCallModeRate = (rate: number | null | undefined): boolean =>
  typeof rate === "number" && rate > 0 && rate <= CALL_MODE_MAX_RATE;

export interface GatedInputWatch {
  /** Takes the next block of raw input; returns the verdict once, when it is reached. */
  feed(samples: Float32Array): "gated" | "clean" | null;
}

/** Judges whether an input mutes itself between sounds (see the file comment). */
export function createGatedInputWatch(sampleRate: number): GatedInputWatch {
  const minRun = Math.max(1, Math.round(sampleRate * MUTED_RUN_SECONDS));
  const total = Math.round(sampleRate * WATCH_SECONDS);
  let started = false;
  let seen = 0;
  let muted = 0;
  let run = 0;
  let done = false;

  return {
    feed(samples) {
      if (done) return null;
      for (let i = 0; i < samples.length; i++) {
        const zero = samples[i] === 0;
        // An input that hasn't produced anything yet says nothing either way.
        if (!started) {
          if (zero) continue;
          started = true;
        }
        seen++;
        if (zero) {
          run++;
        } else {
          if (run >= minRun) muted += run;
          run = 0;
        }
        if (seen >= total) {
          if (run >= minRun) muted += run;
          done = true;
          return muted / seen > MUTED_SHARE ? "gated" : "clean";
        }
      }
      return null;
    },
  };
}

/**
 * Another input to try in place of a muted one: not the same device under
 * another id, and not one already found muted.
 */
export function pickOtherInput(
  devices: readonly Pick<MediaDeviceInfo, "deviceId" | "groupId" | "kind">[],
  current: { deviceId?: string; groupId?: string },
  tried: ReadonlySet<string>,
): string | null {
  const other = devices.find((d) =>
    d.kind === "audioinput"
    && !!d.deviceId
    && d.deviceId !== "default"
    && d.deviceId !== "communications"
    && d.deviceId !== current.deviceId
    && !(current.groupId && d.groupId === current.groupId)
    && !tried.has(d.deviceId));
  return other?.deviceId ?? null;
}
