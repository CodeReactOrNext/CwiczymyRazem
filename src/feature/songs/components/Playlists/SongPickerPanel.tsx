import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { getSongs } from "feature/songs/services/getSongs";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Check, Music, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface SongPickerPanelProps {
  /** Songs already in the playlist — rendered as added, click does nothing. */
  existingIds: Set<string>;
  onAdd: (song: Song) => void;
  /** User's collection, shown as quick-add suggestions before searching. */
  collectionSongs: Song[];
  /** When false the add buttons are disabled (e.g. top 10 is full). */
  canAdd?: boolean;
  className?: string;
}

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
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[4px] bg-zinc-800">
        {song.coverUrl ? (
          <img src={song.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            <Music className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p translate="no" className="truncate text-sm font-semibold text-white">
          {song.title}
        </p>
        <p translate="no" className="truncate text-xs text-zinc-500">
          {song.artist}
        </p>
      </div>
      <span
        className="shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: `${tier.color}14`, color: tier.color }}
      >
        {tier.tier}
      </span>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all",
          isAdded
            ? "bg-green-500/15 text-green-400"
            : "bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white"
        )}
      >
        {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
};

export const SongPickerPanel = ({
  existingIds,
  onAdd,
  collectionSongs,
  canAdd = true,
  className,
}: SongPickerPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Loading state flips in the change handler (not the effect) so the effect
  // only schedules work; results from a superseded fetch are dropped.
  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
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
        const [byTitle, byArtist] = await Promise.all([
          getSongs("popularity", "desc", q, "", 1, 8),
          getSongs("popularity", "desc", "", q, 1, 8),
        ]);
        if (cancelled) return;
        const merged = new Map<string, Song>();
        [...byTitle.songs, ...byArtist.songs].forEach((s: Song) => merged.set(s.id, s));
        setResults(Array.from(merged.values()).slice(0, 10));
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
  }, [searchQuery]);

  const hasQuery = searchQuery.trim().length >= 2;
  const suggestions = useMemo(
    () => collectionSongs.filter((s) => !existingIds.has(s.id)).slice(0, 12),
    [collectionSongs, existingIds]
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3.5">
          <Search className="h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-white" />
        </div>
        <Input
          placeholder="Search the library..."
          value={searchQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="h-11 w-full border-none bg-zinc-900/60 pl-10 text-white placeholder:text-zinc-500 transition-all focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {hasQuery ? (
          <>
            {isSearching && results.length === 0 && (
              <p className="px-2 py-6 text-center text-xs font-medium text-zinc-500">
                Searching...
              </p>
            )}
            {!isSearching && results.length === 0 && (
              <p className="px-2 py-6 text-center text-xs font-medium text-zinc-500">
                Nothing found — try a different title or artist.
              </p>
            )}
            {results.map((song) => (
              <SongPickerRow
                key={song.id}
                song={song}
                isAdded={existingIds.has(song.id)}
                canAdd={canAdd}
                onAdd={() => onAdd(song)}
              />
            ))}
          </>
        ) : suggestions.length > 0 ? (
          <>
            <p className="px-2 pb-1 pt-1 text-xs font-bold text-zinc-500">
              From your collection
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
            Type at least two characters to search the song library.
          </p>
        )}
      </div>
    </div>
  );
};
