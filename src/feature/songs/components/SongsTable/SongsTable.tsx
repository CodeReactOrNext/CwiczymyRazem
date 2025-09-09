import { Badge } from "assets/components/ui/badge";
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
import { getAverageDifficulty } from "feature/songs/utils/getAvgRaiting";
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
  tierFilter?: string;
}

const SongsTable = ({
  songs,
  currentPage,
  totalPages,
  onPageChange,
  onAddSong,
  hasFilters,
  onStatusChange,
  tierFilter = "all",
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

  const renderDifficulty = (rating: number) => {
    const { color, label } = getDifficultyRating(rating);

    return (
      <div className='flex items-center gap-2'>
        <div
          className='h-2 w-2 rounded-full'
          style={{ backgroundColor: color }}></div>
        <span className='font-bold'>{rating}</span> {label}
      </div>
    );
  };

  const getRowStyle = (songId: string) => {
    const status = userSongs.wantToLearn.find((s) => s.id === songId)
      ? {
          backgroundColor: "rgba(0, 0, 98, 0.05)",
          transition: "background-color 0.2s",
          ":hover": {
            backgroundColor: "rgba(0, 0, 98, 0.1)",
          },
        }
      : userSongs.learning.find((s) => s.id === songId)
      ? {
          backgroundColor: "rgba(255, 193, 7, 0.05)",
          transition: "background-color 0.2s",
          ":hover": {
            backgroundColor: "rgba(255, 193, 7, 0.1)",
          },
        }
      : userSongs.learned.find((s) => s.id === songId)
      ? {
          backgroundColor: "rgba(76, 175, 80, 0.05)",
          transition: "background-color 0.2s",
          ":hover": {
            backgroundColor: "rgba(76, 175, 80, 0.1)",
          },
        }
      : {};

    return status;
  };

  if (!userId) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Enhanced Table Container */}
      <div className='overflow-hidden rounded-lg border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm'>
        <Table>
          {/* Enhanced Table Header */}
          <TableHeader className='bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 backdrop-blur-sm'>
            <TableRow className='border-b border-zinc-600/30 hover:bg-transparent'>
              <TableHead className='h-14 px-6 text-sm font-semibold text-zinc-200'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-cyan-400'></div>
                  {t("artist")}
                </div>
              </TableHead>
              <TableHead className='h-14 px-6 text-sm font-semibold text-zinc-200'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-purple-400'></div>
                  {t("title")}
                </div>
              </TableHead>
              <TableHead className='h-14 px-6 text-sm font-semibold text-zinc-200'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-amber-400'></div>
                  {t("difficulty")}
                </div>
              </TableHead>
              <TableHead className='h-14 px-6 text-sm font-semibold text-zinc-200'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-emerald-400'></div>
                  Ocena
                </div>
              </TableHead>
              {tierFilter !== "all" && (
                <TableHead className='h-14 px-6 text-sm font-semibold text-zinc-200'>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-yellow-400'></div>
                    Tier
                  </div>
                </TableHead>
              )}
              <TableHead className='h-14 px-6 text-sm font-semibold text-zinc-200'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-blue-400'></div>
                  Status
                </div>
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
                    className={`group border-b border-zinc-700/20 transition-all duration-200 hover:bg-zinc-800/30 ${
                      status === "wantToLearn"
                        ? "bg-blue-500/5 hover:bg-blue-500/10"
                        : status === "learning"
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : status === "learned"
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "hover:bg-zinc-800/20"
                    }`}>
                    {/* Artist Cell */}
                    <TableCell className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`h-1 w-1 rounded-full ${
                            status === "wantToLearn"
                              ? "bg-blue-400"
                              : status === "learning"
                              ? "bg-amber-400"
                              : status === "learned"
                              ? "bg-emerald-400"
                              : "bg-zinc-500"
                          }`}></div>
                        <div>
                          <p className='font-medium text-zinc-200 transition-colors group-hover:text-white'>
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Title Cell */}
                    <TableCell className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div>
                          <p className='font-semibold text-white transition-colors group-hover:text-cyan-300'>
                            {song.title}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Difficulty Cell */}
                    <TableCell className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <Badge
                          variant='outline'
                          className={`border-zinc-600/50 bg-zinc-800/30 text-zinc-300 backdrop-blur-sm ${
                            getDifficultyRating(
                              getAverageDifficulty(song.difficulties)
                            ).color === "#4CAF50"
                              ? "border-green-500/30 bg-green-500/10 text-green-300"
                              : getDifficultyRating(
                                  getAverageDifficulty(song.difficulties)
                                ).color === "#8BC34A"
                              ? "border-green-400/30 bg-green-400/10 text-green-300"
                              : getDifficultyRating(
                                  getAverageDifficulty(song.difficulties)
                                ).color === "#FFC107"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                              : getDifficultyRating(
                                  getAverageDifficulty(song.difficulties)
                                ).color === "#FF9800"
                              ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                              : getDifficultyRating(
                                  getAverageDifficulty(song.difficulties)
                                ).color === "#FF5722"
                              ? "border-red-500/30 bg-red-500/10 text-red-300"
                              : "border-red-600/30 bg-red-600/10 text-red-300"
                          }`}>
                          {renderDifficulty(
                            getAverageDifficulty(song.difficulties)
                          )}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Rating Cell */}
                    <TableCell className='px-6 py-4'>
                      <div className='rounded-lg border border-zinc-700/30 bg-zinc-800/20 p-3 backdrop-blur-sm'>
                        <SongRating song={song} refreshTable={onStatusChange} />
                      </div>
                    </TableCell>

                    {/* Tier Cell - Only show when tier filter is active */}
                    {tierFilter !== "all" && (
                      <TableCell className='px-6 py-4'>
                        {(() => {
                          const avgDifficulty = getAverageDifficulty(
                            song.difficulties
                          );
                          const tier = getSongTier(avgDifficulty);
                          return (
                            <div className='flex items-center gap-3'>
                              <div
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 backdrop-blur-sm ${tier.borderColor} ${tier.bgColor}`}>
                                <div
                                  className='h-3 w-3 rounded-full border'
                                  style={{
                                    backgroundColor: tier.color,
                                    borderColor: tier.color,
                                  }}></div>
                                <span
                                  className='text-lg font-bold'
                                  style={{ color: tier.color }}>
                                  {tier.tier}
                                </span>
                                <span className='text-xs text-zinc-400'>
                                  {tier.description}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                    )}

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
                          className={`w-[140px] border-zinc-600/50 bg-zinc-800/30 backdrop-blur-sm transition-colors hover:bg-zinc-700/50 ${
                            status === "wantToLearn"
                              ? "border-blue-500/30 bg-blue-500/10"
                              : status === "learning"
                              ? "border-amber-500/30 bg-amber-500/10"
                              : status === "learned"
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : ""
                          }`}>
                          <SelectValue placeholder={t("select_status")} />
                        </SelectTrigger>
                        <SelectContent className='border-zinc-600/50 bg-zinc-800/90 backdrop-blur-xl'>
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
                    className={`border border-zinc-600/50 bg-zinc-800/30 hover:bg-zinc-700/50 ${
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
                          className={`border border-zinc-600/50 bg-zinc-800/30 hover:border-cyan-500/50 hover:bg-zinc-700/50 hover:text-cyan-300 ${
                            currentPage === pageNumber
                              ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
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
                    className={`border border-zinc-600/50 bg-zinc-800/30 hover:bg-zinc-700/50 ${
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

const styles = `
  .want-to-learn {
    background-color: rgba(var(--primary-rgb), 0.05);
  }

  .learning {
    background-color: rgba(var(--warning-rgb), 0.05);
  }

  .learned {
    background-color: rgba(var(--success-rgb), 0.05);
  }

  .want-to-learn:hover {
    background-color: rgba(var(--primary-rgb), 0.1);
  }

  .learning:hover {
    background-color: rgba(var(--warning-rgb), 0.1);
  }

  .learned:hover {
    background-color: rgba(var(--success-rgb), 0.1);
  }
`;
