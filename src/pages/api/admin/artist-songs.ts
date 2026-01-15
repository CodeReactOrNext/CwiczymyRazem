import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

interface Song {
  spotifyId: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  year?: number;
  popularity?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist, offset } = req.query;
  const currentOffset = parseInt(offset as string) || 0;

  if (!artist || typeof artist !== 'string') {
    return res.status(400).json({ error: 'Artist parameter is required' });
  }

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Spotify credentials missing in ENV:', { clientId: !!clientId, clientSecret: !!clientSecret });
    return res.status(500).json({
      error: 'Spotify API not configured. Please ensure NEXT_PUBLIC_SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in your .env file and RESTART the server.'
    });
  }

  try {
    // Get Spotify access token
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

    // Use a more flexible search. artist:"Name" is strict.
    // We try both strict and relaxed if strict fails.
    const searchTracks = async (queryStr: string, offset = 0) => {
      try {
        let response = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(queryStr)}&type=track&limit=50&offset=${offset}&market=PL`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        // If PL market returns no tracks, try US market as a fallback
        if (!response.data.tracks?.items || response.data.tracks.items.length === 0) {
          response = await axios.get(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(queryStr)}&type=track&limit=50&offset=${offset}&market=US`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }
        return response.data.tracks?.items || [];
      } catch (err) {
        console.error("Spotify Search Error:", err);
        return [];
      }
    };

    // Try strict artist search first
    let rawTracks = await searchTracks(`artist:"${artist}"`, currentOffset);

    // If strict search returns very few results on the first page, try relaxed search
    if (currentOffset === 0 && rawTracks.length < 10) {
      const relaxedTracks = await searchTracks(artist, 0);
      rawTracks = [...rawTracks, ...relaxedTracks];
    }

    // Deduplication and Filtering
    const normalizedSongs = new Map<string, Song>();

    for (const track of rawTracks) {
      const mainArtist = track.artists[0]?.name || "";

      // Verification: Does the artist name appear in the track's artists?
      const hasArtistMatch = track.artists.some((a: any) =>
        a.name.toLowerCase().includes(artist.toLowerCase()) ||
        artist.toLowerCase().includes(a.name.toLowerCase())
      );

      if (!hasArtistMatch) continue;

      const title = track.name;
      // Key: title + first artist
      const key = `${title.toLowerCase().trim()}|${mainArtist.toLowerCase().trim()}`;

      if (!normalizedSongs.has(key)) {
        normalizedSongs.set(key, {
          spotifyId: track.id,
          title: title,
          artist: track.artists.map((a: any) => a.name).join(", "),
          album: track.album?.name,
          coverUrl: track.album?.images?.[0]?.url,
          year: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : undefined,
          popularity: track.popularity || 50
        });
      }
    }

    const songs = Array.from(normalizedSongs.values())
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // We can't easily get the total for mixed searches, but we can return the raw total from the last search
    // Or just a hasMore flag. Let's return total.
    return res.status(200).json({ songs, total: songs.length });
  } catch (error: any) {
    console.error("Fatal Spotify API Error:", error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data?.error?.message || error.message || "Spotify connection failed"
    });
  }

  return;
}
