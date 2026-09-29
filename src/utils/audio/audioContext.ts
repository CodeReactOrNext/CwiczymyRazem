/**
 * iOS-safe Web Audio helpers.
 *
 * Two iPhone quirks silence Web Audio where every other browser plays fine:
 * - By default Safari treats it as ambient sound, so the ring/silent switch mutes
 *   it completely. Declaring the page's audio session as "playback" (iOS 17+) makes
 *   it behave like a music app and play through the switch.
 * - Locking the screen, switching apps or taking a call leaves the context
 *   "interrupted" rather than "suspended", and a resume that only looks for
 *   "suspended" never wakes it again.
 */

interface AudioSessionNavigator {
  audioSession?: { type: string };
}

/** Let Web Audio play with the iPhone's silent switch on. No-op elsewhere. */
export function preferPlaybackAudioSession(): void {
  try {
    const session = (navigator as unknown as AudioSessionNavigator)
      .audioSession;
    if (session && session.type !== "playback") session.type = "playback";
  } catch {
    /* unsupported — nothing to change */
  }
}

/** `new AudioContext()` with the webkit fallback and the playback session set, or null. */
export function createAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    preferPlaybackAudioSession();
    return new AudioContextClass();
  } catch {
    return null;
  }
}

/**
 * Resume a context that isn't running — suspended by autoplay policy or
 * interrupted by iOS. Call it synchronously inside the click that should make
 * sound: Safari only honours a resume made during the user gesture.
 */
export function wakeAudioContext(ctx: AudioContext): void {
  // "interrupted" is Safari-only and missing from the DOM typings.
  const state = ctx.state as AudioContextState | "interrupted";
  if (state === "running" || state === "closed") return;
  preferPlaybackAudioSession();
  void ctx.resume().catch(() => {});
}
