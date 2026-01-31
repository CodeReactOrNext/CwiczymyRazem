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
  // Controlled state props
  bpm?: number;
  isPlaying?: boolean;
  onBpmChange?: (bpm: number) => void;
  onToggle?: () => void;
  startTime?: number | null;
}

export const Metronome = (props: MetronomeProps) => {
  const device = useDeviceMetronome(props);
  
  // Use props if controlled, otherwise use internal state
  const bpm = props.bpm !== undefined ? props.bpm : device.bpm;
  const isPlaying = props.isPlaying !== undefined ? props.isPlaying : device.isPlaying;
  const setBpm = props.onBpmChange || device.setBpm;
  const toggleMetronome = props.onToggle || device.toggleMetronome;
  const recommendedBpm = props.recommendedBpm || device.recommendedBpm;
  const minBpm = props.minBpm || device.minBpm;
  const maxBpm = props.maxBpm || device.maxBpm;
  const handleSetRecommendedBpm = device.handleSetRecommendedBpm; // This might need adjustment if fully controlled, but fine for now

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

      <div className='flex justify-end'>
        {recommendedBpm !== bpm && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleSetRecommendedBpm}
            aria-label={`Set recommended tempo (${recommendedBpm} BPM)`}
            tabIndex={0}>
            Recommended tempo ({recommendedBpm})
          </Button>
        )}
      </div>
    </Card>
  );
};
