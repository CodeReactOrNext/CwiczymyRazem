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
import { useRecordingMutations } from "feature/recordings/hooks/useRecordingMutations";
import { selectUserAuth } from "feature/user/store/userSlice";
import { getSongs } from "feature/songs/services/getSongs";
import type { Song } from "feature/songs/types/songs.type";
import debounce from "lodash/debounce";
import { ArrowRight, Check, Loader2, Music, Video, X , Youtube } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

interface AddRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isValidYoutubeUrl = (url: string) => {
  return /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/.test(url);
};

export const AddRecordingModal = ({ isOpen, onClose }: AddRecordingModalProps) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Song search state
  const [searchArtist, setSearchArtist] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [matches, setMatches] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  
  const userId = useAppSelector(selectUserAuth);
  const { addRecording, isAdding } = useRecordingMutations();

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
    if (!isValidYoutubeUrl(videoUrl)) {
      toast.error("Please enter a valid YouTube URL.");
      return;
    }

    try {
      await addRecording({
        userId,
        recordingData: {
          videoUrl,
          title,
          description,
          songId: selectedSong?.id || null, 
          // If a song is selected, use its details. If not, use the search inputs as manual entries.
          songTitle: selectedSong ? selectedSong.title : (searchTitle || null),
          songArtist: selectedSong ? selectedSong.artist : (searchArtist || null),
        },
      });
      handleClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-zinc-950 border-white/5 text-white overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-cyan-400" />
            Add New Recording
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* YouTube Field */}
          <div className="space-y-2">
            <Label htmlFor="videoUrl">YouTube URL *</Label>
            <div className="relative">
                <Youtube className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="pl-9 bg-zinc-900 border-white/10"
                required
                />
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My awesome cover"
              className="bg-zinc-900 border-white/10"
              required
            />
          </div>

          {/* Song Linking Section */}
          <div className="space-y-2">
             <Label>Song Info (Search or Enter Manually)</Label>
             
             {selectedSong ? (
                 <div className="flex items-center justify-between p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                     <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                             <Music className="h-4 w-4" />
                         </div>
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
                 <div className="grid grid-cols-2 gap-3 relative">
                    <div className="space-y-1">
                        <Input 
                            value={searchArtist}
                            onChange={(e) => setSearchArtist(e.target.value)}
                            placeholder="Artist..."
                            className="bg-zinc-900 border-white/10 text-xs h-9"
                        />
                    </div>
                    <div className="space-y-1">
                        <Input 
                            value={searchTitle}
                            onChange={(e) => setSearchTitle(e.target.value)}
                            placeholder="Song Title..."
                            className="bg-zinc-900 border-white/10 text-xs h-9"
                        />
                    </div>

                    {isSearching && (
                        <div className="absolute right-[-20px] top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                        </div>
                    )}

                    {/* Search Results Dropdown */}
                    {matches.length > 0 && !selectedSong && (
                        <div className="absolute top-10 left-0 right-0 z-10 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 shadow-xl custom-scrollbar">
                            <div className="p-2 text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-950/50">
                                Found in library:
                            </div>
                            {matches.map(song => (
                                <button
                                    key={song.id}
                                    type="button"
                                    onClick={() => handleSelectSong(song)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left group"
                                >
                                    <div>
                                        <div className="font-bold text-sm text-white group-hover:text-cyan-400">{song.title}</div>
                                        <div className="text-xs text-zinc-500">{song.artist}</div>
                                    </div>
                                    <div className="text-[10px] text-zinc-600 group-hover:text-cyan-500 font-medium px-2 py-1 rounded bg-zinc-950 border border-zinc-800 group-hover:border-cyan-500/20">
                                        Select
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
             )}
             {!selectedSong && (searchArtist || searchTitle) && matches.length === 0 && !isSearching && (
                 <p className="text-[10px] text-zinc-500 italic mt-1 ml-1">
                    * Not in library? No problem, just fill it in manually.
                 </p>
             )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your recording..."
              className="bg-zinc-900 border-white/10 min-h-[80px]"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button type="submit" disabled={isAdding} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Share Recording
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
