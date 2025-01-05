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
import { Star } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { Badge } from "assets/components/ui/badge";
import { SongStatusCard } from "feature/songs/components/SongStatusCard";

interface SongsTableProps {
  songs: Song[];
  onSort: (sortBy: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

const SongsTable = ({
  songs,
  onSort,
  sortBy,
  sortDirection,
}: SongsTableProps) => {
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
        console.log(songs);
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
    newStatus: SongStatus | null,
    title: string,
    artist: string
  ) => {
    if (!userId) {
      toast.error(t("must_be_logged_in"));
      return;
    }

    try {
      await updateSongStatus(userId, songId, newStatus, title, artist);
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

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <SongStatusCard
          title={t("want_to_learn")}
          songs={userSongs.wantToLearn}
          onStatusChange={handleStatusChange}
        />
        <SongStatusCard
          title={t("learning")}
          songs={userSongs.learning}
          onStatusChange={handleStatusChange}
        />
        <SongStatusCard
          title={t("learned")}
          songs={userSongs.learned}
          onStatusChange={handleStatusChange}
        />
      </div>

      <div className='w-full'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => onSort("title")}
                className='cursor-pointer hover:bg-muted/50'>
                {t("title")}{" "}
                {sortBy === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => onSort("artist")}
                className='cursor-pointer hover:bg-muted/50'>
                {t("artist")}{" "}
                {sortBy === "artist" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => onSort("avgDifficulty")}
                className='cursor-pointer hover:bg-muted/50'>
                {t("difficulty")}{" "}
                {sortBy === "avgDifficulty" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => onSort("learners")}
                className='cursor-pointer hover:bg-muted/50'>
                {t("learners")}{" "}
                {sortBy === "learners" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.map((song) => (
              <TableRow key={song.id}>
                <TableCell>{song.title}</TableCell>
                <TableCell>{song.artist}</TableCell>
                <TableCell>
                  <div className='flex gap-1'>
                    {[...Array(10)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 cursor-pointer ${
                          (ratingHover?.songId === song.id &&
                            ratingHover.rating >= i + 1) ||
                          (!ratingHover?.songId &&
                            song?.difficulties?.find((d) => d.userId === userId)
                              ?.rating >=
                              i + 1)
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted-foreground"
                        }`}
                        onClick={() =>
                          handleRating(song.id, song.title, song.artist, i + 1)
                        }
                        onMouseEnter={() =>
                          setRatingHover({ songId: song.id, rating: i + 1 })
                        }
                        onMouseLeave={() => setRatingHover(null)}
                      />
                    ))}
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SongsTable;
