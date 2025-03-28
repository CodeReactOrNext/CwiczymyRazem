import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { useCallback, useEffect, useRef, useState } from "react";
import MetronomeSound from "./MetronomeSound";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";

interface MetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
}

export const Metronome = ({
  initialBpm = 60,
  minBpm = 40,
  maxBpm = 208,
  recommendedBpm = 60,
}: MetronomeProps) => {
  // State & refs
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPendulumSwinging, setIsPendulumSwinging] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timer | null>(null);
  const pendulumControls = useAnimationControls();

  // Setup audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  // Handle metronome playback
  const playMetronome = useCallback(() => {
    if (!audioContextRef.current) return;

    // Ensure we clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const beatDuration = 60000 / bpm; // milliseconds per beat
    setCurrentBeat(0);
    setIsPendulumSwinging(true);

    // Start the pendulum animation
    startPendulumAnimation(beatDuration);

    // Schedule beats at regular intervals
    let beat = 0;
    intervalRef.current = setInterval(() => {
      // Play the metronome sound
      MetronomeSound.play(audioContextRef.current!);

      // Update beat counter
      beat = (beat + 1) % 4;
      setCurrentBeat(beat);
    }, beatDuration);
  }, [bpm]);

  // Stop the metronome
  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPendulumSwinging(false);
    pendulumControls.stop();
  }, [pendulumControls]);

  // Toggle metronome state
  const toggleMetronome = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      playMetronome();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, playMetronome, stopMetronome]);

  // Update metronome when bpm changes while playing
  useEffect(() => {
    if (isPlaying) {
      playMetronome();
    }
  }, [bpm, isPlaying, playMetronome]);

  // Pendulum animation function
  const startPendulumAnimation = useCallback(
    (beatDuration: number) => {
      const swingDuration = beatDuration / 1000; // Convert to seconds

      pendulumControls.start({
        rotate: [30, -30, 30],
        transition: {
          duration: swingDuration * 2, // Full cycle is two beats
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
        },
      });
    },
    [pendulumControls]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        toggleMetronome();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleMetronome]);

  return (
    <div className='relative overflow-hidden rounded-xl border bg-card/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
      {/* Floating particles in the background */}
      <div className='absolute inset-0 -z-10 overflow-hidden'>
        <AnimatePresence>
          {isPlaying && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className='absolute h-2 w-2 rounded-full'
                  initial={{
                    x: Math.random() * 100 - 50 + 110,
                    y: Math.random() * 100 + 70,
                    opacity: 0,
                    backgroundColor:
                      i % 2 === 0
                        ? "var(--primary)"
                        : "var(--primary-foreground)",
                  }}
                  animate={{
                    x: [null, Math.random() * 200 - 100 + 110],
                    y: [null, Math.random() * 50 + 70],
                    opacity: [0, 0.3, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Pulsing beats visualization */}
      <div className='mb-4 flex justify-center gap-3'>
        {[0, 1, 2, 3].map((beat) => (
          <motion.div
            key={beat}
            className='relative h-5 w-5 rounded-full'
            style={{ backgroundColor: "var(--primary)" }}
            animate={{
              scale: currentBeat === beat && isPlaying ? [1, 1.5, 1] : 1,
              opacity: currentBeat === beat && isPlaying ? [0.7, 1, 0.7] : 0.3,
            }}
            transition={{ duration: 0.2 }}>
            {/* Ripple effect on active beat */}
            {currentBeat === beat && isPlaying && (
              <motion.div
                className='absolute inset-0 rounded-full bg-primary'
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Pendulum visualization */}
      <div className='relative mb-8 flex h-32 items-center justify-center overflow-hidden'>
        {/* Center axis point with glow */}
        <div className='shadow-glow absolute z-10 h-4 w-4 rounded-full bg-primary' />

        {/* Pendulum arm and weight */}
        <motion.div
          className='absolute top-0 origin-top'
          style={{ height: "120px", width: "4px" }}
          animate={pendulumControls}>
          <div className='h-full w-full bg-gradient-to-b from-primary/50 to-primary' />

          {/* Pendulum weight */}
          <motion.div
            className='absolute -left-3 bottom-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-foreground shadow-lg'
            animate={
              isPlaying
                ? {
                    boxShadow: [
                      "0 0 8px 2px var(--primary)",
                      "0 0 16px 4px var(--primary)",
                      "0 0 8px 2px var(--primary)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* BPM display with animation */}
      <div className='mb-4 text-center'>
        <motion.div
          className='text-3xl font-bold tracking-tighter'
          animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.6, repeat: isPlaying ? Infinity : 0 }}>
          {bpm} BPM
        </motion.div>

        {recommendedBpm !== bpm && (
          <div className='mt-1 text-xs text-muted-foreground'>
            (Zalecane: {recommendedBpm} BPM)
          </div>
        )}
      </div>

      {/* BPM slider control */}
      <div className='mb-6'>
        <Slider
          value={[bpm]}
          min={minBpm}
          max={maxBpm}
          step={1}
          onValueChange={(value) => setBpm(value[0])}
          className='py-4'
        />
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>{minBpm}</span>
          <span>{maxBpm}</span>
        </div>
      </div>

      {/* Controls */}
      <div className='flex justify-center'>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={toggleMetronome}
            className={`relative overflow-hidden rounded-full px-8 shadow-md transition-all duration-300 ${
              isPlaying ? "bg-primary" : "bg-primary/20 hover:bg-primary/30"
            }`}>
            {/* Ripple effect on active state */}
            {isPlaying && (
              <motion.div
                className='absolute inset-0 bg-white'
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 0.6,
                }}
              />
            )}
            <span className='relative z-10'>
              {isPlaying ? "Stop" : "Start"}
            </span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
