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
      <div className='w-full'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("artist")}</TableHead>

              <TableHead>{t("title")}</TableHead>
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
                  <TableCell className='min-w-[200px]'>{song.artist}</TableCell>
                  <TableCell className='min-w-[200px]'>{song.title}</TableCell>

                  <TableCell>
                    <SongRating song={song} refreshTable={onStatusChange} />
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
