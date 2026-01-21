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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "assets/components/ui/chart";
import { Checkbox } from "assets/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { useTranslation } from "hooks/useTranslation";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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

export type CategoryKeys = "technique" | "theory" | "hearing" | "creativity";

export function ActivityChart({ data }: ActivityChartProps) {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = React.useState("all");
  const [visibleCategories, setVisibleCategories] = React.useState({
    technique: true,
    theory: true,
    hearing: true,
    creativity: true,
  });

  const chartConfig = {
    activity: {
      label: "Activity",
    },
    technique: {
      label: t("chart.categories.technique"),
      color: "hsl(var(--chart-1))",
    },
    theory: {
      label: t("chart.categories.theory"),
      color: "hsl(var(--chart-2))",
    },
    hearing: {
      label: t("chart.categories.hearing"),
      color: "hsl(var(--chart-3))",
    },
    creativity: {
      label: t("chart.categories.creativity"),
      color: "hsl(var(--chart-4))",
    },
  };

  const processedData =
    data?.map((report) => ({
      date: new Date(report.date).toISOString().split("T")[0],
      technique: report.techniqueTime,
      theory: report.theoryTime,
      hearing: report.hearingTime,
      creativity: report.creativityTime,
    })) || [];

  const filteredData = processedData.filter((item) => {
    if (timeRange === "all") return true;

    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    if (timeRange === "7d") daysToSubtract = 7;

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const toggleCategory = (category: keyof typeof visibleCategories) => {
    setVisibleCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

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
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex flex-wrap gap-3'>
            {Object.entries(visibleCategories).map(([category, isVisible]) => (
              <div key={category} className='flex items-center space-x-2'>
                <Checkbox
                  id={category}
                  checked={isVisible}
                  onCheckedChange={() =>
                    toggleCategory(category as keyof typeof visibleCategories)
                  }
                  className='border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black'
                />
                <label
                  htmlFor={category}
                  className='text-xs capitalize text-white/70'>
                  {t(`chart.categories.${category as CategoryKeys}`)}
                </label>
              </div>
            ))}
          </div>
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
          className='aspect-auto h-[250px] w-full'>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id='fillTechnique' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-technique)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-technique)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillTheory' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-theory)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-theory)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillHearing' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-hearing)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-hearing)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillCreativity' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-creativity)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-creativity)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              className='font-openSans'
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("pl", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={(props) => {
                const { active, payload, label } = props;
                if (active && payload && payload.length) {
                  return (
                    <div className='rounded-lg border border-white/10 bg-zinc-900/90 p-2 text-white shadow-sm backdrop-blur-xl'>
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='flex flex-col'>
                          <span className='text-[0.70rem] uppercase'>
                            {new Date(label).toLocaleDateString("pl", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {payload.map((entry) => (
                            <span key={entry.name} className='font-bold'>
                              {t(
                                `chart.categories.${entry.name as CategoryKeys}`
                              )}
                              :{" "}
                              {
                                convertMsToHMObject(Number(entry.value) ?? 0)
                                  .hours
                              }
                              :
                              {addZeroToTime(
                                Number(
                                  convertMsToHMObject(Number(entry.value) ?? 0)
                                    .minutes
                                )
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {visibleCategories.technique && (
              <Area
                dataKey='technique'
                type='linear'
                fill='url(#fillTechnique)'
                stroke='var(--color-technique)'
                stackId='1'
              />
            )}
            {visibleCategories.theory && (
              <Area
                dataKey='theory'
                type='linear'
                fill='url(#fillTheory)'
                stroke='var(--color-theory)'
                stackId='2'
              />
            )}
            {visibleCategories.hearing && (
              <Area
                dataKey='hearing'
                type='linear'
                fill='url(#fillHearing)'
                stroke='var(--color-hearing)'
                stackId='3'
              />
            )}
            {visibleCategories.creativity && (
              <Area
                dataKey='creativity'
                type='linear'
                fill='url(#fillCreativity)'
                stroke='var(--color-creativity)'
                stackId='4'
              />
            )}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
