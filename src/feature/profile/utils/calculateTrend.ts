
interface TrendInfo {
  direction: 'up' | 'down';
  percent: number | null;
}

export const calculateTrend = (data: number[]): TrendInfo | null => {
  if (!data || data.length < 14) return null; 

  const last7Days = data.slice(-7);
  const previous7Days = data.slice(-14, -7);


  const currentSum = last7Days.reduce((sum, val) => sum + val, 0);
  const previousSum = previous7Days.reduce((sum, val) => sum + val, 0);


  if (currentSum === 0 && previousSum === 0) return null;


  if (previousSum === 0) {
    return {
      direction: 'up',
      percent: currentSum > 0 ? 100 : 0
    };
  }

  const percentChange = ((currentSum - previousSum) / previousSum) * 100;

  return {
    direction: currentSum >= previousSum ? 'up' : 'down',
    percent: Math.abs(Math.round(percentChange * 10) / 10)
  };
};