import { Card } from "assets/components/ui/card";
import type { Song } from "feature/songs/types/songs.type";
import { Award, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SongLearningStatsProps {
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
}

export const SongLearningStats = ({ userSongs }: SongLearningStatsProps) => {
  const { t } = useTranslation("songs");

  const totalSongs =
    userSongs.wantToLearn.length +
    userSongs.learning.length +
    userSongs.learned.length;

  const learnedPercentage = totalSongs
    ? (userSongs.learned.length / totalSongs) * 100
    : 0;

  return (
    <div className='grid grid-cols-1 gap-4 font-openSans md:grid-cols-2 lg:grid-cols-2'>
      <Card className='bg-second p-4'>
        <div className='mb-3 flex items-center'>
          <Clock className='mr-2 h-5 w-5 text-gray-400' />
          <h3 className='text-sm text-gray-400'>{t("total_songs")}</h3>
        </div>
        <p className='mb-1 font-sans text-2xl font-bold text-white'>
          {totalSongs}
        </p>
        <p className='text-xs text-gray-500'>{t("songs_in_your_library")}</p>
      </Card>

      <Card className='bg-second p-4'>
        <div className='mb-3 flex items-center'>
          <Award className='mr-2 h-5 w-5 text-gray-400' />
          <h3 className='text-sm text-gray-400'>{t("completion_rate")}</h3>
        </div>
        <p className='mb-1 font-sans text-2xl font-bold text-white'>
          {learnedPercentage.toFixed(0)}%
        </p>
        <p className='text-xs text-gray-500'>
          {userSongs.learned.length} {t("out_of")} {totalSongs}{" "}
          {t("songs_learned")}
        </p>

        <div className='mt-3 h-1.5 w-full rounded-full bg-[#2a2a2a]'>
          <div
            className='h-1.5 rounded-full bg-[#42f584]'
            style={{ width: `${learnedPercentage}%` }}></div>
        </div>
      </Card>
    </div>
  );
};
