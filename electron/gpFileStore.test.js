import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import * as gpFileStore from "./gpFileStore";

// electron's `app` module only exists inside the real Electron runtime, so use
// the test-only directory override (same approach as backingTrackStore.test.js).
const testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "gp-file-store-test-"));
gpFileStore._setUserDataDirForTests(testUserDataDir);

afterAll(() => {
  fs.rmSync(testUserDataDir, { recursive: true, force: true });
});

beforeEach(() => {
  fs.rmSync(path.join(testUserDataDir, "gp-files"), { recursive: true, force: true });
});

const bytes = (n = 2048) => new Uint8Array(n).fill(7);

describe("gpFileStore", () => {
  it("starts empty", () => {
    expect(gpFileStore.listFiles()).toEqual([]);
  });

  it("saves a file and reads the same bytes back", () => {
    const meta = gpFileStore.saveFile("Master of Puppets.gp5", bytes(4096), "folderA");

    expect(meta).toMatchObject({ name: "Master of Puppets.gp5", ext: ".gp5", size: 4096, folderId: "folderA" });
    expect(meta.id).toMatch(/^gpl_/);
    expect(gpFileStore.listFiles()).toEqual([meta]);

    const read = gpFileStore.readFile(meta.id);
    expect(read?.name).toBe("Master of Puppets.gp5");
    expect(read?.data.length).toBe(4096);
  });

  it("accepts files far above the 1.5 MB cloud cap", () => {
    const meta = gpFileStore.saveFile("Big.gp", bytes(5 * 1024 * 1024));
    expect(meta.size).toBe(5 * 1024 * 1024);
  });

  it("rejects anything that is not a Guitar Pro file", () => {
    expect(() => gpFileStore.saveFile("song.mp3", bytes())).toThrow(/not a Guitar Pro file/);
    expect(() => gpFileStore.saveFile("", bytes())).toThrow();
  });

  it("rejects an empty file", () => {
    expect(() => gpFileStore.saveFile("empty.gp5", new Uint8Array(0))).toThrow(/empty/);
  });

  it("keeps only the base name of a path-like name", () => {
    const meta = gpFileStore.saveFile("../../evil/tab.gpx", bytes());
    expect(meta.name).toBe("tab.gpx");
  });

  it("drops a malformed folder id", () => {
    expect(gpFileStore.saveFile("a.gp5", bytes(), "../x").folderId).toBeNull();
  });

  it("moves a file between folders", () => {
    const meta = gpFileStore.saveFile("a.gp5", bytes());
    expect(gpFileStore.moveFile(meta.id, "folderB")?.folderId).toBe("folderB");
    expect(gpFileStore.moveFile(meta.id, null)?.folderId).toBeNull();
    expect(gpFileStore.listFiles()[0].folderId).toBeNull();
  });

  it("deletes a file and its metadata", () => {
    const meta = gpFileStore.saveFile("a.gp5", bytes());
    gpFileStore.deleteFile(meta.id);
    expect(gpFileStore.listFiles()).toEqual([]);
    expect(gpFileStore.readFile(meta.id)).toBeNull();
  });

  it("refuses ids that could escape the store directory", () => {
    expect(gpFileStore.readFile("../secrets")).toBeNull();
    expect(gpFileStore.moveFile("../secrets", null)).toBeNull();
    expect(() => gpFileStore.deleteFile("../secrets")).not.toThrow();
  });
});
