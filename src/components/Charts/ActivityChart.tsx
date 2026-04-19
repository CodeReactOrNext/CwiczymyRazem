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
import { convertMsToHMObject } from "utils/converter";

export type CategoryKeys = "technique" | "theory" | "hearing" | "creativity";

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
    if (!data || data.length === 0) return [];

    // 1. Map existing reports by date key for fast lookup
    const reportMap = new Map<string, number>();
    data.forEach((report) => {
      const d = new Date(report.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      reportMap.set(key, 
        report.techniqueTime + 
        report.theoryTime + 
        report.hearingTime + 
        report.creativityTime
      );
    });

    // 2. Determine time range
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDate = now;

    let startDate = new Date(now);
    if (timeRange === "7d") startDate.setDate(now.getDate() - 7);
    else if (timeRange === "30d") startDate.setDate(now.getDate() - 30);
    else if (timeRange === "90d") startDate.setDate(now.getDate() - 90);
    else {
      // "all" - start from first available report
      const sortedDates = data
        .map(r => new Date(r.date).getTime())
        .sort((a, b) => a - b);
      startDate = new Date(sortedDates[0]);
      startDate.setHours(0, 0, 0, 0);
    }

    // 3. Fill every day in range
    const result = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      result.push({
        date: current.toISOString(),
        totalTime: reportMap.get(key) || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [data, timeRange]);

  const isNegative = React.useMemo(() => {
    if (processedData.length < 2) return false;
    const first = processedData[0].totalTime;
    const last = processedData[processedData.length - 1].totalTime;
    return last < first;
  }, [processedData]);

  const chartColor = isNegative ? "#f43f5e" : "#10b981";

  return (
    <Card>
      <CardHeader className='flex items-center gap-2 space-y-0 border-b border-white/10 py-5 sm:flex-row'>
        <div className='grid flex-1 gap-1 text-center sm:text-left'>
          <CardTitle className='text-lg font-bold text-white'>
            {t("chart.activity_overview")}
          </CardTitle>
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
          <AreaChart data={processedData}>
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
              width={40}
              stroke='rgba(255,255,255,0.5)'
              className='font-openSans text-xs font-bold'
              tickCount={5}
              domain={[0, (dataMax: number) => {
                const hours = Math.ceil(dataMax / 3600000);
                return hours * 3600000;
              }]}
              tickFormatter={(value) => {
                if (value === 0) return "0";
                const hours = value / 3600000;
                return `${Math.round(hours)}h`;
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
                           <span className={`font-bold text-xl tracking-tight ${isNegative ? "text-rose-500" : "text-emerald-400"}`}>
                            {Number(hm.hours) > 0 && `${Number(hm.hours)}h `}
                            {Number(hm.minutes)}m
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
              type='linear'
              fill='url(#fillPrice)'
              stroke={chartColor}
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!payload || payload.totalTime === 0) return <></>;
                return (
                  <circle
                    key={`dot-${payload.date}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={chartColor}
                    strokeWidth={1.5}
                    stroke='#09090b'
                    fillOpacity={1}
                  />
                );
              }}
              activeDot={{
                r: 5,
                strokeWidth: 0,
              }}
              animationDuration={1500}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>

  );
}
