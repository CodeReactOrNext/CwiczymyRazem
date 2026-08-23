import type Soundfont from "soundfont-player";

/** What `player.play` actually returns: the GainNode a single note runs through,
 *  carrying the buffer source that feeds it (the library types it as `Player`). */
export interface SoundfontVoice extends GainNode {
  source?: AudioBufferSourceNode;
  stop?: (when?: number) => void;
}

interface PlayIntoOptions {
  duration:    number;
  gain:        number;
  destination: AudioNode;
}

/**
 * Play one sampled note *into a node of our choosing*.
 *
 * soundfont-player documents a `destination` option, but it only reads it when
 * the instrument is **loaded** — `sample-player` wires every voice to the one
 * output node the instrument was connected to back then, and silently ignores
 * the option on `play`. Passing it per note therefore sends the note straight
 * out to `ctx.destination`, past any per-track gain, panner or bus: the mixer
 * ends up doing nothing, and volume reads as an on/off switch (a track only
 * falls silent because muting it stops the notes from being scheduled at all).
 *
 * Re-patching the returned voice is the only per-note routing hook the library
 * gives us, so every sampled note in the app goes through here.
 */
export function playSoundfontNote(
  player: Soundfont.Player,
  name: string,
  when: number,
  { duration, gain, destination }: PlayIntoOptions,
): SoundfontVoice | null {
  const voice = player.play(name, when, { duration, gain }) as unknown as SoundfontVoice | null;
  if (!voice) return null;

  // The voice is created and started synchronously here, so the swap lands in
  // the same render quantum — `when` is always scheduled ahead of it.
  try {
    voice.disconnect();
    voice.connect(destination);
  } catch {
    /* voice already torn down — nothing left to route */
  }
  return voice;
}
