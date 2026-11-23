import type { RoadmapSongRef } from "feature/aiCoach/types/roadmap.types";
import type { QuerySnapshot } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

/** What the generator asks for: the song a step names, as the model wrote it. */
export interface SongRequest {
  title: string;
  artist: string;
}

/** The fields of a `songs` document the match reads. */
export interface SongCandidate {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

/**
 * Titles and artists as they are compared: lower case, no diacritics, no
 * punctuation, no "(Live at…)" tails, no leading "the". "Little Wing (Live)"
 * and "little wing" are the same song; "Stevie Ray Vaughan" and "Stevie Ray
 * Vaughan & Double Trouble" share a prefix.
 */
export const normaliseSongText = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s*[([].*?[)\]]\s*/g, " ")
    .replace(/[^a-z0-9&\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the\s+/, "");

const artistMatches = (candidate: string, requested: string): boolean => {
  const a = normaliseSongText(candidate);
  const b = normaliseSongText(requested);
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
};

/**
 * The library song a request means, or null. The title has to match exactly
 * once normalised and the artist has to agree — a roadmap that says "Little
 * Wing" by Hendrix must not land on a cover by somebody else, and a step that
 * names a song the library lacks simply gets no song.
 */
export const pickLibrarySong = (
  candidates: SongCandidate[],
  request: SongRequest,
): RoadmapSongRef | null => {
  const title = normaliseSongText(request.title);
  if (!title) return null;

  const match = candidates.find(
    (candidate) =>
      normaliseSongText(candidate.title) === title &&
      artistMatches(candidate.artist, request.artist),
  );
  if (!match) return null;

  return {
    id: match.id,
    title: match.title,
    artist: match.artist,
    ...(match.coverUrl ? { coverUrl: match.coverUrl } : {}),
  };
};

const toCandidate = (
  id: string,
  data: FirebaseFirestore.DocumentData | undefined,
): SongCandidate => ({
  id,
  title: String(data?.title ?? ""),
  artist: String(data?.artist ?? ""),
  ...(data?.coverUrl ? { coverUrl: String(data.coverUrl) } : {}),
});

/**
 * The title without what a careful model adds to it: "Soothsayer (Dedicated
 * to Aunt Suzie)" → "soothsayer", "Going Home: Theme of the Local Hero" →
 * "going home". Null when there is nothing to cut, so no second lookup runs.
 *
 * The library stores the short title; the model writes the official one. The
 * match itself already ignores brackets, but the query that fetches the
 * candidates is on the raw title — so the longer spelling fetched nothing.
 */
export const shortSongTitle = (title: string): string | null => {
  const lower = title.trim().toLowerCase();
  const cut = lower
    .replace(/\s*[([].*$/, "")
    .replace(/\s*:\s.*$/, "")
    .replace(/\s+[-–—]\s.*$/, "")
    .trim();
  return cut && cut !== lower ? cut : null;
};

/** One title's two reads: the exact match, then the prefix. */
const lookUpByTitle = async (
  title: string,
  request: SongRequest,
): Promise<RoadmapSongRef | null> => {
  const songs = firestore.collection("songs");
  const exact = (await songs
    .where("title_lowercase", "==", title)
    .limit(10)
    .get()) as QuerySnapshot;

  let candidates = exact.docs.map((doc) => toCandidate(doc.id, doc.data()));
  let picked = pickLibrarySong(candidates, request);
  if (picked) return picked;

  const prefix = (await songs
    .where("title_lowercase", ">=", title)
    .where("title_lowercase", "<=", `${title}`)
    .limit(10)
    .get()) as QuerySnapshot;
  candidates = prefix.docs.map((doc) => toCandidate(doc.id, doc.data()));
  picked = pickLibrarySong(candidates, request);
  return picked;
};

/**
 * Looks the song up in the `songs` collection. Two cheap reads: the exact
 * lower-cased title, then a prefix on it for the "(Live)" and "- Remastered"
 * variants the library stores under a longer name — and, when the title has a
 * subtitle or a bracket the library may not carry, the same two on the short
 * title. Nothing is ever created.
 */
export const findLibrarySong = async (
  request: SongRequest,
): Promise<RoadmapSongRef | null> => {
  const title = request.title.trim().toLowerCase();
  if (!title) return null;

  const full = await lookUpByTitle(title, request);
  if (full) return full;

  const short = shortSongTitle(request.title);
  return short ? lookUpByTitle(short, { ...request, title: short }) : null;
};

/** How many of an artist's songs the draft is shown — enough to choose from, not a catalogue. */
const MAX_ARTIST_SONGS = 30;

/**
 * The library's songs by one artist, for the draft to pick its repertoire
 * from. Exact match on the lower-cased name: "buckethead", "dire straits".
 */
export const findLibrarySongsByArtist = async (
  artist: string,
): Promise<RoadmapSongRef[]> => {
  const name = artist.trim().toLowerCase();
  if (!name) return [];
  const snap = (await firestore
    .collection("songs")
    .where("artist_lowercase", "==", name)
    .limit(MAX_ARTIST_SONGS)
    .get()) as QuerySnapshot;
  return snap.docs
    .map((doc) => toCandidate(doc.id, doc.data()))
    .filter((song) => song.title && song.artist)
    .map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      ...(song.coverUrl ? { coverUrl: song.coverUrl } : {}),
    }));
};
