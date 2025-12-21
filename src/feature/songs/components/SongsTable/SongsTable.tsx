
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "assets/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "assets/components/ui/table";
import { SongRating } from "feature/songs/components/SongsTable/components/SongRating";
import { SongsTableEmpty } from "feature/songs/components/SongsTable/components/SongsTableEmpty";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";

interface SongsTableProps {
  songs: Song[];
  hasFilters: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddSong: () => void;
  onStatusChange: () => void;
}

const SongsTable = ({
  songs,
  currentPage,
  totalPages,
  onPageChange,
  onAddSong,
  hasFilters,
  onStatusChange,
}: SongsTableProps) => {
  const { t } = useTranslation("songs");
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

  const getDifficultyRating = (rating: number) => {
    if (rating <= 2) {
      return { color: "#4CAF50", label: "Very Easy" };
    } else if (rating <= 4) {
      return { color: "#8BC34A", label: "Easy" };
    } else if (rating <= 6) {
      return { color: "#FFC107", label: "Medium" };
    } else if (rating <= 7) {
      return { color: "#FF9800", label: "Hard" };
    } else if (rating <= 9) {
      return { color: "#FF5722", label: "Very Hard" };
    } else {
      return { color: "#F44336", label: "Extreme" };
    }
  };



  if (!userId) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Enhanced Table Container */}
      {/* Enhanced Table Container */}
      <div className='overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900/20 shadow-lg backdrop-blur-sm'>
        <Table>
          {/* Enhanced Table Header */}
          <TableHeader className='bg-gradient-to-r from-slate-800/60 to-slate-700/40 backdrop-blur-sm'>
            <TableRow className='border-b border-slate-600/30 hover:bg-transparent'>
              <TableHead className='h-12 px-6 text-sm font-semibold text-slate-300'>
                {t("artist")}
              </TableHead>
              <TableHead className='h-12 px-6 text-sm font-semibold text-slate-300'>
                {t("title")}
              </TableHead>
              <TableHead className='h-12 px-6 text-sm font-semibold text-slate-300'>
                {t("difficulty")}
              </TableHead>
              <TableHead className='h-12 px-6 text-sm font-semibold text-slate-300'>
                Ocena
              </TableHead>
              <TableHead className='h-12 px-6 text-sm font-semibold text-slate-300'>
                Tier
              </TableHead>
              <TableHead className='h-12 px-6 text-sm font-semibold text-slate-300'>
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          {/* Enhanced Table Body */}
          <TableBody>
            {songs.length > 0 ? (
              songs.map((song, index) => {
                const userSong = allUserSongs.find(
                  (userSong) => song.id === userSong.id
                );
                const status = userSong?.status;

                return (
                  <TableRow
                    key={song.id}
                    className='group border-b border-zinc-700/20 transition-all duration-200 hover:bg-zinc-800/40'>
                    {/* Artist Cell */}
                    <TableCell className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <p className='font-medium text-zinc-300 transition-colors group-hover:text-white'>
                          {song.artist}
                        </p>
                      </div>
                    </TableCell>

                    {/* Title Cell */}
                    <TableCell className='px-6 py-4'>
                      <p className='font-semibold text-white transition-colors group-hover:text-cyan-300'>
                        {song.title}
                      </p>
                    </TableCell>

                    {/* Difficulty Cell */}
                    <TableCell className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        {(() => {
                           const avgDiff = song.avgDifficulty || 0;
                           const { color, label } = getDifficultyRating(avgDiff);
                          return (
                            <div className="flex items-center gap-2 rounded-md border border-slate-700/50 bg-slate-800/30 px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-colors"
                                 style={{ color: color, borderColor: `${color}40` }}>
                                <span className="font-bold">{avgDiff.toFixed(1)}</span>
                                <span className="text-slate-400">|</span>
                                <span>{label}</span>
                            </div>
                          )
                        })()}
                      </div>
                    </TableCell>

                    {/* Rating Cell */}
                    <TableCell className='px-6 py-4'>
                      <div className='w-fit rounded-lg border border-zinc-700/30 bg-zinc-800/20 p-2 backdrop-blur-sm'>
                        <SongRating song={song} refreshTable={onStatusChange} />
                      </div>
                    </TableCell>

                    {/* Tier Cell */}
                    <TableCell className='px-6 py-4'>
                      {(() => {
                        const avgDifficulty = song.avgDifficulty || 0;
                        const tier = getSongTier(avgDifficulty);
                        return (
                          <div 
                            className='inline-flex items-center gap-2 rounded px-2.5 py-1 text-sm font-bold border'
                            style={{ 
                              color: tier.color,
                              borderColor: `${tier.color}40`,
                              backgroundColor: `${tier.color}10`
                            }}
                          >
                            {tier.tier}
                          </div>
                        );
                      })()}
                    </TableCell>

                    {/* Status Cell */}
                    <TableCell className='px-6 py-4'>
                      <Select
                        value={status}
                        onValueChange={(value) =>
                          handleStatusChange(
                            song.id,
                            value as SongStatus,
                            song.title,
                            song.artist
                          )
                        }>
                        <SelectTrigger
                          className='w-[140px] border-slate-700/50 bg-slate-800/30 text-slate-300 backdrop-blur-sm transition-colors hover:bg-slate-700/50 focus:ring-slate-700'>
                          <SelectValue placeholder={t("select_status")} />
                        </SelectTrigger>
                        <SelectContent className='border-slate-600/50 bg-slate-800/90 backdrop-blur-xl'>
                          <SelectItem
                            value='wantToLearn'
                            className='font-openSans focus:bg-blue-500/20 focus:text-blue-300'>
                            <div className='flex items-center gap-2'>
                              <div className='h-2 w-2 rounded-full bg-blue-400'></div>
                              {t("want_to_learn")}
                            </div>
                          </SelectItem>
                          <SelectItem
                            value='learning'
                            className='focus:bg-amber-500/20 focus:text-amber-300'>
                            <div className='flex items-center gap-2'>
                              <div className='h-2 w-2 rounded-full bg-amber-400'></div>
                              {t("learning")}
                            </div>
                          </SelectItem>
                          <SelectItem
                            value='learned'
                            className='focus:bg-emerald-500/20 focus:text-emerald-300'>
                            <div className='flex items-center gap-2'>
                              <div className='h-2 w-2 rounded-full bg-emerald-400'></div>
                              {t("learned")}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <SongsTableEmpty hasFilters={hasFilters} onAddSong={onAddSong} />
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      {songs.length > 0 && (
        <div className='flex justify-center'>
          <div className='rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-4 backdrop-blur-sm'>
            <Pagination>
              <PaginationContent className='gap-2'>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(currentPage - 1)}
                    className={`border border-slate-600/50 bg-slate-800/30 hover:bg-slate-700/50 ${
                      currentPage <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:border-cyan-500/50 hover:text-cyan-300"
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
                          className={`border border-slate-600/50 bg-slate-800/30 hover:border-cyan-500/50 hover:bg-slate-700/50 hover:text-cyan-300 ${
                            currentPage === pageNumber
                              ? "border-cyan-500/50 bg-cyan-500/25 text-cyan-300"
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
                        <PaginationEllipsis className='text-zinc-500' />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange(currentPage + 1)}
                    className={`border border-slate-600/50 bg-slate-800/30 hover:bg-slate-700/50 ${
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:border-cyan-500/50 hover:text-cyan-300"
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

export default SongsTable;


