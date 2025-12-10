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
}

export const SongsGrid = ({
  songs,
  currentPage,
  totalPages,
  onPageChange,
  onAddSong,
  hasFilters,
  onStatusChange,
}: SongsGridProps) => {
  const userId = useAppSelector(selectUserAuth);

  const [userSongs, setUserSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>({
    wantToLearn: [],
    learning: [],
    learned: [],
  });

  const { handleStatusChange } = useSongsStatusChange({
    onChange: setUserSongs,
    userSongs,
    onTableStatusChange: onStatusChange,
  });

  const allUserSongs = [
    ...userSongs.wantToLearn.map((song) => ({
      ...song,
      status: "wantToLearn",
    })),
    ...userSongs.learning.map((song) => ({ ...song, status: "learning" })),
    ...userSongs.learned.map((song) => ({ ...song, status: "learned" })),
  ];

  useEffect(() => {
    const loadUserSongs = async () => {
      if (!userId) return;
      try {
        const songs = await getUserSongs(userId);
        setUserSongs({
          wantToLearn: songs.wantToLearn,
          learning: songs.learning,
          learned: songs.learned,
        });
      } catch (error) {
        console.error("Error loading user songs:", error);
      }
    };

    loadUserSongs();
  }, [userId]);

  if (songs.length === 0) {
    return <SongsTableEmpty hasFilters={hasFilters} onAddSong={onAddSong} />;
  }

  return (
    <div className='space-y-8'>
      {/* Grid Container */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {songs.map((song) => {
          const userSong = allUserSongs.find((u) => u.id === song.id);
          const status = userSong?.status as SongStatus | undefined;

          return (
            <SongCard
              key={song.id}
              song={song}
              status={status}
              onStatusChange={(newStatus) =>
                handleStatusChange(
                  song.id,
                  newStatus,
                  song.title,
                  song.artist
                )
              }
              onRatingChange={onStatusChange}
            />
          );
        })}
      </div>

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
                          className={`border border-white/5 bg-zinc-800/50 hover:border-cyan-500/30 hover:bg-zinc-700/50 hover:text-cyan-300 ${
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
