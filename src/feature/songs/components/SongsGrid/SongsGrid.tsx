import { Button } from "assets/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "assets/components/ui/pagination";
import { SongCard } from "feature/songs/components/SongsGrid/SongCard";
import SongSheet from "feature/songs/components/SongSheet/SongSheet";
import { SongsTableEmpty } from "feature/songs/components/SongsTable/components/SongsTableEmpty";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

interface SongsGridProps {
  songs: Song[];
  hasFilters: boolean;
  currentPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onAddSong: () => void;
  onStatusChange: () => void;
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
}

export const SongsGrid = ({
  songs,
  currentPage,
  hasMore,
  onPageChange,
  onAddSong,
  hasFilters,
  onStatusChange,
  userSongs,
}: SongsGridProps) => {

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { handleStatusChange, handleSongRemoval } = useSongsStatusChange({
    onChange: () => {}, // Handled by refreshSongs in SongsView
    userSongs,
    onTableStatusChange: onStatusChange,
  });

  return (
    <div className='space-y-8 min-h-[400px] flex flex-col justify-between pb-12 transition-all duration-300'>
      {songs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <SongsTableEmpty hasFilters={hasFilters} onAddSong={onAddSong} />
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-500'>
          {songs.map((song) => {
            let userStatus: SongStatus | undefined;
            if (userSongs.wantToLearn.some(s => s.id === song.id)) userStatus = "wantToLearn";
            else if (userSongs.learning.some(s => s.id === song.id)) userStatus = "learning";
            else if (userSongs.learned.some(s => s.id === song.id)) userStatus = "learned";

            return (
              <SongCard
                key={song.id}
                song={song}
                userStatus={userStatus}
                onOpenDetails={() => {
                  setSelectedSong(song);
                  setIsDetailsOpen(true);
                }}
              />
            );
          })}
        </div>
      )}

      <SongSheet
        song={songs.find((s) => s.id === selectedSong?.id) || selectedSong}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onStatusChange={async (newStatus) => {
          if (selectedSong) {
            if (newStatus === undefined) {
              await handleSongRemoval(selectedSong.id);
            } else {
              await handleStatusChange(
                selectedSong.id,
                newStatus,
                selectedSong.title,
                selectedSong.artist
              );
            }
          }
        }}
        onRatingChange={onStatusChange}
        status={
          userSongs.wantToLearn.some(s => s.id === selectedSong?.id) ? "wantToLearn" :
          userSongs.learning.some(s => s.id === selectedSong?.id) ? "learning" :
          userSongs.learned.some(s => s.id === selectedSong?.id) ? "learned" : 
          undefined
        }
      />

      {/* Pagination Container */}
      <div className='mt-auto pt-8'>
        {(currentPage > 1 || hasMore) && (
          <div className='flex justify-center'>
            <div className='rounded-2xl border border-white/5 bg-zinc-900/40 p-2 backdrop-blur-sm flex items-center gap-4'>
              <Button
                variant="ghost"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-10 px-4 border border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-30"
              >
                Previous
              </Button>
              
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">
                Page {currentPage}
              </div>

              <Button
                variant="ghost"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasMore}
                className="h-10 px-4 border border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-30"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
