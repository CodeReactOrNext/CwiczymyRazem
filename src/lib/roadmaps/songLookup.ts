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
 * Looks the song up in the `songs` collection. Two cheap reads: the exact
 * lower-cased title, then a prefix on it for the "(Live)" and "- Remastered"
 * variants the library stores under a longer name. Nothing is ever created.
 */
export const findLibrarySong = async (
  request: SongRequest,
): Promise<RoadmapSongRef | null> => {
  const title = request.title.trim().toLowerCase();
  if (!title) return null;

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
