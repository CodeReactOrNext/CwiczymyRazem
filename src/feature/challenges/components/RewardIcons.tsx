import { cn } from "assets/lib/utils";

/**
 * The app's two currency marks. Same assets the header, Arsenal and the level
 * bar use — wrapped here only because the challenge board repeats them across
 * chips, dialogs and toasts.
 */

interface RewardIconProps {
  className?: string;
}

export const PointsIcon = ({ className }: RewardIconProps) => (
  <img
    src='/images/points.png'
    alt='points'
    className={cn("h-4 w-4 shrink-0 object-contain", className)}
  />
);

export const FameIcon = ({ className }: RewardIconProps) => (
  <img
    src='/images/coin.png'
    alt='fame'
    className={cn("h-4 w-4 shrink-0 object-contain", className)}
  />
);
