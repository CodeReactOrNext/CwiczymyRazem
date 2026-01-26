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

    const genreFilters = filters.genres.filter(g => g !== "Any");

    let pool: Song[] = [];

    if (genreFilters.length > 0) {
      // Priority: Genres. Fetch songs matching chosen genres (up to 100)
      const { songs } = await getSongs(
        "popularity",
        "desc",
        "",
        "",
        1,
        100,
        [], // Skip tiers on server to allow genre filter to work
        "all",
        genreFilters
      );
      // Filter tiers locally
      pool = songs.filter((s: Song) => tiers.includes(s.tier || ""));

      // If pool is empty after tier filtering, relax tier requirements for these genres
      if (pool.length === 0) {
        pool = songs;
      }
    } else {
      // No genres selected (or "Any"): Fetch by tiers
      const { songs } = await getSongs(
        "popularity",
        "desc",
        "",
        "",
        1,
        50,
        tiers,
        "all",
        []
      );
      pool = songs;
    }

    let results = [...pool];

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
