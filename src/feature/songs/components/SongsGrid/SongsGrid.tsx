import { Button } from "assets/components/ui/button";
import { SongCard } from "feature/songs/components/SongsGrid/SongCard";
import { SongCardRow, SongRowSkeleton } from "feature/songs/components/SongsGrid/SongCardRow";
import { SongCardSkeleton } from "feature/songs/components/SongsGrid/SongCardSkeleton";
import SongSheet from "feature/songs/components/SongSheet/SongSheet";
import { SongsTableEmpty } from "feature/songs/components/SongsTable/components/SongsTableEmpty";
import { ITEMS_PER_PAGE } from "feature/songs/hooks/useSongs";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import posthog from "posthog-js";
import { useState } from "react";

interface SongsGridProps {
  songs: Song[];
  isLoading?: boolean;
  hasFilters: boolean;
  currentPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onAddSong: () => void;
  onStatusChange: () => void;
  onPractice?: (song: Song) => void;
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
  updateUserSongsCache: (songs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }) => void;
}

export const SongsGrid = ({
  songs,
  isLoading,
  currentPage,
  hasMore,
  onPageChange,
  onAddSong,
  hasFilters,
  onStatusChange,
  onPractice,
  userSongs,
  updateUserSongsCache,
}: SongsGridProps) => {

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { handleStatusChange, handleSongRemoval } = useSongsStatusChange({
    onChange: updateUserSongsCache,
    userSongs,
    onTableStatusChange: onStatusChange,
  });

  // Adding a library song that isn't in the collection yet: handleStatusChange's
  // optimistic move can't help (it only reshuffles songs already in userSongs), so
  // we insert the full song into the cache here. The sidebar reads the same cache,
  // so it appears instantly; the refetch afterwards reconciles order/progress.
  const handleAddOrMove = (song: Song, status: SongStatus) => {
    const isInCollection =
      userSongs.wantToLearn.some((s) => s.id === song.id) ||
      userSongs.learning.some((s) => s.id === song.id) ||
      userSongs.learned.some((s) => s.id === song.id);

    if (!isInCollection) {
      updateUserSongsCache({
        ...userSongs,
        [status]: [...userSongs[status], song],
      });
      return handleStatusChange(song.id, status, song.title, song.artist, {
        skipOptimisticUpdate: true,
      });
    }
    return handleStatusChange(song.id, status, song.title, song.artist);
  };

  if (!userSongs) {
    return <div>Loading...</div>;
  }

  const getUserStatus = (song: Song): SongStatus | undefined => {
    if (userSongs.wantToLearn.some((s) => s.id === song.id)) return "wantToLearn";
    if (userSongs.learning.some((s) => s.id === song.id)) return "learning";
    if (userSongs.learned.some((s) => s.id === song.id)) return "learned";
    return undefined;
  };

  const openDetails = (song: Song) => {
    posthog.capture("song_library_action", { action: "open_details", song_id: song.id });
    setSelectedSong(song);
    setIsDetailsOpen(true);
  };

  const changeStatus = (song: Song, status: SongStatus | undefined) => {
    if (status) handleAddOrMove(song, status);
    else handleSongRemoval(song.id);
  };

  return (
    <div className='space-y-8 min-h-[400px] flex flex-col justify-between pb-12 transition-all duration-300'>
      {isLoading ? (
        <>
          {/* Phones: Spotify-style list */}
          <div className='space-y-1 sm:hidden'>
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <SongRowSkeleton key={i} />
            ))}
          </div>
          {/* Tablet / desktop: card grid */}
          <div className='hidden gap-x-6 gap-y-8 sm:grid sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5'>
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : songs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <SongsTableEmpty hasFilters={hasFilters} onAddSong={onAddSong} />
        </div>
      ) : (
        <>
          {/* Phones: Spotify-style list — the 2-col card grid is too cramped to read. */}
          <div className='space-y-1 sm:hidden animate-in fade-in duration-500'>
            {songs.map((song) => {
              const userStatus = getUserStatus(song);
              return (
                <SongCardRow
                  key={song.id}
                  song={song}
                  userStatus={userStatus}
                  onOpenDetails={() => openDetails(song)}
                  onStatusChange={(status) => changeStatus(song, status)}
                  onPlay={userStatus && onPractice ? () => onPractice(song) : undefined}
                />
              );
            })}
          </div>

          {/* Tablet / desktop: card grid */}
          <div className='hidden gap-x-6 gap-y-8 sm:grid sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 animate-in fade-in duration-500'>
            {songs.map((song) => {
              const userStatus = getUserStatus(song);
              return (
                <SongCard
                  key={song.id}
                  song={song}
                  userStatus={userStatus}
                  onOpenDetails={() => openDetails(song)}
                  onStatusChange={(status) => changeStatus(song, status)}
                  onPlay={userStatus && onPractice ? () => onPractice(song) : undefined}
                />
              );
            })}
          </div>
        </>
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
            <div className='rounded-2xl bg-zinc-900/40 p-2 backdrop-blur-sm flex items-center gap-4'>
              <Button
                variant="ghost"
                onClick={() => {
                  posthog.capture("song_library_action", { action: "page_change", direction: "prev", page: currentPage - 1 });
                  onPageChange(currentPage - 1);
                }}
                disabled={currentPage <= 1}
                className="h-10 px-4 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-30"
              >
                Previous
              </Button>
              
              <div className="text-xs font-bold text-zinc-500 px-2">
                Page {currentPage}
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  posthog.capture("song_library_action", { action: "page_change", direction: "next", page: currentPage + 1 });
                  onPageChange(currentPage + 1);
                }}
                disabled={!hasMore}
                className="h-10 px-4 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-30"
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
