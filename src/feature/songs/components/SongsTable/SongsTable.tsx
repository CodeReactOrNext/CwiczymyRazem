import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Song, SongStatus } from "utils/firebase/client/firebase.types";
import {
  getUserSongs,
  rateSongDifficulty,
} from "utils/firebase/client/firebase.utils";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "assets/components/ui/table";
import { Music, Star } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
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

import { SongsTableEmpty } from "feature/songs/components/SongsTable/components/SongsTableEmpty";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";

interface SongsTableProps {
  songs: Song[];
  hasFilters: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddSong: () => void;
  onStatusChange?: () => void;
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
  const [ratingHover, setRatingHover] = useState<{
    songId: string;
    rating: number;
  } | null>(null);
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

  const handleRating = async (
    songId: string,
    title: string,
    artist: string,
    rating: number
  ) => {
    if (!userId) {
      return;
    }

    try {
      await rateSongDifficulty(songId, userId, rating, title, artist);
      toast.success(t("rating_updated"));
    } catch (error) {
      toast.error(t("error_rating"));
    }
  };

  const getAverageDifficulty = (difficulties: Song["difficulties"]) => {
    if (!difficulties?.length) return 0;
    return (
      difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
      difficulties.length
    );
  };

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
        <span>{label}</span>
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
      <div className='w-full'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("artist")}</TableHead>
              <TableHead>{t("difficulty")}</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.length > 0 ? (
              songs.map((song) => (
                <TableRow
                  key={song.id}
                  style={getRowStyle(song.id)}
                  className='transition-colors'>
                  <TableCell>{song.title}</TableCell>
                  <TableCell>{song.artist}</TableCell>
                  <TableCell>
                    <div className='flex gap-1'>
                      {[...Array(10)].map((_, i) => {
                        const avgRating = getAverageDifficulty(
                          song.difficulties
                        );

                        const userRating = song?.difficulties?.find(
                          (d) => d.userId === userId
                        )?.rating;

                        const isHovered =
                          ratingHover?.songId === song.id &&
                          ratingHover.rating >= i + 1;

                        const showUserRating =
                          !ratingHover?.songId &&
                          userRating &&
                          userRating >= i + 1;

                        const showAvgRating = avgRating >= i + 1;

                        return (
                          <div key={i} className='relative'>
                            <Star
                              className={`h-4 w-4 ${
                                showAvgRating
                                  ? "fill-yellow-300 text-yellow-300"
                                  : "fill-muted text-muted-foreground"
                              }`}
                            />
                            <Star
                              className={`absolute inset-0 h-4 w-4 cursor-pointer ${
                                isHovered || showUserRating
                                  ? "fill-primary text-primary"
                                  : "fill-transparent text-transparent"
                              }`}
                              onClick={
                                userRating
                                  ? undefined
                                  : () =>
                                      handleRating(
                                        song.id,
                                        song.title,
                                        song.artist,
                                        i + 1
                                      )
                              }
                              onMouseEnter={
                                userRating
                                  ? undefined
                                  : () =>
                                      setRatingHover({
                                        songId: song.id,
                                        rating: i + 1,
                                      })
                              }
                              onMouseLeave={() => setRatingHover(null)}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className='mt-1 text-sm text-muted-foreground'>
                      {t("avg")}:{" "}
                      {getAverageDifficulty(song.difficulties).toFixed(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>
                      {renderDifficulty(
                        getAverageDifficulty(song.difficulties)
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={
                        allUserSongs.find((userSong) => song.id === userSong.id)
                          ?.status
                      }
                      onValueChange={(value) =>
                        handleStatusChange(
                          song.id,
                          value as SongStatus,
                          song.title,
                          song.artist
                        )
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value='wantToLearn'
                          className='font-openSans'>
                          {t("want_to_learn")}
                        </SelectItem>
                        <SelectItem value='learning'>
                          {t("learning")}
                        </SelectItem>
                        <SelectItem value='learned'>{t("learned")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <SongsTableEmpty hasFilters={hasFilters} onAddSong={onAddSong} />
            )}
          </TableBody>
        </Table>
      </div>

      {songs.length > 0 && (
        <div className='mt-4 flex justify-center'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(currentPage - 1)}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
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
                        isActive={currentPage === pageNumber}>
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
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(currentPage + 1)}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
