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
      <TimerDisplay
        value={timerProgressValue}
        text={formattedTimeLeft}
        isPlaying={isPlaying}
        size='sm'
      />
    </div>
  );
};
