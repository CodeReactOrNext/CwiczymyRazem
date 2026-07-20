import { getSongTier } from "feature/songs/utils/getSongTier";

interface DifficultyMeterProps {
  value: number;
  max?: number;
}

export const DifficultyMeter = ({ value, max = 10 }: DifficultyMeterProps) => {
  const tier = getSongTier(value);

  return (
    <div className='flex items-center gap-3'>
      <div className='h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
        <div
          className='h-full rounded-full'
          style={{
            width: `${Math.min((value / max) * 100, 100)}%`,
            backgroundColor: tier.color,
          }}
        />
      </div>
      <span
        className='shrink-0 text-sm font-bold tabular-nums'
        style={{ color: tier.color }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
};
