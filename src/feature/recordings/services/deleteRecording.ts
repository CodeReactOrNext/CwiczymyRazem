import { deleteDoc, doc, runTransaction } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const deleteRecording = async (recordingId: string, userId: string) => {
  const recordingRef = doc(db, "recordings", recordingId);

  await runTransaction(db, async (transaction) => {
    const recordingDoc = await transaction.get(recordingRef);
    if (!recordingDoc.exists()) {
      throw new Error("Recording does not exist");
    }

    const data = recordingDoc.data();
    if (data.userId !== userId) {
      throw new Error("Unauthorized to delete this recording");
    }

    // We might want to delete subcollection "comments" too, 
    // but client-side recursive delete is tricky. 
    // For now, we delete the main doc. 
    // Ideally, a detailed cloud function handles recursive cleanup.

    transaction.delete(recordingRef);
  });
};
