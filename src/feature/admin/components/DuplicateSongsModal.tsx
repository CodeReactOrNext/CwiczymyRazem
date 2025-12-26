import { X, Copy, Trash2, AlertTriangle, Users } from "lucide-react";
import { Song } from "feature/songs/types/songs.type";
import { Button } from "assets/components/ui/button";

interface DuplicateSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: { key: string; songs: Song[] }[];
  onDelete: (songId: string) => void;
  scannedCount?: number;
}

export const DuplicateSongsModal = ({ isOpen, onClose, duplicates, onDelete, scannedCount }: DuplicateSongsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-zinc-900 font-sans shadow-2xl shadow-black/50">
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Copy className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Duplicate Detective</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                Analyzed {scannedCount || "entire"} database • Found {duplicates.length} conflict groups
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors group">
            <X className="h-6 w-6 text-zinc-500 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-track-zinc-900/40 scrollbar-thumb-zinc-700">
          {duplicates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4 opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest">No duplicates found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {duplicates.map((group) => (
                <div key={group.key} className="bg-black/30 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-3">
                     <AlertTriangle className="h-4 w-4 text-amber-500" />
                     <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Duplicate Key:</span>
                     <code className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{group.key}</code>
                  </div>
                  <div className="divide-y divide-white/5">
                    {group.songs.map((song) => (
                      <div key={song.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                        <div className="flex items-center gap-4">
                           {song.coverUrl ? (
                             <img src={song.coverUrl} className="h-10 w-10 rounded-lg object-cover bg-black" />
                           ) : (
                             <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-[10px] font-bold">N/A</div>
                           )}
                           <div>
                              <p className="text-sm font-bold text-white leading-tight">{song.title}</p>
                              <p className="text-xs font-medium text-zinc-500">{song.artist}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-1.5 rounded">ID: {song.id.slice(0, 6)}...</span>
                                <span className="text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-1.5 rounded">Rating: {song.avgDifficulty}</span>
                                <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 px-1.5 rounded flex items-center gap-1">
                                  <Users className="h-2.5 w-2.5" />
                                  {song.practicingUsers?.length || 0}
                                </span>
                              </div>
                           </div>
                        </div>
                        <Button 
                          onClick={() => onDelete(song.id)}
                          variant="ghost"
                          size="sm"
                          className="h-9 hover:bg-red-500/10 hover:text-red-500 text-zinc-600 font-bold uppercase tracking-wider text-[10px]"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-6 border-t border-white/5 bg-black/20 text-center">
             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-2">
               <AlertTriangle className="h-3 w-3" />
               Review carefully before deleting. This action cannot be undone.
             </p>
        </div>
      </div>
    </div>
  );
};

import { CheckCircle2 } from "lucide-react";
