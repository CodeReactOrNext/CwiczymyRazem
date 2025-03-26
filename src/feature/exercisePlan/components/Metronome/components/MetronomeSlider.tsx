import { Slider } from "assets/components/ui/slider";
import { useRef, useState } from "react";

interface MetronomeSliderProps {
  bpm: number;
  minBpm: number;
  maxBpm: number;
  onBpmChange: (values: number[]) => void;
  onBpmDragChange?: (values: number[]) => void;
  onBpmDragEnd?: () => void;
}

export const MetronomeSlider = ({
  bpm,
  minBpm,
  maxBpm,
  onBpmChange,
  onBpmDragChange,
  onBpmDragEnd,
}: MetronomeSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const isFirstChangeRef = useRef(true);

  const handleValueChange = (values: number[]) => {
    if (onBpmDragChange && isDragging) {
      onBpmDragChange(values);
    } else {
      onBpmChange(values);
    }
  };

  const handleValueCommit = () => {
    if (isDragging) {
      setIsDragging(false);
      if (onBpmDragEnd) {
        onBpmDragEnd();
      }
    }
  };

  const handlePointerDown = () => {
    setIsDragging(true);
    isFirstChangeRef.current = true;
  };

  return (
    <div className='space-y-2'>
      <Slider
        step={1}
        value={[bpm]}
        min={minBpm}
        max={maxBpm}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        onPointerDown={handlePointerDown}
      />
      <div className='flex justify-between text-xs text-muted-foreground'>
        <span>{minBpm} BPM</span>
        <span>{maxBpm} BPM</span>
      </div>
    </div>
  );
};
