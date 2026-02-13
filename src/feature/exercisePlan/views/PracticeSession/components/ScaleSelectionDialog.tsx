'use client';

import { useState } from 'react';
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
import type { Exercise } from 'feature/exercisePlan/types/exercise.types';

interface ScaleSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseGenerated: (exercise: Exercise) => void;
}

export function ScaleSelectionDialog({
  isOpen,
  onClose,
  onExerciseGenerated,
}: ScaleSelectionDialogProps) {
  const [config, setConfig] = useState<Partial<ScaleExerciseConfig>>({
    rootNote: 'C',
    scaleType: 'major',
    patternType: 'ascending',
    position: 1,
  });

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
                setConfig({ ...config, rootNote: value })
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
                setConfig({ ...config, scaleType: value })
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
                setConfig({ ...config, patternType: value })
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
                setConfig({ ...config, position: parseInt(value) })
              }
            >
              <SelectTrigger id="position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos.toString()}>
                    Position {pos} (frets {pos}-{pos + 4})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Position determines where on the fretboard you practice the scale
            </p>
          </div>
        </div>

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
