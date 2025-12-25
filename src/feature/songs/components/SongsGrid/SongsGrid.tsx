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
import { SongsTableEmpty } from "feature/songs/components/SongsTable/components/SongsTableEmpty";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import SongSheet from "feature/songs/components/SongSheet/SongSheet";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

interface SongsGridProps {
  songs: Song[];
  hasFilters: boolean;
  currentPage: number;
  totalPages: number;
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
  totalPages,
  onPageChange,
  onAddSong,
  hasFilters,
  onStatusChange,
  userSongs,
}: SongsGridProps) => {
  const userId = useAppSelector(selectUserAuth);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { handleStatusChange, handleSongRemoval } = useSongsStatusChange({
    onChange: () => {}, // Handled by refreshSongs in SongsView
    userSongs,
    onTableStatusChange: onStatusChange,
  });

  if (songs.length === 0) {
    return <SongsTableEmpty hasFilters={hasFilters} onAddSong={onAddSong} />;
  }

  return (
    <div className='space-y-8'>
      {/* Grid Container */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
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

      {/* Pagination */}
      {songs.length > 0 && (
        <div className='flex justify-center'>
          <div className='rounded-2xl border border-white/5 bg-zinc-900/40 p-3 backdrop-blur-sm'>
            <Pagination>
              <PaginationContent className='gap-2'>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(currentPage - 1)}
                    className={`border border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 ${
                      currentPage <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:border-cyan-500/30 hover:text-cyan-300"
                    }`}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 &&
                      pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => onPageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className={`cursor-pointer border border-white/5 bg-zinc-800/50 hover:border-cyan-500/30 hover:bg-zinc-700/50 hover:text-cyan-300 ${
                            currentPage === pageNumber
                              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                              : ""
                          }`}>
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationEllipsis className='text-zinc-600' />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange(currentPage + 1)}
                    className={`border border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 ${
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:border-cyan-500/30 hover:text-cyan-300"
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
};
