import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { Song } from "feature/songs/types/songs.type";

export interface QuizFilters {
  genre: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  popularity: "classic" | "discovery";
}

export const getQuizRecommendations = async (filters: QuizFilters): Promise<Song[]> => {
  try {
    const songsRef = collection(db, "songs");
    let q = query(songsRef, where("isVerified", "==", true));

    // Map difficulty to tiers
    let tiers: string[] = [];
    if (filters.difficulty === "beginner") tiers = ["D"];
    else if (filters.difficulty === "intermediate") tiers = ["C", "B"];
    else if (filters.difficulty === "advanced") tiers = ["A", "S"];

    q = query(q, where("tier", "in", tiers));

    // Firestore doesn't support multiple disjunctions (in + array-contains-any) well together without indexes.
    // We'll fetch more and filter genre/popularity locally to keep it simple and flexible.

    const snapshot = await getDocs(q);
    let songs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));

    // Filter by genre
    if (filters.genre !== "Any") {
      songs = songs.filter(song => song.genres?.includes(filters.genre));
    }

    // Filter by popularity
    if (filters.popularity === "classic") {
      songs = songs.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else {
      // For discovery, we can shuffle or take lower popularity
      songs = songs.sort(() => Math.random() - 0.5);
    }

    // Return 3 random songs from the top matching ones
    const topMatches = songs.slice(0, 15);
    const shuffled = topMatches.sort(() => Math.random() - 0.5);

    return shuffled.slice(0, 3);
  } catch (error) {
    console.error("Error getting quiz recommendations:", error);
    return [];
  }
};
