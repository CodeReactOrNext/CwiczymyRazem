import axios from "axios";

export async function fetchEnrichmentData(artist: string, title: string) {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  // 1. Get Access Token
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const accessToken = tokenResponse.data.access_token;

  // 2. Search Spotify (Track first for better song matching)
  const searchTerm = encodeURIComponent(`track:${title} artist:${artist}`);
  const searchResponse = await axios.get(
    `https://api.spotify.com/v1/search?q=${searchTerm}&type=track&limit=5&market=PL`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const tracks = searchResponse.data.tracks?.items || [];

  if (tracks.length > 0) {
    const candidates = tracks.map((track: any) => ({
      coverUrl: track.album?.images[0]?.url || null,
      artist: track.artists.map((a: any) => a.name).join(", "),
      title: track.name,
      albumName: track.album?.name,
      source: "spotify",
      artistId: track.artists[0]?.id // Store for genre fetching
    })).filter((c: any) => c.coverUrl);

    if (candidates.length > 0) {
      // Fetch genres for the primary candidate
      let genres: string[] = [];
      if (candidates[0].artistId) {
        try {
          const artistResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${candidates[0].artistId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          genres = artistResponse.data.genres || [];
        } catch (err) {
          console.error("Error fetching Spotify genres:", err);
        }
      }

      // For automated enrichment, we still return the best match
      return {
        coverUrl: candidates[0].coverUrl,
        genres,
        isVerified: true,
        source: "spotify",
        candidates: candidates // Include candidates for manual selection
      };
    }
  }

  // 2b. Fallback to Album search if Track search failed
  const albumSearchTerm = encodeURIComponent(`album:${title} artist:${artist}`);
  const albumSearchResponse = await axios.get(
    `https://api.spotify.com/v1/search?q=${albumSearchTerm}&type=album&limit=5`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const albums = albumSearchResponse.data.albums?.items || [];
  if (albums.length > 0) {
    const candidates = albums.map((album: any) => ({
      coverUrl: album.images[0]?.url || null,
      artist: album.artists.map((a: any) => a.name).join(", "),
      title: album.name,
      albumName: album.name,
      source: "spotify-album",
      artistId: album.artists[0]?.id
    })).filter((c: any) => c.coverUrl);

    if (candidates.length > 0) {
      let genres: string[] = [];
      if (candidates[0].artistId) {
        try {
          const artistResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${candidates[0].artistId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          genres = artistResponse.data.genres || [];
        } catch (err) {
          console.error("Error fetching Spotify genres (album):", err);
        }
      }

      return {
        coverUrl: candidates[0].coverUrl,
        genres,
        isVerified: true,
        source: "spotify-album",
        candidates: candidates
      };
    }
  }

  // 3. Fallback to MusicBrainz
  try {
    const mbSearchUrl = `https://musicbrainz.org/ws/2/recording?query=recording:"${title}" AND artist:"${artist}"&limit=1&fmt=json`;
    const mbResponse = await axios.get(mbSearchUrl, {
      headers: { "User-Agent": "CwiczymyRazem/1.0 (kontakt@riff.quest)" },
    });

    if (mbResponse.data.recordings && mbResponse.data.recordings.length > 0) {
      return {
        coverUrl: null,
        isVerified: true,
        source: "musicbrainz"
      };
    }
  } catch (mbError) {
    console.error("MusicBrainz API Error:", mbError);
  }

  return { coverUrl: null, isVerified: false, source: "none" };
}
