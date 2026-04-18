"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
} from "assets/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { useTranslation } from "hooks/useTranslation";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { addZeroToTime, convertMsToHMObject } from "utils/converter";

interface ActivityChartProps {
  data: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = React.useState("all");

  const chartConfig = {
    totalTime: {
      label: "Activity",
    },
  };

  const processedData = React.useMemo(() => {
    return (data || [])
      .map((report) => {
        const d = new Date(report.date);
        const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        return {
          date: dateStr,
          totalTime:
            report.techniqueTime +
            report.theoryTime +
            report.hearingTime +
            report.creativityTime,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const filteredData = React.useMemo(() => {
    return processedData.filter((item) => {
      if (timeRange === "all") return true;

      const date = new Date(item.date);
      const referenceDate = new Date();
      referenceDate.setHours(0, 0, 0, 0);

      let daysToSubtract = 90;
      if (timeRange === "30d") daysToSubtract = 30;
      if (timeRange === "7d") daysToSubtract = 7;

      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    });
  }, [processedData, timeRange]);

  const isNegative = React.useMemo(() => {
    if (filteredData.length < 2) return false;
    const first = filteredData[0].totalTime;
    const last = filteredData[filteredData.length - 1].totalTime;
    return last < first;
  }, [filteredData]);

  const chartColor = isNegative ? "#f43f5e" : "#10b981";

  return (
    <Card>
      <CardHeader className='flex items-center gap-2 space-y-0 border-b border-white/10 py-5 sm:flex-row'>
        <div className='grid flex-1 gap-1 text-center sm:text-left'>
          <CardTitle className='text-lg font-bold text-white'>
            {t("chart.activity_overview")}
          </CardTitle>
          <CardDescription className='text-white/70'>
            {t("chart.showing_activity")}
          </CardDescription>
        </div>
        <div className='flex items-center'>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className='w-[160px] rounded-lg border-white/10 bg-white/5 text-white sm:ml-auto'
              aria-label={t("chart.time_ranges.all_time")}>
              <SelectValue placeholder={t("chart.time_ranges.all_time")} />
            </SelectTrigger>
            <SelectContent className='rounded-xl border-white/10 bg-zinc-900/90 backdrop-blur-xl'>
              <SelectItem
                value='all'
                className='rounded-lg text-white hover:bg-white/10'>
                {t("chart.time_ranges.all_time")}
              </SelectItem>
              <SelectItem
                value='90d'
                className='rounded-lg text-white hover:bg-white/10'>
                {t("chart.time_ranges.last_3_months")}
              </SelectItem>
              <SelectItem
                value='30d'
                className='rounded-lg text-white hover:bg-white/10'>
                {t("chart.time_ranges.last_30_days")}
              </SelectItem>
              <SelectItem
                value='7d'
                className='rounded-lg text-white hover:bg-white/10'>
                {t("chart.time_ranges.last_7_days")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full text-white'>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id='fillPrice' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor={chartColor} stopOpacity={0.4} />
                <stop offset='95%' stopColor={chartColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray='3 3'
              stroke='rgba(255,255,255,0.1)'
            />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              stroke='rgba(255,255,255,0.5)'
              className='font-openSans text-xs font-bold'
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("pl", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              width={50}
              stroke='rgba(255,255,255,0.5)'
              className='font-openSans text-xs font-bold'
              tickFormatter={(value) => {
                if (value === 0) return "0";
                const { hours, minutes } = convertMsToHMObject(value);
                if (hours > 0 && minutes === 0) return `${hours}h`;
                if (hours > 0) return `${hours}h ${minutes}m`;
                return `${minutes}m`;
              }}
            />
            <ChartTooltip
              cursor={{
                stroke: "rgba(255,255,255,0.2)",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              content={(props) => {
                const { active, payload, label } = props;
                if (active && payload && payload.length) {
                  const entry = payload[0];
                  const hm = convertMsToHMObject(Number(entry.value) ?? 0);
                  return (
                    <div className='rounded-lg border border-white/10 bg-zinc-950/90 p-4 text-white shadow-2xl backdrop-blur-xl'>
                      <div className='flex flex-col gap-1'>
                        <span className='text-[0.70rem] uppercase font-bold text-zinc-500 tracking-wider'>
                          {new Date(label).toLocaleDateString("pl", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <div className="flex items-baseline gap-2">
                           <span className={`font-black text-2xl tracking-tighter ${isNegative ? "text-rose-500" : "text-emerald-400"}`}>
                            {hm.hours > 0 && `${hm.hours}h `}
                            {addZeroToTime(Number(hm.minutes))}m
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              dataKey='totalTime'
              type='monotone'
              fill='url(#fillPrice)'
              stroke={chartColor}
              strokeWidth={4}
              animationDuration={1500}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>

  );
}
