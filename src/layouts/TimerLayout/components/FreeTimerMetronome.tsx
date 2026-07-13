import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useDeviceMetronome } from "feature/exercisePlan/components/Metronome/hooks/useDeviceMetronome";
import { Metronome } from "feature/exercisePlan/components/Metronome/Metronome";
import { useTranslation } from "hooks/useTranslation";
import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { GiMetronome } from "react-icons/gi";

// Standalone metronome for the Free Timer — same click engine/controls as the
// Practice Session metronome, just without an exercise driving start/stop, so
// it gets its own play/pause button and is never `locked` (no exam mode here).
const FreeTimerMetronome = () => {
  const { t } = useTranslation("timer");
  const [isMuted, setIsMuted] = useState(false);

  const metronome = useDeviceMetronome({
    initialBpm: 100,
    isMuted,
  });

  const handleTogglePlay = () => {
    if (metronome.isPlaying) {
      metronome.stopMetronome();
    } else {
      metronome.startMetronome({ skipCountIn: true });
    }
  };

  return (
    <div className='flex h-full flex-col gap-3'>
      <div className='flex items-center gap-2 px-1'>
        <GiMetronome className='h-4 w-4 text-zinc-400' />
        <span className='text-sm font-medium text-zinc-300'>
          {t("metronome.title")}
        </span>
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors",
            metronome.isPlaying ? "bg-cyan-400" : "bg-zinc-700"
          )}
          style={
            metronome.isPlaying
              ? { animation: `pulse ${60 / metronome.bpm}s ease-in-out infinite` }
              : undefined
          }
        />
      </div>

      <div className='flex flex-1 flex-col justify-between gap-4 rounded-lg bg-zinc-900/40 p-4'>
        <div className='flex flex-1 flex-col justify-center [&>div]:bg-transparent [&>div]:p-0 [&>div]:shadow-none [&>div]:backdrop-blur-none'>
          <Metronome metronome={metronome} isMuted={isMuted} onMuteToggle={setIsMuted} />
        </div>

        <Button
          onClick={handleTogglePlay}
          className={cn(
            "h-11 w-full rounded-lg text-sm font-medium transition-colors",
            metronome.isPlaying
              ? "bg-cyan-500 text-black hover:bg-cyan-400"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          )}
          aria-label={metronome.isPlaying ? t("metronome.stop") : t("metronome.start")}>
          {metronome.isPlaying ? (
            <>
              <Pause className='mr-2 h-4 w-4' fill='currentColor' />
              {t("metronome.stop")}
            </>
          ) : (
            <>
              <Play className='mr-2 h-4 w-4' fill='currentColor' />
              {t("metronome.start")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FreeTimerMetronome;
