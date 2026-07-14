import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";
import { removeUserSong } from "feature/songs/services/removeUserSong";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  arrayRemove: vi.fn(),
  increment: vi.fn((n: number) => ({ __increment: n })),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

vi.mock("feature/report/services/updateSeasonalPoints", () => ({
  updateSeasonalPoints: vi.fn(),
}));

const songSnapshotMissing = { exists: () => false, data: () => undefined };

const mockUserSongsSnapshot = (data: Record<string, unknown> | null) => {
  vi.mocked(doc).mockImplementation((...args: any[]) => ({
    __isUserSongs: args.includes("userSongs"),
  }) as any);

  vi.mocked(getDoc).mockImplementation(async (ref: any) => {
    if (ref?.__isUserSongs) {
      return data
        ? ({ exists: () => true, data: () => data } as any)
        : songSnapshotMissing;
    }
    return songSnapshotMissing as any;
  });
};

describe("removeUserSong", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subtracts points when the song was learned and points were actually awarded", async () => {
    mockUserSongsSnapshot({ status: "learned", pointsAwarded: true });

    const result = await removeUserSong("user1", "song1");

    expect(result.pointsAdded).toBe(-40);
    expect(updateSeasonalPoints).toHaveBeenCalledWith("user1", -40);
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ "statistics.points": expect.anything() })
    );
    expect(deleteDoc).toHaveBeenCalled();
  });

  it("does not subtract points when the song is learned but points were never awarded", async () => {
    mockUserSongsSnapshot({ status: "learned", pointsAwarded: false });

    const result = await removeUserSong("user1", "song1");

    expect(result.pointsAdded).toBe(0);
    expect(updateSeasonalPoints).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ "statistics.points": expect.anything() })
    );
  });

  it("does not subtract points for songs that were never learned", async () => {
    mockUserSongsSnapshot({ status: "learning", pointsAwarded: false });

    const result = await removeUserSong("user1", "song1");

    expect(result.pointsAdded).toBe(0);
    expect(updateSeasonalPoints).not.toHaveBeenCalled();
  });

  it("does not subtract points when the userSongs doc does not exist", async () => {
    mockUserSongsSnapshot(null);

    const result = await removeUserSong("user1", "song1");

    expect(result.pointsAdded).toBe(0);
    expect(updateSeasonalPoints).not.toHaveBeenCalled();
  });
});
