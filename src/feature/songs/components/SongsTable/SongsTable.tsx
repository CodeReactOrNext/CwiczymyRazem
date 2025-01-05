import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Song, SongStatus } from "utils/firebase/client/firebase.types";
import {
  getUserSongs,
  rateSongDifficulty,
  updateSongStatus,
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
import { Star, XCircle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { Badge } from "assets/components/ui/badge";
import { SongStatusCard } from "feature/songs/components/SongStatusCard";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "assets/components/ui/pagination";
import { Button } from "assets/components/ui/button";
import { FaPlusCircle } from "react-icons/fa";

interface SongsTableProps {
  songs: Song[];
  onSort: (sortBy: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

const SongsTable = ({ songs, onSort, sortBy, currentPage, totalPages, onPageChange, onAddSong, onClearFilters, hasFilters }: SongsTableProps) => {
  const { t } = useTranslation("song");
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

  const handleStatusChange = async (
    songId: string,
    newStatus: SongStatus,
    title: string,
    artist: string
  ) => {
    console.log(songId, newStatus, title, artist);
    if (!userId) {
      toast.error(t("must_be_logged_in"));
      return;
    }

    try {
      await updateSongStatus(userId, songId, title, artist, newStatus);
      const updatedSongs = await getUserSongs(userId);
      setUserSongs({
        wantToLearn: updatedSongs.wantToLearn,
        learning: updatedSongs.learning,
        learned: updatedSongs.learned,
      });
      toast.success(t("status_updated"));
    } catch (error) {
      toast.error(t("error_updating_status"));
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
      return { color: "#4CAF50", label: "Very Easy" }; // Green
    } else if (rating <= 4) {
      return { color: "#8BC34A", label: "Easy" }; // Light Green
    } else if (rating <= 6) {
      return { color: "#FFC107", label: "Medium" }; // Yellow
    } else if (rating <= 7) {
      return { color: "#FF9800", label: "Hard" }; // Orange
    } else if (rating <= 9) {
      return { color: "#FF5722", label: "Very Hard" }; // Deep Orange
    } else {
      return { color: "#F44336", label: "Extreme" }; // Red
    }
  };

  const renderDifficulty = (rating: number) => {
    const { color, label } = getDifficultyRating(rating);

    return (
      <div className='flex items-center gap-2'>
        <div
          className='h-4 w-4 rounded-full'
          style={{ backgroundColor: color }}></div>
        <span>{label}</span>
      </div>
    );
  };

  const getStatus = (
    userSongs: {
      wantToLearn: Song[];
      learning: Song[];
      learned: Song[];
    },
    songId: string
  ) => {
    if (userSongs.wantToLearn.some(({ id }) => id === songId)) {
      return t("want_to_learn");
    }

    if (userSongs.learning.some(({ id }) => id === songId)) {
      return t("learning");
    }

    if (userSongs.learned.some(({ id }) => id === songId)) {
      return t("learned");
    }

    return "None";
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    const songs = userSongs.wantToLearn.concat(
      userSongs.learning,
      userSongs.learned
    );

    if (!destination) {
      return;
    }

    // Dropped in the same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const songToMove = songs.find((song) => song.id === draggableId);
    if (!songToMove) {
      console.log("ni ma");
      return;
    }

    // Optimistically update the UI
    setUserSongs((prev) => {
      const newUserSongs = { ...prev };

      // Remove from source
      if (source.droppableId in newUserSongs) {
        newUserSongs[source.droppableId as SongStatus] = newUserSongs[
          source.droppableId as SongStatus
        ].filter((s) => s.id !== draggableId);
      }

      // Add to destination
      if (destination.droppableId in newUserSongs) {
        newUserSongs[destination.droppableId as SongStatus] = [
          ...newUserSongs[destination.droppableId as SongStatus],
          songToMove,
        ];
      }

      return newUserSongs;
    });

    try {
      await handleStatusChange(
        draggableId,
        destination.droppableId as SongStatus,
        songToMove.title,
        songToMove.artist
      );
    } catch (error) {
      // Revert on error
      const songs = await getUserSongs(userId);
      setUserSongs(songs);
      toast.error(t("error_updating_status"));
    }
  };

  return (
    <div className='space-y-6'>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <SongStatusCard
            title={t("want_to_learn")}
            songs={userSongs.wantToLearn}
            droppableId='wantToLearn'
            onStatusChange={handleStatusChange}
          />
          <SongStatusCard
            title={t("learning")}
            songs={userSongs.learning}
            droppableId='learning'
            onStatusChange={handleStatusChange}
          />
          <SongStatusCard
            title={t("learned")}
            songs={userSongs.learned}
            droppableId='learned'
            onStatusChange={handleStatusChange}
          />
        </div>
      </DragDropContext>

      <div className='w-full'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => onSort("title")}
                className='cursor-pointer hover:bg-muted/50'>
                {t("title")} {sortBy === "title" && "↓"}
              </TableHead>
              <TableHead
                onClick={() => onSort("artist")}
                className='cursor-pointer hover:bg-muted/50'>
                {t("artist")} {sortBy === "artist" && "↓"}
              </TableHead>
              <TableHead
                onClick={() => onSort("avgDifficulty")}
                className='cursor-pointer hover:bg-muted/50'>
                {t("difficulty")} {sortBy === "avgDifficulty" && "↓"}
              </TableHead>
              <TableHead
                onClick={() => onSort("learners")}
                className='cursor-pointer hover:bg-muted/50'>
                {t("learners")} {sortBy === "learners" && "↓"}
              </TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.length > 0 ? (
              songs.map((song) => (
                <TableRow key={song.id}>
                  <TableCell>{song.title}</TableCell>
                  <TableCell>{song.artist}</TableCell>
                  <TableCell>
                    <div className='flex gap-1'>
                      {[...Array(10)].map((_, i) => {
                        const avgRating = getAverageDifficulty(song.difficulties);
                        const userRating = song?.difficulties?.find(
                          (d) => d.userId === userId
                        )?.rating;
                        const isHovered =
                          ratingHover?.songId === song.id &&
                          ratingHover.rating >= i + 1;
                        const showUserRating =
                          !ratingHover?.songId && userRating >= i + 1;
                        const showAvgRating = avgRating >= i + 1;

                        return (
                          <div key={i} className='relative'>
                            {/* Average rating (bottom star) */}
                            <Star
                              className={`h-4 w-4 ${
                                showAvgRating
                                  ? "fill-yellow-300 text-yellow-300"
                                  : "fill-muted text-muted-foreground"
                              }`}
                            />
                            {/* User rating (top star) */}
                            <Star
                              className={`absolute inset-0 h-4 w-4 cursor-pointer ${
                                isHovered || showUserRating
                                  ? "fill-primary text-primary"
                                  : "fill-transparent text-transparent"
                              }`}
                              onClick={() =>
                                handleRating(song.id, song.title, song.artist, i + 1)
                              }
                              onMouseEnter={() =>
                                setRatingHover({ songId: song.id, rating: i + 1 })
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
                      <Badge variant='outline'>
                        {renderDifficulty(
                          getAverageDifficulty(song.difficulties)
                        )}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{song.learningUsers?.length || 0}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>
                      {getStatus(userSongs, song.id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={
                        song.learningUsers?.includes(userId)
                          ? "learning"
                          : song.learningUsers?.includes(userId)
                          ? "learned"
                          : ""
                      }
                      onValueChange={(value) =>
                        handleStatusChange(
                          song.id,
                          value as SongStatus | null,
                          song.title,
                          song.artist
                        )
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='wantToLearn' className='font-openSans'>
                          {t("want_to_learn")}
                        </SelectItem>
                        <SelectItem value='learning'>{t("learning")}</SelectItem>
                        <SelectItem value='learned'>{t("learned")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-lg font-medium text-muted-foreground">
                      {hasFilters 
                        ? t("no_songs_found_with_filters")
                        : t("no_songs_found")}
                    </p>
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={onAddSong}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <FaPlusCircle className="h-4 w-4" />
                        <span>{t("add_new_song")}</span>
                      </Button>
                      {hasFilters && (
                        <Button
                          onClick={onClearFilters}
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          <XCircle  className="h-4 w-4" />
                          <span>{t("clear_filters")}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {songs.length > 0 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => onPageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                      >
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
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
