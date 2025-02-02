import { Card } from "assets/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { calculateTrend } from "../../utils/calculateTrend";
import MiniTrendChart from "../MiniTrendChart/MiniTrendChart";

export interface StatsFieldProps {
  Icon?: LucideIcon;
  description: string;
  value: string | number;
  trendData?: number[];
  trendColor?: string;
  subtitle?: string;
  key?: string;
  id?: string;
}

const StatsField = ({
  Icon,
  description,
  value,
  trendData,
}: StatsFieldProps) => {
  const shouldShowTrend = !description.toLowerCase().includes("rekord");
  const trend = shouldShowTrend && trendData ? calculateTrend(trendData) : null;

  // Don't show chart if value is 0 or "00:00"
  const shouldShowChart =
    shouldShowTrend &&
    value !== 0 &&
    value !== "0" &&
    value !== "00:00" &&
    trendData &&
    trendData.length >= 14; // Make sure we have enough data

  // Determine chart color based on trend direction
  const chartColor =
    trend?.direction === "up"
      ? "rgb(34, 197, 94)" // green-500 for positive trend
      : "rgb(239, 68, 68)"; // red-500 for negative trend

  return (
    <Card className='bg-second p-4 font-openSans transition-all hover:shadow-md'>
      <div className='flex items-start justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            {Icon && <Icon className='h-4 w-4 text-muted-foreground' />}
            <span className='text-sm text-muted-foreground'>{description}</span>
          </div>
          <p className='font-sans text-2xl font-bold'>{value}</p>
        </div>
        {trend && shouldShowChart && (
          <div
            className={`flex items-center gap-1 text-sm ${
              trend.direction === "up" ? "text-green-500" : "text-red-500"
            }`}>
            {trend.direction === "up" ? (
              <ArrowUp className='h-4 w-4' />
            ) : (
              <ArrowDown className='h-4 w-4' />
            )}
            {trend.percent !== null && <span>{trend.percent}%</span>}
          </div>
        )}
      </div>
      {shouldShowChart && trendData && trendData.length > 0 && (
        <div className='mt-2'>
          <MiniTrendChart data={trendData} color={chartColor} />
        </div>
      )}
    </Card>
  );
};

export default StatsField;
