import { Button } from "assets/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { SongRating } from "feature/songs/components/SongsTable/components/SongRating";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getAverageDifficulty } from "feature/songs/utils/getAvgRaiting";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "react-i18next";

interface SongCardProps {
  song: Song;
  status?: SongStatus;
  onStatusChange: (status: SongStatus) => void;
  onRatingChange: () => void;
}

export const SongCard = ({
  song,
  status,
  onStatusChange,
  onRatingChange,
}: SongCardProps) => {
  const { t } = useTranslation("songs");
  const avgDifficulty = getAverageDifficulty(song.difficulties);
  const tier = getSongTier(avgDifficulty);

  const getStatusColor = (currentStatus?: SongStatus) => {
    switch (currentStatus) {
      case "wantToLearn":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "learning":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "learned":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div 
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-zinc-900/40 p-5 backdrop-blur-md shadow-lg shadow-black/20 transition-colors duration-300 ${
        status === "wantToLearn" ? "border-blue-500/30 active:border-blue-500/50" :
        status === "learning" ? "border-amber-500/30 active:border-amber-500/50" :
        status === "learned" ? "border-emerald-500/30 active:border-emerald-500/50" :
        "border-white/5 hover:border-white/10"
      }`}
    >
      {/* Background Gradient */}
      <div
        className='absolute inset-0 opacity-10'
        style={{
          background: `linear-gradient(135deg, ${tier.color} 0%, transparent 100%)`,
        }}
      />

      {/* Top Section: Header & Tier */}
      <div className='relative z-10 mb-4 flex items-start justify-between gap-4'>
        <div>
          <h3 className='line-clamp-1 text-lg font-bold text-white'>
            {song.title}
          </h3>
          <p className='line-clamp-1 text-sm font-medium text-zinc-500'>
            {song.artist}
          </p>
        </div>
        
        {/* Tier Badge */}
        <div
          className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-bold shadow-sm'
          style={{
            borderColor: `${tier.color}40`,
            backgroundColor: `${tier.color}15`,
            color: tier.color,
          }}>
          {tier.tier}
        </div>
      </div>

      {/* Middle Section: Stats & Rating */}
      <div className='relative z-10 mb-5 flex flex-col gap-3'>
        {/* Difficulty Bar */}
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between px-1'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-zinc-500'>
              {t("difficulty")}
            </span>
            <span className='text-sm font-bold text-white'>{avgDifficulty}</span>
          </div>
          <div className='h-1.5 w-full overflow-hidden rounded-full bg-black/40'>
            <div
              className='h-full rounded-full transition-all duration-500'
              style={{
                width: `${Math.min(avgDifficulty * 10, 100)}%`,
                backgroundColor: tier.color,
                boxShadow: `0 0 10px ${tier.color}`,
              }}
            />
          </div>
        </div>

        {/* Rating */}
        <div className='flex items-center justify-center rounded-xl border border-white/5 bg-black/20 p-2'>
          <SongRating song={song} refreshTable={onRatingChange} />
        </div>
      </div>

      {/* Bottom Section: Status Selector */}
      <div className='relative z-10 mt-auto'>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger
            className={`w-full border-t border-x-0 border-b-0 border-white/5 bg-black/20 backdrop-blur-sm transition-all hover:bg-black/40 text-xs font-bold uppercase tracking-wider focus:ring-0 ${
               status === "wantToLearn" ? "text-blue-400" :
               status === "learning" ? "text-amber-400" :
               status === "learned" ? "text-emerald-400" : "text-zinc-500"
            }`}>
            <SelectValue placeholder={t("select_status")} />
          </SelectTrigger>
          <SelectContent className='border-zinc-800 bg-zinc-900/95 backdrop-blur-xl'>
            <SelectItem value='wantToLearn' className='focus:bg-zinc-800'>
              <span className='flex items-center gap-2 text-blue-400'>
                <span className='h-1.5 w-1.5 rounded-full bg-blue-400' />
                {t("want_to_learn")}
              </span>
            </SelectItem>
            <SelectItem value='learning' className='focus:bg-zinc-800'>
              <span className='flex items-center gap-2 text-amber-400'>
                <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />
                {t("learning")}
              </span>
            </SelectItem>
            <SelectItem value='learned' className='focus:bg-zinc-800'>
              <span className='flex items-center gap-2 text-emerald-400'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
                {t("learned")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
