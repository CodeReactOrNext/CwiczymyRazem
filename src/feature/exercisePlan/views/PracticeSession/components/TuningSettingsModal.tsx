import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { InstrumentPicker } from "feature/tuner/components/InstrumentPicker";
import { useTranslation } from "hooks/useTranslation";
import { Check, Lock } from "lucide-react";
import { useState } from "react";
import { GUITAR_STRING_COUNTS } from "utils/audio/tunings";

import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";

/**
 * The tuning grid. Its own component so the 6/7-string tab it keeps resets to
 * the active tuning's string count every time the dialog opens (Radix unmounts
 * the dialog's content while it's closed).
 */
const TuningOptions = () => {
  const { t } = useTranslation("session");
  const {
    setTuningId, isLocked, instrument,
    fileTuning, fileTuningSource, tuningOptions, selectedTuningId, isTuningAvailable,
  } = useGuitarTuningContext();
  const selectedCount = tuningOptions.find((option) => option.id === selectedTuningId)?.stringCount ?? 6;
  const [stringTab, setStringTab] = useState(String(selectedCount));

  // A Guitar Pro file fixes the string count; a bass keeps its one list.
  const countsOnOffer = GUITAR_STRING_COUNTS.filter((count) =>
    tuningOptions.some((option) => option.stringCount === count));
  const showStringTabs = instrument === "guitar" && !fileTuning && countsOnOffer.length > 1;
  const visibleCount = showStringTabs ? Number(stringTab) : fileTuning?.stringCount;
  const visibleOptions = visibleCount
    ? tuningOptions.filter((option) => option.stringCount === visibleCount)
    : tuningOptions;

  return (
    <div className='space-y-3'>
      {showStringTabs && (
        <SegmentedControl
          label={t("tuning_modal.strings")}
          selected={[stringTab]}
          onSelect={(value) => {
            if (!isLocked) setStringTab(value);
          }}
          className={cn(isLocked && "pointer-events-none opacity-40")}
          options={countsOnOffer.map((count) => ({
            value: String(count),
            label: t("tuning_modal.string_count", { count }),
          }))}
        />
      )}

      <div
        className={cn(
          "grid grid-cols-1 gap-2 xsm:grid-cols-2",
          isLocked && "pointer-events-none opacity-40"
        )}
      >
        {visibleOptions.map((option) => {
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
                  {option.id === fileTuning?.id && ` · ${t(fileTuningSource === "exercise" ? "tuning_modal.written_in" : "tuning_modal.from_file")}`}
                </span>
              </span>
              {isSelected && <Check className="h-4 w-4 shrink-0 text-cyan-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TuningSettingsModal = () => {
  const { t } = useTranslation("session");
  const {
    isModalOpen, closeModal, isLocked, lockReason, tuning,
    instrument, setInstrument, instrumentLockReason, fileTuning, fileTuningSource,
  } = useGuitarTuningContext();
  const isBass = instrument === "bass";

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
      {/* z-index must beat the session view (z-[999999] desktop / z-[9999999] mobile modal)
          or this dialog opens invisibly behind it — and since Radix disables pointer
          events on the rest of the page while a dialog is open, the whole session
          becomes unresponsive with no visible way to close it. */}
      <DialogContent className="sm:max-w-md z-[99999999]">
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

        {/* A Guitar Pro file (or a tab saying so) is written in its own tuning: the
            frets only stay true when the whole instrument moves, so nothing else is offered. */}
        {fileTuning && !isLocked && (
          <p className="text-xs leading-relaxed text-zinc-500">
            {fileTuningSource === "exercise"
              ? t(isBass ? "tuning_modal.written_description_bass" : "tuning_modal.written_description", { name: fileTuning.name, notation: fileTuning.notation })
              : t(isBass ? "tuning_modal.file_description_bass" : "tuning_modal.file_description", { name: fileTuning.name })}
          </p>
        )}

        <TuningOptions />
      </DialogContent>
    </Dialog>
  );
};
