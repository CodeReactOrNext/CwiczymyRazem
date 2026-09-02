import { updateRecording } from "feature/recordings/services/updateRecording";
import { runTransaction } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ __ref: "recording" })),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

/** Runs the callback against a fake transaction over the given stored document. */
const mockTransaction = (stored: Record<string, unknown> | null) => {
  const update = vi.fn();

  vi.mocked(runTransaction).mockImplementation(async (_db: any, callback: any) =>
    callback({
      get: async () => ({
        exists: () => stored !== null,
        data: () => stored ?? undefined,
      }),
      update,
    }),
  );

  return update;
};

const editData = {
  videoUrl: "https://youtu.be/abcdefghijk",
  title: "Nothing Else Matters — take 2",
  description: "Re-recorded the solo",
  songId: "song1",
  songTitle: "Nothing Else Matters",
  songArtist: "Metallica",
};

describe("updateRecording", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes the author's new text and refreshes the search string", async () => {
    const update = mockTransaction({ userId: "user1", likes: ["user2"] });

    await updateRecording("rec1", "user1", editData);

    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: editData.title,
        description: editData.description,
        videoUrl: editData.videoUrl,
        searchString: "nothing else matters — take 2 nothing else matters metallica",
      }),
    );
  });

  it("never overwrites the author, likes or comment count", async () => {
    const update = mockTransaction({ userId: "user1", likes: ["user2"] });

    await updateRecording("rec1", "user1", editData);

    const payload = update.mock.calls[0][1];
    expect(payload).not.toHaveProperty("userId");
    expect(payload).not.toHaveProperty("likes");
    expect(payload).not.toHaveProperty("commentCount");
    expect(payload).not.toHaveProperty("createdAt");
  });

  it("clears the linked song when the author removed it", async () => {
    const update = mockTransaction({ userId: "user1", likes: [] });

    await updateRecording("rec1", "user1", {
      ...editData,
      songId: null,
      songTitle: null,
      songArtist: null,
    });

    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        songId: null,
        songTitle: null,
        songArtist: null,
      }),
    );
  });

  it("refuses to edit somebody else's recording", async () => {
    const update = mockTransaction({ userId: "someoneElse", likes: [] });

    await expect(updateRecording("rec1", "user1", editData)).rejects.toThrow(
      "Unauthorized to edit this recording",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("throws when the recording is gone", async () => {
    const update = mockTransaction(null);

    await expect(updateRecording("rec1", "user1", editData)).rejects.toThrow(
      "Recording does not exist",
    );
    expect(update).not.toHaveBeenCalled();
  });
});
