import { firebaseAddSongsLog } from "feature/logs/services/addSongsLog.service";
import { ensureSongIsLearning,updateSongStatus } from "feature/songs/services/udateSongStatus";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn(),
  increment: vi.fn(),
  Timestamp: { now: vi.fn(() => "now") },
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

vi.mock("feature/report/services/updateSeasonalPoints", () => ({
  updateSeasonalPoints: vi.fn(),
}));

vi.mock("feature/logs/services/addSongsLog.service", () => ({
  firebaseAddSongsLog: vi.fn(),
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

describe("updateSongStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not log an activity entry when the status is unchanged", async () => {
    mockUserSongsSnapshot({ status: "learning", pointsAwarded: false });

    await updateSongStatus("user1", "song1", "Title", "Artist", "learning", undefined);

    expect(firebaseAddSongsLog).not.toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
  });

  it("logs an activity entry when the status changes", async () => {
    mockUserSongsSnapshot({ status: "wantToLearn", pointsAwarded: false });

    await updateSongStatus("user1", "song1", "Title", "Artist", "learning", undefined);

    expect(firebaseAddSongsLog).toHaveBeenCalledWith(
      "user1",
      expect.any(String),
      "Title",
      "Artist",
      "learning",
      undefined,
      undefined,
      "song1"
    );
  });

  it("does not double-award points when re-saving an already-learned status", async () => {
    mockUserSongsSnapshot({ status: "learned", pointsAwarded: true });

    const result = await updateSongStatus("user1", "song1", "Title", "Artist", "learned", undefined);

    expect(result.pointsAdded).toBe(0);
    expect(firebaseAddSongsLog).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ "statistics.points": expect.anything() })
    );
  });
});

describe("ensureSongIsLearning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves an untracked song to learning", async () => {
    mockUserSongsSnapshot(null);

    await ensureSongIsLearning("user1", "song1", "Title", "Artist", undefined);

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "learning" }),
      { merge: true }
    );
  });

  it("moves a 'want to learn' song to learning", async () => {
    mockUserSongsSnapshot({ status: "wantToLearn", pointsAwarded: false });

    await ensureSongIsLearning("user1", "song1", "Title", "Artist", undefined);

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "learning" }),
      { merge: true }
    );
  });

  it("does not touch a song that is already learning", async () => {
    mockUserSongsSnapshot({ status: "learning", pointsAwarded: false });

    await ensureSongIsLearning("user1", "song1", "Title", "Artist", undefined);

    expect(setDoc).not.toHaveBeenCalled();
  });

  it("does not downgrade a song that is already learned", async () => {
    mockUserSongsSnapshot({ status: "learned", pointsAwarded: true });

    await ensureSongIsLearning("user1", "song1", "Title", "Artist", undefined);

    expect(setDoc).not.toHaveBeenCalled();
  });
});
