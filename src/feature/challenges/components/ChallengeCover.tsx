import { cn } from "assets/lib/utils";
import type { ChallengeSong } from "feature/challenges/types/challenge.types";
import { Swords } from "lucide-react";

interface ChallengeCoverProps {
  songs: ChallengeSong[];
  className?: string;
  iconSize?: number;
}

/** Four-up mosaic of the board's cover art, same shape as a playlist cover. */
export const ChallengeCover = ({
  songs,
  className,
  iconSize = 32,
}: ChallengeCoverProps) => {
  const covers = songs
    .map((song) => song.coverUrl)
    .filter(Boolean)
    .slice(0, 4);

  if (covers.length < 4) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-amber-500/25 to-orange-600/10 text-amber-300",
          className,
        )}>
        {covers[0] ? (
          <img src={covers[0]} alt='' className='h-full w-full object-cover' />
        ) : (
          <Swords size={iconSize} />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("grid grid-cols-2 overflow-hidden bg-zinc-900", className)}>
      {covers.map((cover, index) => (
        <img
          key={`${cover}-${index}`}
          src={cover}
          alt=''
          className='h-full w-full object-cover'
        />
      ))}
    </div>
  );
};
