import { Card } from "assets/components/ui/card";
import { ChartContainer, ChartTooltip } from "assets/components/ui/chart";
import { motion } from "framer-motion";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { convertMsToHM } from "utils/converter";

interface SkillBalanceProps {
  activityData?: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

export function SkillBalance({ activityData = [] }: SkillBalanceProps) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${(sevenDaysAgo.getMonth() + 1).toString().padStart(2, "0")}-${sevenDaysAgo.getDate().toString().padStart(2, "0")}`;

  const last7Days = activityData.filter(d => {
    const dd = new Date(d.date);
    const dateStr = `${dd.getFullYear()}-${(dd.getMonth() + 1).toString().padStart(2, "0")}-${dd.getDate().toString().padStart(2, "0")}`;
    return dateStr >= sevenDaysAgoStr;
  });

  const totals = last7Days.reduce(
    (acc, day) => ({
      technique: acc.technique + day.techniqueTime,
      theory: acc.theory + day.theoryTime,
      hearing: acc.hearing + day.hearingTime,
      creativity: acc.creativity + day.creativityTime,
    }),
    { technique: 0, theory: 0, hearing: 0, creativity: 0 }
  );

  const chartData = [
    { skill: "Technique", time: totals.technique },
    { skill: "Theory", time: totals.theory },
    { skill: "Hearing", time: totals.hearing },
    { skill: "Creativity", time: totals.creativity },
  ];

  const chartConfig = {
    time: {
      label: "Time",
      color: "hsl(180, 100%, 50%)",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.0 }}>
      <Card className='border-none bg-zinc-900/50 backdrop-blur-xl rounded-lg h-full'>
        <div className='p-8'>
          <h3 className='mb-6 text-sm font-semibold text-zinc-400'>
            Skill Balance — Last 7 Days
          </h3>
          <div className="flex items-center justify-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[220px] w-full"
            >
              <RadarChart data={chartData}>
                <ChartTooltip
                  cursor={false}
                  content={(props) => {
                     const { active, payload } = props;
                     if (active && payload && payload.length) {
                       return (
                         <div className='rounded-lg bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl border-none'>
                           <div className='flex flex-col gap-0.5'>
                             <span className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
                               {payload[0].payload.skill}
                             </span>
                             <span className='text-sm font-black text-cyan-400'>
                               {convertMsToHM(Number(payload[0].value) || 0)}
                             </span>
                           </div>
                         </div>
                       );
                     }
                     return null;
                  }}
                />
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700 }}
                />
                <Radar
                  dataKey="time"
                  fill="rgb(6, 182, 212)"
                  fillOpacity={0.3}
                  stroke="rgb(6, 182, 212)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ChartContainer>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
