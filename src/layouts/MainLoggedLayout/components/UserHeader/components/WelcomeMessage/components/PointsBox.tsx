import {  Sparkles } from 'lucide-react';
import { useAppSelector } from "store/hooks";
import { selectCurrentUserStats } from "feature/user/store/userSlice";

export const PointsBox = () => {
  const userStats = useAppSelector(selectCurrentUserStats);
  const points = userStats?.points || 0;

  return (
    <div className='hidden h-10 items-center justify-center gap-2 rounded-lg bg-zinc-800/40 px-3 py-2 shadow-sm backdrop-blur-sm sm:flex'>
      <Sparkles  size={18} className=' text-white-500/80' />
      <span className='text-xs font-semibold text-white'>
        {points.toLocaleString()}
      </span>
    </div>
  );
};
