import type Soundfont from "soundfont-player";
import { describe, expect, it, vi } from "vitest";

import { playSoundfontNote } from "./soundfontVoice";

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
