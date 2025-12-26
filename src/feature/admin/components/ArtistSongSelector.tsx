"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Music,
  Plus,
  Loader2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { toast } from "sonner";

interface Song {
  title: string;
  artist: string;
  album?: string;
  year?: number;
  popularity?: number;
}

interface ArtistSongSelectorProps {
  isOpen: boolean;
  onSongsSelected: (
    songs: { title: string; artist: string; difficulty: number }[],
    artist: string
  ) => void;
  onClose: () => void;
}

export const ArtistSongSelector = ({
  isOpen,
  onSongsSelected,
  onClose,
}: ArtistSongSelectorProps) => {
  const [artist, setArtist] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key and click outside to close modal
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

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const searchArtistSongs = async () => {
    if (!artist.trim()) {
      setError("Wprowadź nazwę artysty");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSongs([]);
    setSelectedSongs(new Set());

    try {
      const response = await fetch(
        `/api/admin/artist-songs?artist=${encodeURIComponent(artist)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch songs");
      }

      setSongs(data.songs);
      toast.success(
        `Znaleziono ${data.songs.length} piosenek artysty ${artist}`
      );
    } catch (err: any) {
      setError(
        err.message || "Nie udało się pobrać piosenek. Spróbuj ponownie."
      );
      toast.error("Błąd podczas wyszukiwania piosenek");
    } finally {
      setIsLoading(false);
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

  const handleAddSelectedSongs = () => {
    const songsToAdd = songs
      .filter((song) => selectedSongs.has(song.title))
      .map((song) => ({
        title: song.title,
        artist: song.artist,
        difficulty: Math.round((song.popularity || 50) / 10), // Prosta logika trudności na podstawie popularności
      }));

    if (songsToAdd.length === 0) {
      toast.error("Wybierz przynajmniej jedną piosenkę");
      return;
    }

    onSongsSelected(songsToAdd, artist);
    toast.success(`Dodano ${songsToAdd.length} piosenek do kolejki`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchArtistSongs();
    }
  };

  return (
    <div className='modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md duration-300 animate-in fade-in'>
      <div className='flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl shadow-black/50'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl bg-purple-500/10 p-2 text-purple-500'>
              <Music className='h-6 w-6' />
            </div>
            <div>
              <h3 className='text-xl font-black uppercase italic text-white'>
                Dodaj Piosenki Artysty
              </h3>
              <p className='text-xs font-bold uppercase tracking-widest text-zinc-500'>
                Wyszukaj i wybierz utwory
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className='rounded-xl p-2 transition-colors hover:bg-white/5'>
            <X className='h-6 w-6 text-zinc-500' />
          </button>
        </div>

        {/* Search Section */}
        <div className='mb-6'>
          <div className='flex gap-3'>
            <div className='flex-1'>
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='Wprowadź nazwę artysty (np. Metallica, Pink Floyd)'
                className='h-12 border-white/5 bg-black/40 text-white placeholder:text-zinc-600'
              />
            </div>
            <Button
              onClick={searchArtistSongs}
              disabled={isLoading || !artist.trim()}
              className='h-12 bg-purple-500 px-6 text-white hover:bg-purple-600'>
              {isLoading ? (
                <Loader2 className='h-5 w-5 animate-spin' />
              ) : (
                <Search className='h-5 w-5' />
              )}
            </Button>
          </div>

          {error && (
            <div className='mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-500'>
              <AlertCircle className='h-4 w-4 shrink-0' />
              <span className='text-sm'>{error}</span>
            </div>
          )}
        </div>

        {/* Songs List */}
        {songs.length > 0 && (
          <div className='flex-1 overflow-hidden'>
            <div className='mb-4 flex items-center justify-between'>
              <h4 className='text-lg font-semibold text-white'>
                Piosenki artysty:{" "}
                <span className='text-purple-400'>{artist}</span>
              </h4>
              <span className='text-sm text-zinc-500'>
                Wybrano: {selectedSongs.size} z {songs.length}
              </span>
            </div>

            <div className='max-h-96 space-y-2 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-4'>
              {songs.map((song, index) => (
                <div
                  key={index}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                    selectedSongs.has(song.title)
                      ? "border-purple-500/50 bg-purple-500/20"
                      : "border-transparent bg-zinc-900/50 hover:border-white/10"
                  }`}
                  onClick={() => toggleSongSelection(song.title)}>
                  <div className='flex min-w-0 flex-1 items-center gap-3'>
                    {selectedSongs.has(song.title) ? (
                      <Check className='h-5 w-5 shrink-0 text-purple-400' />
                    ) : (
                      <div className='h-5 w-5 shrink-0 rounded border-2 border-zinc-600' />
                    )}
                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-medium text-white'>
                        {song.title}
                      </div>
                      <div className='truncate text-sm text-zinc-400'>
                        {song.album} {song.year && `• ${song.year}`}
                      </div>
                    </div>
                  </div>
                  <div className='ml-4 shrink-0 text-right'>
                    <div className='text-sm font-medium text-zinc-300'>
                      Trudność: {Math.round((song.popularity || 50) / 10)}
                    </div>
                    {song.popularity && (
                      <div className='text-xs text-zinc-500'>
                        Popularność: {song.popularity}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='mt-6 flex gap-3'>
          <Button
            onClick={handleAddSelectedSongs}
            disabled={selectedSongs.size === 0}
            className='h-12 flex-1 bg-purple-500 font-semibold text-white hover:bg-purple-600'>
            <Plus className='mr-2 h-5 w-5' />
            Dodaj {selectedSongs.size} wybranych piosenek
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            variant='outline'
            className='h-12 border-zinc-700 px-6 text-zinc-300 hover:bg-zinc-800'>
            Anuluj
          </Button>
        </div>

        {/* Info */}
        <div className='mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4'>
          <div className='flex items-start gap-3'>
            <Music className='mt-0.5 h-5 w-5 shrink-0 text-zinc-600' />
            <div>
              <p className='mb-1 text-sm font-medium text-zinc-400'>
                Wskazówka
              </p>
              <p className='text-xs leading-relaxed text-zinc-600'>
                Poziom trudności jest automatycznie obliczany na podstawie
                popularności utworu. Możesz później dostosować go ręcznie w
                panelu zarządzania piosenkami.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
