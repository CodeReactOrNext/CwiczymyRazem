"use client";

import { Button } from "assets/components/ui/button";
import { Checkbox } from "assets/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Label } from "assets/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { cn } from "assets/lib/utils";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import {
  type ChordExerciseConfig,
  generateChordExercise,
  getCategorizedChords,
} from "feature/exercisePlan/chords/chordExerciseGenerator";
import {
  SETUP_DIALOG_BODY,
  SETUP_DIALOG_CONTENT,
  SETUP_DIALOG_FOOTER,
  SETUP_FIELD,
  SETUP_SURFACE,
} from "feature/exercisePlan/components/setupDialogStyles";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { X } from "lucide-react";
import { useState } from "react";

interface ChordSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseGenerated: (exercise: Exercise) => void;
  initialExercise?: Exercise;
}

export function ChordSelectionDialog({
  isOpen,
  onClose,
  onExerciseGenerated,
  initialExercise,
}: ChordSelectionDialogProps) {
  const { t } = useTranslation("session");
  const [selectedChords, setSelectedChords] = useState<string[]>(["G", "C"]);
  const [hideNotes, setHideNotes] = useState(false);
  const [changesPerMeasure, setChangesPerMeasure] = useState(1);
  const categorizedChords = getCategorizedChords();
  const [chordLevel, setChordLevel] =
    useState<keyof typeof categorizedChords>("beginner");

  // Reset the form whenever the dialog opens (or is reopened for another
  // exercise) — adjusted during render instead of in an effect.
  const [syncedFor, setSyncedFor] = useState<{
    isOpen: boolean;
    initialExercise?: Exercise;
  }>({ isOpen: false });
  if (
    syncedFor.isOpen !== isOpen ||
    syncedFor.initialExercise !== initialExercise
  ) {
    setSyncedFor({ isOpen, initialExercise });
    if (isOpen) {
      setChordLevel("beginner");
      if (initialExercise && initialExercise._generatorConfig) {
        const conf = initialExercise._generatorConfig as ChordExerciseConfig;
        setSelectedChords(conf.chords || []);
        setHideNotes(initialExercise.hideTablatureNotes ?? false);
        setChangesPerMeasure(conf.changesPerMeasure || 1);
      } else {
        setSelectedChords(["G", "C"]);
        setHideNotes(false);
        setChangesPerMeasure(1);
      }
    }
  }

  const handleAddChord = (chord: string) => {
    if (selectedChords.length < 8) {
      setSelectedChords([...selectedChords, chord]);
    }
  };

  const handleRemoveChord = (index: number) => {
    const newChords = [...selectedChords];
    newChords.splice(index, 1);
    setSelectedChords(newChords);
  };

  const handleGenerate = () => {
    if (selectedChords.length > 0) {
      const exercise = generateChordExercise({
        chords: selectedChords,
        changesPerMeasure: changesPerMeasure,
        beatsPerMeasure: 4,
        measures: 16,
        includeNotes: true,
        tempo: {
          min: 40,
          max: 180,
          recommended: 80,
        },
      });
      exercise.hideTablatureNotes = hideNotes;
      onExerciseGenerated(exercise);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* z-index must beat the mobile session modal (z-[9999999]) or the setup
          dialog is invisible on phones. Flex column + capped height keeps the
          header/footer on screen (middle scrolls) even on short landscape phones.
          The Select dropdown needs a z-index above this dialog's, otherwise it
          renders behind it (SelectContent defaults to z-50). */}
      <DialogContent
        overlayClassName='z-[99999998]'
        className={cn("z-[99999999]", SETUP_DIALOG_CONTENT)}>
        <DialogHeader className='shrink-0'>
          <DialogTitle>{t("chord_dialog.title")}</DialogTitle>
          <DialogDescription>{t("chord_dialog.description")}</DialogDescription>
        </DialogHeader>

        <div className={SETUP_DIALOG_BODY}>
          <div className='space-y-2'>
            <Label>
              {t("chord_dialog.sequence", { count: selectedChords.length })}
            </Label>
            <div className={cn(
                "flex min-h-[64px] flex-wrap items-center gap-2 p-3",
                SETUP_SURFACE
              )}>
              {selectedChords.map((chord, idx) => (
                <div key={idx} className='flex items-center gap-2'>
                  <span className='flex items-center gap-1 rounded bg-zinc-800 py-1 pl-3 pr-1 text-sm font-semibold text-zinc-100'>
                    {chord}
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveChord(idx)}
                      aria-label={t("chord_dialog.remove_chord", { chord })}
                      className='h-6 w-6 rounded text-zinc-400 [&_svg]:size-3.5'>
                      <X />
                    </Button>
                  </span>
                  {idx < selectedChords.length - 1 && (
                    <span className='text-zinc-500'>→</span>
                  )}
                </div>
              ))}
              {selectedChords.length === 0 && (
                <span className='pl-1 text-sm text-zinc-400'>
                  {t("chord_dialog.click_to_add")}
                </span>
              )}
            </div>
          </div>

          <div className='w-full space-y-4'>
            <SegmentedControl<keyof typeof categorizedChords>
              label={t("chord_dialog.click_to_add")}
              selected={[chordLevel]}
              onSelect={setChordLevel}
              options={(["beginner", "intermediate", "advanced"] as const).map(
                (level) => ({
                  value: level,
                  label: t(`chord_dialog.${level}`),
                }),
              )}
            />
            <div className='grid max-h-[180px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5'>
              {categorizedChords[chordLevel].map((chord) => (
                <Button
                  key={chord}
                  variant='secondary'
                  onClick={() => handleAddChord(chord)}
                  disabled={selectedChords.length >= 8}>
                  {chord}
                </Button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='chord-frequency'>
                {t("chord_dialog.frequency")}
              </Label>
              <Select
                value={changesPerMeasure.toString()}
                onValueChange={(v) => setChangesPerMeasure(parseInt(v))}>
                <SelectTrigger id='chord-frequency' className={SETUP_FIELD}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='z-[100000000]'>
                  <SelectItem value='1'>
                    {t("chord_dialog.every_bar")}
                  </SelectItem>
                  <SelectItem value='2'>
                    {t("chord_dialog.every_2_beats")}
                  </SelectItem>
                  <SelectItem value='4'>
                    {t("chord_dialog.every_beat")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-start gap-3 sm:pt-9'>
              <Checkbox
                id='hide-notes-dlg'
                checked={hideNotes}
                onCheckedChange={(checked) => setHideNotes(!!checked)}
                className='mt-0.5'
              />
              <div className='grid gap-1'>
                <Label htmlFor='hide-notes-dlg' className='cursor-pointer'>
                  {t("chord_dialog.hide_tabs")}
                </Label>
                <p className='text-xs text-zinc-400'>
                  {t("chord_dialog.by_ear")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={SETUP_DIALOG_FOOTER}>
          <Button variant='outline' onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedChords.length === 0}>
            {t("add_to_plan")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
