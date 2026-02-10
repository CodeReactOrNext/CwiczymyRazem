import { Card } from "assets/components/ui/card";
import { ChartContainer, ChartTooltip } from "assets/components/ui/chart";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { convertMsToHM } from "utils/converter";

interface WeeklyInsightProps {
  activityData: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

export function WeeklyInsight({ activityData }: WeeklyInsightProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const weekDayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const chartData = weekDayLabels.map((date) => {
    const dateStr = date.toISOString().split('T')[0];
    const item = activityData.find(d => new Date(d.date).toISOString().split('T')[0] === dateStr);

    return {
      date: date.toLocaleDateString("en", { weekday: "short" }),
      fullName: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      totalTime: item ? (item.techniqueTime + item.theoryTime + item.hearingTime + item.creativityTime) : 0,
      isToday: dateStr === todayStr,
    };
  });

  const totalWeekTime = chartData.reduce((acc, d) => acc + d.totalTime, 0);
  const completedDaysCount = chartData.filter(d => d.totalTime > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}>
      <Card className='border-none bg-zinc-900/40 backdrop-blur-xl h-full overflow-hidden rounded-lg'>
        <div className='p-6'>
          <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                  <h3 className='text-sm font-semibold text-zinc-400'>
                    {completedDaysCount}/7 Days
                  </h3>
                  <span className="text-2xl font-black text-white">{convertMsToHM(totalWeekTime)}</span>
              </div>
          </div>

          <ChartContainer
            config={{ totalTime: { label: "Time spent", color: "rgb(6, 182, 212)" } }}
            className='aspect-auto h-[100px] w-full'>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id='fillTotal' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='rgb(6, 182, 212)' stopOpacity={0.4} />
                  <stop offset='95%' stopColor='rgb(6, 182, 212)' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='4 4' stroke='rgba(255,255,255,0.02)' vertical={false} />
              <XAxis 
                dataKey='date' 
                tickLine={false} 
                axisLine={false} 
                tickMargin={12} 
                className='text-[10px] font-bold text-zinc-600 uppercase tracking-tighter' 
              />
              <YAxis hide domain={[0, 'auto']} />
              <ChartTooltip
                cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
                content={(props) => {
                  const { active, payload } = props;
                  if (active && payload && payload.length) {
                    return (
                      <div className='rounded-lg bg-zinc-950/90 p-4 shadow-2xl backdrop-blur-xl border-none'>
                        <div className='flex flex-col gap-1'>
                          <span className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
                            {payload[0].payload.fullName}
                          </span>
                          <span className='text-xl font-black text-white'>
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
                type='monotone'
                fill='url(#fillTotal)'
                stroke='rgb(6, 182, 212)'
                strokeWidth={3}
                animationDuration={2000}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.isToday) {
                    return (
                      <circle cx={cx} cy={cy} r={4} fill='rgb(6, 182, 212)' stroke='white' strokeWidth={2} />
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
