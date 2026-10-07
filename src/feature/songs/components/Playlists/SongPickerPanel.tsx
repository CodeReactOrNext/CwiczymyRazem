import { useTranslation } from "hooks/useTranslation";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { addSong } from "feature/songs/services/addSong";
import { enrichSong } from "feature/songs/services/enrichment.service";
import { getSongs } from "feature/songs/services/getSongs";
import type { SpotifySongSuggestion } from "feature/songs/services/searchSpotifySongs";
import { searchSpotifySongs } from "feature/songs/services/searchSpotifySongs";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { Timestamp } from "firebase/firestore";
import { Check, Loader2, Music, Plus, Search } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

interface SongPickerPanelProps {
  /** Songs already in the playlist — rendered as added, click does nothing. */
  existingIds: Set<string>;
  onAdd: (song: Song) => void;
  /** User's collection, shown as quick-add suggestions before searching. */
  collectionSongs: Song[];
  /** When false the add buttons are disabled (e.g. top 10 is full). */
  canAdd?: boolean;
  /**
   * Also offer songs that aren't in the library yet (Spotify search + "as typed"),
   * creating them in the library on click — saves a trip to the Songs page.
   */
  allowCreate?: boolean;
  className?: string;
}

const MANUAL_ROW_ID = "__manual__";

const songSignature = (title: string, artist: string) =>
  `${title.trim().toLowerCase()}|${artist.trim().toLowerCase()}`;

/** "Artist - Title" typed into the single search box → both parts, else null. */
const parseTypedSong = (query: string) => {
  const match = query.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (!match) return null;
  const artist = match[1].trim();
  const title = match[2].trim();
  return artist && title ? { artist, title } : null;
};

const RowCover = ({ coverUrl }: { coverUrl?: string | null }) => (
  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[4px] bg-zinc-800">
    {coverUrl ? (
      <img src={coverUrl} alt="" className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-zinc-600">
        <Music className="h-4 w-4" />
      </div>
    )}
  </div>
);

const RowText = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="min-w-0 flex-1">
    <p translate="no" className="truncate text-sm font-semibold text-white">
      {title}
    </p>
    <p translate="no" className="truncate text-xs text-zinc-500">
      {subtitle}
    </p>
  </div>
);

const RowAction = ({ isAdded, isPending }: { isAdded?: boolean; isPending?: boolean }) => (
  <span
    className={cn(
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all",
      isAdded
        ? "bg-green-500/15 text-green-400"
        : isPending
          ? "bg-cyan-500/15 text-cyan-400"
          : "bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white"
    )}
  >
    {isAdded ? (
      <Check className="h-3.5 w-3.5" />
    ) : isPending ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : (
      <Plus className="h-3.5 w-3.5" />
    )}
  </span>
);

const SongPickerRow = ({
  song,
  isAdded,
  canAdd,
  onAdd,
}: {
  song: Song;
  isAdded: boolean;
  canAdd: boolean;
  onAdd: () => void;
}) => {
  const tier = getSongTier((song.avgDifficulty ?? 0) === 0 ? "?" : song.tier || song.avgDifficulty || "?");

  return (
    <button
      type="button"
      disabled={isAdded || !canAdd}
      onClick={onAdd}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
        isAdded ? "opacity-50" : canAdd ? "hover:bg-zinc-800/60" : "opacity-40"
      )}
    >
      <RowCover coverUrl={song.coverUrl} />
      <RowText title={song.title} subtitle={song.artist} />
      <span
        className="shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: `${tier.color}14`, color: tier.color }}
      >
        {tier.tier}
      </span>
      <RowAction isAdded={isAdded} />
    </button>
  );
};

