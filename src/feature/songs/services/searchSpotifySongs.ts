import axios from "axios";

export interface SpotifySongSuggestion {
  spotifyId: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  year?: number;
  popularity?: number;
}

export const searchSpotifySongs = async (
  query: string
): Promise<SpotifySongSuggestion[]> => {
  try {
    const response = await axios.get("/api/songs/search-spotify", {
      params: { q: query },
    });
    return response.data.tracks || [];
  } catch (error) {
    console.error("Error searching Spotify:", error);
    return [];
  }
};
