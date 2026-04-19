import { Card } from "assets/components/ui/card";
import { MiniTrendChart } from "feature/profile/components/MiniTrendChart";
import { calculateTrend } from "feature/profile/utils/calculateTrend";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type { ComponentType } from "react";
import Link from "next/link";

export interface StatsFieldProps {
  Icon?: LucideIcon | ComponentType<{ className?: string }>;
  description: string;
  value: string | number;
  trendData?: number[];
  trendColor?: string;
  subtitle?: string;
  key?: string;
  id?: string;
  className?: string;
  footerLink?: { href: string; label: string };
}

export const StatsField = ({
  Icon,
  description,
  value,
  trendData,
  className,
  footerLink,
}: StatsFieldProps) => {
  const shouldShowTrend = !description.toLowerCase().includes("rekord");
  const trend = shouldShowTrend && trendData ? calculateTrend(trendData) : null;
  const DATA_LENGTH_FOR_CHART = 7;

  const shouldShowChart =
    shouldShowTrend &&
    value !== 0 &&
    value !== "0" &&
    value !== "00:00" &&
    trendData &&
    trendData.length >= DATA_LENGTH_FOR_CHART;

  const chartColor =
    trend?.direction === "up" ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";

  return (
    <Card className={`flex flex-col border-0 bg-zinc-800/40 p-5 shadow-sm backdrop-blur-sm ${className ?? ""}`}>
      <div className='flex items-start justify-between'>
        <div className='space-y-1.5'>
          <div className='flex items-center gap-2'>
            {Icon && <Icon className='h-4 w-4 text-zinc-500' />}
            <span className='text-[11px] font-semibold tracking-widest text-zinc-500'>{description}</span>
          </div>
          <p className='text-2xl font-bold tabular-nums text-white'>{value}</p>
        </div>
        {trend && shouldShowChart && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend.direction === "up" ? "text-green-400" : "text-red-400"
            }`}>
            {trend.direction === "up" ? (
              <ArrowUp className='h-3 w-3' />
            ) : (
              <ArrowDown className='h-3 w-3' />
            )}
            {trend.percent !== null && <span>{trend.percent}%</span>}
          </div>
        )}
      </div>
      {shouldShowChart && trendData && trendData.length > 0 && (
        <div className='mt-3 flex-1 min-h-0'>
          <MiniTrendChart data={trendData} color={chartColor} className="h-full min-h-[80px]" />
        </div>
      )}
      {footerLink && (
        <Link
          href={footerLink.href}
          className="group/link mt-3 flex items-center gap-2 text-xs font-bold text-zinc-300 transition-all duration-300 hover:text-white hover:gap-3 w-fit"
        >
          {footerLink.label}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      )}
    </Card>
  );
};
