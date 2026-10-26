import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadScoreFromBytes } = vi.hoisted(() => ({ loadScoreFromBytes: vi.fn() }));

vi.mock("@coderline/alphatab", () => ({
  importer: { ScoreLoader: { loadScoreFromBytes } },
  Settings: class {
    importer = { encoding: "utf-8" };
  },
}));

import { parseGpFile } from "./gp5Parser.service";

/** A score as AlphaTab hands it over, with tracks that have no bars. */
const scoreWithTracks = (...names: string[]) => ({
  tempo: 120,
  tracks: names.map((name) => ({ name, staves: [{ bars: [] }] })),
});

const file = () => new File([new Uint8Array([1, 2, 3])], "song.gp5");

describe("parseGpFile", () => {
  beforeEach(() => loadScoreFromBytes.mockReset());

  it("reads the file once when its names decode as UTF-8", async () => {
    loadScoreFromBytes.mockReturnValue(scoreWithTracks("Lead", "Rhythm"));
    const parsed = await parseGpFile(file());
    expect(parsed.tracks.map((t) => t.name)).toEqual(["Lead", "Rhythm"]);
    expect(loadScoreFromBytes).toHaveBeenCalledTimes(1);
  });

  it("reads it again as Windows-1252 when UTF-8 leaves broken characters in a name", async () => {
    loadScoreFromBytes
      .mockReturnValueOnce(scoreWithTracks("Sp�r 1", "Slagverk"))
      .mockReturnValueOnce(scoreWithTracks("Spår 1", "Slagverk"));
    const parsed = await parseGpFile(file());
    expect(parsed.tracks.map((t) => t.name)).toEqual(["Spår 1", "Slagverk"]);
    expect(loadScoreFromBytes).toHaveBeenLastCalledWith(
      expect.any(Uint8Array),
      expect.objectContaining({ importer: { encoding: "windows-1252" } }),
    );
  });
});
