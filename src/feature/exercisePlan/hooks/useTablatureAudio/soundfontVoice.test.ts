import type Soundfont from "soundfont-player";
import { describe, expect, it, vi } from "vitest";

import { attackLeadFor, attackLeadOf, playSoundfontNote } from "./soundfontVoice";

/** A mono buffer: `leadSec` of near-silence, then a decaying 55 Hz pluck. */
function pluckBuffer(leadSec: number, sampleRate = 44100): AudioBuffer {
  const data = new Float32Array(Math.round(sampleRate * 1));
  const start = Math.round(leadSec * sampleRate);
  for (let i = 0; i < data.length; i++) {
    const t = (i - start) / sampleRate;
    data[i] = i < start ? 0.001 * Math.sin(i) : Math.exp(-t * 3) * Math.sin(2 * Math.PI * 55 * t + Math.PI / 2);
  }
  return { sampleRate, length: data.length, getChannelData: () => data } as unknown as AudioBuffer;
}

/** Stand-in for the GainNode `sample-player` hands back, pre-wired to the one
 *  output the instrument was connected to when it loaded. */
function fakeVoice(hardwareOut: object) {
  const connectedTo: object[] = [hardwareOut];
  return {
    connectedTo,
    connect: vi.fn((node: object) => { connectedTo.push(node); }),
    disconnect: vi.fn(() => { connectedTo.length = 0; }),
  };
}

function fakePlayer(voice: unknown) {
  return { play: vi.fn(() => voice) } as unknown as Soundfont.Player;
}

describe("playSoundfontNote", () => {
  it("re-routes the voice to the given destination instead of the instrument output", () => {
    const hardwareOut = { id: "ctx.destination" };
    const trackGain   = { id: "trackGain" };
    const voice  = fakeVoice(hardwareOut);
    const player = fakePlayer(voice);

    playSoundfontNote(player, "60", 1.5, { duration: 0.4, gain: 0.65, destination: trackGain as never });

    // The whole point: the note must not reach the output the instrument was
    // loaded against, or per-track volume and pan never touch it.
    expect(voice.connectedTo).toEqual([trackGain]);
  });

  it("does not pass `destination` to the library, which ignores it per note", () => {
    const voice  = fakeVoice({ id: "ctx.destination" });
    const player = fakePlayer(voice);

    playSoundfontNote(player, "60", 1.5, { duration: 0.4, gain: 0.65, destination: {} as never });

    expect(player.play).toHaveBeenCalledWith("60", 1.5, { duration: 0.4, gain: 0.65 });
  });

  it("returns the voice so callers can stop or bend it", () => {
    const voice = fakeVoice({});
    expect(playSoundfontNote(fakePlayer(voice), "60", 0, {
      duration: 1, gain: 1, destination: {} as never,
    })).toBe(voice);
  });

  it("survives a voice that never started", () => {
    expect(playSoundfontNote(fakePlayer(null), "60", 0, {
      duration: 1, gain: 1, destination: {} as never,
    })).toBeNull();
  });
});

describe("attackLeadOf", () => {
  it("finds where the attack arrives in the buffer", () => {
    expect(attackLeadOf(pluckBuffer(0.035))).toBeCloseTo(0.035, 3);
    expect(attackLeadOf(pluckBuffer(0))).toBeCloseTo(0, 3);
  });

  it("never moves a note by more than a lead-in's worth", () => {
    expect(attackLeadOf(pluckBuffer(0.2))).toBe(0.08);
  });

  it("leaves a silent buffer where it is", () => {
    const silent = { sampleRate: 44100, length: 4410, getChannelData: () => new Float32Array(4410) } as unknown as AudioBuffer;
    expect(attackLeadOf(silent)).toBe(0);
  });
});

describe("attackLeadFor", () => {
  it("reads the buffer the player keeps under the MIDI number", () => {
    const player = { buffers: { 28: pluckBuffer(0.02) } } as unknown as Soundfont.Player;
    expect(attackLeadFor(player, 28)).toBeCloseTo(0.02, 3);
  });

  it("is 0 for a note the player has no buffer for", () => {
    expect(attackLeadFor({ buffers: {} } as unknown as Soundfont.Player, 28)).toBe(0);
    expect(attackLeadFor({} as unknown as Soundfont.Player, 28)).toBe(0);
  });
});
