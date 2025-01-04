import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Song, SongStatus } from 'utils/firebase/client/firebase.types';
import { getUserSongs, rateSongDifficulty, toggleLearningSong, updateSongStatus } from 'utils/firebase/client/firebase.utils';
import { toast } from 'sonner';
import { useAppSelector } from 'store/hooks';
import { selectUserAuth } from 'feature/user/store/userSlice';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow, 
} from "assets/components/ui/table";
import { Star } from "lucide-react";
import { Button } from 'assets/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "assets/components/ui/card";
import { ScrollArea } from "assets/components/ui/scroll-area";

interface SongsTableProps {
  songs: Song[];
  onSort: (sortBy: string) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

const SongStatusCard = ({ 
  title, 
  songs, 
  onStatusChange 
}: { 
  title: string; 
  songs: Song[]; 
  onStatusChange: (songId: string, status: SongStatus | null) => Promise<void>;
}) => (
  <Card className="flex-1">
    <CardHeader>
      <CardTitle className="text-sm font-medium">
        {title} ({songs.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-32">
        <div className="space-y-2">
          {songs.map((song) => (
            <div key={song.id} className="flex items-center justify-between text-sm">
              <span>{song.title} - {song.artist}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onStatusChange(song.id, null)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
);

const SongsTable = ({ songs, onSort, sortBy, sortDirection }: SongsTableProps) => {
  const { t } = useTranslation('songs');
  const userId = useAppSelector(selectUserAuth);
  const [ratingHover, setRatingHover] = useState<{songId: string, rating: number} | null>(null);
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
        console.error('Error loading user songs:', error);
      }
    };

    loadUserSongs();
  }, [userId]);

  const handleRating = async (songId: string, rating: number) => {
    if (!userId) {
      return;
    }

    try {
      await rateSongDifficulty(songId, userId, rating);
      toast.success(t('rating_updated'));
    } catch (error) {
      toast.error(t('error_rating'));
    }
  };

  const handleLearningToggle = async (songId: string) => {
    if (!userId) {
      toast.error(t('must_be_logged_in'));
      return;
    }

    try {
      await toggleLearningSong(songId, userId);
      toast.success(t('learning_status_updated'));
    } catch (error) {
      toast.error(t('error_updating_learning'));
    }
  };

  const handleStatusChange = async (songId: string, newStatus: SongStatus | null) => {
    if (!userId) {
      toast.error(t('must_be_logged_in'));
      return;
    }

    try {
      await updateSongStatus(userId, songId, newStatus);
      // Refresh user songs after status change
      const updatedSongs = await getUserSongs(userId);
      setUserSongs({
        wantToLearn: updatedSongs.wantToLearn,
        learning: updatedSongs.learning,
        learned: updatedSongs.learned,
      });
      toast.success(t('status_updated'));
    } catch (error) {
      toast.error(t('error_updating_status'));
    }
  };

  const getAverageDifficulty = (difficulties: Song['difficulties']) => {
    if (!difficulties?.length) return 0;
    return difficulties.reduce((acc, curr) => acc + curr.rating, 0) / difficulties.length;
  };

  return (
    <div className="space-y-6">
      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SongStatusCard
          title={t('want_to_learn')}
          songs={userSongs.wantToLearn}
          onStatusChange={handleStatusChange}
        />
        <SongStatusCard
          title={t('learning')}
          songs={userSongs.learning}
          onStatusChange={handleStatusChange}
        />
        <SongStatusCard
          title={t('learned')}
          songs={userSongs.learned}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Songs Table */}
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                onClick={() => onSort('title')}
                className="cursor-pointer hover:bg-muted/50"
              >
                {t('title')} {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('artist')}
                className="cursor-pointer hover:bg-muted/50"
              >
                {t('artist')} {sortBy === 'artist' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('avgDifficulty')}
                className="cursor-pointer hover:bg-muted/50"
              >
                {t('difficulty')} {sortBy === 'avgDifficulty' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('learners')}
                className="cursor-pointer hover:bg-muted/50"
              >
                {t('learners')} {sortBy === 'learners' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.map((song) => (
              <TableRow key={song.id}>
                <TableCell>{song.title}</TableCell>
                <TableCell>{song.artist}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 cursor-pointer ${
                          (ratingHover?.songId === song.id && ratingHover.rating >= i + 1) ||
                          (!ratingHover?.songId && song.difficulties.find(d => d.userId === userId)?.rating >= i + 1)
                            ? 'fill-primary text-primary'
                            : 'fill-muted text-muted-foreground'
                        }`}
                        onClick={() => handleRating(song.id, i + 1)}
                        onMouseEnter={() => setRatingHover({ songId: song.id, rating: i + 1 })}
                        onMouseLeave={() => setRatingHover(null)}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {t('avg')}: {getAverageDifficulty(song.difficulties).toFixed(1)}
                  </div>
                </TableCell>
                <TableCell>{song.learningUsers?.length || 0}</TableCell>
                <TableCell>
                  <Button
                    variant={song.learningUsers?.includes(userId) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLearningToggle(song.id)}
                  >
                    {song.learningUsers?.includes(userId) ? t('learning') : t('learn')}
                  </Button>
                </TableCell>
                <TableCell>
                  <select
                    value={song.learningUsers?.includes(userId) ? 'learning' : song.learningUsers?.includes(userId) ? 'learned' : ''}
                    onChange={(value) => handleStatusChange(song.id, value.target.value as SongStatus | null)}
                  >
                    <option value="">{t('select_status')}</option>
                    <option value="wantToLearn">{t('want_to_learn')}</option>
                    <option value="learning">{t('learning')}</option>
                    <option value="learned">{t('learned')}</option>
                  </select>
                  {song.statusCounts && (
                    <div className="text-xs text-muted-foreground mt-1">
                      ({song.statusCounts.wantToLearn}/{song.statusCounts.learning}/{song.statusCounts.learned})
                    </div>
                  )}
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