import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { Minus, Plus, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";



interface MetronomeProps {
  metronome: any; // The object from useDeviceMetronome
  showStartStop?: boolean;
  isMuted?: boolean;
  onMuteToggle?: (muted: boolean) => void;
  // Fallbacks for specific values if needed, though metronome should have them
  recommendedBpm?: number;
  isHalfSpeed?: boolean;
  onHalfSpeedToggle?: (value: boolean) => void;
}

export const Metronome = ({
  metronome,
  showStartStop = true,
  isMuted = false,
  onMuteToggle,
  recommendedBpm: propsRecommendedBpm,
  isHalfSpeed = false,
  onHalfSpeedToggle
}: MetronomeProps) => {
  const bpm = metronome.bpm;
  const isPlaying = metronome.isPlaying;
  const setBpm = metronome.setBpm;
  const toggleMetronome = metronome.toggleMetronome;
  const recommendedBpm = propsRecommendedBpm || metronome.recommendedBpm;
  const minBpm = metronome.minBpm;
  const maxBpm = metronome.maxBpm;
  const handleSetRecommendedBpm = metronome.handleSetRecommendedBpm;

  const effectiveIsMuted = isMuted;

  const handleMuteToggle = () => {
    if (onMuteToggle) {
      onMuteToggle(!effectiveIsMuted);
    }
  };

  return (
    <Card className='overflow-hidden rounded-xl border bg-card/80 p-4 shadow-md'>
      <div className='mb-6 flex items-center justify-between'>
        <h3 className='text-sm font-medium'>Metronom</h3>
        <div className='text-sm font-semibold'>
          {bpm} BPM{isHalfSpeed && <span className="text-xs text-cyan-400 ml-1">(effective: {Math.round(bpm / 2)})</span>}
        </div>
      </div>

      <div className='mb-4'>
        <div className='flex items-center gap-3 mb-3'>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => setBpm(Math.max(minBpm, bpm - 1))}
            disabled={bpm <= minBpm}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Slider
            value={[bpm]}
            min={minBpm}
            max={maxBpm}
            step={1}
            onValueChange={(value) => setBpm(value[0])}
            className='py-2'
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => setBpm(Math.min(maxBpm, bpm + 1))}
            disabled={bpm >= maxBpm}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>{minBpm}</span>
          <span>{maxBpm}</span>
        </div>
      </div>

      <div className='flex justify-between items-center'>
        <div className="flex items-center gap-2">
          {showStartStop && (
            <Button
              variant={isPlaying ? "destructive" : "default"}
              size='sm'
              onClick={toggleMetronome}
              className="gap-2"
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
              {isPlaying ? "Stop" : "Start"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleMuteToggle}
            className={cn(
               "w-9 px-0",
               effectiveIsMuted ? "text-zinc-500" : "text-cyan-400"
            )}
          >
            {effectiveIsMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {recommendedBpm !== bpm && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleSetRecommendedBpm}
            aria-label={`Set recommended tempo (${recommendedBpm} BPM)`}
            tabIndex={0}>
            Recommended ({recommendedBpm})
          </Button>
        )}
      </div>

      {onHalfSpeedToggle && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full gap-2 text-xs font-bold uppercase tracking-widest transition-all",
              isHalfSpeed
                ? "text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 hover:text-cyan-300"
                : "text-zinc-500 hover:text-zinc-400"
            )}
            onClick={() => onHalfSpeedToggle(!isHalfSpeed)}
          >
            1/2x Half Speed
          </Button>
        </div>
      )}
    </Card>
  );
};