/** A song that isn't in the library yet — clicking creates it there, then adds it. */
const NewSongRow = ({
  title,
  subtitle,
  coverUrl,
  isPending,
  disabled,
  onAdd,
}: {
  title: string;
  subtitle: string;
  coverUrl?: string | null;
  isPending: boolean;
  disabled: boolean;
  onAdd: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onAdd}
    className={cn(
      "group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
      isPending ? "bg-zinc-800/60" : disabled ? "opacity-40" : "hover:bg-zinc-800/60"
    )}
  >
    <RowCover coverUrl={coverUrl} />
    <RowText title={title} subtitle={subtitle} />
    <RowAction isPending={isPending} />
  </button>
);

export const SongPickerPanel = ({
  existingIds,
  onAdd,
  collectionSongs,
  canAdd = true,
  allowCreate = false,
  className,
}: SongPickerPanelProps) => {
  const { t } = useTranslation("playlists");
  const userId = useAppSelector(selectUserAuth);
  const avatar = useAppSelector(selectUserAvatar);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [spotifyResults, setSpotifyResults] = useState<SpotifySongSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // Row being created in the library right now (spotifyId or MANUAL_ROW_ID).
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Loading state flips in the change handler (not the effect) so the effect
  // only schedules work; results from a superseded fetch are dropped.
  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setSpotifyResults([]);
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        // The library indexes title and artist separately — query both and merge.
        const [byTitle, byArtist, spotify] = await Promise.all([
          getSongs("popularity", "desc", q, "", 1, 8),
          getSongs("popularity", "desc", "", q, 1, 8),
          allowCreate ? searchSpotifySongs(q) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        const merged = new Map<string, Song>();
        [...byTitle.songs, ...byArtist.songs].forEach((s: Song) => merged.set(s.id, s));
        setResults(Array.from(merged.values()).slice(0, 10));
        setSpotifyResults(spotify);
      } catch (error) {
        console.error("Playlist song search failed:", error);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, allowCreate]);

  const hasQuery = searchQuery.trim().length >= 2;
  const suggestions = useMemo(
    () => collectionSongs.filter((s) => !existingIds.has(s.id)).slice(0, 12),
    [collectionSongs, existingIds]
  );

  // Spotify tracks already in the library show up as library rows — skip them here.
  const librarySignatures = useMemo(
    () => new Set(results.map((s) => songSignature(s.title, s.artist))),
    [results]
  );
  const newSongs = useMemo(
    () =>
      spotifyResults
        .filter((s) => !librarySignatures.has(songSignature(s.title, s.artist)))
        .slice(0, 6),
    [spotifyResults, librarySignatures]
  );
  const typedSong = allowCreate ? parseTypedSong(searchQuery) : null;
  const showTypedRow =
    !!typedSong &&
    !librarySignatures.has(songSignature(typedSong.title, typedSong.artist)) &&
    !newSongs.some(
      (s) => songSignature(s.title, s.artist) === songSignature(typedSong.title, typedSong.artist)
    );

  const createAndAdd = async (
    rowId: string,
    title: string,
    artist: string,
    spotify: SpotifySongSuggestion | null
  ) => {
    if (!userId || pendingId) return;
    setPendingId(rowId);
    try {
      let song: Song;
      try {
        const songId = await addSong(
          title,
          artist,
          userId,
          avatar,
          undefined,
          undefined,
          spotify ? { coverUrl: spotify.coverUrl, spotifyId: spotify.spotifyId } : undefined
        );
        // Background enrichment fills in genres/cover for songs added as typed.
        enrichSong(songId, artist, title).catch((err) => {
          console.error("Background enrichment failed:", err);
        });
        song = {
          id: songId,
          title,
          artist,
          difficulties: [],
          createdAt: Timestamp.now(),
          createdBy: userId,
          avgDifficulty: 0,
          tier: "?",
          ...(spotify?.coverUrl ? { coverUrl: spotify.coverUrl } : {}),
          ...(spotify?.spotifyId ? { spotifyId: spotify.spotifyId } : {}),
        };
      } catch (error) {
        // Someone added the exact same song meanwhile — use the library copy.
        if (!(error instanceof Error && error.message === "song_already_exists")) throw error;
        const { songs } = await getSongs("popularity", "desc", title, artist, 1, 5);
        const existing = songs.find(
          (s: Song) => songSignature(s.title, s.artist) === songSignature(title, artist)
        );
        if (!existing) throw error;
        song = existing;
      }
      posthog.capture("song_addition_flow", {
        action: "add_from_playlist_picker",
        title,
        artist,
        from_spotify_suggestion: !!spotify,
      });
      onAdd(song);
    } catch (error) {
      console.error("Adding a new song from the playlist picker failed:", error);
      toast.error(t("errors.add_to_library"));
    } finally {
      setPendingId(null);
    }
  };

  const canCreate = canAdd && !pendingId && !!userId;
  const hasAnyResult = results.length > 0 || newSongs.length > 0 || showTypedRow;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3.5">
          <Search className="h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-white" />
        </div>
        <Input
          placeholder={allowCreate ? t("picker.search_create") : t("picker.search_library")}
          value={searchQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="h-11 w-full border-none bg-zinc-900/60 pl-10 text-white placeholder:text-zinc-500 transition-all focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {hasQuery ? (
          <>
            {isSearching && !hasAnyResult && (
              <p className="px-2 py-6 text-center text-xs font-medium text-zinc-500">
                Searching...
              </p>
            )}
            {!isSearching && !hasAnyResult && (
              <p className="px-2 py-6 text-center text-xs font-medium text-zinc-500">
                {t("picker.nothing_found")}
              </p>
            )}
            {results.map((song) => (
              <SongPickerRow
                key={song.id}
                song={song}
                isAdded={existingIds.has(song.id)}
                canAdd={canAdd && !pendingId}
                onAdd={() => onAdd(song)}
              />
            ))}

            {allowCreate && (newSongs.length > 0 || showTypedRow) && (
              <>
                <p className="px-2 pb-1 pt-4 text-xs font-bold text-zinc-500">
                  {t("picker.not_in_library")}
                </p>
                {newSongs.map((s) => (
                  <NewSongRow
                    key={s.spotifyId}
                    title={s.title}
                    subtitle={`${s.artist}${s.year ? ` · ${s.year}` : ""}`}
                    coverUrl={s.coverUrl}
                    isPending={pendingId === s.spotifyId}
                    disabled={!canCreate}
                    onAdd={() => createAndAdd(s.spotifyId, s.title, s.artist, s)}
                  />
                ))}
                {showTypedRow && typedSong && (
                  <NewSongRow
                    title={typedSong.title}
                    subtitle={t("picker.add_as_typed", { artist: typedSong.artist })}
                    isPending={pendingId === MANUAL_ROW_ID}
                    disabled={!canCreate}
                    onAdd={() =>
                      createAndAdd(MANUAL_ROW_ID, typedSong.title, typedSong.artist, null)
                    }
                  />
                )}
              </>
            )}

            {allowCreate && !isSearching && !typedSong && (
              <p className="px-2 pb-2 pt-4 text-xs text-zinc-600">
                {t("picker.cant_find")}
              </p>
            )}
          </>
        ) : suggestions.length > 0 ? (
          <>
            <p className="px-2 pb-1 pt-1 text-xs font-bold text-zinc-500">
              {t("picker.from_collection")}
            </p>
            {suggestions.map((song) => (
              <SongPickerRow
                key={song.id}
                song={song}
                isAdded={existingIds.has(song.id)}
                canAdd={canAdd}
                onAdd={() => onAdd(song)}
              />
            ))}
          </>
        ) : (
          <p className="px-2 py-6 text-center text-xs font-medium text-zinc-500">
            {allowCreate
              ? t("picker.min_chars_create")
              : t("picker.min_chars_library")}
          </p>
        )}
      </div>
    </div>
  );
};
