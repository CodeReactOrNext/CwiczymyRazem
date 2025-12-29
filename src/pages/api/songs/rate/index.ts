import { firebaseAddSongsLog } from "feature/logs/services/addSongsLog.service";
import type { Song } from "feature/songs/types/songs.type";
import { doc, getDoc, Timestamp, updateDoc, increment } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config"; // Admin Auth for verification
import { db } from "utils/firebase/client/firebase.utils"; // Client DB for operations

export interface RateSongInput {
  songId: string;
  rating: number;
  title: string;
  artist: string;
  avatarUrl?: string; // Optional, might be in user token but sent for simplicity or derived
  token: any; // User token for auth verification
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { songId, rating, title, artist, avatarUrl, token, tier } = req.body;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ... (token verification remains same) ...
    const tokenString = token.token || token;
    let userId = "";
    try {
      const decodedToken = await auth.verifyIdToken(tokenString);
      userId = decodedToken.uid;
    } catch (e) {
      console.error("Token verification failed", e);
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const songRef = doc(db, "songs", songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      return res.status(404).json({ message: "Song not found" });
    }

    const song = songDoc.data() as Song;
    const difficulties = song.difficulties || [];

    const existingRatingIndex = difficulties.findIndex((d) => d.userId === userId);
    const isNewRating = existingRatingIndex === -1;

    let newDifficulties;
    if (isNewRating) {
      newDifficulties = [
        ...difficulties,
        {
          userId,
          rating,
          date: Timestamp.now(),
        }
      ];
    } else {
      newDifficulties = difficulties.map(d => {
        if (d.userId === userId) {
          return {
            ...d,
            rating,
            date: Timestamp.now()
          };
        }
        return d;
      });
    }

    const avgDifficulty =
      newDifficulties.reduce((acc, curr) => acc + curr.rating, 0) /
      (newDifficulties.length || 1);

    // Determine final tier
    const getTierFromDifficulty = (diff: number): string => {
        if (diff >= 9) return "S";
        if (diff >= 7.5) return "A";
        if (diff >= 6) return "B";
        if (diff >= 4) return "C";
        return "D";
    };
    
    const finalTier =  getTierFromDifficulty(avgDifficulty);

    // Update Song
    await updateDoc(songRef, {
      difficulties: newDifficulties,
      avgDifficulty,
      tier: finalTier
    });

    // Update User Points (+25) ONLY if new rating (remains same)
    let addedPoints = 0;
    if (isNewRating) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        "statistics.points": increment(25)
      });
      addedPoints = 25;
    }

    // Add Log ...
    await firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      "difficulty_rate",
      avatarUrl,
      rating
    );

    return res.status(200).json({
      success: true,
      difficulties: newDifficulties,
      avgDifficulty,
      tier: finalTier,
      addedPoints
    });

  } catch (error) {
    console.error("Error in rate song API:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
