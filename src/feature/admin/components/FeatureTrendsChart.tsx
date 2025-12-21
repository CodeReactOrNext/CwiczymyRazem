import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface FeatureTrendsChartProps {
  data: any[];
}

export const FeatureTrendsChart = ({ data }: FeatureTrendsChartProps) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md h-full">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Feature Trend Analysis</h3>
          <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Daily engagement per module - Last 30 days</p>
        </div>
        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Comparative View</span>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
              interval={4}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
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
            <Legend 
               verticalAlign="top" 
               align="right" 
               iconType="circle"
               wrapperStyle={{ paddingBottom: '20px' }}
               formatter={(value) => <span className="text-[9px] font-black uppercase text-zinc-500">{value}</span>}
            />
            <Line type="monotone" dataKey="exercises" stroke="#8b5cf6" strokeWidth={2} dot={false} animationDuration={1000} />
            <Line type="monotone" dataKey="songs" stroke="#f59e0b" strokeWidth={2} dot={false} animationDuration={1200} />
            <Line type="monotone" dataKey="achievements" stroke="#ec4899" strokeWidth={2} dot={false} animationDuration={1400} />
            <Line type="monotone" dataKey="levels" stroke="#06b6d4" strokeWidth={2} dot={false} animationDuration={1600} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
