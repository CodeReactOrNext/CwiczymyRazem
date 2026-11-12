import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { InstrumentPicker } from "feature/tuner/components/InstrumentPicker";
import { useTranslation } from "hooks/useTranslation";
import { Check, Lock } from "lucide-react";

import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";

export const TuningSettingsModal = () => {
  const { t } = useTranslation("session");
  const {
    isModalOpen, closeModal, setTuningId, isLocked, lockReason, tuning,
    instrument, setInstrument, instrumentLockReason,
    fileTuning, tuningOptions, selectedTuningId, isTuningAvailable,
  } = useGuitarTuningContext();
  const isBass = instrument === "bass";

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
      {/* z-index must beat the session view (z-[999999] desktop / z-[9999999] mobile modal)
          or this dialog opens invisibly behind it — and since Radix disables pointer
          events on the rest of the page while a dialog is open, the whole session
          becomes unresponsive with no visible way to close it. */}
      <DialogContent className="max-w-md z-[99999999]">
        <DialogHeader>
          <DialogTitle>{t(isBass ? "media.bass_tuning" : "media.guitar_tuning")}</DialogTitle>
          <DialogDescription>
            {t(isBass ? "tuning_modal.bass_description" : "tuning_modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <InstrumentPicker
            value={instrument}
            onChange={setInstrument}
            disabled={!!instrumentLockReason}
          />
          {instrumentLockReason && (
            <p className="text-xs text-zinc-500">{instrumentLockReason}</p>
          )}
        </div>

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

        {/* A Guitar Pro file is written in its own tuning: the frets only stay
            true when the whole instrument moves, so nothing else is offered. */}
        {fileTuning && !isLocked && (
          <p className="text-xs leading-relaxed text-zinc-500">
            {t(isBass ? "tuning_modal.file_description_bass" : "tuning_modal.file_description", { name: fileTuning.name })}
          </p>
        )}

        <div
          className={cn(
            "grid grid-cols-1 gap-2 xsm:grid-cols-2",
            isLocked && "pointer-events-none opacity-40"
          )}
        >
          {tuningOptions.map((option) => {
            const isSelected = option.id === selectedTuningId;
            const isAvailable = isTuningAvailable(option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={isLocked || !isAvailable}
                onClick={() => setTuningId(option.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg p-3 text-left transition-colors",
                  isSelected ? "bg-cyan-500/10 text-cyan-400" : "bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60",
                  !isAvailable && !isLocked && "pointer-events-none opacity-40"
                )}
              >
                <span>
                  <span className="block text-sm font-semibold">{option.name}</span>
                  <span className="block text-xs text-zinc-500">
                    {option.notation}
                    {option.id === fileTuning?.id && ` · ${t("tuning_modal.from_file")}`}
                  </span>
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
