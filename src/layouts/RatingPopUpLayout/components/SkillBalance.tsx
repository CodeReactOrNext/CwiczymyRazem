import { Card } from "assets/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
} from "assets/components/ui/chart";
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
  const last7Days = activityData.slice(-7);
  
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
      <Card className='border-white/10 bg-zinc-900/50 backdrop-blur-sm'>
        <div className='p-4'>
          <h3 className='mb-4 text-sm font-semibold text-white'>
            Skill Balance (7d)
          </h3>
          <div className="flex items-center justify-center pb-2">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px] w-full"
            >
              <RadarChart data={chartData}>
                <ChartTooltip
                  cursor={false}
                  content={(props) => {
                     const { active, payload } = props;
                     if (active && payload && payload.length) {
                       return (
                         <div className='rounded-lg border border-cyan-500/30 bg-zinc-900/95 p-2.5 shadow-xl backdrop-blur-xl'>
                           <div className='flex flex-col gap-0.5'>
                             <span className='text-xs font-medium text-gray-400'>
                               {payload[0].payload.skill}
                             </span>
                             <span className='text-sm font-bold text-cyan-400'>
                               {convertMsToHM(Number(payload[0].value) || 0)}
                             </span>
                           </div>
                         </div>
                       );
                     }
                     return null;
                  }}
                />
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                />
                <Radar
                  dataKey="time"
                  fill="rgb(6, 182, 212)"
                  fillOpacity={0.5}
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
