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

  // 2. Search Spotify
  const searchTerm = encodeURIComponent(`album:${title} artist:${artist}`);
  const searchResponse = await axios.get(
    `https://api.spotify.com/v1/search?q=${searchTerm}&type=album&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const album = searchResponse.data.albums?.items[0];

  if (album && album.images && album.images.length > 0) {
    const image = album.images[1] || album.images[0];
    return {
      coverUrl: image.url,
      isVerified: true,
      source: "spotify"
    };
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
