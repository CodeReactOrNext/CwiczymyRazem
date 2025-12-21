import { Progress } from "assets/components/ui/progress";

interface MassActionProgressProps {
  progress: {
    current: number;
    total: number;
  };
}

const MassActionProgress = ({ progress }: MassActionProgressProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-8 animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-black text-white">Cross-platform validation active</h3>
          <p className="text-[11px] text-zinc-500 tracking-[0.2em] font-black uppercase">Checking Spotify Network & MusicBrainz DB</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-zinc-500">Progress</p>
            <span className="text-lg font-black text-cyan-400">{progress.current} / {progress.total}</span>
          </div>
        </div>
      </div>
      <Progress value={(progress.current / (progress.total || 1)) * 100} className="h-1.5 bg-zinc-950 ring-1 ring-white/5" />
    </div>
  );
};

export default MassActionProgress;
