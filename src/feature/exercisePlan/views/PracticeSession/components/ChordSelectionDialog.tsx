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
import { Checkbox } from 'assets/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'assets/components/ui/tabs';
import {
  getCategorizedChords,
  generateChordExercise,
  type ChordExerciseConfig,
} from 'feature/exercisePlan/chords/chordExerciseGenerator';
import type { Exercise } from 'feature/exercisePlan/types/exercise.types';
import { Badge } from 'assets/components/ui/badge';
import { X } from 'lucide-react';

interface ChordSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseGenerated: (exercise: Exercise) => void;
}

export function ChordSelectionDialog({
  isOpen,
  onClose,
  onExerciseGenerated,
}: ChordSelectionDialogProps) {
  const [selectedChords, setSelectedChords] = useState<string[]>(['G', 'C']);
  const [hideNotes, setHideNotes] = useState(false);
  const [changesPerMeasure, setChangesPerMeasure] = useState(1);
  const categorizedChords = getCategorizedChords();

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
          recommended: 80
        }
      });
      exercise.hideTablatureNotes = hideNotes;
      onExerciseGenerated(exercise);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-zinc-950 border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic tracking-tighter text-white uppercase">
            Chord Practice Setup
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Build your exercise. Sequence up to 8 chords.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest pl-1">
                Active Sequence ({selectedChords.length}/8)
            </Label>
            <div className="flex flex-wrap gap-2 p-4 bg-white/[0.03] rounded-xl border border-white/5 min-h-[72px] items-center">
              {selectedChords.map((chord, idx) => (
                <div key={idx} className="flex items-center animate-in fade-in zoom-in duration-200">
                    <Badge variant="secondary" className="px-3 py-1.5 text-base font-black bg-cyan-500/10 text-cyan-400 border-cyan-500/20 gap-2">
                    {chord}
                    <button onClick={() => handleRemoveChord(idx)} className="hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                    </Badge>
                    {idx < selectedChords.length - 1 && <span className="mx-1 text-zinc-700 font-bold">→</span>}
                </div>
              ))}
              {selectedChords.length === 0 && <span className="text-zinc-600 text-sm font-medium pl-1">Click chords below to add...</span>}
            </div>
          </div>

          <div className="space-y-3">
            <Tabs defaultValue="beginner" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 border border-white/5 p-1 h-11">
                <TabsTrigger value="beginner" className="data-[state=active]:bg-zinc-800 uppercase text-[10px] font-bold tracking-wider">Beginner</TabsTrigger>
                <TabsTrigger value="intermediate" className="data-[state=active]:bg-zinc-800 uppercase text-[10px] font-bold tracking-wider">Inter</TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-zinc-800 uppercase text-[10px] font-bold tracking-wider">Advanced</TabsTrigger>
              </TabsList>
              
              {(Object.keys(categorizedChords) as Array<keyof typeof categorizedChords>).map((level) => (
                <TabsContent key={level} value={level} className="mt-4 outline-none">
                  <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-premium">
                    {categorizedChords[level].map(chord => (
                      <Button 
                        key={chord} 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAddChord(chord)}
                        className="font-black text-sm border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all h-10 uppercase tracking-tight"
                      >
                        {chord}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <Label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest pl-1">Changes Frequency</Label>
              <Select
                value={changesPerMeasure.toString()}
                onValueChange={(v) => setChangesPerMeasure(parseInt(v))}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/5 h-11 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="1">Every Bar</SelectItem>
                  <SelectItem value="2">Every 2 Beats</SelectItem>
                  <SelectItem value="4">Every Beat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center space-x-3 pb-2 px-1">
                <Checkbox 
                  id="hide-notes-dlg" 
                  checked={hideNotes} 
                  onCheckedChange={(checked) => setHideNotes(!!checked)}
                  className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 w-5 h-5"
                />
                <div className="grid gap-1 leading-none">
                    <Label htmlFor="hide-notes-dlg" className="text-sm font-bold text-zinc-200 cursor-pointer">
                        Hide Fret Tabs
                    </Label>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                        Play by ear/memory
                    </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[11px]">
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={selectedChords.length === 0} className="bg-white text-black hover:bg-zinc-200 px-8 font-black uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Add to Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
