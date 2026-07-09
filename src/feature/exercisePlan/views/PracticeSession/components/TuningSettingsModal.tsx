import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { Check, Lock } from "lucide-react";
import { GUITAR_TUNINGS } from "utils/audio/tunings";

import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";

export const TuningSettingsModal = () => {
  const { isModalOpen, closeModal, preferredTuning, setTuningId, isLocked, lockReason, tuning } = useGuitarTuningContext();

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guitar tuning</DialogTitle>
          <DialogDescription>
            Choose how your guitar is tuned — pitch detection and backing audio will be matched to this tuning.
          </DialogDescription>
        </DialogHeader>

        {isLocked && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="space-y-1">
              <p className="text-sm text-amber-400">{lockReason}</p>
              <p className="text-xs text-zinc-500">
                Active tuning: <span className="text-zinc-300">{tuning.name} ({tuning.notation})</span>
              </p>
            </div>
          </div>
        )}

        <div
          className={cn(
            "grid grid-cols-1 gap-2 xsm:grid-cols-2",
            isLocked && "pointer-events-none opacity-40"
          )}
        >
          {GUITAR_TUNINGS.map((option) => {
            const isSelected = option.id === preferredTuning.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={isLocked}
                onClick={() => setTuningId(option.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg p-3 text-left transition-colors",
                  isSelected ? "bg-cyan-500/10 text-cyan-400" : "bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60"
                )}
              >
                <span>
                  <span className="block text-sm font-semibold">{option.name}</span>
                  <span className="block text-xs text-zinc-500">{option.notation}</span>
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
