"use client";

import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  Layers,
  Loader2,
  Music,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef,useState } from "react";
import { toast } from "sonner";

interface Song {
  spotifyId: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  year?: number;
  popularity?: number;
}

interface ArtistSongSelectorProps {
  isOpen: boolean;
  isEmbedded?: boolean;
  onSongsSelected: (
    songs: { title: string; artist: string; difficulty: number; coverUrl?: string }[],
    artist: string,
    autoEnrich: boolean
  ) => void;
  onClose: () => void;
}

export const ArtistSongSelector = ({
  isOpen,
  isEmbedded = false,
  onSongsSelected,
  onClose,
}: ArtistSongSelectorProps) => {
  const [artist, setArtist] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [customDifficulties, setCustomDifficulties] = useState<Record<string, number>>({});
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoEnrich, setAutoEnrich] = useState(true);

  // Using a ref for immediate blocking of double-triggers
  const importActiveRef = useRef(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        target.classList &&
        target.classList.contains("modal-backdrop")
      ) {
        onClose();
      }
    };

    if (isOpen && !isEmbedded) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isEmbedded, onClose]);

  if (!isOpen) return null;

  const searchArtistSongs = async (isLoadMore = false) => {
    if (!artist.trim()) {
      setError("Enter artist name");
      return;
    }

    if (isLoadMore) {
        setIsLoadMoreLoading(true);
    } else {
        setIsLoading(true);
        setError(null);
        setSongs([]);
        setSelectedSongs(new Set());
        setCustomDifficulties({});
        setOffset(0);
    }

    const currentOffset = isLoadMore ? offset + 50 : 0;

    try {
      const response = await fetch(
        `/api/admin/artist-songs?artist=${encodeURIComponent(artist)}&offset=${currentOffset}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch songs");
      }

      if (isLoadMore) {
        setSongs(prev => [...prev, ...data.songs]);
        setOffset(currentOffset);
      } else {
        setSongs(data.songs);
        setOffset(0);
      }
      
      if (data.songs.length === 0 && !isLoadMore) {
        toast.error(`No songs found for "${artist}". Try a simpler search.`);
      } else if (!isLoadMore) {
        const topSongs = data.songs.slice(0, 15).map((s: Song) => s.title);
        setSelectedSongs(new Set(topSongs));
        toast.success(`Found ${data.songs.length} unique songs for ${artist}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch songs. Check logs.");
      toast.error("Error searching songs");
    } finally {
      setIsLoading(false);
      setIsLoadMoreLoading(false);
    }
  };

  const handleDifficultyChange = (spotifyId: string, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num)) {
        setCustomDifficulties(prev => ({
            ...prev,
            [spotifyId]: num
        }));
    }
  };

  const toggleSongSelection = (songTitle: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songTitle)) {
      newSelected.delete(songTitle);
    } else {
      newSelected.add(songTitle);
    }
    setSelectedSongs(newSelected);
  };

  const toggleAll = () => {
    if (selectedSongs.size === songs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(songs.map(s => s.title)));
    }
  };

  const handleAddSelectedSongs = async () => {
    if (importActiveRef.current) return;
    
    const songsToAdd = songs
      .filter((song) => selectedSongs.has(song.title))
      .map((song) => ({
        title: song.title,
        artist: song.artist,
        coverUrl: song.coverUrl,
        difficulty: customDifficulties[song.spotifyId] ?? Math.round((song.popularity || 50) / 10),
      }));

    if (songsToAdd.length === 0) {
      toast.error("Select at least one song");
      return;
    }

    importActiveRef.current = true;
    setIsImporting(true);
    try {
      await onSongsSelected(songsToAdd, artist, autoEnrich);
    } finally {
      setIsImporting(false);
      importActiveRef.current = false;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchArtistSongs();
    }
  };

  return (
    <div className={cn(
        "z-[10] flex items-center justify-center duration-300 animate-in fade-in",
        isEmbedded ? "w-full h-full" : "modal-backdrop fixed inset-0 bg-black/80 px-4 py-6 backdrop-blur-xl"
    )}>
      <div className={cn(
          "flex w-full flex-col overflow-hidden transition-all",
          isEmbedded ? "h-full" : "max-h-[95vh] max-w-5xl rounded-[2.5rem] border border-white/10 bg-zinc-950 p-1 shadow-[0_0_80px_-15px_rgba(168,85,247,0.4)]"
      )}>
        <div className={cn(
            "flex flex-col h-full rounded-[2.2rem] p-6 lg:p-10",
            !isEmbedded && "bg-zinc-900/40"
        )}>
            {/* Header */}
            <div className='mb-8 flex items-center justify-between'>
                <div className='flex items-center gap-5'>
                    <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20'>
                        <Music className='h-7 w-7' />
                    </div>
                    <div>
                        <h3 className='text-3xl font-black uppercase tracking-tight text-white italic leading-none'>
                            Discovery Engine
                        </h3>
                        <p className='mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500'>
                            Spotify Cloud Connector
                        </p>
                    </div>
                </div>
                {!isEmbedded && (
                    <button
                        onClick={onClose}
                        className='flex h-12 w-12 items-center justify-center rounded-2xl transition-all hover:bg-white/5 active:scale-95 border border-white/5'>
                        <X className='h-6 w-6 text-zinc-500' />
                    </button>
                )}
            </div>

            {/* Search Input Section */}
            <div className='mb-10'>
                <div className='relative flex gap-4'>
                    <div className='relative flex-1'>
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-zinc-600" />
                        </div>
                        <Input
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder='Search Artist, Band or Group...'
                            className='h-16 border-white/5 bg-black/60 pl-14 pr-6 text-xl font-bold text-white placeholder:text-zinc-700 focus:ring-2 focus:ring-purple-500/50 transition-all rounded-[1.5rem] shadow-inner'
                        />
                    </div>
                    <Button
                        onClick={() => searchArtistSongs()}
                        disabled={isLoading || !artist.trim()}
                        className='h-16 rounded-[1.5rem] bg-purple-600 px-10 font-black uppercase tracking-widest text-white hover:bg-purple-500 shadow-xl shadow-purple-900/20 transition-all active:scale-95 disabled:opacity-30'>
                        {isLoading ? (
                            <Loader2 className='h-7 w-7 animate-spin' />
                        ) : (
                            "Explore"
                        )}
                    </Button>
                </div>

                {error && (
                    <div className='mt-5 flex items-center gap-4 rounded-[1.5rem] border border-red-500/20 bg-red-500/5 p-5 text-red-500 animate-in slide-in-from-top-4'>
                        <AlertCircle className='h-6 w-6 shrink-0' />
                        <span className='font-bold text-sm'>{error}</span>
                    </div>
                )}
            </div>

            {/* Results Grid/List */}
            {songs.length > 0 ? (
                <div className='flex-1 flex flex-col min-h-0'>
                    <div className='mb-6 flex items-center justify-between px-3'>
                        <div className="flex items-center gap-6">
                            <h4 className='text-xs font-black uppercase tracking-widest text-zinc-500'>
                                Findings for: <span className='text-purple-400 bg-purple-400/10 px-3 py-1 rounded-lg ml-2'>{artist}</span>
                            </h4>
                            <button 
                                onClick={toggleAll}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors"
                            >
                                {selectedSongs.size === songs.length ? "Deselect Everything" : "Select All Available"}
                            </button>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-800/40 border border-white/5 rounded-full shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className='text-[10px] font-black uppercase tracking-widest text-zinc-300'>
                                {selectedSongs.size} Selected
                            </span>
                        </div>
                    </div>

                    <div className='flex-1 space-y-3 overflow-y-auto rounded-[2.5rem] border border-white/5 bg-black/40 p-4 lg:p-8 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent'>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {songs.map((song, index) => (
                                <div
                                    key={index}
                                    onClick={() => toggleSongSelection(song.title)}
                                    className={`group relative flex cursor-pointer items-center gap-5 rounded-[1.8rem] border p-4 transition-all duration-300 ${
                                        selectedSongs.has(song.title)
                                        ? "border-purple-500/40 bg-purple-500/10 shadow-[0_15px_40px_-15px_rgba(168,85,247,0.2)] scale-[1.02] z-10"
                                        : "border-white/[0.03] bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-white/10"
                                    }`}>
                                    
                                    {/* Cover Image */}
                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-md">
                                        {song.coverUrl ? (
                                            <img 
                                                src={song.coverUrl} 
                                                alt={song.title} 
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-zinc-600 uppercase text-[8px] font-black">
                                                No Cover
                                            </div>
                                        )}
                                        <div className={cn(
                                            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300",
                                            selectedSongs.has(song.title) ? "opacity-100" : "opacity-0"
                                        )}>
                                            <Check className="h-8 w-8 text-white stroke-[3px]" />
                                        </div>
                                    </div>

                                    {/* Song Details */}
                                    <div className='min-w-0 flex-1 space-y-1' onClick={(e) => e.stopPropagation()}>
                                        <div className='text-[13px] font-black uppercase tracking-tight text-white leading-tight'>
                                            {song.title}
                                        </div>
                                        <div className='truncate text-[10px] font-bold text-purple-400 uppercase tracking-widest'>
                                            {song.artist}
                                        </div>
                                        <div className='flex items-center gap-3 pt-1'>
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                                                <Layers className="h-3 w-3" />
                                                <span className="truncate max-w-[120px]">{song.album}</span>
                                            </div>
                                            {song.year && (
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{song.year}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Difficulty Badge */}
                                    <div className='ml-2 shrink-0 text-center px-4' onClick={(e) => e.stopPropagation()}>
                                        <div className='text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1'>DIFF</div>
                                        <input 
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={customDifficulties[song.spotifyId] ?? Math.round((song.popularity || 50) / 10)}
                                            onChange={(e) => handleDifficultyChange(song.spotifyId, e.target.value)}
                                            className={cn(
                                                "w-12 text-center text-xs font-black px-1 py-1 rounded-lg transition-colors border-none focus:ring-1 focus:ring-purple-500 bg-transparent outline-none",
                                                selectedSongs.has(song.title) ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-zinc-400"
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {songs.length > 0 && songs.length % 50 === 0 && (
                            <div className="mt-8 flex justify-center pb-4">
                                <Button
                                    onClick={() => searchArtistSongs(true)}
                                    disabled={isLoadMoreLoading}
                                    variant="outline"
                                    className="h-12 px-8 rounded-xl border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {isLoadMoreLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Load 50 More Tracks"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ) : !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-8 opacity-40 animate-in fade-in duration-1000">
                    <div className="p-12 rounded-[4rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5">
                        <Activity className="h-28 w-28 text-zinc-700 stroke-[0.5]" />
                    </div>
                    <div className="text-center space-y-2">
                         <p className="font-black uppercase tracking-[0.4em] text-sm text-white italic">Awaiting Input</p>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Scan Spotify Database for new repertoire</p>
                    </div>
                </div>
            )}

            {/* Footer Bottom Actions */}
            <div className='mt-10 pt-10 border-t border-white/5'>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    {/* Settings & Status */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                        <div 
                            onClick={() => setAutoEnrich(!autoEnrich)}
                            className="flex items-center gap-5 cursor-pointer group px-6 py-3 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all shadow-sm"
                        >
                            <div className={cn(
                                "w-11 h-5 rounded-full p-1 transition-all duration-500",
                                autoEnrich ? "bg-purple-600 shadow-lg shadow-purple-500/40" : "bg-zinc-800"
                            )}>
                                <div className={cn(
                                    "w-3 h-3 rounded-full bg-white transition-all duration-500 shadow-lg",
                                    autoEnrich ? "translate-x-6" : "translate-x-0"
                                )} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-white uppercase italic tracking-tight leading-none mb-1">Deep Metadata Sync</p>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Automated Enrichment</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-6 py-3 rounded-3xl border border-cyan-500/10 bg-cyan-500/[0.02]">
                            <Activity className="h-5 w-5 text-cyan-500/60 shrink-0" />
                            <p className="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest leading-relaxed max-w-[220px]">
                                Database will be populated with estimated difficulty nodes. Refine in Inventory.
                            </p>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className='flex gap-4 w-full lg:w-auto'>
                        {!isEmbedded && (
                            <Button
                                onClick={onClose}
                                variant='ghost'
                                className='h-16 px-10 font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl'>
                                Cancel
                            </Button>
                        )}
                        <Button
                            onClick={handleAddSelectedSongs}
                            disabled={selectedSongs.size === 0 || isImporting}
                            className='h-16 flex-1 lg:flex-none px-16 rounded-2xl bg-white font-black uppercase tracking-widest text-black hover:bg-zinc-200 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.25)] transition-all active:scale-[0.98] disabled:opacity-20'>
                            {isImporting ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                `Import ${selectedSongs.size} Tracks`
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
