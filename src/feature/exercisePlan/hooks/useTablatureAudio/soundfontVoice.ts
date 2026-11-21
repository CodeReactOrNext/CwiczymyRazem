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

/** The latest a sample's attack is allowed to start — past this it's not a lead-in. */
const MAX_ATTACK_LEAD_SEC = 0.08;
/** Where the attack is looked for: a plucked note peaks well inside this. */
const ATTACK_SEARCH_SEC = 0.3;
/** The attack "arrives" once the waveform reaches this share of its first peak. */
const ATTACK_LEVEL = 0.5;

const attackLeadCache = new WeakMap<AudioBuffer, number>();

/** How long into the buffer the note's attack arrives (seconds). */
export function attackLeadOf(buffer: AudioBuffer): number {
  const cached = attackLeadCache.get(buffer);
  if (cached !== undefined) return cached;
  const samples = buffer.getChannelData(0);
  const end = Math.min(samples.length, Math.round(ATTACK_SEARCH_SEC * buffer.sampleRate));
  let peak = 0;
  for (let i = 0; i < end; i++) peak = Math.max(peak, Math.abs(samples[i]));
  let lead = 0;
  if (peak > 0) {
    let i = 0;
    while (i < end && Math.abs(samples[i]) < ATTACK_LEVEL * peak) i++;
    lead = Math.min(MAX_ATTACK_LEAD_SEC, i / buffer.sampleRate);
  }
  attackLeadCache.set(buffer, lead);
  return lead;
}

/**
 * How much earlier to start a sampled note so its attack lands on the beat.
 *
 * Pre-rendered soundfont notes don't all start with the attack: the FluidR3
 * bass carries 10–50 ms of lead-in that differs from one note to the next,
 * which is a flam against the metronome. The library can't skip into a buffer,
 * so the note is scheduled that much earlier instead. Its buffers are keyed by
 * MIDI number (sample-player's notes plugin).
 */
export function attackLeadFor(player: Soundfont.Player, midiNote: number): number {
  const buffer = (player as { buffers?: Record<string, AudioBuffer | undefined> }).buffers?.[midiNote];
  return buffer ? attackLeadOf(buffer) : 0;
}
