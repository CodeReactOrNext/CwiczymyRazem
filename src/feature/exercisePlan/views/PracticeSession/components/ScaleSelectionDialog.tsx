'use client';

import { Button } from 'assets/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'assets/components/ui/dialog';
import { Label } from 'assets/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'assets/components/ui/select';
import { type FretPosition,getScaleShape, getShapeStartFrets } from 'feature/exercisePlan/scales/fretboardMapper';
import { getNotesPerString,rootNotes as chromaticRootNotes,scaleDefinitions } from 'feature/exercisePlan/scales/scaleDefinitions';
import {
  generateScaleExercise,
  getAvailablePatterns,
  getAvailablePositions,
  getAvailableRootNotes,
  getAvailableScales,
  type ScaleExerciseConfig,
} from 'feature/exercisePlan/scales/scaleExerciseGenerator';
import type { Exercise } from 'feature/exercisePlan/types/exercise.types';
import { useTranslation } from "hooks/useTranslation";
import { useEffect,useState } from 'react';

import { FretboardPreview } from './FretboardPreview';

interface ScaleSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseGenerated: (exercise: Exercise) => void;
  initialExercise?: Exercise;
}

export function ScaleSelectionDialog({
  isOpen,
  onClose,
  onExerciseGenerated,
  initialExercise,
}: ScaleSelectionDialogProps) {
  const { t } = useTranslation("session");
  const [config, setConfig] = useState<Partial<ScaleExerciseConfig>>({
    rootNote: 'C',
    scaleType: 'major',
    patternType: 'ascending',
    position: 1,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialExercise && initialExercise._generatorConfig) {
        setConfig(initialExercise._generatorConfig);
      } else {
        setConfig({
          rootNote: 'C',
          scaleType: 'major',
          patternType: 'ascending',
          position: 1,
        });
      }
    }
  }, [isOpen, initialExercise]);

  const rootNotes = getAvailableRootNotes();
  const scales = getAvailableScales();
  const patterns = getAvailablePatterns();
  const positions = getAvailablePositions();

  const handleGenerate = () => {
    if (
      config.rootNote &&
      config.scaleType &&
      config.patternType &&
      config.position
    ) {
      const exercise = generateScaleExercise(config as ScaleExerciseConfig);
      onExerciseGenerated(exercise);
      onClose();
    }
  };

  const selectedScale = scales.find((s) => s.value === config.scaleType);

  const previewData = (() => {
    if (!config.rootNote || !config.scaleType) return null;
    const rootMidi = 60 + chromaticRootNotes.indexOf(config.rootNote);
    const intervals = scaleDefinitions[config.scaleType].intervals;
    const notesPerString = getNotesPerString(config.scaleType);

    if (config.position === 'all') {
      const seen = new Set<string>();
      const allPositions: FretPosition[] = [];
      for (const pos of getShapeStartFrets(rootMidi, intervals)) {
        for (const fp of getScaleShape(rootMidi, intervals, pos, notesPerString)) {
          const key = `${fp.string}-${fp.fret}`;
          if (!seen.has(key)) { seen.add(key); allPositions.push(fp); }
        }
      }
      return { positions: allPositions, startFret: 0, endFret: 15, rootMidi };
    }

    const pos = config.position as number;
    const shape = getScaleShape(rootMidi, intervals, pos, notesPerString);
    // The diagram follows the shape rather than a nominal window, so a
    // three-notes-per-string shape isn't cropped at its top fret.
    const frets = shape.map((note) => note.fret);
    return {
      positions: shape,
      startFret: Math.max(0, Math.min(...frets) - 1),
      endFret: Math.max(...frets) + 1,
      rootMidi,
    };
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* z-index must beat the mobile session modal (z-[9999999]) or the setup
          dialog is invisible on phones. Flex column + capped height keeps the
          header/footer on screen (middle scrolls) even on short landscape phones.
          Each Select's dropdown also needs a z-index above this dialog's, otherwise
          it renders behind it (SelectContent defaults to z-50). */}
      <DialogContent
        overlayClassName="z-[99999998]"
        className="z-[99999999] !flex flex-col max-h-[100dvh] sm:max-h-[92dvh] sm:max-w-[500px]"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("scale_dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("scale_dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-6 py-4">
          {/* Root Note Selection */}
          <div className="space-y-2">
            <Label htmlFor="root-note">{t("scale_dialog.root")}</Label>
            <Select
              value={config.rootNote}
              onValueChange={(value) =>
                setConfig((prev) => ({ ...prev, rootNote: value }))
              }
            >
              <SelectTrigger id="root-note">
                <SelectValue placeholder={t("scale_dialog.select_note")} />
              </SelectTrigger>
              <SelectContent className="z-[100000000]">
                {rootNotes.map((note) => (
                  <SelectItem key={note} value={note}>
                    {note}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scale Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="scale-type">{t("scale_dialog.scale_type")}</Label>
            <Select
              value={config.scaleType}
              onValueChange={(value: any) =>
                setConfig((prev) => ({ ...prev, scaleType: value }))
              }
            >
              <SelectTrigger id="scale-type">
                <SelectValue placeholder={t("scale_dialog.select_scale")} />
              </SelectTrigger>
              <SelectContent className="z-[100000000]">
                {scales.map((scale) => (
                  <SelectItem key={scale.value} value={scale.value}>
                    {scale.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedScale && (
              <p className="text-sm text-muted-foreground">
                {selectedScale.description}
              </p>
            )}
          </div>

          {/* Pattern Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="pattern-type">{t("scale_dialog.pattern")}</Label>
            <Select
              value={config.patternType}
              onValueChange={(value: any) =>
                setConfig((prev) => ({ ...prev, patternType: value }))
              }
            >
              <SelectTrigger id="pattern-type">
                <SelectValue placeholder={t("scale_dialog.select_pattern")} />
              </SelectTrigger>
              <SelectContent className="z-[100000000]">
                {patterns.map((pattern) => (
                  <SelectItem key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position Selection */}
          <div className="space-y-2">
            <Label htmlFor="position">{t("scale_dialog.position")}</Label>
            <Select
              value={config.position?.toString()}
              onValueChange={(value) =>
                setConfig((prev) => ({ ...prev, position: value === 'all' ? 'all' : parseInt(value) }))
              }
            >
              <SelectTrigger id="position">
                <SelectValue placeholder={t("scale_dialog.select_position")} />
              </SelectTrigger>
              <SelectContent className="z-[100000000]">
                {positions.map((pos) => (
                  <SelectItem key={pos.toString()} value={pos.toString()}>
                    {pos === 'all' ? t('scale_dialog.full_fretboard') : t('scale_dialog.position_frets', { pos, from: pos, to: pos + 4 })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {config.position === 'all' 
                ? t("scale_dialog.all_hint")
                : t("scale_dialog.position_hint")}
            </p>
          </div>
        </div>

        {previewData && (
          <FretboardPreview
            positions={previewData.positions}
            startFret={previewData.startFret}
            endFret={previewData.endFret}
            rootMidi={previewData.rootMidi}
            label={
              config.position === 'all'
                ? t('scale_dialog.preview_all')
                : t('scale_dialog.preview_position', { pos: config.position, from: previewData.startFret, to: previewData.endFret })
            }
          />
        )}
        </div>

        <div className="flex shrink-0 justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleGenerate}>{t("add_to_plan")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
