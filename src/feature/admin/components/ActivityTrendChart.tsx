import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

interface ActivityTrendChartProps {
  data: any[];
}

export const ActivityTrendChart = ({ data }: ActivityTrendChartProps) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md h-full">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Activity Velocity</h3>
          <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Daily interaction volume - Last 7 days</p>
        </div>
        <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
           <span className="text-[10px] font-black text-cyan-500 uppercase">Live Metrics</span>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
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
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            />
            <Bar dataKey="exercises" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} barSize={20} />
            <Bar dataKey="songs" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={20} />
            <Bar dataKey="count" stackId="a" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
