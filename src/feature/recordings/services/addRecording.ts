import { firebaseAddRecordingLog } from "feature/logs/services/addRecordingLog.service";
import type { RecordingCreateData } from "feature/recordings/types/types";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc } from "utils/firebase/client/firestoreTracking";

export const addRecording = async (userId: string, data: RecordingCreateData) => {
  const userDocRef = doc(db, "users", userId);
  const userSnapshot = await trackedGetDoc(userDocRef);
  const userData = userSnapshot.data();

  if (!userData) {
    throw new Error("User not found");
  }

  const recordingData = {
    ...data,
    songId: data.songId || null,
    songTitle: data.songTitle || null,
    songArtist: data.songArtist || null,
    userId,
    userDisplayName: userData.displayName,
    userAvatarUrl: userData.photoURL || null,
    createdAt: serverTimestamp(),
    likes: [],
    commentCount: 0,
    searchString: `${data.title} ${data.songTitle || ""} ${data.songArtist || ""}`.toLowerCase(),
  };

  const docRef = await addDoc(collection(db, "recordings"), recordingData);

  // Log the activity
  await firebaseAddRecordingLog(
    userId,
    data.videoUrl,
    data.title,
    data.description,
    docRef.id,
    data.songTitle,
    data.songArtist
  );

  return docRef.id;
};
