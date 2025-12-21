import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "assets/components/ui/dialog";
import { Button } from "assets/components/ui/button";
import { Loader2, Music, Check, RefreshCw } from "lucide-react";
import { cn } from "assets/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface Candidate {
  coverUrl: string;
  artist: string;
  title: string;
  albumName: string;
  source: string;
}

interface CoverPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: { id: string; artist: string; title: string } | null;
  password: string;
  onSelect: (coverUrl: string) => void;
}

const CoverPickerModal = ({ isOpen, onClose, song, password, onSelect }: CoverPickerModalProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && song) {
      fetchCandidates();
    } else {
      setCandidates([]);
      setSelectedUrl(null);
    }
  }, [isOpen, song]);

  const fetchCandidates = async () => {
    if (!song) return;
    setIsLoading(true);
    try {
      const res = await axios.post("/api/admin/search-covers", {
        password,
        artist: song.artist,
        title: song.title
      });
      setCandidates(res.data.candidates || []);
      if (res.data.candidates?.length === 0) {
        toast.info("No cover candidates found for this song.");
      }
    } catch (error) {
      toast.error("Failed to search for covers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl border-white/5 bg-zinc-950 p-6 text-white overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Select Cover Art</DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium">
            Search results for "{song?.title}" by {song?.artist}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-10 w-10 text-cyan-500 animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Searching Spotify Network...</p>
            </div>
          ) : candidates.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {candidates.map((candidate, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedUrl(candidate.coverUrl)}
                  className={cn(
                    "group relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300",
                    selectedUrl === candidate.coverUrl 
                      ? "border-cyan-500 ring-4 ring-cyan-500/20" 
                      : "border-transparent hover:border-white/10"
                  )}
                >
                  <div className="aspect-square bg-zinc-900 border-b border-white/5">
                    <img 
                      src={candidate.coverUrl} 
                      alt={candidate.albumName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-3 bg-zinc-900/50 backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase text-cyan-500 mb-1">{candidate.source}</p>
                    <p className="text-xs font-bold truncate text-white">{candidate.albumName}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{candidate.artist}</p>
                  </div>
                  {selectedUrl === candidate.coverUrl && (
                    <div className="absolute top-2 right-2 h-8 w-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
                      <Check className="h-5 w-5 text-black" strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="h-16 w-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
                <Music className="h-8 w-8 text-zinc-700" />
              </div>
              <div>
                <p className="text-white font-bold">No candidates found</p>
                <p className="text-sm text-zinc-500">Try adjusting the artist or title in the dashboard.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-white/5">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedUrl}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-cyan-500/20"
          >
            Apply Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoverPickerModal;
