import type { RoadmapSongRef } from "feature/aiCoach/types/roadmap.types";
import { addSong } from "feature/songs/services/addSong";
import { enrichSong } from "feature/songs/services/enrichment.service";
import { getSongs } from "feature/songs/services/getSongs";
import {
  searchSpotifySongs,
  type SpotifySongSuggestion,
} from "feature/songs/services/searchSpotifySongs";
import type { Song } from "feature/songs/types/songs.type";
import { AnimatePresence, motion } from "framer-motion";
import { MAX_BRIEF_SONGS } from "lib/roadmaps/generation/questionBank";
import { Check, Loader2, Music, Plus, Search, X } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { auth } from "utils/firebase/client/firebase.utils";

/** How long typing pauses before the library and Spotify are asked. */
const SEARCH_DEBOUNCE_MS = 250;

interface SongName {
  title: string;
  artist: string;
}

const toRef = (song: Song): RoadmapSongRef => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  ...(song.coverUrl ? { coverUrl: song.coverUrl } : {}),
});

const signature = ({ title, artist }: SongName) =>
  `${title.trim().toLowerCase()}|${artist.trim().toLowerCase()}`;

/**
 * Creates the song in the library, as the playlist picker does, and answers
 * it as a roadmap song. A song somebody added meanwhile is fetched instead
 * of failing — the library copy is the one that should be linked.
 */
const createLibrarySong = async (
  name: SongName,
  spotify: SpotifySongSuggestion | null,
): Promise<RoadmapSongRef> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const title = name.title.trim();
  const artist = name.artist.trim();
  try {
    const id = await addSong(
      title,
      artist,
      user.uid,
      user.photoURL ?? undefined,
      undefined,
      undefined,
      spotify
        ? { coverUrl: spotify.coverUrl, spotifyId: spotify.spotifyId }
        : undefined,
    );
    // Genres and a cover for a song added by name alone; nothing waits on it.
    enrichSong(id, artist, title).catch((error) =>
      console.error("Background enrichment failed:", error),
    );
    return {
      id,
      title,
      artist,
      ...(spotify?.coverUrl ? { coverUrl: spotify.coverUrl } : {}),
    };
  } catch (error) {
    if (!(error instanceof Error && error.message === "song_already_exists")) {
      throw error;
    }
    const { songs } = await getSongs("popularity", "desc", title, artist, 1, 5);
    const existing = (songs as Song[]).find(
      (song) => signature(song) === signature({ title, artist }),
    );
    if (!existing) throw error;
    return toRef(existing);
  }
};

/** The Spotify track that is this song, for its cover and id — or the closest, or none. */
const spotifyMatch = async (
  name: SongName,
): Promise<SpotifySongSuggestion | null> => {
  const tracks = await searchSpotifySongs(`${name.artist} ${name.title}`).catch(
    () => [] as SpotifySongSuggestion[],
  );
  return (
    tracks.find((track) => signature(track) === signature(name)) ??
    tracks[0] ??
    null
  );
};

const Cover = ({ coverUrl }: { coverUrl?: string | null }) => (
  <span className='flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-800 text-zinc-600'>
    {coverUrl ? (
      <img src={coverUrl} alt='' className='h-full w-full object-cover' />
    ) : (
      <Music size={14} />
    )}
  </span>
);

const Row = ({
  title,
  artist,
  coverUrl,
  state,
  onClick,
  tag,
}: SongName & {
  coverUrl?: string | null;
  state: "add" | "added" | "pending" | "off";
  onClick: () => void;
  /** A word beside the artist: what clicking does beyond picking. */
  tag?: string;
}) => (
  <button
    type='button'
    onClick={onClick}
    disabled={state !== "add"}
    className='group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors disabled:cursor-default hover:bg-zinc-800 disabled:hover:bg-transparent'>
    <Cover coverUrl={coverUrl} />
    <span className='min-w-0 flex-1'>
      <span className='block truncate text-sm font-semibold text-zinc-100'>
        {title}
      </span>
      <span className='block truncate text-xs text-zinc-500'>
        {artist}
        {tag && <span className='ml-2 text-cyan-300/80'>{tag}</span>}
      </span>
    </span>
    <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-100'>
      {state === "added" ? (
        <Check size={14} />
      ) : state === "pending" ? (
        <Loader2 size={14} className='animate-spin' />
      ) : (
        <Plus size={14} />
      )}
    </span>
  </button>
);

