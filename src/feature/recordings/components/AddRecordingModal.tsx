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
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import { useRecordingMutations } from "feature/recordings/hooks/useRecordingMutations";
import type { Recording } from "feature/recordings/types/types";
import { getSongs } from "feature/songs/services/getSongs";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import debounce from "lodash/debounce";
import { ArrowRight, Loader2, Music, Pencil, Search, Video, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FaYoutube } from "react-icons/fa6";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

interface AddRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selects the song this recording is for (e.g. opened from a song's detail page). */
  initialSong?: { id: string; title: string; artist: string } | null;
  /** When given, the modal edits this recording's text instead of sharing a new one. */
  recording?: Recording | null;
}

const isValidFaYoutubeUrl = (url: string) => {
  return /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/.test(url);
};

/** One row in the song-search results box — cover art, title/artist, pick action. */
const SongResultRow = ({ song, onSelect }: { song: Song; onSelect: () => void }) => (
  <button
    type="button"
    onClick={onSelect}
    className="w-full flex items-center gap-3 rounded-lg bg-zinc-800/40 p-2.5 hover:bg-cyan-500/10 transition-colors text-left group"
  >
    {song.coverUrl ? (
      <img src={song.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
    ) : (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500">
        <Music className="h-4 w-4" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <div className="font-bold text-sm text-white truncate group-hover:text-cyan-400">{song.title}</div>
      <div className="text-xs text-zinc-500 truncate">{song.artist}</div>
    </div>
    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-cyan-400" />
  </button>
);

export const AddRecordingModal = ({
  isOpen,
  onClose,
  initialSong,
  recording,
}: AddRecordingModalProps) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Song search state
  const [searchArtist, setSearchArtist] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [matches, setMatches] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [wasOpen, setWasOpen] = useState(isOpen);

  const userId = useAppSelector(selectUserAuth);
  const { addRecording, isAdding, updateRecording, isUpdating } = useRecordingMutations();

  const isEditing = !!recording;
  const isSaving = isAdding || isUpdating;

  // Carries the song over when the modal is opened from that song's own page,
  // same derived-state-during-render pattern as AddSongModal's initialTitle/Artist.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen && recording) {
      // Editing: start from what the author already published, so they only
      // have to touch the words they want to change.
      setVideoUrl(recording.videoUrl);
      setTitle(recording.title);
      setDescription(recording.description || "");
      if (recording.songId) {
        setSelectedSong({
          id: recording.songId,
          title: recording.songTitle,
          artist: recording.songArtist,
        } as Song);
      } else {
        // Song was typed by hand — it belongs in the search fields, not as a pick.
        setSearchArtist(recording.songArtist || "");
        setSearchTitle(recording.songTitle || "");
      }
    } else if (isOpen && initialSong) {
      setSelectedSong(initialSong as Song);
      setTitle(`${initialSong.artist} - ${initialSong.title} Cover`);
    }
  }

  const resetForm = () => {
    setVideoUrl("");
    setTitle("");
    setDescription("");
    setSearchArtist("");
    setSearchTitle("");
    setMatches([]);
    setSelectedSong(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const searchSongs = useCallback(
    debounce(async (titleQuery: string, artistQuery: string) => {
      if (titleQuery.length < 2 && artistQuery.length < 2) {
        setMatches([]);
        return;
      }
      setIsSearching(true);
      try {
        // Pass title and artist queries independently
        const result = await getSongs("popularity", "desc", titleQuery, artistQuery, 1, 5);
        setMatches(result.songs);
      } catch (error) {
        console.error("Error searching for songs:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if ((searchArtist.trim() || searchTitle.trim()) && !selectedSong) {
      searchSongs(searchTitle.trim(), searchArtist.trim());
    } else {
        setMatches([]);
    }
  }, [searchArtist, searchTitle, searchSongs, selectedSong]);

  const handleSelectSong = (song: Song) => {
      setSelectedSong(song);
      setMatches([]);
      
      // Auto-fill title if empty
      if (!title) {
          setTitle(`${song.artist} - ${song.title} Cover`);
      }
  };

  const handleRemoveSelectedSong = () => {
      // Upon removal, maybe fill the search fields with what was selected so user can edit?
      // Or just clear? Let's clear search fields to allow fresh search or just keep empty
      // Actually, standard UX would be to just clear selection state
      // But we should populate the manual fields if we want fallback? 
      // The manual fallback fields are now the search fields themselves implicitly if no match is selected.
      
      // If we remove selection, we might want to keep the text in inputs
      if (selectedSong) {
          setSearchArtist(selectedSong.artist);
          setSearchTitle(selectedSong.title);
      }
      
      setSelectedSong(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("You must be logged in.");
      return;
    }
    if (!isValidFaYoutubeUrl(videoUrl)) {
      toast.error("Please enter a valid YouTube URL.");
      return;
    }

    const recordingData = {
      videoUrl,
      title,
      description,
      songId: selectedSong?.id || null,
      // If a song is selected, use its details. If not, use the search inputs as manual entries.
      songTitle: selectedSong ? selectedSong.title : (searchTitle || null),
      songArtist: selectedSong ? selectedSong.artist : (searchArtist || null),
    };

    try {
      if (recording) {
        await updateRecording({ recordingId: recording.id, userId, recordingData });
      } else {
        await addRecording({ userId, recordingData });
      }
      handleClose();
    } catch (error) {
      console.error(error);
    }
  };

  const fieldClass =
    "border-none bg-zinc-900/60 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium";
  const hasSongQuery = !!(searchArtist.trim() || searchTitle.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-none sm:max-w-xl bg-zinc-950 text-white p-0 overflow-hidden h-full sm:h-auto flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 pb-24 sm:pb-6 sm:max-h-[85vh]">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                {isEditing ? (
                  <Pencil className="h-5 w-5 text-cyan-400" />
                ) : (
                  <Video className="h-5 w-5 text-cyan-400" />
                )}
              </div>
              {isEditing ? "Edit Recording" : "Add New Recording"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Song Linking Section — first, so picking it can auto-fill the title below */}
            <div className="space-y-2">
               <Label className="text-zinc-400 font-bold ml-1">
                  What song is this? <span className="font-normal text-zinc-600">(optional)</span>
               </Label>

               {selectedSong ? (
                   <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10">
                       <div className="flex items-center gap-3">
                           {selectedSong.coverUrl ? (
                             <img src={selectedSong.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                           ) : (
                             <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                                 <Music className="h-4 w-4" />
                             </div>
                           )}
                           <div>
                               <div className="font-bold text-sm text-white">{selectedSong.title}</div>
                               <div className="text-xs text-cyan-200">{selectedSong.artist}</div>
                           </div>
                       </div>
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveSelectedSong}
                          className="h-8 w-8 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/20"
                       >
                           <X className="h-4 w-4" />
                       </Button>
                   </div>
               ) : (
                   <>
                      <div className="grid grid-cols-2 gap-3">
                         <Input
                             value={searchArtist}
                             onChange={(e) => setSearchArtist(e.target.value)}
                             placeholder="Artist..."
                             className={cn("h-11", fieldClass)}
                         />
                         <Input
                             value={searchTitle}
                             onChange={(e) => setSearchTitle(e.target.value)}
                             placeholder="Song title..."
                             className={cn("h-11", fieldClass)}
                         />
                      </div>

                      {/* Always-visible results box — reserves its own space so it never
                          overlaps the fields below, and gives room for cover art + a clear
                          empty/loading state instead of a cramped floating dropdown. */}
                      <div className="custom-scrollbar h-48 space-y-1 overflow-y-auto rounded-lg bg-black/20 p-1.5">
                        {!hasSongQuery ? (
                          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-zinc-500">
                            <Search className="mr-2 h-4 w-4 shrink-0" />
                            Type an artist or song title to search your library
                          </div>
                        ) : isSearching ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg bg-zinc-800/40 p-2.5">
                              <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-800" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-2/5 rounded bg-zinc-800" />
                                <div className="h-2.5 w-1/4 rounded bg-zinc-800" />
                              </div>
                            </div>
                          ))
                        ) : matches.length > 0 ? (
                          matches.map((song) => (
                            <SongResultRow key={song.id} song={song} onSelect={() => handleSelectSong(song)} />
                          ))
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
                            <p className="text-sm font-semibold text-zinc-300">Not in the library</p>
                            <p className="text-xs text-zinc-500">No problem — we&apos;ll save it exactly as typed.</p>
                          </div>
                        )}
                      </div>
                   </>
               )}
            </div>

            {/* YouTube Field */}
            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="text-zinc-400 font-bold ml-1">YouTube URL *</Label>
              <div className="relative">
                  <FaYoutube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className={cn("pl-9 h-11", fieldClass)}
                  required
                  />
              </div>
            </div>

            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-400 font-bold ml-1">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My awesome cover"
                className={cn("h-11", fieldClass)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-400 font-bold ml-1">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your recording..."
                className={cn("min-h-[90px]", fieldClass)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Share Recording"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
