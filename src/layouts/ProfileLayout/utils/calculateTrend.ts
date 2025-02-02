import type { ReportListInterface } from "types/api.types";

interface TrendInfo {
  direction: 'up' | 'down';
  percent: number | null;
}

export const calculateTrend = (data: number[]): TrendInfo | null => {
  if (!data || data.length < 14) return null; // Need at least 14 days of data

  // Get last 7 days and previous 7 days
  const last7Days = data.slice(-7);
  const previous7Days = data.slice(-14, -7);

  // Calculate sums for both periods
  const currentSum = last7Days.reduce((sum, val) => sum + val, 0);
  const previousSum = previous7Days.reduce((sum, val) => sum + val, 0);

  // If both periods are 0, no trend to show
  if (currentSum === 0 && previousSum === 0) return null;

  // Handle cases where previousSum is 0
  if (previousSum === 0) {
    return {
      direction: 'up',
      percent: currentSum > 0 ? 100 : 0
    };
  }

  // Calculate percentage change between periods
  const percentChange = ((currentSum - previousSum) / previousSum) * 100;

  return {
    direction: currentSum >= previousSum ? 'up' : 'down',
    percent: Math.abs(Math.round(percentChange * 10) / 10) // Keep one decimal place
  };
};