interface LibrarySongPickerProps {
  songs: RoadmapSongRef[];
  onChange: (songs: RoadmapSongRef[]) => void;
  /** Songs the goal named that the library does not have, as typed. */
  otherSongs: string;
  onOtherSongsChange: (value: string) => void;
  /** The songs the goal named that were not found — offered for adding. */
  missing: SongName[];
}

/**
 * The songs question: what the goal named and the library has is already in
 * the list; a search adds more, up to the cap. What the library lacks is
 * offered for adding right here — one click creates it in the library, the
 * way the playlist picker does, so the roadmap step opens something — and a
 * search that finds nothing in the library offers Spotify's matches the same
 * way. Whatever stays unadded rides along as a reference for the coach.
 */
export const LibrarySongPicker = ({
  songs,
  onChange,
  otherSongs,
  onOtherSongsChange,
  missing: missingAtStart,
}: LibrarySongPickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [suggestions, setSuggestions] = useState<SpotifySongSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [missing, setMissing] = useState<SongName[]>(missingAtStart);
  /** The row being created in the library right now. */
  const [pending, setPending] = useState<string | null>(null);
  const full = songs.length >= MAX_BRIEF_SONGS;
  // The pending search: its timer, and a stamp so a slow answer to an older
  // query never overwrites the results of a newer one.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requestRef.current += 1;
    },
    [],
  );

  const search = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    const term = value.trim();
    const stamp = ++requestRef.current;
    if (term.length < 2) {
      setResults([]);
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timerRef.current = setTimeout(() => {
      Promise.all([
        getSongs("popularity", "desc", term, "", 1, 8),
        getSongs("popularity", "desc", "", term, 1, 8),
        searchSpotifySongs(term),
      ])
        .then(([byTitle, byArtist, spotify]) => {
          if (stamp !== requestRef.current) return;
          const merged = new Map<string, Song>();
          for (const song of [
            ...((byTitle?.songs as Song[] | undefined) ?? []),
            ...((byArtist?.songs as Song[] | undefined) ?? []),
          ]) {
            merged.set(song.id, song);
          }
          const library = Array.from(merged.values()).slice(0, 8);
          const known = new Set(library.map(signature));
          setResults(library);
          setSuggestions(
            spotify.filter((track) => !known.has(signature(track))).slice(0, 5),
          );
        })
        .catch(() => {
          if (stamp === requestRef.current) {
            setResults([]);
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (stamp === requestRef.current) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
  };

  const picked = new Set(songs.map((song) => song.id));
  const pickedNames = new Set(songs.map(signature));
  const pick = (ref: RoadmapSongRef) => {
    if (picked.has(ref.id) || full) return;
    onChange([...songs, ref]);
  };
  const remove = (id: string) =>
    onChange(songs.filter((song) => song.id !== id));

  /** Creates the song in the library and picks it; a missing one leaves the missing list. */
  const create = async (
    key: string,
    name: SongName,
    spotify: SpotifySongSuggestion | null,
    source: "missing" | "spotify",
  ) => {
    if (pending || full) return;
    setPending(key);
    try {
      const track = spotify ?? (await spotifyMatch(name));
      const ref = await createLibrarySong(name, track);
      posthog.capture("song_addition_flow", {
        action: "add_from_roadmap_brief",
        title: ref.title,
        artist: ref.artist,
        from_spotify_suggestion: Boolean(track),
        source,
      });
      pick(ref);
      const left = missing.filter(
        (item) => signature(item) !== signature(name),
      );
      setMissing(left);
      if (source === "missing") {
        // The reference line loses the song too: it is in the library now.
        onOtherSongsChange(left.map((item) => item.title).join(", "));
      }
      setSuggestions((prev) =>
        prev.filter((item) => signature(item) !== signature(name)),
      );
    } catch (error) {
      console.error("Adding a song from the roadmap brief failed:", error);
      toast.error("Couldn't add that song to the library.");
    } finally {
      setPending(null);
    }
  };

  const rowState = (key: string, name: SongName) =>
    pickedNames.has(signature(name))
      ? "added"
      : pending === key
        ? "pending"
        : pending || full
          ? "off"
          : "add";

  return (
    <div className='space-y-5'>
      {missing.length > 0 && (
        <div className='space-y-2 rounded-lg bg-amber-500/10 px-4 py-3'>
          <p className='text-sm leading-relaxed text-amber-200/90'>
            Not in the library yet. Add them and each gets a real step with a
            tab and a backing track — or leave them as a reference for the
            coach.
          </p>
          <ul className='space-y-0.5'>
            {missing.map((name) => {
              const key = `missing:${signature(name)}`;
              return (
                <li key={key}>
                  <Row
                    title={name.title}
                    artist={name.artist}
                    state={rowState(key, name)}
                    tag='add to the library'
                    onClick={() => void create(key, name, null, "missing")}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className='flex min-h-11 flex-wrap gap-2'>
        <AnimatePresence initial={false}>
          {songs.map((song) => (
            <motion.span
              key={song.id}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className='flex items-center gap-2 rounded-lg bg-zinc-700/70 py-1.5 pl-1.5 pr-2 text-sm text-zinc-100'>
              <Cover coverUrl={song.coverUrl} />
              <span className='flex min-w-0 flex-col leading-tight'>
                <span className='truncate font-semibold'>{song.title}</span>
                <span className='truncate text-xs text-zinc-400'>
                  {song.artist}
                </span>
              </span>
              <button
                type='button'
                onClick={() => remove(song.id)}
                aria-label={`Remove ${song.title}`}
                className='ml-1 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-600 hover:text-zinc-100'>
                <X size={14} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {!songs.length && (
          <span className='self-center text-sm text-zinc-500'>
            No songs picked yet — the coach chooses them.
          </span>
        )}
      </div>

      <div className='space-y-2'>
        <label className='flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-2.5 focus-within:ring-1 focus-within:ring-zinc-600'>
          {searching ? (
            <Loader2
              size={16}
              className='shrink-0 animate-spin text-zinc-500'
            />
          ) : (
            <Search size={16} className='shrink-0 text-zinc-500' />
          )}
          <input
            type='text'
            value={query}
            onChange={(event) => search(event.target.value)}
            disabled={full}
            placeholder={
              full
                ? `That is ${MAX_BRIEF_SONGS} — the most one roadmap takes`
                : "Search by title or artist — anything missing can be added"
            }
            className='w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed'
          />
        </label>

        <AnimatePresence>
          {(results.length > 0 || suggestions.length > 0) && !full && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className='space-y-3 rounded-lg bg-zinc-800/30 p-1.5'>
              {results.length > 0 && (
                <ul className='space-y-0.5'>
                  {results.map((song) => (
                    <li key={song.id}>
                      <Row
                        title={song.title}
                        artist={song.artist}
                        coverUrl={song.coverUrl}
                        state={
                          picked.has(song.id) ? "added" : full ? "off" : "add"
                        }
                        onClick={() => pick(toRef(song))}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {suggestions.length > 0 && (
                <div className='space-y-0.5'>
                  <p className='px-2 pt-1 text-[11px] font-semibold text-zinc-500'>
                    Not in the library yet — one click adds it
                  </p>
                  <ul className='space-y-0.5'>
                    {suggestions.map((track) => {
                      const key = `spotify:${track.spotifyId}`;
                      return (
                        <li key={key}>
                          <Row
                            title={track.title}
                            artist={track.artist}
                            coverUrl={track.coverUrl}
                            state={rowState(key, track)}
                            tag='add to the library'
                            onClick={() =>
                              void create(key, track, track, "spotify")
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <label className='block space-y-1.5'>
        <span className='text-xs font-semibold text-zinc-400'>
          Songs we do not have, as a reference for the coach
        </span>
        <input
          type='text'
          value={otherSongs}
          onChange={(event) => onOtherSongsChange(event.target.value)}
          maxLength={300}
          placeholder='e.g. Romeo and Juliet, Brothers in Arms'
          className='w-full rounded-lg bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600'
        />
      </label>
    </div>
  );
};
