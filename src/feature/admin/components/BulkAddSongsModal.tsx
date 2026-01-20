import { AlertCircle,CheckCircle2, Info, Upload, X } from "lucide-react";
import { useState } from "react";

interface BulkAddSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (songs: any[]) => void;
  isLoading: boolean;
}

export const BulkAddSongsModal = ({ isOpen, onClose, onConfirm, isLoading }: BulkAddSongsModalProps) => {
  const [text, setText] = useState("");
  const [parsedSongs, setParsedSongs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    try {
      // Try JSON first
      if (text.trim().startsWith("[")) {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          setParsedSongs(data);
          return;
        }
      }

      // Fallback to line-by-line parsing: Title - Artist - Difficulty
      const lines = text.split("\n").filter(l => l.trim());
      const songs = lines.map(line => {
        const parts = line.split("-").map(p => p.trim());
        if (parts.length >= 3) {
          return {
            title: parts[0],
            artist: parts[1],
            difficulty: parseFloat(parts[2]) || 0
          };
        }
        return null;
      }).filter(s => s !== null);

      if (songs.length === 0) throw new Error("No valid songs found. Use format: Title - Artist - Difficulty");
      setParsedSongs(songs);
    } catch (err: any) {
      setError(err.message || "Failed to parse data");
      setParsedSongs([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic">Bulk Song Import</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Expand the database in seconds</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="h-6 w-6 text-zinc-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Paste JSON or list here...\nExample: \nTitle - Artist - 5\nAnother Song - Artist - 3`}
              className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-zinc-300 font-medium focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-700 resize-none font-mono"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button 
                onClick={handleParse}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white transition-all"
              >
                Validate Data
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {parsedSongs.length > 0 && (
            <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 max-h-40 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-cyan-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Detected {parsedSongs.length} songs
                </span>
              </div>
              {parsedSongs.map((s, i) => (
                <div key={i} className="text-[10px] text-zinc-400 font-bold flex justify-between border-b border-white/5 pb-1 last:border-0 uppercase tracking-tighter">
                  <span className="truncate pr-4">{s.title} — {s.artist}</span>
                  <span className="text-cyan-500 shrink-0">DIFF: {s.difficulty}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button
              onClick={() => onConfirm(parsedSongs)}
              disabled={isLoading || parsedSongs.length === 0}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-black font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>Import {parsedSongs.length} Songs to Database</>
              )}
            </button>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3">
              <Info className="h-5 w-5 text-zinc-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase">AI Prompt Tip</p>
                <p className="text-[10px] text-zinc-600 leading-relaxed font-bold uppercase">
                  "Give me 10 rock songs in this format: Title - Artist - Difficulty(1-10)"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
