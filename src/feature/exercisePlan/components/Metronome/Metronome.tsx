import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Slider } from "assets/components/ui/slider";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMagic, FaPause, FaPlay } from "react-icons/fa";

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
  const { t } = useTranslation("exercises");
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  };

  const playClick = () => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.setValueAtTime(
      1000,
      audioContextRef.current.currentTime
    );
    gainNode.gain.setValueAtTime(1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContextRef.current.currentTime + 0.05
    );

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.05);
  };

  const startMetronome = () => {
    initAudioContext();
    setIsPlaying(true);
    const intervalTime = (60 / bpm) * 1000;
    playClick();
    intervalRef.current = window.setInterval(playClick, intervalTime);
  };

  const stopMetronome = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  const handleBpmChange = (newBpm: number[]) => {
    setBpm(newBpm[0]);
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <Card className='overflow-hidden bg-card/50'>
      <div className='border-b border-border/50 bg-muted/5 p-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-medium'>
            {t("practice_session.metronome")}
          </h3>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setBpm(recommendedBpm);
              if (isPlaying) {
                stopMetronome();
                startMetronome();
              }
            }}
            className='h-8 px-2'>
            <FaMagic className='mr-1 h-3 w-3' />
            <span className='text-xs'>{t("metronome.recommended_tempo")}</span>
          </Button>
        </div>
      </div>
      <div className='p-4'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Button
              variant={isPlaying ? "default" : "outline"}
              onClick={toggleMetronome}
              className='w-24'>
              {isPlaying ? (
                <>
                  <FaPause className='mr-2 h-3 w-3' />
                  <span>{t("metronome.stop")}</span>
                </>
              ) : (
                <>
                  <FaPlay className='mr-2 h-3 w-3' />
                  <span>{t("metronome.start")}</span>
                </>
              )}
            </Button>
            <span className='text-sm font-medium'>{bpm} BPM</span>
          </div>
          <Slider
            value={[bpm]}
            min={minBpm}
            max={maxBpm}
            step={1}
            onValueChange={handleBpmChange}
          />
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>{minBpm} BPM</span>
            <span>{maxBpm} BPM</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
