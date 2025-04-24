import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Slider } from "assets/components/ui/slider";
import { FaPause, FaPlay } from "react-icons/fa";

import { useDeviceMetronome } from "./hooks/useDeviceMetronome";

interface MetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
}

export const Metronome = (props: MetronomeProps) => {
  const {
    bpm,
    isPlaying,
    minBpm,
    maxBpm,
    setBpm,
    toggleMetronome,
    handleSetRecommendedBpm,
    recommendedBpm,
  } = useDeviceMetronome(props);

  return (
    <Card className='overflow-hidden rounded-xl border bg-card/80 p-4 shadow-md'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-sm font-medium'>Metronom</h3>
        <div className='text-sm font-semibold'>{bpm} BPM</div>
      </div>

      <div className='mb-4'>
        <Slider
          value={[bpm]}
          min={minBpm}
          max={maxBpm}
          step={1}
          onValueChange={(value) => setBpm(value[0])}
          className='py-2'
        />
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>{minBpm}</span>
          <span>{maxBpm}</span>
        </div>
      </div>

      <div className='flex justify-between'>
        <Button
          variant={isPlaying ? "default" : "outline"}
          size='sm'
          onClick={toggleMetronome}
          aria-label={isPlaying ? "Stop metronome" : "Start metronome"}
          tabIndex={0}>
          {isPlaying ? (
            <>
              <FaPause className='mr-2 h-3 w-3' />
              <span>Stop</span>
            </>
          ) : (
            <>
              <FaPlay className='mr-2 h-3 w-3' />
              <span>Start</span>
            </>
          )}
        </Button>

        {recommendedBpm !== bpm && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleSetRecommendedBpm}
            aria-label={`Set recommended tempo (${recommendedBpm} BPM)`}
            tabIndex={0}>
            Zalecane tempo ({recommendedBpm})
          </Button>
        )}
      </div>
    </Card>
  );
};
