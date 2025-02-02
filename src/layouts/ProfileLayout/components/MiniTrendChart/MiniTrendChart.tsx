import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MiniTrendChartProps {
  data: number[];
  color?: string;
}

const MiniTrendChart = ({
  data,
  color = "rgb(99, 102, 241)",
}: MiniTrendChartProps) => {
  if (!data.length) return null;

  const chartData = data.map((value, index) => ({
    value,
    index,
  }));

  return (
    <div className='h-12 w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id='colorGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor={color} stopOpacity={0.3} />
              <stop offset='95%' stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type='monotone'
            dataKey='value'
            stroke={color}
            fill='url(#colorGradient)'
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniTrendChart;
