import { Cell, Legend,Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface FeatureUsageChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ["#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899"];

export const FeatureUsageChart = ({ data }: FeatureUsageChartProps) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md h-full">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Feature Engagement</h3>
        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Distribution of actions across app modules</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
              ))}
            </Pie>
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
              iconType="circle" 
              verticalAlign="bottom" 
              align="center"
              formatter={(value) => <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
