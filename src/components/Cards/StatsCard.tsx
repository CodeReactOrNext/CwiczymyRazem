import { Card } from "assets/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  compact?: boolean;
  className?: string;
}

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  compact = false,
  className = "",
}: StatsCardProps) => {
  const padding = compact ? "p-3" : "p-4";
  const valueSize = compact ? "text-xl" : "text-2xl";

  return (
    <Card>
      {/* Header with icon */}
      {(icon || title) && (
        <div className='mb-2 flex items-center gap-2'>
          {icon && <div className='text-zinc-400'>{icon}</div>}
          <span className='text-xs font-medium text-zinc-400'>{title}</span>
        </div>
      )}

      {/* Main value */}
      <div className='flex items-baseline gap-2'>
        <span className={`font-bold text-white ${valueSize}`}>{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? "text-green-400" : "text-red-400"
            }`}>
            {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && <p className='mt-1 text-xs text-zinc-500'>{subtitle}</p>}
    </Card>
  );
};
