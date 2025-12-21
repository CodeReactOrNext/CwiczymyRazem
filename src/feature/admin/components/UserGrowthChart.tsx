import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface UserGrowthChartProps {
  data: { name: string; users: number }[];
}

export const UserGrowthChart = ({ data }: UserGrowthChartProps) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Registration Growth</h3>
        <p className="text-[10px] text-zinc-600 font-bold uppercase">Daily user signups - Last 30 days</p>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              itemStyle={{ color: '#06b6d4' }}
              cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="#06b6d4" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorUsers)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
