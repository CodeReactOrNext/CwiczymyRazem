import { selectCurrentUserStats } from "feature/user/store/userSlice";

import { useAppSelector } from "store/hooks";

export const PointsBox = () => {
  const userStats = useAppSelector(selectCurrentUserStats);
  const points = userStats?.points || 0;

  return (
    <div className='hidden h-10 items-center justify-center gap-2 rounded-lg bg-zinc-800/40 px-3 py-2 shadow-sm backdrop-blur-sm sm:flex'>
      <img src="/images/points.png" alt="points" className="h-6 w-6 object-contain" />
      <span className='text-xs font-semibold text-white'>
        {points.toLocaleString()}
      </span>
    </div>
  );
};
