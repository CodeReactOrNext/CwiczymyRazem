import axios from "axios";

import { getSpotifyAccessToken } from "./enrichment.util";

interface SpotifyTrackLike {
  name?: string;
  duration_ms?: number;
  artists?: { name?: string }[];
}

const LIVE_VERSION = /\blive\b/i;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s*[([].*?[)\]]\s*/g, " ")
    .replace(/\s+-\s+.*$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/**
 * The length of the search hit that is this song: same title (ignoring
 * "(Remastered)" / "- Live" tails) by an artist of the same name, the studio
 * cut before a live one. Anything looser risks a cover or a medley, so no
 * match means no length.
 */
export const pickTrackDurationMs = (
  tracks: readonly SpotifyTrackLike[],
  artist: string,
  title: string,
): number | null => {
  const wantedTitle = normalize(title);
  const wantedArtist = normalize(artist);
  const matches = tracks.filter(
    (track) =>
      normalize(track.name ?? "") === wantedTitle &&
      ((track.artists ?? []).some(
        (candidate) => normalize(candidate.name ?? "") === wantedArtist,
      ) ||
        normalize(
          (track.artists ?? []).map((candidate) => candidate.name).join(", "),
        ) === wantedArtist),
  );
  // A live take runs long with crowd and solos, so the studio cut comes first.
  const match =
    matches.find((track) => !LIVE_VERSION.test(track.name ?? "")) ?? matches[0];
  return match?.duration_ms && match.duration_ms > 0 ? match.duration_ms : null;
};

/**
 * A song's recording length from Spotify: straight from its track when the
 * song carries a spotifyId, otherwise from a title + artist search.
 */
export async function fetchSongDurationMs(song: {
  artist: string;
  title: string;
  spotifyId?: string | null;
}): Promise<number | null> {
  const accessToken = await getSpotifyAccessToken();
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (song.spotifyId) {
    try {
      const response = await axios.get<SpotifyTrackLike>(
        `https://api.spotify.com/v1/tracks/${encodeURIComponent(song.spotifyId)}`,
        { headers },
      );
      const durationMs = response.data.duration_ms;
      if (durationMs && durationMs > 0) return durationMs;
    } catch {
      // An id from an album-level match isn't a track; fall through to search.
    }
  }

  const query = encodeURIComponent(
    `track:"${song.title}" artist:"${song.artist}"`,
  );
  const response = await axios.get(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
    { headers },
  );
  return pickTrackDurationMs(
    response.data.tracks?.items ?? [],
    song.artist,
    song.title,
  );
}
