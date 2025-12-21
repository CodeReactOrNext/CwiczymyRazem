import { Song } from "feature/songs/types/songs.type";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Music, CheckCircle2, ShieldCheck, XCircle, Edit2, Loader2, Save, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { cn } from "assets/lib/utils";
import { useState } from "react";

interface SongManagementTableProps {
  songs: Song[];
  editingId: string | null;
  editForm: { title: string; artist: string; avgDifficulty: number };
  onEdit: (song: Song) => void;
  onSave: (songId: string) => void;
  onManualVerify: (songId: string) => void;
  onEnrich: (songId: string, artist: string, title: string) => void;
  onOpenCoverPicker?: (song: any) => void;
  isEnrichingBySong: Record<string, boolean>;
  onCancel: () => void;
  onFieldChange: (field: "title" | "artist" | "avgDifficulty", value: string) => void;
  isLoading?: boolean;
}

export const SongManagementTable = ({
  songs,
  editingId,
  editForm,
  onEdit,
  onSave,
  onManualVerify,
  onEnrich,
  onOpenCoverPicker,
  isEnrichingBySong,
  onCancel,
  onFieldChange,
  isLoading
}: SongManagementTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const totalPages = Math.ceil(songs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSongs = songs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
       setCurrentPage(newPage);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm shadow-xl">
        <div className="grid grid-cols-12 gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          <div className="col-span-1">Img</div>
          <div className="col-span-5 uppercase">Song / Artist</div>
          <div className="col-span-1 text-center uppercase">Rating</div>
          <div className="col-span-2 text-center uppercase tracking-normal">Cover</div>
          <div className="col-span-2 text-center uppercase">Status</div>
          <div className="col-span-1 text-right uppercase">Actions</div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/[0.03] scrollbar-thin scrollbar-track-zinc-900/40 scrollbar-thumb-zinc-700">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
               <Loader2 className="h-10 w-10 animate-spin text-cyan-500 opacity-20" />
               <p className="text-sm font-bold text-zinc-600">Loading catalog...</p>
            </div>
          ) : songs.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 font-medium">No records matching your search.</div>
          ) : (
            paginatedSongs.map((song) => (
              <div key={song.id} className={cn(
                  "grid grid-cols-12 items-center gap-4 px-6 py-4 transition-all duration-300",
                  editingId === song.id ? "bg-cyan-500/[0.03] ring-1 ring-inset ring-cyan-500/20" : "hover:bg-white/[0.02]"
              )}>
                <div className="col-span-1">
                   <div className="group relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-800 shadow-md border border-white/5">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music className="h-4 w-4 opacity-20" />
                        </div>
                      )}
                   </div>
                </div>
                <div className="col-span-5 min-w-0">
                  {editingId === song.id ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Input 
                        value={editForm.title} 
                        onChange={(e) => onFieldChange("title", e.target.value)}
                        className="h-8 border-cyan-500/30 bg-black/40 text-sm font-bold text-white focus:ring-1 focus:ring-cyan-500"
                      />
                      <Input 
                        value={editForm.artist} 
                        onChange={(e) => onFieldChange("artist", e.target.value)}
                        className="h-8 border-white/5 bg-black/20 text-xs font-medium text-zinc-400"
                      />
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="truncate text-sm font-bold text-white leading-tight">{song.title}</p>
                      <p className="truncate text-[11px] font-medium text-zinc-500 tracking-wide">{song.artist}</p>
                      {song.genres && song.genres.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {song.genres.slice(0, 2).map((genre) => (
                            <span 
                              key={genre} 
                              className="rounded bg-white/5 px-1 py-0.5 text-[7px] font-bold uppercase tracking-tight text-zinc-500 border border-white/5"
                            >
                              {genre}
                            </span>
                          ))}
                          {song.genres.length > 2 && (
                            <span className="text-[7px] font-bold text-zinc-700">+{song.genres.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex flex-col items-center justify-center">
                  {editingId === song.id ? (
                    <div className="w-14">
                      <Input 
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={editForm.avgDifficulty} 
                        onChange={(e) => onFieldChange("avgDifficulty", e.target.value)}
                        className="h-8 border-cyan-500/30 bg-black/40 text-xs font-bold text-center text-white focus:ring-1 focus:ring-cyan-500 p-1"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                       <span className="text-xs font-black text-cyan-400">{song.avgDifficulty?.toFixed(1) || "0.0"}</span>
                       <span className="text-[7px] font-bold text-zinc-600 uppercase">Rating</span>
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex justify-center">
                  {song.coverUrl ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-black text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <CheckCircle2 className="h-3 w-3" />
                      ACTIVE
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-3 py-1 text-[9px] font-black text-zinc-500 border border-white/10">
                      NONE
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex justify-center">
                  {song.isVerified ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[9px] font-black text-cyan-500 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      <ShieldCheck className="h-3 w-3" />
                      VERIFIED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[9px] font-black text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                      <XCircle className="h-3 w-3" />
                      UNVERIFIED
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  {editingId === song.id ? (
                    <div className="flex gap-1 animate-in zoom-in-95 duration-200">
                      <Button 
                        onClick={() => onSave(song.id)}
                        size="icon" 
                        className="h-8 w-8 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={onCancel}
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-zinc-500 hover:text-white"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      {!song.isVerified && (
                        <Button 
                          onClick={() => onManualVerify(song.id)}
                          variant="ghost" 
                          size="icon" 
                          title="Mark as Verified"
                          className="h-8 w-8 rounded-full transition-colors hover:bg-emerald-500/10 hover:text-emerald-500"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button 
                        onClick={() => onEnrich(song.id, song.artist, song.title)}
                        variant="ghost" 
                        size="icon" 
                        disabled={isEnrichingBySong[song.id]}
                        title="Auto Enrich"
                        className="h-8 w-8 rounded-full transition-colors hover:bg-cyan-500/10 hover:text-cyan-400 text-cyan-500"
                      >
                        {isEnrichingBySong[song.id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button 
                        onClick={() => onOpenCoverPicker?.(song)}
                        variant="ghost" 
                        size="icon" 
                        title="Manual Cover Select"
                        className="h-8 w-8 rounded-full transition-colors hover:bg-amber-500/10 hover:text-amber-500 text-amber-500"
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        onClick={() => onEdit(song)}
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
            <span className="ml-4 opacity-50">({songs.length} items)</span>
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 border-white/5 bg-zinc-900/60 hover:bg-white/5 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 border-white/5 bg-zinc-900/60 hover:bg-white/5 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
