'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'assets/components/ui/dialog';
import { Button } from 'assets/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'assets/components/ui/select';
import { Label } from 'assets/components/ui/label';
import {
  getAvailableRootNotes,
  getAvailableScales,
  getAvailablePatterns,
  getAvailablePositions,
  generateScaleExercise,
  type ScaleExerciseConfig,
} from 'feature/exercisePlan/scales/scaleExerciseGenerator';
import { scaleDefinitions, rootNotes as chromaticRootNotes } from 'feature/exercisePlan/scales/scaleDefinitions';
import { getScalePatternForPosition, type FretPosition } from 'feature/exercisePlan/scales/fretboardMapper';
import type { Exercise } from 'feature/exercisePlan/types/exercise.types';
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

    if (config.position === 'all') {
      const seen = new Set<string>();
      const allPositions: FretPosition[] = [];
      for (const pos of [1, 3, 5, 7, 8, 10, 12]) {
        for (const fp of getScalePatternForPosition(rootMidi, intervals, pos)) {
          const key = `${fp.string}-${fp.fret}`;
          if (!seen.has(key)) { seen.add(key); allPositions.push(fp); }
        }
      }
      return { positions: allPositions, startFret: 0, endFret: 15, rootMidi };
    }

    const pos = config.position as number;
    return {
      positions: getScalePatternForPosition(rootMidi, intervals, pos),
      startFret: pos - 1,
      endFret: pos + 3,
      rootMidi,
    };
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Choose Scale to Practice</DialogTitle>
          <DialogDescription>
            Configure scale practice parameters. The system will generate
            tablature automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Root Note Selection */}
          <div className="space-y-2">
            <Label htmlFor="root-note">Root Note</Label>
            <Select
              value={config.rootNote}
              onValueChange={(value) =>
                setConfig((prev) => ({ ...prev, rootNote: value }))
              }
            >
              <SelectTrigger id="root-note">
                <SelectValue placeholder="Select note" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="scale-type">Scale Type</Label>
            <Select
              value={config.scaleType}
              onValueChange={(value: any) =>
                setConfig((prev) => ({ ...prev, scaleType: value }))
              }
            >
              <SelectTrigger id="scale-type">
                <SelectValue placeholder="Select scale" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="pattern-type">Practice Pattern</Label>
            <Select
              value={config.patternType}
              onValueChange={(value: any) =>
                setConfig((prev) => ({ ...prev, patternType: value }))
              }
            >
              <SelectTrigger id="pattern-type">
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="position">Fretboard Position</Label>
            <Select
              value={config.position?.toString()}
              onValueChange={(value) =>
                setConfig((prev) => ({ ...prev, position: value === 'all' ? 'all' : parseInt(value) }))
              }
            >
              <SelectTrigger id="position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((pos) => (
                  <SelectItem key={pos.toString()} value={pos.toString()}>
                    {pos === 'all' ? 'Full Fretboard (All Positions)' : `Position ${pos} (frets ${pos}-${pos + 4})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {config.position === 'all' 
                ? "This will generate a longer exercise covering all main positions across the neck"
                : "Position determines where on the fretboard you practice the scale"}
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
                ? 'All positions — frets 0–15'
                : `Position ${config.position} — frets ${previewData.startFret}–${previewData.endFret}`
            }
          />
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>Add to Plan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
