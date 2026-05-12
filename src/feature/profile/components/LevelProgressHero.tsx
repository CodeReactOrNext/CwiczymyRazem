import { getPointsToLvlUp } from "utils/gameLogic";

interface LevelProgressHeroProps {
  lvl: number;
  points: number;
  className?: string;
}

export const LevelProgressHero = ({
  lvl,
  points,
  className = "",
}: LevelProgressHeroProps) => {
  return (
    <div className={`flex flex-col gap-3 w-full md:max-w-xl ${className}`}>
      <div className="flex items-center justify-between sm:justify-end gap-6 leading-none">
        <div className="flex items-baseline gap-2">
            <span className="font-inter text-6xl font-black text-white tracking-tighter leading-none">
            Lvl {lvl}
            </span>
        </div>
      </div>
    </div>
  );
};
