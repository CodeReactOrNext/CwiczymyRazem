import { playChime } from "lib/uiSounds/uiSounds";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { playAnswerChime } from "./answerChime";

vi.mock("lib/uiSounds/uiSounds", () => ({ playChime: vi.fn() }));

describe("playAnswerChime", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rings the found note, so it never clashes with the interval", () => {
    playAnswerChime("A", false);
    const [notes] = vi.mocked(playChime).mock.calls[0];
    expect(notes.map((note) => Math.round(note.freq))).toEqual([880]);
  });

  it("adds the octave once the round is solved", () => {
    playAnswerChime("A", true);
    const [notes] = vi.mocked(playChime).mock.calls[0];
    expect(notes.map((note) => Math.round(note.freq))).toEqual([880, 1760]);
  });

  it("stays silent for a note it doesn't know", () => {
    playAnswerChime("", true);
    expect(playChime).not.toHaveBeenCalled();
  });
});
