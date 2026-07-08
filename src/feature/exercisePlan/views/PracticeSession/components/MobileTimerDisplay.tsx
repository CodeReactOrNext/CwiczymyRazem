import { useTimerContext } from "../contexts/TimerContext";

interface MobileTimerDisplayProps {
  isPlaying: boolean;
}

export const MobileTimerDisplay = ({
  isPlaying,
}: MobileTimerDisplayProps) => {
  const { formattedTimeLeft } = useTimerContext();

  return (
    <div className='flex w-full flex-col items-center'>
      {/* Main Digital Timer - Big and Bold */}
      <div className="flex flex-col items-center justify-center py-3 relative">
          <div className={`text-6xl font-mono font-black tracking-tighter leading-none transition-colors duration-300 ${
              isPlaying ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-zinc-500"
          }`}>
              {formattedTimeLeft}
          </div>
      </div>
    </div>
  );
};
