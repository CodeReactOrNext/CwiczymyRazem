import { describe, expect, it } from "vitest";

import { isSongPackFile, isSongPackSource, isSongPackTab, readSongPackTab } from "./songPackFiles";

describe("song package file names", () => {
  it("tells a package and its tab from a Guitar Pro file", () => {
    expect(isSongPackSource("Song_p.PSARC")).toBe(true);
    expect(isSongPackTab("The Band - Song.rqpack")).toBe(true);
    expect(isSongPackFile("song.gp5")).toBe(false);
    expect(isSongPackFile(undefined)).toBe(false);
  });

  it("counts both as something that must stay on the computer", () => {
    expect(isSongPackFile("a.psarc")).toBe(true);
    expect(isSongPackFile("a.rqpack")).toBe(true);
  });
});

describe("readSongPackTab", () => {
  const file = (content: unknown) => new File([JSON.stringify(content)], "song.rqpack");

  it("reads a stored tab", async () => {
    const tab = await readSongPackTab(file({ format: 1, title: "Song", parts: [{ name: "Lead" }], audioTrackId: "bt_1" }));
    expect(tab).toMatchObject({ title: "Song", artist: "", audioTrackId: "bt_1" });
    expect(tab.parts).toHaveLength(1);
  });

  it("reads a tab that came without a recording", async () => {
    expect((await readSongPackTab(file({ parts: [{ name: "Lead" }] }))).audioTrackId).toBeNull();
  });

  it("refuses a file with no parts", async () => {
    await expect(readSongPackTab(file({ parts: [] }))).rejects.toThrow();
  });
});
