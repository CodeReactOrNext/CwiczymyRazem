import axios from "axios";
import { doc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const enrichSong = async (songId: string, artist: string, title: string) => {
  try {
    // Call our server-side API instead of external API directly
    const response = await axios.post("/api/songs/enrich", {
      artist,
      title,
    });

    const coverUrl = response.data.coverUrl;
    const isVerified = response.data.isVerified;
    const songRef = doc(db, "songs", songId);

    const genres = response.data.genres || [];

    await updateDoc(songRef, {
      coverUrl: coverUrl || null,
      isVerified: !!isVerified,
      coverAttempted: true,
      genres,
    });

    // Maintain global unique genres list for filtering
    if (genres.length > 0) {
      const globalMetaRef = doc(db, "metadata", "global");
      await setDoc(globalMetaRef, {
        genres: arrayUnion(...genres)
      }, { merge: true }).catch(err => console.error("Error updating global genres:", err));
    }

    return { coverUrl, isVerified };
  } catch (error: any) {
    // If 404, we still want to mark it as attempted but NOT verified
    if (error.response?.status === 404) {
      const songRef = doc(db, "songs", songId);
      await updateDoc(songRef, {
        coverUrl: null,
        isVerified: false,
        coverAttempted: true,
      });
    }

    console.error(`Error enriching song ${songId}:`, error.response?.data || error.message);
    return null;
  }
};
