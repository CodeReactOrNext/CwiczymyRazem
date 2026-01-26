import { getSongs } from "feature/songs/services/getSongs";
import type { Song } from "feature/songs/types/songs.type";

export interface QuizFilters {
  genres: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  popularity: "classic" | "discovery";
}

export const getQuizRecommendations = async (filters: QuizFilters): Promise<Song[]> => {
  try {
    // Map difficulty to tiers - using broader ranges to ensure results
    let tiers: string[] = [];
    if (filters.difficulty === "beginner") tiers = ["D", "C"];
    else if (filters.difficulty === "intermediate") tiers = ["C", "B", "A"];
    else if (filters.difficulty === "advanced") tiers = ["B", "A", "S"];

    const genreFilters = filters.genres.includes("Any") ? [] : filters.genres;

    // Use the main getSongs logic to fetch a targeted pool of 30 songs
    const { songs: pool } = await getSongs(
      "popularity",
      "desc",
      "",
      "",
      1,
      40, // Slightly larger pool since we might have multiple genres
      tiers.length > 0 ? tiers : undefined,
      "all",
      genreFilters
    );

    let results = [...pool];

    // Fallback: If no results with combinations, try just tiers
    if (results.length === 0 && genreFilters.length > 0) {
      const { songs: fallbackPool } = await getSongs(
        "popularity",
        "desc",
        "",
        "",
        1,
        30,
        tiers,
        "all",
        []
      );
      results = fallbackPool;
    }

    // Sort or shuffle based on preference
    if (filters.popularity === "classic") {
      results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else {
      results.sort(() => Math.random() - 0.5);
    }

    // Return 3 random songs from the targeted pool
    return results.sort(() => Math.random() - 0.5).slice(0, 3);
  } catch (error) {
    console.error("Error getting quiz recommendations:", error);
    return [];
  }
};
