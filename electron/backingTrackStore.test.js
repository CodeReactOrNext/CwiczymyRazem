import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import * as backingTrackStore from "./backingTrackStore";

// electron's `app` module only exists inside the real Electron runtime, so use
// the test-only directory override (same approach as toneStore.test.js).
const testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "backing-track-store-test-"));
backingTrackStore._setUserDataDirForTests(testUserDataDir);

const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "backing-track-src-"));

function writeSourceFile(name, bytes = 2048) {
  const filePath = path.join(sourceDir, name);
  fs.writeFileSync(filePath, Buffer.alloc(bytes, 7));
  return filePath;
}

function resetStore() {
  fs.rmSync(path.join(testUserDataDir, "backing-tracks"), { recursive: true, force: true });
  fs.rmSync(path.join(testUserDataDir, "backing-assignments.json"), { force: true });
}

afterAll(() => {
  fs.rmSync(testUserDataDir, { recursive: true, force: true });
  fs.rmSync(sourceDir, { recursive: true, force: true });
});

beforeEach(resetStore);

describe("backingTrackStore library", () => {
  it("starts with an empty track list", () => {
    expect(backingTrackStore.listTracks()).toEqual([]);
  });

  it("copies an imported file into the store and keeps its bytes readable", () => {
    const meta = backingTrackStore.importTrack(writeSourceFile("Sweet Child.mp3"));

    expect(meta).toMatchObject({
      name: "Sweet Child",
      fileName: "Sweet Child.mp3",
      ext: ".mp3",
      mimeType: "audio/mpeg",
      size: 2048,
    });
    expect(backingTrackStore.listTracks()).toHaveLength(1);

    const track = backingTrackStore.readTrack(meta.id);
    expect(track.mimeType).toBe("audio/mpeg");
    expect(track.data.length).toBe(2048);
  });

  it("survives the original file being deleted (import is a copy, not a reference)", () => {
    const source = writeSourceFile("Temporary.wav");
    const meta = backingTrackStore.importTrack(source);
    fs.rmSync(source);

    expect(backingTrackStore.readTrack(meta.id).data.length).toBe(2048);
  });

  it("rejects an unsupported container", () => {
    expect(() => backingTrackStore.importTrack(writeSourceFile("riff.gp5"))).toThrow(/Unsupported audio format/);
  });

  it("rejects a file above the size cap", () => {
    const oversized = path.join(sourceDir, "huge.mp3");
    fs.writeFileSync(oversized, Buffer.alloc(1024));
    fs.truncateSync(oversized, backingTrackStore.MAX_TRACK_BYTES + 1);

    expect(() => backingTrackStore.importTrack(oversized)).toThrow(/capped at/);
  });

  it("returns null for a track that was never imported", () => {
    expect(backingTrackStore.readTrack("bt_missing")).toBeNull();
  });

  it("deletes both the audio file and its metadata", () => {
    const meta = backingTrackStore.importTrack(writeSourceFile("Gone.mp3"));
    backingTrackStore.deleteTrack(meta.id);

    expect(backingTrackStore.listTracks()).toEqual([]);
    expect(backingTrackStore.readTrack(meta.id)).toBeNull();
  });
});

