import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Song } from 'utils/firebase/client/firebase.types';
import { getUserSongStatuses, rateSongDifficulty, toggleLearningSong,  } from 'utils/firebase/client/firebase.utils';
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
} from  "assets/components/ui/table";
import { Star } from "lucide-react";
import { Button } from 'assets/components/ui/button';
import type { SongStatus } from 'utils/firebase/client/firebase.types';

interface SongsTableProps {
  songs: Song[];
  onSort: (sortBy: string) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

const SongsTable = ({ songs, onSort, sortBy, sortDirection }: SongsTableProps) => {
  const { t } = useTranslation('songs');
  const userId = useAppSelector(selectUserAuth);
  const [ratingHover, setRatingHover] = useState<{songId: string, rating: number} | null>(null);
  const [songStatuses, setSongStatuses] = useState<Record<string, SongStatus>>({});

  useEffect(() => {
    const loadSongStatuses = async () => {
      if (!userId) return;
      const statuses = await getUserSongStatuses(userId);
      setSongStatuses(statuses);
    };

    loadSongStatuses();
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

  const handleStatusChange = async (songId: string, newStatus: SongStatus) => {
    if (!userId) {
      toast.error(t('must_be_logged_in'));
      return;
    }

    try {
      await updateSongStatus(userId, songId, newStatus);
      setSongStatuses(prev => ({
        ...prev,
        [songId]: newStatus
      }));
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
                  value={songStatuses[song.id] || ''}
                  onChange={(value) => handleStatusChange(song.id, value.target.value as SongStatus)}
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
  );
};

export default SongsTable;