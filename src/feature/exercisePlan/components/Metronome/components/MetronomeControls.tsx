import { Button } from "assets/components/ui/button";
import { FaPause, FaPlay } from "react-icons/fa";

import { MetronomeAnimation } from "./MetronomeAnimation";

interface MetronomeControlsProps {
  isPlaying: boolean;
  bpm: number;
  onTogglePlay: () => void;
  currentBeat?: number;
}

export const MetronomeControls = ({
  isPlaying,
  bpm,
  onTogglePlay,
  currentBeat = 0,
}: MetronomeControlsProps) => {
  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Button
          variant={isPlaying ? "default" : "outline"}
          onClick={onTogglePlay}
          className='w-24'>
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
        <span className='text-sm font-medium'>{bpm} BPM</span>
      </div>

      <div className='flex items-center justify-between'>
        {isPlaying ? (
          <MetronomeAnimation
            isPlaying={isPlaying}
            bpm={bpm}
            currentBeat={currentBeat}
          />
        ) : (
          <div className='text-xs text-muted-foreground'>
            Click start to start the metronome
          </div>
        )}
      </div>
    </div>
  );
};
