import { Card } from "assets/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
} from "assets/components/ui/chart";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Dot, XAxis, YAxis } from "recharts";
import { convertMsToHM } from "utils/converter";

interface WeeklyActivityChartProps {
  data: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const last7Days = data.slice(-7);
  
  const today = new Date().toISOString().split('T')[0];

  const chartData = last7Days.map((item) => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return {
      date: new Date(item.date).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      }),
      totalTime:
        item.techniqueTime + item.theoryTime + item.hearingTime + item.creativityTime,
      isToday: itemDate === today,
    };
  });

  const chartConfig = {
    totalTime: {
      label: "Practice Time",
      color: "hsl(180, 100%, 50%)",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}>
      <Card className='border-white/10 bg-zinc-900/50 backdrop-blur-sm'>
        <div className='p-3'>
          <h3 className='mb-3 font-openSans text-base font-semibold text-white'>
            Last 7 Days Activity
          </h3>
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[120px] w-full'>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id='fillTotal' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='rgb(6, 182, 212)'
                    stopOpacity={0.5}
                  />
                  <stop
                    offset='95%'
                    stopColor='rgb(6, 182, 212)'
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='rgba(255,255,255,0.03)'
                vertical={false}
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                className='text-xs text-gray-400'
              />
              <YAxis hide />
              <ChartTooltip
                cursor={false}
                content={(props) => {
                  const { active, payload } = props;
                  if (active && payload && payload.length) {
                    return (
                      <div className='rounded-lg border border-cyan-500/30 bg-zinc-900/95 p-2.5 shadow-xl backdrop-blur-xl'>
                        <div className='flex flex-col gap-0.5'>
                          <span className='text-xs font-medium text-gray-400'>
                            {payload[0].payload.date}
                          </span>
                          <span className='text-base font-bold text-cyan-400'>
                            {convertMsToHM(Number(payload[0].value) || 0)}
                          </span>
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
                fill='url(#fillTotal)'
                stroke='rgb(6, 182, 212)'
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.isToday) {
                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill='rgb(6, 182, 212)'
                          stroke='rgb(6, 182, 212)'
                          strokeWidth={2}
                          opacity={0.2}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill='rgb(6, 182, 212)'
                          stroke='white'
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  }
                  return <g />;
                }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>
    </motion.div>
  );
}
