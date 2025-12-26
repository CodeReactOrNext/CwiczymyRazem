import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

interface Song {
  title: string;
  artist: string;
  album?: string;
  year?: number;
  popularity?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist } = req.query;

  if (!artist || typeof artist !== 'string') {
    return res.status(400).json({ error: 'Artist parameter is required' });
  }

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Spotify credentials not configured');
    return res.status(500).json({ error: 'Spotify credentials not configured' });
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

    // Search for artist
    const artistSearchTerm = encodeURIComponent(artist);
    const artistResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${artistSearchTerm}&type=artist&limit=1&market=PL`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const artists = artistResponse.data.artists?.items || [];
    if (artists.length === 0) {
      return res.status(404).json({ error: `Artist "${artist}" not found` });
    }

    const artistId = artists[0].id;

    // Get artist's top tracks and albums
    const [topTracksResponse, albumsResponse] = await Promise.all([
      axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=PL`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=5&market=PL`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);

    const tracks = topTracksResponse.data.tracks || [];
    const albums = albumsResponse.data.items || [];

    // Get tracks from top albums
    const albumPromises = albums.slice(0, 2).map((album: any) =>
      axios.get(`https://api.spotify.com/v1/albums/${album.id}/tracks?limit=5&market=PL`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).catch(err => {
        console.error(`Error fetching tracks for album ${album.name}:`, err);
        return { data: { items: [] } };
      })
    );

    const albumResponses = await Promise.all(albumPromises);
    const albumTracks = albumResponses.flatMap(response => response.data.items || []);

    // Combine, deduplicate and format tracks
    const allTracks = [...tracks, ...albumTracks];
    const uniqueTracks = allTracks.filter((track, index, self) =>
      index === self.findIndex(t => t.name === track.name)
    );

    const songs: Song[] = uniqueTracks.slice(0, 20).map((track: any) => ({
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      album: track.album?.name,
      year: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : undefined,
      popularity: track.popularity || 50
    }));

    res.status(200).json({ songs });
  } catch (error: any) {
    console.error("Error fetching artist songs:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch artist songs from Spotify"
    });
  }

  return;
}
