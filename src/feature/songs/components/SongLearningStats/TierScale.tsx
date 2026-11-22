import { cn } from "assets/lib/utils";
import {
  getTierScalePosition,
  TIER_THRESHOLDS,
} from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";

interface TierScaleProps {
  /** Gated skill power; 0 = not rated yet (scale shown without a marker). */
  skillPower: number;
  className?: string;
}

/**
 * D → S ladder with a marker at the player's power score, so the tier letter
 * reads as a step on a scale instead of a bare grade.
 */
export const TierScale = ({ skillPower, className }: TierScaleProps) => {
  const { t } = useTranslation("songs");
  const isRated = skillPower > 0;
  const currentTier = isRated ? getSongTier(skillPower).tier : null;
  const markerLeft = `${getTierScalePosition(skillPower) * 100}%`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className='relative pt-2.5'>
        {isRated && (
          <svg
            aria-hidden
            viewBox='0 0 10 6'
            className='absolute top-0 h-1.5 w-2.5 -translate-x-1/2 fill-white'
            style={{ left: markerLeft }}>
            <path d='M0 0h10L5 6z' />
          </svg>
        )}
        <div className='flex gap-1'>
          {TIER_THRESHOLDS.map(({ tier }) => (
            <div
              key={tier}
              className='h-2 flex-1 rounded-full'
              style={{
                backgroundColor: getSongTier(tier).color,
                opacity: tier === currentTier ? 1 : 0.18,
              }}
            />
          ))}
        </div>
      </div>

      <div className='flex gap-1'>
        {TIER_THRESHOLDS.map(({ tier }) => {
          const info = getSongTier(tier);
          const isCurrent = tier === currentTier;
          return (
            <div key={tier} className='min-w-0 flex-1 text-center'>
              <p
                className={cn(
                  "text-xs font-bold leading-none",
                  !isCurrent && "text-zinc-500",
                )}
                style={isCurrent ? { color: info.color } : undefined}>
                {tier}
              </p>
              <p
                title={t(info.description)}
                className={cn(
                  "mt-1 truncate text-[10px] leading-tight",
                  isCurrent ? "text-zinc-300" : "text-zinc-600",
                )}>
                {t(info.description)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
