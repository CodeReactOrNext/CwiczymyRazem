/** Level for the strumming pattern's built-in guitar synth.
 *
 *  The strum synth is the session's guitar in a strumming exercise (there is no
 *  tablature for the sampler to play), so it answers to exactly the controls the
 *  player already reaches for: the toolbar's guitar playback toggle and the
 *  volume panel's track row — both of which live on the "main" track config.
 */
export function strumSynthVolume(
  isAudioMuted: boolean,
  mainTrack?: { volume: number; isMuted: boolean },
): number {
  if (isAudioMuted || mainTrack?.isMuted) return 0;
  return Math.max(0, mainTrack?.volume ?? 1);
}
