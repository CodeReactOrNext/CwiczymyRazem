import type { RecordingUpdateData } from "feature/recordings/types/types";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

/**
 * Lets the author fix the text of a recording they already shared (title,
 * description, linked song and the video link itself). Author fields, likes and
 * the comment count are never touched — only what the owner typed.
 */
export const updateRecording = async (
  recordingId: string,
  userId: string,
  data: RecordingUpdateData,
) => {
  const recordingRef = doc(db, "recordings", recordingId);

  await runTransaction(db, async (transaction) => {
    const recordingDoc = await transaction.get(recordingRef);
    if (!recordingDoc.exists()) {
      throw new Error("Recording does not exist");
    }

    if (recordingDoc.data().userId !== userId) {
      throw new Error("Unauthorized to edit this recording");
    }

    transaction.update(recordingRef, {
      videoUrl: data.videoUrl,
      title: data.title,
      description: data.description,
      songId: data.songId || null,
      songTitle: data.songTitle || null,
      songArtist: data.songArtist || null,
      // Kept in sync with addRecording so an edited recording stays searchable
      // under its new title / song.
      searchString: `${data.title} ${data.songTitle || ""} ${data.songArtist || ""}`.toLowerCase(),
      updatedAt: serverTimestamp(),
    });
  });
};
