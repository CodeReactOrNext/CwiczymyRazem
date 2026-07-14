import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import { addSong } from "feature/songs/services/addSong";
import { enrichSong } from "feature/songs/services/enrichment.service";
import { getSongs } from "feature/songs/services/getSongs";
import type { SpotifySongSuggestion } from "feature/songs/services/searchSpotifySongs";
import { searchSpotifySongs } from "feature/songs/services/searchSpotifySongs";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
import { useTranslation } from "hooks/useTranslation";
import debounce from "lodash/debounce";
import { ArrowRight, Loader2, Music, Plus, Search, SkipForward } from "lucide-react";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";

import { SpotifyPlayer } from "../SpotifyPlayer";

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Pre-fills the form with whatever the user already searched for before opening the modal. */
  initialTitle?: string;
  initialArtist?: string;
}

type ModalStep = "info" | "category";

const STATUS_LABELS: Record<string, string> = {
  learning: "Learning",
  wantToLearn: "Want to Learn",
  learned: "Learned",
};

interface SongResultRowProps {
  title: string;
  subtitle: string;
  action: React.ReactNode;
  onClick: () => void;
  coverUrl?: string;
  badge?: string;
  isActive?: boolean;
  disabled?: boolean;
}

/** Every row in the results box is a one-click add — same shape for library, search and manual. */
const SongResultRow = ({
  title,
  subtitle,
  action,
  onClick,
  coverUrl,
  badge,
  isActive,
  disabled,
}: SongResultRowProps) => (
  <button
    type='button'
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "transition-background group flex w-full items-center gap-3 rounded-lg bg-zinc-800/40 p-2.5",
      isActive ? "bg-cyan-500/10" : "hover:bg-cyan-500/10",
      disabled && !isActive && "opacity-50"
    )}>
    {coverUrl ? (
      <img src={coverUrl} alt='' className='h-11 w-11 shrink-0 rounded-lg object-cover' />
    ) : (
      <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500'>
        <Music className='h-4 w-4' />
      </div>
    )}
    <div className='min-w-0 flex-1 text-left'>
      <div className='flex items-center gap-2'>
        <span
          className={cn(
            "truncate font-bold transition-colors",
            isActive ? "text-cyan-400" : "text-white group-hover:text-cyan-400"
          )}>
          {title}
        </span>
        {badge && (
          <span className='shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400'>
            {badge}
          </span>
        )}
      </div>
      <div className='truncate text-xs text-zinc-500'>{subtitle}</div>
    </div>
    {action}
  </button>
);

const AddSongModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialTitle = "",
  initialArtist = "",
}: AddSongModalProps) => {
  const [step, setStep] = useState<ModalStep>("info");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedSongId, setAddedSongId] = useState<string | null>(null);
  const [addedSongSpotifyId, setAddedSongSpotifyId] = useState<string | null>(null);
  const [importedTab, setImportedTab] = useState<TablatureMeasure[] | null>(null);
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [spotifySuggestions, setSpotifySuggestions] = useState<SpotifySongSuggestion[]>([]);
  const [isSpotifySearching, setIsSpotifySearching] = useState(false);
  // The result row the user just clicked — drives the spinner on that row while it's added.
  const [pendingSuggestionId, setPendingSuggestionId] = useState<string | null>(null);

  const { t } = useTranslation("songs");
  const userId = useAppSelector(selectUserAuth);
  const avatar = useAppSelector(selectUserAvatar);
  const dispatch = useAppDispatch();

  const searchSongs = useCallback(
    debounce(async (t: string, a: string) => {
      if (t.length < 2 && a.length < 2) {
        setMatches([]);
        setSpotifySuggestions([]);
        return;
      }
      setIsSearching(true);
      setIsSpotifySearching(true);

      const [libraryResult, spotifyResult] = await Promise.allSettled([
        getSongs("popularity", "desc", t, a, 1, 5),
        searchSpotifySongs([a, t].filter(Boolean).join(" ")),
      ]);

      if (libraryResult.status === "fulfilled") {
        setMatches(libraryResult.value.songs);
      } else {
        console.error("Error searching for matches:", libraryResult.reason);
      }

      if (spotifyResult.status === "fulfilled") {
        setSpotifySuggestions(spotifyResult.value);
      }

      setIsSearching(false);
      setIsSpotifySearching(false);
    }, 300),
    []
  );

  useEffect(() => {
    if (artist.trim() || title.trim()) {
      searchSongs(title.trim(), artist.trim());
    } else {
      setMatches([]);
      setSpotifySuggestions([]);
    }
  }, [title, artist, searchSongs]);

  // Suggestions that are already in the library are listed (and actionable) as library
  // rows at the top of the box, so drop them here to avoid duplicate/confusing entries.
  const librarySignatures = useMemo(
    () => new Set(matches.map((m) => `${m.title.toLowerCase()}|${m.artist.toLowerCase()}`)),
    [matches]
  );
  const newSpotifySuggestions = useMemo(
    () =>
      spotifySuggestions.filter(
        (s) => !librarySignatures.has(`${s.title.toLowerCase()}|${s.artist.toLowerCase()}`)
      ),
    [spotifySuggestions, librarySignatures]
  );

  const hasQuery = artist.trim().length >= 2 || title.trim().length >= 2;
  const isBusySearching = hasQuery && (isSearching || isSpotifySearching);
  const canAddManually =
    hasQuery && !isBusySearching && !!artist.trim() && !!title.trim();

  // Carries over whatever the user already searched for on the songs page,
  // so they don't have to retype it inside the modal. Adjusted during render
  // (React's recommended pattern) rather than in an effect, since it reacts
  // to the isOpen prop flipping rather than syncing an external system.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTitle(initialTitle);
      setArtist(initialArtist);
    }
  }

  const handleReset = () => {
    setStep("info");
    setTitle("");
    setArtist("");
    setMatches([]);
    setSpotifySuggestions([]);
    setPendingSuggestionId(null);
    setAddedSongId(null);
    setAddedSongSpotifyId(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const submitSong = async (
    songTitle: string,
    songArtist: string,
    suggestion: SpotifySongSuggestion | null
  ) => {
    if (!userId) {
      toast.error(t("must_be_logged_in"));
      return;
    }

    if (!songTitle || !songArtist) {
      toast.error(t("all_fields_required"));
      return;
    }

    try {
      setIsLoading(true);
      setPendingSuggestionId(suggestion?.spotifyId ?? null);
      posthog.capture("song_addition_flow", {
        action: suggestion ? "select_search_result" : "submit_info",
        title: songTitle,
        artist: songArtist,
        has_tab: !!importedTab,
        from_spotify_suggestion: !!suggestion,
      });
      const songId = await addSong(
        songTitle,
        songArtist,
        userId,
        avatar,
        undefined,
        importedTab || undefined,
        suggestion
          ? { coverUrl: suggestion.coverUrl, spotifyId: suggestion.spotifyId }
          : undefined
      );

      // Trigger enrichment in the background (no await) — fills in genres, and
      // covers the case where the song wasn't picked from a search result.
      enrichSong(songId, songArtist, songTitle).catch((err) => {
        console.error("Background enrichment failed:", err);
      });

      setTitle(songTitle);
      setArtist(songArtist);
      setAddedSongId(songId);
      setAddedSongSpotifyId(suggestion?.spotifyId || null);
      setStep("category");
    } catch (error) {
      if (error instanceof Error && error.message === "song_already_exists") {
        toast.error(t("song_already_exists"));
      } else {
        toast.error(t("error_adding_song"));
      }
    } finally {
      setIsLoading(false);
      setPendingSuggestionId(null);
    }
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    submitSong(title.trim(), artist.trim(), null);
  };

  const handleSelectMatch = (song: Song) => {
    posthog.capture("song_addition_flow", { action: "select_match", song_id: song.id });
    setAddedSongId(song.id);
    setAddedSongSpotifyId(song.spotifyId || null);
    setTitle(song.title);
    setArtist(song.artist);
    setStep("category");
  };

  const handleSelectCategory = async (status: SongStatus | "skip") => {
    if (status === "skip") {
      posthog.capture("song_addition_flow", { action: "skip_status", song_id: addedSongId });
      toast.success('Song added to library');
      onSuccess();
      handleClose();
      return;
    }

    if (!userId || !addedSongId) return;

    try {
      setIsLoading(true);
      posthog.capture("song_addition_flow", { action: "set_status", status, song_id: addedSongId });
      await updateSongStatus(userId, addedSongId, title, artist, status, avatar);

      if (status === "wantToLearn") {
        dispatch(updateQuestProgress({ type: "add_want_to_learn" }));
      }

      toast.success(t("status_updated"));
      onSuccess();
      handleClose();
    } catch (_error) {
      toast.error(t("error_updating_status"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-none sm:max-w-lg bg-zinc-950 p-0 overflow-hidden h-full sm:h-auto">
        <div className="p-6 pb-24 sm:pb-6 overflow-y-auto h-full sm:max-h-[85vh]">
          <DialogHeader className="mb-6">
            <DialogTitle className='font-sans text-2xl font-bold text-white flex items-center gap-3'>
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Music className="h-6 w-6 text-cyan-400" />
              </div>
              {step === "info" ? 'Add new song' : 'Set status'}
            </DialogTitle>
          </DialogHeader>

          {step === "info" ? (
            <form onSubmit={handleSubmitInfo} className='space-y-6'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='artist' className="text-zinc-400 font-bold ml-1">{t("artist")}</Label>
                  <Input
                    id='artist'
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    required
                    placeholder="e.g. Led Zeppelin"
                    className="h-12 border-none bg-zinc-900/60 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='title' className="text-zinc-400 font-bold ml-1">{t("song_title")}</Label>
                  <Input
                    id='title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Stairway to Heaven"
                    className="h-12 border-none bg-zinc-900/60 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                  />
                </div>
              </div>

              {/* One results box of a fixed height, always rendered: library matches,
                  then search results, then the "add as typed" row. Its contents swap
                  in place so the modal never grows or shrinks while typing. */}
              <div className="space-y-3">
                <span className="ml-1 flex h-4 items-center gap-2 text-xs font-bold tracking-wide text-zinc-500">
                  {isBusySearching ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Search className="h-3 w-3" />
                  )}
                  {isBusySearching ? "Searching..." : "Search results"}
                </span>

                <div className="custom-scrollbar h-64 space-y-1 overflow-y-auto pr-2">
                  {!hasQuery ? (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-zinc-500">
                      Type an artist and a title to search
                    </div>
                  ) : isBusySearching ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex animate-pulse items-center gap-3 rounded-lg bg-zinc-800/40 p-2.5"
                      >
                        <div className="h-11 w-11 shrink-0 rounded-lg bg-zinc-800" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-2/5 rounded bg-zinc-800" />
                          <div className="h-2.5 w-1/4 rounded bg-zinc-800" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {matches.map((song) => (
                        <SongResultRow
                          key={song.id}
                          coverUrl={song.coverUrl}
                          title={song.title}
                          subtitle={song.artist}
                          badge="In your library"
                          disabled={isLoading}
                          onClick={() => handleSelectMatch(song)}
                          action={
                            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-cyan-400" />
                          }
                        />
                      ))}

                      {newSpotifySuggestions.map((song) => {
                        const isPending = pendingSuggestionId === song.spotifyId;
                        return (
                          <SongResultRow
                            key={song.spotifyId}
                            coverUrl={song.coverUrl}
                            title={song.title}
                            subtitle={`${song.artist}${song.year ? ` · ${song.year}` : ""}`}
                            isActive={isPending}
                            disabled={isLoading}
                            onClick={() => submitSong(song.title, song.artist, song)}
                            action={
                              isPending ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-400" />
                              ) : (
                                <Plus className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-cyan-400" />
                              )
                            }
                          />
                        );
                      })}

                      {/* The track isn't always out there (or the search misses it) —
                          this row adds exactly what was typed, just without cover art. */}
                      {canAddManually && (
                        <SongResultRow
                          title={title.trim()}
                          subtitle={`${artist.trim()} · add as typed, no cover art`}
                          isActive={isLoading && !pendingSuggestionId}
                          disabled={isLoading}
                          onClick={() => submitSong(title.trim(), artist.trim(), null)}
                          action={
                            isLoading && !pendingSuggestionId ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-400" />
                            ) : (
                              <Plus className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-cyan-400" />
                            )
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-8">
                <div className="text-2xl font-bold text-white">{title}</div>
                <div className="text-zinc-400 font-bold">{artist}</div>
                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wide">
                    Song added to library
                  </span>
                </div>
              </div>

              {/* Show player in status step if we have a spotifyId */}
              {addedSongSpotifyId && (
                <div className="mb-6">
                  <SpotifyPlayer
                    trackId={addedSongSpotifyId}
                    height={152}
                  />
                </div>
              )}

              <p className="mx-auto max-w-sm text-center text-sm leading-relaxed text-zinc-400">
                Pick how far along you are with this song — it decides which of
                your lists it lands on. You can change it anytime.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {(Object.entries(STATUS_CONFIG) as [SongStatus, typeof STATUS_CONFIG.learning][]).map(([status, config]) => (
                  <button
                    key={status}
                    disabled={isLoading}
                    onClick={() => handleSelectCategory(status)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg bg-zinc-800/40 transition-background active:scale-[0.98] text-left group",
                      config.bgHover,
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn("p-3 rounded-lg", config.bgColor, config.color)}>
                      {isLoading ? (
                        <div className="h-6 w-6 flex items-center justify-center">
                          <span className="loading loading-spinner loading-xs" />
                        </div>
                      ) : (
                        <config.icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={cn("font-bold tracking-tight", config.color)}>
                        {STATUS_LABELS[status] || status}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium leading-tight mt-0.5">
                        {status === "learning" && "Focus on this song today"}
                        {status === "wantToLearn" && "Save for later inspiration"}
                        {status === "learned" && "Mastered and in repertoire"}
                      </div>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => handleSelectCategory("skip")}
                  disabled={isLoading}
                  className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 transition-background active:scale-[0.98] group disabled:opacity-50"
                >
                  <div className="p-3 rounded-lg bg-zinc-800 text-zinc-400">
                    <SkipForward className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                      Skip for now
                    </div>
                    <div className="text-xs text-zinc-500 font-medium mt-0.5">
                      Adjust status later from the lists
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSongModal;
