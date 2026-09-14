/** Level for the strumming pattern's built-in guitar synth.
 *
 *  The strum synth is the session's guitar in a strumming exercise (there is no
 *  tablature for the sampler to play), so it answers to exactly the controls the
 *  player already reaches for: the toolbar's guitar playback toggle and the
 *  volume panel's track row — both of which live on the "main" track config.
 *
 *  The track config is the source of truth, exactly as it is for the tablature
 *  sampler and for AlphaTab: `useSessionAudio` mirrors the toolbar toggle into
 *  `main.isMuted`, so reading the toggle on top of it would only add a second
 *  opinion — one the volume panel cannot overrule. That is what left the panel's
 *  slider dead after the toolbar had muted the guitar once.
 */
export function strumSynthVolume(
  isAudioMuted: boolean,
  mainTrack?: { volume: number; isMuted: boolean },
): number {
  // No track config yet (first render of a session): the toolbar toggle is all
  // there is to go on.
  if (!mainTrack) return isAudioMuted ? 0 : 1;
  if (mainTrack.isMuted) return 0;
  return Math.max(0, mainTrack.volume);
}
