import { TimerDisplay } from "./TimerDisplay";

interface MobileTimerDisplayProps {
  timerProgressValue: number;
  formattedTimeLeft: string;
  isPlaying: boolean;
}

export const MobileTimerDisplay = ({
  timerProgressValue,
  formattedTimeLeft,
  isPlaying,
}: MobileTimerDisplayProps) => {
  return (
    <div className='mb-8 flex justify-center'>
      <div className='relative'>
        <div
          className='absolute -inset-8 -z-20 rounded-full opacity-10 blur-sm'
          style={{
            background: `radial-gradient(circle, var(--tw-gradient-from) 0%, transparent 70%)`,
          }}
        />

        <TimerDisplay
          value={timerProgressValue}
          text={formattedTimeLeft}
          isPlaying={isPlaying}
          size='sm'
        />
      </div>
    </div>
  );
};
