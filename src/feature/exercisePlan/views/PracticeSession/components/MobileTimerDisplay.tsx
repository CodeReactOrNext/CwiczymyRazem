import { FaDumbbell, FaHistory } from "react-icons/fa";
import type { TimerInterface } from "types/api.types";
import { convertMsToHMS } from "utils/converter/timeConverter";

interface MobileTimerDisplayProps {
  formattedTimeLeft: string;
  isPlaying: boolean;
  sessionTimerData?: TimerInterface;
  exerciseTimeSpent?: number;
}

export const MobileTimerDisplay = ({
  formattedTimeLeft,
  isPlaying,
  sessionTimerData,
  exerciseTimeSpent = 0
}: MobileTimerDisplayProps) => {
  const totalSessionMs = sessionTimerData 
    ? ((sessionTimerData.creativity || 0) + 
       (sessionTimerData.hearing || 0) + 
       (sessionTimerData.technique || 0) + 
       (sessionTimerData.theory || 0))
    : 0;

  const formattedElapsed = convertMsToHMS(exerciseTimeSpent);
  const formattedTotalSession = convertMsToHMS(totalSessionMs);

  return (
    <div className='mb-6 flex flex-col items-center gap-4 w-full'>
      {/* Main Digital Timer - Big and Bold */}
      <div className="flex flex-col items-center justify-center py-6 relative">
          <div className={`text-6xl font-mono font-black tracking-tighter leading-none transition-colors duration-300 ${
              isPlaying ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-zinc-500"
          }`}>
              {formattedTimeLeft}
          </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 w-full">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900/50 border border-white/5">
             <div className="flex items-center gap-2 text-zinc-300">
                 <FaDumbbell className="h-3 w-3 text-white/50" />
                 <span className="text-sm font-mono font-black">{formattedElapsed}</span>
             </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900/50 border border-white/5">
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/50 mb-1">Session</span>
             <div className="flex items-center gap-2 text-cyan-400">
                 <FaHistory className="h-3 w-3 text-cyan-500/50" />
                 <span className="text-sm font-mono font-black">{formattedTotalSession}</span>
             </div>
          </div>
      </div>
    </div>
  );
};
