import axios from "axios";
import { doc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const enrichSong = async (songId: string, artist: string, title: string) => {
  try {
    // Call our server-side API which now handles the DB update
    const response = await axios.post("/api/songs/enrich", {
      artist,
      title,
      songId,
    });

    return { 
      coverUrl: response.data.coverUrl, 
      isVerified: response.data.isVerified 
    };
  } catch (error: any) {
    console.error(`Error enriching song ${songId}:`, error.response?.data || error.message);
    return null;
  }
};
