import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "assets/components/ui/dialog";
import { Slider } from "assets/components/ui/slider";
import { Checkbox } from "assets/components/ui/checkbox";
import { useState } from "react";
import { convertMsToHMS } from "utils/converter";

interface TimeSplitterModalProps {
  isOpen: boolean;
  totalTime: number;
  onConfirm: (hearingTime: number, techniqueTime: number, markAsLearned: boolean) => void;
  onCancel: () => void;
  songTitle: string;
}

export const TimeSplitterModal = ({
  isOpen,
  totalTime,
  onConfirm,
  onCancel,
  songTitle,
}: TimeSplitterModalProps) => {
  const [splitRatio, setSplitRatio] = useState(50); // 0 = 100% Hearing, 100 = 100% Technique
  const [markAsLearned, setMarkAsLearned] = useState(false);

  const techniqueTime = Math.round(totalTime * (splitRatio / 100));
  const hearingTime = totalTime - techniqueTime;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Session Summary</DialogTitle>
          <DialogDescription className="text-zinc-400">
            You practiced <span className="text-white font-bold">{songTitle}</span> for <span className="text-cyan-400 font-bold">{convertMsToHMS(totalTime)}</span>.
            <br />
            How did you spend your time?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
            <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider">
                <span className={splitRatio < 50 ? "text-cyan-400" : "text-zinc-500"}>Hearing</span>
                <span className={splitRatio > 50 ? "text-amber-400" : "text-zinc-500"}>Technique</span>
            </div>
            
            <Slider 
                value={[splitRatio]} 
                onValueChange={(val) => setSplitRatio(val[0])} 
                max={100} 
                step={5}
                className="cursor-pointer"
            />
            
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Hearing</p>
                    <p className="text-xl font-bold text-cyan-400">{convertMsToHMS(hearingTime)}</p>
                    <p className="text-[10px] text-zinc-600">{100 - splitRatio}%</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Technique</p>
                    <p className="text-xl font-bold text-amber-400">{convertMsToHMS(techniqueTime)}</p>
                    <p className="text-[10px] text-zinc-600">{splitRatio}%</p>
                </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setMarkAsLearned(!markAsLearned)}>
                <Checkbox checked={markAsLearned} onCheckedChange={(c) => setMarkAsLearned(!!c)} id="learned-check" className="border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:text-black" />
                <div className="flex flex-col">
                    <label htmlFor="learned-check" className="text-sm font-medium text-white cursor-pointer pointer-events-none">
                        I've learned this song!
                    </label>
                    <span className="text-xs text-zinc-400">
                        Mark as "Learned" and move to completed
                    </span>
                </div>
            </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
           <Button variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-white">
             Resume Timer
           </Button>
           <Button onClick={() => onConfirm(hearingTime, techniqueTime, markAsLearned)} className="bg-cyan-600 hover:bg-cyan-500 text-white">
             Confirm & Finish
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