describe("backingTrackStore assignments", () => {
  it("returns null for a song with no backing track", () => {
    expect(backingTrackStore.getAssignment("song-1")).toBeNull();
  });

  it("fills in defaults on first save", () => {
    const saved = backingTrackStore.saveAssignment("song-1", { stems: [{ trackId: "bt_1" }] });

    expect(saved).toMatchObject({ offsetMs: 0, sourceBpm: 120, volume: 0.8, muted: false });
    expect(saved.stems).toEqual([{ trackId: "bt_1", volume: 1, muted: false, offsetMs: 0 }]);
  });

  it("keeps several stems of one recording in the order they were added", () => {
    const saved = backingTrackStore.saveAssignment("song-1", {
      stems: [{ trackId: "backing" }, { trackId: "guitar" }, { trackId: "vocals" }],
    });

    expect(saved.stems.map((s) => s.trackId)).toEqual(["backing", "guitar", "vocals"]);
  });

  it("gives every stem its own level and mute", () => {
    const saved = backingTrackStore.saveAssignment("song-1", {
      stems: [
        { trackId: "backing", volume: 0.6 },
        { trackId: "guitar", volume: 0.2, muted: true },
      ],
    });

    expect(saved.stems).toEqual([
      { trackId: "backing", volume: 0.6, muted: false, offsetMs: 0 },
      { trackId: "guitar", volume: 0.2, muted: true, offsetMs: 0 },
    ]);
  });

  it("refuses to store the same stem twice", () => {
    const saved = backingTrackStore.saveAssignment("song-1", {
      stems: [{ trackId: "backing" }, { trackId: "backing" }],
    });

    expect(saved.stems).toHaveLength(1);
  });

  it("caps how many stems one song can hold", () => {
    const many = Array.from({ length: backingTrackStore.MAX_STEMS + 3 }, (_, i) => ({
      trackId: `bt_${i}`,
    }));
    const saved = backingTrackStore.saveAssignment("song-1", { stems: many });

    expect(saved.stems).toHaveLength(backingTrackStore.MAX_STEMS);
  });

  it("ignores stem entries with no track behind them", () => {
    const saved = backingTrackStore.saveAssignment("song-1", {
      stems: [{ trackId: "backing" }, { volume: 0.5 }, null],
    });

    expect(saved.stems.map((s) => s.trackId)).toEqual(["backing"]);
  });

  it("reads a pre-stems assignment as a single stem", () => {
    // Written by a version that only supported one file per song.
    backingTrackStore.saveAssignment("song-1", { sourceBpm: 96 });
    const raw = backingTrackStore.listAssignments();
    raw["song-1"] = { trackId: "legacy", offsetMs: 320, sourceBpm: 96 };
    fs.writeFileSync(path.join(testUserDataDir, "backing-assignments.json"), JSON.stringify(raw));

    const migrated = backingTrackStore.getAssignment("song-1");

    expect(migrated.stems).toEqual([{ trackId: "legacy", volume: 1, muted: false, offsetMs: 0 }]);
    expect(migrated.offsetMs).toBe(320);
  });

  it("merges partial updates instead of replacing the whole assignment", () => {
    backingTrackStore.saveAssignment("song-1", { stems: [{ trackId: "bt_1" }], sourceBpm: 96 });
    const saved = backingTrackStore.saveAssignment("song-1", { offsetMs: -320 });

    expect(saved.stems.map((s) => s.trackId)).toEqual(["bt_1"]);
    expect(saved.sourceBpm).toBe(96);
    expect(saved.offsetMs).toBe(-320);
  });

  it("clamps out-of-range values rather than storing them", () => {
    const saved = backingTrackStore.saveAssignment("song-1", { sourceBpm: 5000, volume: 4, offsetMs: 1e9 });

    expect(saved.sourceBpm).toBe(400);
    expect(saved.volume).toBe(1);
    expect(saved.offsetMs).toBe(60_000);
  });

  it("ignores non-numeric values and keeps the previous ones", () => {
    backingTrackStore.saveAssignment("song-1", { sourceBpm: 96 });
    const saved = backingTrackStore.saveAssignment("song-1", { sourceBpm: "fast" });

    expect(saved.sourceBpm).toBe(96);
  });

  it("keeps assignments of different songs independent", () => {
    backingTrackStore.saveAssignment("song-1", { stems: [{ trackId: "bt_1" }] });
    backingTrackStore.saveAssignment("song-2", { stems: [{ trackId: "bt_2" }] });

    expect(backingTrackStore.getAssignment("song-1").stems[0].trackId).toBe("bt_1");
    expect(backingTrackStore.getAssignment("song-2").stems[0].trackId).toBe("bt_2");
  });

  it("drops a deleted track from a song's stems but keeps the rest aligned", () => {
    const meta = backingTrackStore.importTrack(writeSourceFile("Guitar.mp3"));
    backingTrackStore.saveAssignment("song-1", {
      stems: [{ trackId: "backing" }, { trackId: meta.id }],
      offsetMs: 250,
    });

    backingTrackStore.deleteTrack(meta.id);

    const after = backingTrackStore.getAssignment("song-1");
    expect(after.stems.map((s) => s.trackId)).toEqual(["backing"]);
    expect(after.offsetMs).toBe(250);
  });

  it("clears one song's assignment on request", () => {
    backingTrackStore.saveAssignment("song-1", { stems: [{ trackId: "bt_1" }] });
    backingTrackStore.clearAssignment("song-1");

    expect(backingTrackStore.getAssignment("song-1")).toBeNull();
  });
});
