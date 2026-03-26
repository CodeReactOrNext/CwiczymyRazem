import { SEASON_FAME_REWARDS } from "constants/seasonRewards";
import { Gem } from "lucide-react";

const PLACE_MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
const PLACE_LABELS = ["1st", "2nd", "3rd", "4th", "5th"];

export const SeasonRewards = () => {
  return (
    <div className="bg-black/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/5 min-w-[200px]">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Season Rewards
      </p>
      <ul className="flex flex-col gap-1">
        {SEASON_FAME_REWARDS.map((fame, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span className="w-5 text-center text-sm leading-none">{PLACE_MEDALS[i]}</span>
            <span className="text-zinc-400 w-12">{PLACE_LABELS[i]}</span>
            <span className="flex items-center gap-1 font-bold text-amber-400 ml-auto">
              <Gem className="h-3 w-3" />
              {fame}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
