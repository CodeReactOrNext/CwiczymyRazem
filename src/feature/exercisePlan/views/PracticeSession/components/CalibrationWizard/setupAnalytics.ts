import posthog from "posthog-js";

/**
 * Where players get through the mic setup and where they give up — the wizard
 * sent nothing before, so "it's hard to set up an interface" could not be
 * placed on a step. Device names are deliberately left out: they can carry a
 * person's name ("Anna's AirPods").
 */
export type SetupEvent =
  /** A step came on screen. */
  | "mic_setup_step_viewed"
  /** The input could not be opened (see AudioInitFailure). */
  | "mic_setup_error"
  /** The guitar was heard for the first time on the input step. */
  | "mic_setup_signal_heard"
  /** The input step sat silent long enough to show the checklist. */
  | "mic_setup_no_signal_help"
  | "mic_setup_device_changed"
  | "mic_setup_channel_changed"
  | "mic_setup_completed"
  /** Closed before the end; `step` says where. */
  | "mic_setup_cancelled";

export type SetupEventProps = Record<string, string | number | boolean | null>;

export function trackSetup(event: SetupEvent, props: SetupEventProps = {}): void {
  try {
    posthog.capture(event, props);
  } catch { /* analytics must never break the setup */ }
}
