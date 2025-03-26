import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";

import { MetronomeControls } from "./components/MetronomeControls";
import { MetronomeHeader } from "./components/MetronomeHeader";
import { MetronomeSlider } from "./components/MetronomeSlider";
import { useMetronome } from "./hooks/useMetronome";

interface MetronomeProps {
  initialBpm: number;
  minBpm: number;
  maxBpm: number;
  recommendedBpm: number;
}

export const Metronome = ({
  initialBpm,
  minBpm,
  maxBpm,
  recommendedBpm,
}: MetronomeProps) => {
  const [currentBeat, setCurrentBeat] = useState(0);

  const {
    bpm,
    isPlaying,
    handleBpmChange,
    handleBpmDragChange,
    handleBpmDragEnd,
    toggleMetronome,
    setRecommendedBpm,
  } = useMetronome({
    initialBpm,
    minBpm,
    maxBpm,
    recommendedBpm,
    onBeat: (beat) => setCurrentBeat(beat),
  });

  return (
    <Card
      className={`overflow-hidden transition-colors duration-300 ${
        isPlaying ? "border-primary/40 bg-card/50" : "bg-card/30"
      }`}>
      <motion.div
        animate={{
          backgroundColor: isPlaying ? "rgba(var(--primary), 0.06)" : "initial",
        }}
        transition={{ duration: 0.5 }}>
        <MetronomeHeader onRecommendedBpmClick={setRecommendedBpm} />
      </motion.div>
      <div className='p-4'>
        <div className='space-y-4'>
          <MetronomeControls
            isPlaying={isPlaying}
            bpm={bpm}
            onTogglePlay={toggleMetronome}
            currentBeat={currentBeat}
          />
          <MetronomeSlider
            bpm={bpm}
            minBpm={minBpm}
            maxBpm={maxBpm}
            onBpmChange={handleBpmChange}
            onBpmDragChange={handleBpmDragChange}
            onBpmDragEnd={handleBpmDragEnd}
          />
        </div>
      </div>
    </Card>
  );
};
