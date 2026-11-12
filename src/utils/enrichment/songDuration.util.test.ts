import { describe, expect, it, vi } from "vitest";

vi.mock("./enrichment.util", () => ({ getSpotifyAccessToken: vi.fn() }));

import { pickTrackDurationMs } from "./songDuration.util";

const track = (name: string, artists: string[], duration_ms: number) => ({
  name,
  duration_ms,
  artists: artists.map((artist) => ({ name: artist })),
});

describe("pickTrackDurationMs", () => {
  it("takes the studio cut with the same title and artist, ignoring version tails", () => {
    const tracks = [
      track("Seek & Destroy - Live", ["Metallica"], 1_100_000),
      track("Seek & Destroy (Remastered)", ["Metallica"], 415_000),
    ];

    expect(pickTrackDurationMs(tracks, "Metallica", "Seek & Destroy")).toBe(
      415_000,
    );
  });

  it("settles for a live take when that is the only match", () => {
    const tracks = [track("Seek & Destroy - Live", ["Metallica"], 1_100_000)];

    expect(pickTrackDurationMs(tracks, "Metallica", "Seek & Destroy")).toBe(
      1_100_000,
    );
  });

  it("matches a song stored with all of its artists", () => {
    const tracks = [track("Under Pressure", ["Queen", "David Bowie"], 248_000)];

    expect(
      pickTrackDurationMs(tracks, "Queen, David Bowie", "Under Pressure"),
    ).toBe(248_000);
  });

  it("gives no length for a hit by someone else or with another title", () => {
    const tracks = [
      track("Breaking the Law", ["Some Cover Band"], 160_000),
      track("Breaking the Habit", ["Judas Priest"], 200_000),
    ];

    expect(
      pickTrackDurationMs(tracks, "Judas Priest", "Breaking the Law"),
    ).toBeNull();
  });
});
