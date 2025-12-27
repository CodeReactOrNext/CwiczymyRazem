import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { addSong } from "feature/songs/services/addSong";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import { getSongs } from "feature/songs/services/getSongs";
import { enrichSong } from "feature/songs/services/enrichment.service";
import { selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import { Check, Music, Search, ArrowRight, SkipForward } from "lucide-react";
import { cn } from "assets/lib/utils";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import debounce from "lodash/debounce";

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = "info" | "category";

const STATUS_LABELS: Record<string, string> = {
  learning: "Learning",
  wantToLearn: "Want to Learn",
  learned: "Learned",
};

const AddSongModal = ({ isOpen, onClose, onSuccess }: AddSongModalProps) => {
  const [step, setStep] = useState<ModalStep>("info");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedSongId, setAddedSongId] = useState<string | null>(null);

  const { t } = useTranslation("songs");
  const userId = useAppSelector(selectUserAuth);
  const avatar = useAppSelector(selectUserAvatar);

  const searchSongs = useCallback(
    debounce(async (searchValue: string) => {
      if (searchValue.length < 2) {
        setMatches([]);
        return;
      }
      setIsSearching(true);
      try {
        const result = await getSongs("popularity", "desc", searchValue, 1, 5);
        setMatches(result.songs);
      } catch (error) {
        console.error("Error searching for matches:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (artist.trim() && title.trim()) {
      searchSongs(`${title} ${artist}`.trim());
    } else {
      setMatches([]);
    }
  }, [title, artist, searchSongs]);

  const handleReset = () => {
    setStep("info");
    setTitle("");
    setArtist("");
    setMatches([]);
    setAddedSongId(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error(t("must_be_logged_in"));
      return;
    }

    if (!title.trim() || !artist.trim()) {
      toast.error(t("all_fields_required"));
      return;
    }

    try {
      setIsLoading(true);
      const songId = await addSong(title.trim(), artist.trim(), userId, avatar, undefined);
      
      // Trigger enrichment in the background (no await)
      enrichSong(songId, artist.trim(), title.trim()).catch((err) => {
        console.error("Background enrichment failed:", err);
      });

      setAddedSongId(songId);
      setStep("category");
    } catch (error) {
      if (error instanceof Error && error.message === "song_already_exists") {
        toast.error(t("song_already_exists"));
      } else {
        toast.error(t("error_adding_song"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMatch = (song: Song) => {
    setAddedSongId(song.id);
    setTitle(song.title);
    setArtist(song.artist);
    setStep("category");
  };

  const handleSelectCategory = async (status: SongStatus | "skip") => {
    if (status === "skip") {
      toast.success('Song added to library');
      onSuccess();
      handleClose();
      return;
    }

    if (!userId || !addedSongId) return;

    try {
      setIsLoading(true);
      await updateSongStatus(userId, addedSongId, title, artist, status, avatar);
      toast.success(t("status_updated"));
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(t("error_updating_status"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg border-white/5 bg-zinc-950 p-0 overflow-hidden">
        <div className="p-6 pb-20 md:pb-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-6">
            <DialogTitle className='font-openSans text-2xl font-bold text-white flex items-center gap-3'>
              <div className="p-2 rounded-xl bg-cyan-500/10">
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
                    className="h-12 border-white/5 bg-white/5 focus:border-cyan-500/50 transition-all font-medium"
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
                    className="h-12 border-white/5 bg-white/5 focus:border-cyan-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Match Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    {isSearching ? <Search className="h-3 w-3 animate-pulse" /> : <Check className="h-3 w-3" />}
                    {matches.length > 0 ? "Possible matches found" : isSearching ? "Searching..." : "Library Check"}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {matches.map((song) => (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => handleSelectMatch(song)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
                    >
                      <div className="text-left">
                        <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{song.title}</div>
                        <div className="text-xs text-zinc-500">{song.artist}</div>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </button>
                  ))}
                  
                  {!isSearching && matches.length === 0 && (artist.trim() && title.trim()) && (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                      <div className="text-sm font-medium text-zinc-500 italic">No exact matches in library yet - yours will be the first!</div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type='button'
                  variant='ghost'
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading || !title.trim() || !artist.trim()}
                  className="h-12 px-8"
                >
                  {isLoading ? (
                    <span className='loading loading-spinner loading-sm' />
                  ) : (
                    <div className="flex items-center gap-2">
                      {t("add")}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-8">
                <div className="text-2xl font-bold text-white">{title}</div>
                <div className="text-zinc-400 font-bold">{artist}</div>
                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-widest border border-green-500/20">
                    Song Added to Library
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(Object.entries(STATUS_CONFIG) as [SongStatus, typeof STATUS_CONFIG.learning][]).map(([status, config]) => (
                  <button
                    key={status}
                    disabled={isLoading}
                    onClick={() => handleSelectCategory(status)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 text-left group",
                      config.borderColor,
                      config.bgHover,
                      "bg-white/[0.02] hover:shadow-lg",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn("p-3 rounded-xl", config.bgColor, config.color)}>
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
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-white/5 bg-white/[0.02] hover:bg-zinc-900 transition-all active:scale-95 group disabled:opacity-50"
                >
                  <div className="p-3 rounded-xl bg-zinc-800 text-zinc-400">
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
