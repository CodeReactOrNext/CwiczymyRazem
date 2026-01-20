import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

interface SkillDistributionChartProps {
  data: { name: string; value: number }[];
}

export const SkillDistributionChart = ({ data }: SkillDistributionChartProps) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md h-full">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Learning Intensity</h3>
        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Time distribution across guitar disciplines</p>
      </div>
      
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#ffffff10" />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700, textAnchor: 'middle' }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 'auto']} 
              tick={false} 
              axisLine={false} 
            />
            <Radar
              name="Minutes Spent"
              dataKey="value"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.4}
              animationDuration={2000}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#09090b', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
