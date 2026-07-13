import { Button } from 'assets/components/ui/button';
import { cn } from 'assets/lib/utils';
import { BackLink } from 'components/BackLink/BackLink';
import { useTablatureAudio } from 'feature/exercisePlan/hooks/useTablatureAudio';
import type { TablatureBeat, TablatureMeasure, TablatureNote } from 'feature/exercisePlan/types/exercise.types';
import { TablatureViewer } from 'feature/exercisePlan/views/PracticeSession/components/TablatureViewer';
import { ImportTablature } from 'feature/songs/components/ImportTablature/ImportTablature';
import { AnimatePresence,motion } from 'framer-motion';
import { LucideChevronsRight,LucideEraser, LucideFileMusic, LucideMinus, LucideMonitor, LucidePlay, LucidePlus, LucideRedo2, LucideSquare, LucideTrash2, LucideUndo2, LucideVolume2, LucideVolumeX } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useCallback,useEffect, useState } from 'react';

type ArticulationType = 'isHammerOn' | 'isPullOff' | 'isAccented' | 'isDead' | 'isVibrato' | 'isTap' | 'isPalmMute';

const ARTICULATIONS: { type: ArticulationType; letter: string; label: string; activeClass: string }[] = [
  { type: 'isHammerOn', letter: 'H', label: 'Hammer-on', activeClass: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40' },
  { type: 'isPullOff', letter: 'P', label: 'Pull-off', activeClass: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' },
  { type: 'isAccented', letter: 'A', label: 'Accent', activeClass: 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40' },
  { type: 'isDead', letter: 'D', label: 'Dead note', activeClass: 'bg-zinc-500/20 text-zinc-300 ring-1 ring-zinc-500/40' },
  { type: 'isVibrato', letter: 'V', label: 'Vibrato', activeClass: 'bg-cyan-300/20 text-cyan-300 ring-1 ring-cyan-300/40' },
  { type: 'isTap', letter: 'T', label: 'Tap', activeClass: 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/40' },
  { type: 'isPalmMute', letter: 'M', label: 'Palm mute', activeClass: 'bg-amber-600/20 text-amber-500 ring-1 ring-amber-600/40' },
];

const QUICK_FRETS = [0, 1, 2, 3, 5, 7, 9, 12, 15, 17, 19, 22];

const DURATION_LABELS: Record<number, string> = { 1: '1/4', 0.5: '1/8', 0.25: '1/16', 0.125: '1/32' };

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  hoverClass = 'hover:bg-zinc-800 hover:text-zinc-100',
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  hoverClass?: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 disabled:pointer-events-none disabled:opacity-30',
        active ? 'bg-cyan-500 text-zinc-950' : hoverClass
      )}>
      <Icon size={14} />
    </button>
  );
}

export default function TabEditor() {
  const router = useRouter();
  const [measures, setMeasures] = useState<TablatureMeasure[]>([
    {
      timeSignature: [4, 4],
      beats: Array(16).fill(null).map(() => ({ duration: 0.25, notes: [] }))
    }
  ]);
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ measureIdx: number; beatIdx: number; stringIdx: number } | null>(null);
  const [isGpModalOpen, setIsGpModalOpen] = useState(false);
  const selectionStartRef = React.useRef<{ mIdx: number; bIdx: number; sIdx: number; x: number; y: number } | null>(null);
  const [activeSelection, setActiveSelection] = useState<{ measureIdx: number; startBeat: number; endBeat: number; startString: number; endString: number } | null>(null);
  const [clipboard, setClipboard] = useState<{ beats: TablatureBeat[], baseStringIdx: number } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ mIdx: number; bIdx: number; sIdx: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' | 'error' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  }, [setToast]);

  const saveHistory = useCallback((newMeasures: TablatureMeasure[]) => {
    const serialized = JSON.stringify(newMeasures);
    if (history[historyIdx] === serialized) return;

    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(serialized);
    if (newHistory.length > 50) newHistory.shift();

    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  }, [history, historyIdx, setHistory, setHistoryIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setMeasures(JSON.parse(prev));
      setHistoryIdx(historyIdx - 1);
    }
  }, [history, historyIdx, setMeasures, setHistoryIdx]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setMeasures(JSON.parse(next));
      setHistoryIdx(historyIdx + 1);
    }
  }, [history, historyIdx, setMeasures, setHistoryIdx]);

  const editId = typeof router.query.edit === "string" ? router.query.edit : null;
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // On mount, restore any saved draft so navigating away and back (e.g. a
  // round-trip to the publish page) doesn't wipe the editor. Works for both
  // edit mode (draft holds the exercise's tablature) and create mode.
  useEffect(() => {
    let restored = false;
    try {
      const raw = localStorage.getItem("tab-editor-draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMeasures(parsed);
          setHistory([JSON.stringify(parsed)]);
          setHistoryIdx(0);
          restored = true;
        }
      }
    } catch {}
    if (!restored) {
      setHistory([JSON.stringify(measures)]);
      setHistoryIdx(0);
    }
    setIsDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draft in sync so a round-trip to the publish page (or a refresh)
  // preserves the user's work. Gated on isDraftLoaded (state, not a ref) so the
  // initial render's run is skipped — otherwise it would overwrite the saved
  // draft with the default measures before the restore above is committed.
  useEffect(() => {
    if (!isDraftLoaded) return;
    try {
      localStorage.setItem("tab-editor-draft", JSON.stringify(measures));
    } catch {}
  }, [isDraftLoaded, measures]);

  useTablatureAudio({
    measures,
    bpm,
    isPlaying,
    startTime,
    isMuted
  });

  const startPlayback = () => {
    setStartTime(Date.now());
    setIsPlaying(true);
  };

  const processImportText = useCallback((text: string) => {
    try {
      let cleanText = text.trim();
      if (cleanText.includes('tablature:')) {
          const startIndex = cleanText.indexOf('[');
          const endIndex = cleanText.lastIndexOf(']');
          if (startIndex !== -1 && endIndex !== -1) {
              cleanText = cleanText.substring(startIndex, endIndex + 1);
          }
      }

      if (cleanText.endsWith(',')) {
          cleanText = cleanText.slice(0, -1).trim();
      }

      const parseValue = (text: string) => {
          return new Function(`return (${text})`)();
      };

      const parsed = parseValue(cleanText);
      if (!Array.isArray(parsed)) return null;

      let processedMeasures: TablatureMeasure[] = [];
      const isAlreadyMeasures = parsed.length > 0 && ('beats' in parsed[0]);

      if (isAlreadyMeasures) {
          processedMeasures = parsed.map(m => ({
              timeSignature: m.timeSignature || [4, 4],
              beats: (m.beats || []).map((b: any) => ({
                  duration: b.duration || 0.25,
                  notes: (b.notes || []).map((n: any) => ({
                      string: n.string,
                      fret: n.fret,
                      isAccented: !!n.isAccented,
                      isHammerOn: !!n.isHammerOn,
                      isPullOff: !!n.isPullOff
                  }))
              }))
          }));
      } else {
          const BEATS_PER_MEASURE = 16;
          for (let i = 0; i < parsed.length; i += BEATS_PER_MEASURE) {
              const beatsInMeasure = parsed.slice(i, i + BEATS_PER_MEASURE).map((b: any) => ({
                  duration: b.duration || 0.25,
                  notes: (b.notes || []).map((n: any) => ({
                      string: n.string,
                      fret: n.fret,
                      isAccented: !!n.isAccented,
                      isHammerOn: !!n.isHammerOn,
                      isPullOff: !!n.isPullOff
                  }))
              }));

              while (beatsInMeasure.length < BEATS_PER_MEASURE) {
                  beatsInMeasure.push({ duration: 0.25, notes: [] });
              }

              processedMeasures.push({
                  timeSignature: [4, 4],
                  beats: beatsInMeasure
              });
          }
      }
      return processedMeasures;
    } catch (e) {
      return null;
    }
  }, []);

  const handleGpImported = useCallback((
    importedMeasures: TablatureMeasure[],
    fileName: string,
    tempo: number,
    trackName: string,
  ) => {
    if (!importedMeasures || importedMeasures.length === 0) {
      showToast("This track has no tablature notes.", "error");
      return;
    }
    setMeasures(importedMeasures);
    saveHistory(importedMeasures);
    if (tempo > 0) setBpm(Math.round(tempo));
    setSelectedCell(null);
    setActiveSelection(null);
    showToast(`Loaded "${trackName}" from ${fileName}`, "success");
  }, [saveHistory, showToast]);

  const stopPlayback = () => {
    setIsPlaying(false);
    setStartTime(null);
  };

  const addMeasure = () => {
    setMeasures([...measures, {
      timeSignature: [4, 4],
      beats: Array(16).fill(null).map(() => ({ duration: 0.25, notes: [] }))
    }]);
  };

  const updateMeasureSteps = (mIdx: number, steps: number) => {
    const newMeasures = [...measures];
    const currentBeats = newMeasures[mIdx].beats;
    const duration = 4 / steps;

    const newBeats = Array(steps).fill(null).map((_, i) => {
      if (i < currentBeats.length) {
        return { ...currentBeats[i], duration };
      }
      return { duration, notes: [] };
    });

    newMeasures[mIdx].beats = newBeats;
    setMeasures(newMeasures);
    saveHistory(newMeasures);
    showToast(`Measure #${mIdx + 1}: ${steps} steps`, "info");
  };

  const removeMeasure = (index: number) => {
    if (measures.length > 1) {
      setMeasures(measures.filter((_, i) => i !== index));
    }
  };

  const clearAll = () => {
    if (confirm("Clear all measures?")) {
      setMeasures([{
        timeSignature: [4, 4],
        beats: Array(16).fill(null).map(() => ({ duration: 0.25, notes: [] }))
      }]);
    }
  };


  const updateDuration = (measureIdx: number, beatIdx: number, duration: number) => {
    const newMeasures = [...measures];
    newMeasures[measureIdx].beats[beatIdx].duration = duration;
    setMeasures(newMeasures);
    saveHistory(newMeasures);
  };

  const setGlobalDuration = (duration: number) => {
    const newMeasures = measures.map(m => ({
        ...m,
        beats: m.beats.map(b => ({ ...b, duration }))
    }));
    setMeasures(newMeasures);
    saveHistory(newMeasures);
  };

  const handleWheel = (e: React.WheelEvent, mIdx: number, bIdx: number, sIdx: number) => {
    e.preventDefault();
    const string = sIdx + 1;
    const newMeasures = [...measures];
    const beat = newMeasures[mIdx].beats[bIdx];
    const note = beat.notes.find(n => n.string === string);

    if (note) {
        const delta = e.deltaY < 0 ? 1 : -1;
        note.fret = Math.max(0, Math.min(24, note.fret + delta));
        setMeasures(newMeasures);
        saveHistory(newMeasures);
    }
  };

  const updateFret = (measureIdx: number, beatIdx: number, stringIdx: number, fret: number) => {
    const string = stringIdx + 1;
    const newMeasures = [...measures];
    const beat = newMeasures[measureIdx].beats[beatIdx];
    const note = beat.notes.find(n => n.string === string);

    if (note) {
      note.fret = Math.max(0, Math.min(24, fret));
    } else {
      beat.notes.push({ string, fret });
    }

    setMeasures(newMeasures);
  };

  const toggleEffect = (measureIdx: number, beatIdx: number, stringIdx: number, type: ArticulationType) => {
    const string = stringIdx + 1;
    const newMeasures = [...measures];
    const beat = newMeasures[measureIdx].beats[beatIdx];
    const note = beat.notes.find(n => n.string === string);

    if (note) {
      if (type === 'isHammerOn') {
        note.isHammerOn = !note.isHammerOn;
        if (note.isHammerOn) note.isPullOff = false;
      } else if (type === 'isPullOff') {
        note.isPullOff = !note.isPullOff;
        if (note.isPullOff) note.isHammerOn = false;
      } else if (type === 'isAccented') {
        note.isAccented = !note.isAccented;
      } else if (type === 'isDead') {
        note.isDead = !note.isDead;
      } else if (type === 'isVibrato') {
        note.isVibrato = !note.isVibrato;
      } else if (type === 'isTap') {
        note.isTap = !note.isTap;
      } else if (type === 'isPalmMute') {
        note.isPalmMute = !note.isPalmMute;
      }
    }

    setMeasures(newMeasures);
  };

  const clearSelectedNote = useCallback(() => {
    if (!selectedCell) return;
    const newMeasures = [...measures];
    const beat = newMeasures[selectedCell.measureIdx].beats[selectedCell.beatIdx];
    beat.notes = beat.notes.filter(n => n.string !== selectedCell.stringIdx + 1);
    setMeasures(newMeasures);
    saveHistory(newMeasures);
  }, [selectedCell, measures, saveHistory]);

  const handlePasteAtCursor = useCallback((rightClickCell?: { measureIdx: number; beatIdx: number; stringIdx: number } | null) => {
    const target = rightClickCell || selectedCell;
    if (!clipboard || !target) return;

    const newMeasures = JSON.parse(JSON.stringify(measures));
    const stringOffset = target.stringIdx - clipboard.baseStringIdx;

    clipboard.beats.forEach((beat: TablatureBeat, offset: number) => {
        let tMIdx = target.measureIdx;
        let tBIdx = target.beatIdx + offset;

        while (tMIdx < newMeasures.length && tBIdx >= newMeasures[tMIdx].beats.length) {
            tBIdx -= newMeasures[tMIdx].beats.length;
            tMIdx++;
        }

        if (tMIdx < newMeasures.length) {
            const targetBeat = newMeasures[tMIdx].beats[tBIdx];
            targetBeat.duration = beat.duration;

            beat.notes.forEach((note: TablatureNote) => {
                const newString = note.string + stringOffset;
                if (newString >= 1 && newString <= 6) {
                    const existingNoteIdx = targetBeat.notes.findIndex((n: TablatureNote) => n.string === newString);
                    const newNote = JSON.parse(JSON.stringify(note));
                    newNote.string = newString;
                    if (existingNoteIdx > -1) {
                        targetBeat.notes[existingNoteIdx] = newNote;
                    } else {
                        targetBeat.notes.push(newNote);
                    }
                }
            });
        }
    });

    setMeasures(newMeasures);
    saveHistory(newMeasures);
    showToast("Pattern applied!", "success");
  }, [clipboard, selectedCell, measures, saveHistory, showToast]);

  const handleCopySelection = useCallback(() => {
    if (activeSelection) {
        const beats = measures[activeSelection.measureIdx].beats.slice(
            Math.min(activeSelection.startBeat, activeSelection.endBeat),
            Math.max(activeSelection.startBeat, activeSelection.endBeat) + 1
        );

        const minS = Math.min(activeSelection.startString, activeSelection.endString);
        const maxS = Math.max(activeSelection.startString, activeSelection.endString);

        const filteredBeats = beats.map((beat: TablatureBeat) => ({
            ...beat,
            notes: beat.notes.filter((n: TablatureNote) => (n.string - 1) >= minS && (n.string - 1) <= maxS)
        }));

        setClipboard({
            beats: JSON.parse(JSON.stringify(filteredBeats)),
            baseStringIdx: minS
        });
        showToast("Copied selection", "success");
        setContextMenu(null);
    }
  }, [activeSelection, measures, showToast, setClipboard, setContextMenu]);

  const handleDeleteSelection = useCallback(() => {
    if (activeSelection) {
        const newMeasures = JSON.parse(JSON.stringify(measures));
        const minB = Math.min(activeSelection.startBeat, activeSelection.endBeat);
        const maxB = Math.max(activeSelection.startBeat, activeSelection.endBeat);
        const minS = Math.min(activeSelection.startString, activeSelection.endString);
        const maxS = Math.max(activeSelection.startString, activeSelection.endString);

        for (let b = minB; b <= maxB; b++) {
            newMeasures[activeSelection.measureIdx].beats[b].notes = newMeasures[activeSelection.measureIdx].beats[b].notes.filter(
                (n: TablatureNote) => (n.string - 1) < minS || (n.string - 1) > maxS
            );
        }
        setMeasures(newMeasures);
        saveHistory(newMeasures);
        showToast("Selection cleared", "info");
        setContextMenu(null);
    }
  }, [activeSelection, measures, saveHistory, showToast, setMeasures, setContextMenu]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isGpModalOpen) return;

    if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
    }
    if (e.key.toLowerCase() === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
        return;
    }
    if (e.key.toLowerCase() === 'x' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleCopySelection();
        handleDeleteSelection();
        return;
    }

    if (!selectedCell) return;
    const { measureIdx, beatIdx, stringIdx } = selectedCell;

    if (e.key >= '0' && e.key <= '9') {
        const beat = measures[measureIdx].beats[beatIdx];
        const note = beat.notes.find(n => n.string === stringIdx + 1);
        let newFret = parseInt(e.key);

        if (note && note.fret < 10 && note.fret > 0) {
            const combined = parseInt(`${note.fret}${e.key}`);
            if (combined <= 24) newFret = combined;
        }

        updateFret(measureIdx, beatIdx, stringIdx, newFret);
        saveHistory(measures);

        if (autoAdvance) {
            const nextBeat = beatIdx + 1;
            if (nextBeat < measures[measureIdx].beats.length) {
                setSelectedCell({ ...selectedCell, beatIdx: nextBeat });
            } else if (measureIdx + 1 < measures.length) {
                setSelectedCell({ measureIdx: measureIdx + 1, beatIdx: 0, stringIdx });
            }
        }
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
        const newMeasures = [...measures];
        if (activeSelection) {
            const minB = Math.min(activeSelection.startBeat, activeSelection.endBeat);
            const maxB = Math.max(activeSelection.startBeat, activeSelection.endBeat);
            const minS = Math.min(activeSelection.startString, activeSelection.endString);
            const maxS = Math.max(activeSelection.startString, activeSelection.endString);
            for (let b = minB; b <= maxB; b++) {
                newMeasures[activeSelection.measureIdx].beats[b].notes = newMeasures[activeSelection.measureIdx].beats[b].notes.filter((n: TablatureNote) => (n.string - 1) < minS || (n.string - 1) > maxS);
            }
        } else {
            newMeasures[measureIdx].beats[beatIdx].notes = newMeasures[measureIdx].beats[beatIdx].notes.filter((n: TablatureNote) => n.string !== stringIdx + 1);
        }
        setMeasures(newMeasures);
        saveHistory(newMeasures);
    } else if (['h', 'p', 'a', 'd', 'v', 't', 'm'].includes(e.key.toLowerCase())) {
        const typeMap: Record<string, ArticulationType> = {
          h: 'isHammerOn', p: 'isPullOff', a: 'isAccented',
          d: 'isDead', v: 'isVibrato', t: 'isTap', m: 'isPalmMute'
        };
        const type = typeMap[e.key.toLowerCase()];
        if (activeSelection) {
            const newMeasures = [...measures];
            const minB = Math.min(activeSelection.startBeat, activeSelection.endBeat);
            const maxB = Math.max(activeSelection.startBeat, activeSelection.endBeat);
            const minS = Math.min(activeSelection.startString, activeSelection.endString);
            const maxS = Math.max(activeSelection.startString, activeSelection.endString);
            for (let b = minB; b <= maxB; b++) {
                for (let s = minS; s <= maxS; s++) {
                    const note = newMeasures[activeSelection.measureIdx].beats[b].notes.find((n: TablatureNote) => n.string === s + 1);
                    if (note) {
                        if (type === 'isHammerOn') { note.isHammerOn = !note.isHammerOn; if (note.isHammerOn) note.isPullOff = false; }
                        else if (type === 'isPullOff') { note.isPullOff = !note.isPullOff; if (note.isPullOff) note.isHammerOn = false; }
                        else if (type === 'isAccented') note.isAccented = !note.isAccented;
                        else if (type === 'isDead') note.isDead = !note.isDead;
                        else if (type === 'isVibrato') note.isVibrato = !note.isVibrato;
                        else if (type === 'isTap') note.isTap = !note.isTap;
                        else if (type === 'isPalmMute') note.isPalmMute = !note.isPalmMute;
                    }
                }
            }
            setMeasures(newMeasures);
            saveHistory(newMeasures);
        } else {
            toggleEffect(measureIdx, beatIdx, stringIdx, type);
            saveHistory(measures);
        }
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextBeat = beatIdx + 1;
        if (nextBeat < measures[measureIdx].beats.length) setSelectedCell({ ...selectedCell, beatIdx: nextBeat });
        else if (measureIdx + 1 < measures.length) setSelectedCell({ measureIdx: measureIdx + 1, beatIdx: 0, stringIdx });
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevBeat = beatIdx - 1;
        if (prevBeat >= 0) setSelectedCell({ ...selectedCell, beatIdx: prevBeat });
        else if (measureIdx > 0) setSelectedCell({ measureIdx: measureIdx - 1, beatIdx: measures[measureIdx-1].beats.length - 1, stringIdx });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (stringIdx > 0) setSelectedCell({ ...selectedCell, stringIdx: stringIdx - 1 });
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (stringIdx < 5) setSelectedCell({ ...selectedCell, stringIdx: stringIdx + 1 });
    } else if (e.key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey)) {
        handleCopySelection();
    } else if (e.key.toLowerCase() === 'v' && (e.ctrlKey || e.metaKey)) {
        handlePasteAtCursor();
    }
  }, [selectedCell, measures, activeSelection, clipboard, handlePasteAtCursor, handleCopySelection, handleDeleteSelection, showToast, isGpModalOpen, undo, redo, toggleEffect, updateFret, autoAdvance, setSelectedCell, setMeasures, saveHistory]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (isGpModalOpen) return;
    const text = e.clipboardData?.getData('text');
    if (text) {
        const processed = processImportText(text);
        if (processed) {
            e.preventDefault();
            const isSnippet = !text.includes('timeSignature');

            if (isSnippet && selectedCell) {
                const newMeasures = [...measures];
                const flatBeats = processed.flatMap(m => m.beats);

                let currentM = selectedCell.measureIdx;
                let currentB = selectedCell.beatIdx;

                flatBeats.forEach(beat => {
                    if (currentM < newMeasures.length) {
                        newMeasures[currentM].beats[currentB] = JSON.parse(JSON.stringify(beat));
                        currentB++;
                        if (currentB >= newMeasures[currentM].beats.length) {
                            currentB = 0;
                            currentM++;
                        }
                    }
                });
                setMeasures(newMeasures);
                saveHistory(newMeasures);
                showToast("Snippet imported to cursor", "success");
            } else {
                setMeasures(processed);
                saveHistory(processed);
                showToast("Full Tab imported", "success");
            }
        }
    }
  }, [isGpModalOpen, saveHistory, selectedCell, measures, showToast, processImportText, setMeasures]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && selectionStartRef.current) {
        const { mIdx, x: startX, y: startY } = selectionStartRef.current;
        const container = document.getElementById(`measure-grid-${mIdx}`);
        const box = document.getElementById(`selection-box-${mIdx}`);

        if (container && box) {
          const rect = container.getBoundingClientRect();
          const currentX = e.clientX;
          const currentY = e.clientY;

          const left = Math.min(startX, currentX) - rect.left;
          const top = Math.min(startY, currentY) - rect.top;
          const width = Math.abs(currentX - startX);
          const height = Math.abs(currentY - startY);

          box.style.display = 'block';
          box.style.left = `${left}px`;
          box.style.top = `${top}px`;
          box.style.width = `${width}px`;
          box.style.height = `${height}px`;

          const localX = e.clientX - rect.left;
          const localY = e.clientY - rect.top;
          const gridStartX = 32;
          const bIdx = Math.max(0, Math.min(measures[mIdx].beats.length - 1, Math.floor((localX - gridStartX) / 48)));
          const sIdx = Math.max(0, Math.min(5, Math.floor(localY / 48)));
          setHoveredCell({ mIdx, bIdx, sIdx });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && selectionStartRef.current) {
        const { mIdx, x: startAbsoluteX, y: startAbsoluteY } = selectionStartRef.current;
        const container = document.getElementById(`measure-grid-${mIdx}`);
        const box = document.getElementById(`selection-box-${mIdx}`);

        if (container) {
          const boxLeft = Math.min(startAbsoluteX, e.clientX);
          const boxRight = Math.max(startAbsoluteX, e.clientX);
          const boxTop = Math.min(startAbsoluteY, e.clientY);
          const boxBottom = Math.max(startAbsoluteY, e.clientY);

          let minB = measures[mIdx].beats.length, maxB = -1, minS = 6, maxS = -1;
          const cells = container.querySelectorAll('.group-cell');
          const BUFFER = 2;

          cells.forEach((cell: any) => {
              const cRect = cell.getBoundingClientRect();
              if (Math.max(boxLeft + BUFFER, cRect.left) < Math.min(boxRight - BUFFER, cRect.right) &&
                  Math.max(boxTop + BUFFER, cRect.top) < Math.min(boxBottom - BUFFER, cRect.bottom)) {
                  const bIdx = parseInt(cell.getAttribute('data-bidx'));
                  const sIdx = parseInt(cell.getAttribute('data-sidx'));
                  minB = Math.min(minB, bIdx);
                  maxB = Math.max(maxB, bIdx);
                  minS = Math.min(minS, sIdx);
                  maxS = Math.max(maxS, sIdx);
              }
          });

          if (maxB !== -1 && maxS !== -1) {
            setActiveSelection({
              measureIdx: mIdx,
              startBeat: minB,
              endBeat: maxB,
              startString: minS,
              endString: maxS
            });
          } else {
            setActiveSelection(null);
          }
        }

        if (box) box.style.display = 'none';
      }
      setIsDragging(false);
      selectionStartRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [handleKeyDown, handlePaste, isDragging]);

  const selectedBeat = selectedCell ? measures[selectedCell.measureIdx]?.beats[selectedCell.beatIdx] : undefined;
  const selectedNote = selectedCell ? selectedBeat?.notes.find(n => n.string === selectedCell.stringIdx + 1) : undefined;

  const setSelectedFret = (fret: number) => {
    if (!selectedCell) return;
    updateFret(selectedCell.measureIdx, selectedCell.beatIdx, selectedCell.stringIdx, fret);
    saveHistory(measures);
  };

  const toggleSelectedArticulation = (type: ArticulationType) => {
    if (!selectedCell || !selectedNote) return;
    toggleEffect(selectedCell.measureIdx, selectedCell.beatIdx, selectedCell.stringIdx, type);
    saveHistory(measures);
  };

  return (
    <>
      {/* Mobile blocker */}
      <div className='fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-zinc-950 p-8 text-center md:hidden'>
        <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-900'>
          <LucideMonitor className='text-zinc-500' size={32} />
        </div>
        <div className='space-y-3'>
          <h2 className='text-xl font-black tracking-tight text-zinc-100'>Desktop Only</h2>
          <p className='max-w-xs text-sm leading-relaxed text-zinc-500'>
            Tab Editor requires a keyboard and larger screen. Please open it on a desktop or laptop computer.
          </p>
        </div>
      </div>

      <div className='min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-cyan-500/30'>
        <Head>
          <title>Tablature Editor | Riff Quest</title>
        </Head>

        {/* Fixed Header/Toolbar */}
        <div className='fixed left-0 right-0 top-0 z-[60] bg-zinc-950/85 p-4 backdrop-blur-2xl md:px-8'>
          <div className='mx-auto flex max-w-[1700px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center gap-4'>
              <BackLink label='Back' onClick={() => router.back()} />
              <div>
                <h1 className='text-xl font-black italic tracking-tighter text-zinc-100'>Tab Editor</h1>
                <p className='text-[11px] font-bold text-zinc-500'>
                  {measures.length} measure{measures.length !== 1 ? 's' : ''} · {editId ? 'Editing exercise' : 'New exercise'}
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-1 rounded-lg bg-zinc-900/60 p-1'>
                <button
                  onClick={() => setIsGpModalOpen(true)}
                  className='flex items-center gap-2 rounded px-3 py-1.5 text-[11px] font-bold text-cyan-400 transition-colors hover:bg-cyan-500/10'>
                  <LucideFileMusic size={13} />
                  <span>Import GP</span>
                </button>
                <div className='mx-1 h-5 w-px bg-zinc-800' />
                <ToolbarIconButton icon={LucideUndo2} label='Undo' onClick={undo} disabled={historyIdx <= 0} />
                <ToolbarIconButton icon={LucideRedo2} label='Redo' onClick={redo} disabled={historyIdx >= history.length - 1} />
                <div className='mx-1 h-5 w-px bg-zinc-800' />
                <ToolbarIconButton
                  icon={LucideEraser}
                  label='Clear all measures'
                  onClick={clearAll}
                  hoverClass='hover:bg-red-500/10 hover:text-red-400'
                />
              </div>

              <div className='flex items-center gap-1 rounded-lg bg-zinc-900/60 p-1'>
                <button
                  onClick={() => isPlaying ? stopPlayback() : startPlayback()}
                  aria-label={isPlaying ? 'Stop playback' : 'Start playback'}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded transition-colors',
                    isPlaying ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  )}>
                  {isPlaying ? <LucideSquare size={13} fill='currentColor' /> : <LucidePlay size={13} fill='currentColor' className='ml-0.5' />}
                </button>
                <ToolbarIconButton
                  icon={isMuted ? LucideVolumeX : LucideVolume2}
                  label={isMuted ? 'Unmute' : 'Mute'}
                  onClick={() => setIsMuted(!isMuted)}
                  active={isMuted}
                  hoverClass={isMuted ? '' : 'hover:bg-zinc-800 hover:text-zinc-100'}
                />
                <div className='flex flex-col justify-center px-2 py-1'>
                  <span className='text-[7px] font-black leading-tight text-zinc-600'>BPM</span>
                  <input
                      type='number'
                      value={bpm}
                      onChange={(e) => setBpm(parseInt(e.target.value) || 80)}
                      className='w-8 bg-transparent text-[11px] font-black text-cyan-400 outline-none'
                  />
                </div>
                <div className='flex items-center gap-1 rounded bg-zinc-950/60 p-0.5'>
                    {[1, 0.5, 0.25, 0.125].map(d => (
                        <button
                            key={d}
                            onClick={() => setGlobalDuration(d)}
                            className={cn(
                                'flex h-7 items-center justify-center whitespace-nowrap rounded px-2 text-[8px] font-black transition-colors',
                                d === (measures[0]?.beats[0]?.duration) ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
                            )}>
                            {DURATION_LABELS[d]}
                        </button>
                    ))}
                </div>
                <div className='mx-1 h-5 w-px bg-zinc-800' />
                <button
                    onClick={() => setAutoAdvance(!autoAdvance)}
                    className={cn(
                        'flex h-8 items-center justify-center gap-2 rounded px-2 text-[8px] font-black tracking-widest transition-colors',
                        autoAdvance ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-200'
                    )}>
                    <div className={cn('h-1 w-1 rounded-full', autoAdvance ? 'animate-pulse bg-black' : 'bg-zinc-600')} />
                    Next
                </button>
              </div>

              <Button
                onClick={() => {
                  localStorage.setItem('tab-editor-draft', JSON.stringify(measures));
                  router.push(editId ? `/tab-editor/publish?edit=${editId}` : '/tab-editor/publish');
                }}
                className='gap-2 bg-cyan-500 text-zinc-950 shadow-none hover:bg-cyan-400'>
                <span>{editId ? 'Save changes' : 'Publish exercise'}</span>
                <LucideChevronsRight size={14} />
              </Button>
            </div>
          </div>
        </div>

        <div className='mx-auto max-w-[1700px] space-y-10 px-4 pb-24 pt-32 md:px-8 lg:pr-80'>

          {/* GP Import Modal */}
          <AnimatePresence>
            {isGpModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md'>
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className='custom-scrollbar max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-lg bg-zinc-900 p-8'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='space-y-2'>
                      <h3 className='text-xl font-black italic tracking-tighter text-cyan-400'>Import Guitar Pro</h3>
                      <p className='text-sm font-medium text-zinc-500'>
                        Drop a GP3/GP4/GP5/GPX/GP file, then pick a track to load it into the editor.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsGpModalOpen(false)}
                      className='shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-[10px] font-black tracking-widest text-zinc-300 transition-colors hover:bg-zinc-700'>
                      Done
                    </button>
                  </div>

                  <ImportTablature
                    onImported={(importedMeasures, fileName, tempo, trackName) =>
                      handleGpImported(importedMeasures, fileName, tempo, trackName)
                    }
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Preview Section */}
          <section className='space-y-4'>
              <div className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500' />
                  <h2 className='text-[10px] font-black tracking-[0.3em] text-zinc-500'>Real-time Visualization</h2>
              </div>
              <div className='relative'>
                  <TablatureViewer
                      measures={measures}
                      bpm={bpm}
                      isPlaying={isPlaying}
                      startTime={startTime}
                      className='relative z-10 h-[280px] rounded-lg backdrop-blur-3xl'
                  />
              </div>
          </section>

          {/* Editor Grid Container */}
          <section className='space-y-6'>
            <AnimatePresence>
              {measures.map((measure, mIdx) => (
                <motion.div
                  key={mIdx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className='relative overflow-hidden rounded-lg bg-zinc-900/40'>
                  <div className='flex items-center justify-between bg-zinc-900/60 p-4'>
                    <div className='flex items-center gap-6'>
                        <div className='rounded-full bg-zinc-800/60 px-3 py-1'>
                          <span className='text-[10px] font-black tracking-tighter text-zinc-400'>Measure #{mIdx + 1}</span>
                        </div>
                          <div className='flex items-center gap-4 text-[10px] font-bold text-zinc-600'>
                            <span>4 / 4 time</span>
                            <span className='h-1 w-1 rounded-full bg-zinc-700' />
                            <div className='flex items-center gap-1.5 rounded bg-zinc-950/60 p-1'>
                                {[8, 12, 16, 24, 32].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateMeasureSteps(mIdx, s)}
                                        className={cn(
                                            'whitespace-nowrap rounded px-2 py-0.5 transition-colors',
                                            measure.beats.length === s
                                                ? 'bg-cyan-500/10 text-cyan-400'
                                                : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300'
                                        )}>
                                        {s === 12 ? 'Triplet (12)' : s === 24 ? 'Sextuplet (24)' : `${s} steps`}
                                    </button>
                                ))}
                            </div>
                          </div>
                    </div>
                    <button
                      onClick={() => removeMeasure(mIdx)}
                      aria-label='Delete measure'
                      className='rounded p-2.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400'>
                      <LucideTrash2 size={18} />
                    </button>
                  </div>

                    <div className='custom-scrollbar relative overflow-x-auto p-8'>
                      <div className='min-w-max'>
                          <div
                              id={`measure-grid-${mIdx}`}
                              className='relative flex gap-4'
                              onMouseDown={(e) => {
                                  if (e.button !== 0) return;
                                  const target = (e.target as HTMLElement).closest('.group-cell');
                                  let bIdx, sIdx;

                                  if (target) {
                                      bIdx = parseInt(target.getAttribute('data-bidx') || '0');
                                      sIdx = parseInt(target.getAttribute('data-sidx') || '0');
                                  } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const localX = e.clientX - rect.left;
                                      const localY = e.clientY - rect.top;
                                      const gridStartX = 40;
                                      bIdx = Math.max(0, Math.min(15, Math.floor((localX - gridStartX) / 55)));
                                      sIdx = Math.max(0, Math.min(5, Math.floor(localY / 52)));
                                  }

                                  setSelectedCell({ measureIdx: mIdx, beatIdx: bIdx, stringIdx: sIdx });
                                  selectionStartRef.current = { mIdx, bIdx, sIdx, x: e.clientX, y: e.clientY };
                                  setActiveSelection(null);
                                  setIsDragging(true);
                                  setContextMenu(null);
                              }}
                              onContextMenu={(e) => {
                                  e.preventDefault();
                                  const target = (e.target as HTMLElement).closest('.group-cell');
                                  let bIdx, sIdx;

                                  if (target) {
                                      bIdx = parseInt(target.getAttribute('data-bidx') || '0');
                                      sIdx = parseInt(target.getAttribute('data-sidx') || '0');
                                  } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const localX = e.clientX - rect.left;
                                      const localY = e.clientY - rect.top;
                                      const gridStartX = 40;
                                      bIdx = Math.max(0, Math.min(15, Math.floor((localX - gridStartX) / 55)));
                                      sIdx = Math.max(0, Math.min(5, Math.floor(localY / 52)));
                                  }

                                  const isCellInSelection = activeSelection && activeSelection.measureIdx === mIdx &&
                                      bIdx >= Math.min(activeSelection.startBeat, activeSelection.endBeat) &&
                                      bIdx <= Math.max(activeSelection.startBeat, activeSelection.endBeat) &&
                                      sIdx >= Math.min(activeSelection.startString, activeSelection.endString) &&
                                      sIdx <= Math.max(activeSelection.startString, activeSelection.endString);

                                  if (!isCellInSelection) {
                                      setSelectedCell({ measureIdx: mIdx, beatIdx: bIdx, stringIdx: sIdx });
                                      setActiveSelection(null);
                                  }

                                  let x = e.clientX;
                                  let y = e.clientY;
                                  const menuWidth = 160;
                                  const menuHeight = 220;
                                  if (x + menuWidth > window.innerWidth) x -= menuWidth;
                                  if (y + menuHeight > window.innerHeight) y -= menuHeight;
                                  setContextMenu({ x, y });
                              }}
                          >
                              {/* Selection Rect Overlay */}
                              <div
                                id={`selection-box-${mIdx}`}
                                className='absolute z-20 hidden bg-cyan-400/20 ring-1 ring-cyan-400 pointer-events-none'
                              />
                            {/* String Labels */}
                            <div className='mb-10 flex w-4 flex-col justify-between py-2 text-[10px] font-black text-zinc-600'>
                              {[1, 2, 3, 4, 5, 6].map(s => (
                                <span key={s}>{s}</span>
                              ))}
                            </div>

                            <div className='flex gap-2'>
                              {measure.beats.map((beat, bIdx) => (
                                <div key={bIdx} className='space-y-4'>
                                  <div className='space-y-2'>
                                      {[0, 1, 2, 3, 4, 5].map(sIdx => {
                                        const note = beat.notes.find(n => n.string === sIdx + 1);
                                        const isSelected = selectedCell?.measureIdx === mIdx && selectedCell?.beatIdx === bIdx && selectedCell?.stringIdx === sIdx;
                                        const isInActiveSelection = !isDragging && activeSelection?.measureIdx === mIdx &&
                                          bIdx >= Math.min(activeSelection.startBeat, activeSelection.endBeat) &&
                                          bIdx <= Math.max(activeSelection.startBeat, activeSelection.endBeat) &&
                                          sIdx >= Math.min(activeSelection.startString, activeSelection.endString) &&
                                          sIdx <= Math.max(activeSelection.startString, activeSelection.endString);
                                      const isCrosshair = (selectedCell?.measureIdx === mIdx && (selectedCell?.beatIdx === bIdx || selectedCell?.stringIdx === sIdx));
                                      const isBeatMark = bIdx % 4 === 0;

                                      return (
                                        <button
                                          key={sIdx}
                                          data-bidx={bIdx}
                                          data-sidx={sIdx}
                                          onMouseEnter={() => {
                                              setHoveredCell({ mIdx, bIdx, sIdx });
                                          }}
                                          onMouseLeave={() => setHoveredCell(null)}
                                          onWheel={(e) => handleWheel(e, mIdx, bIdx, sIdx)}
                                          className={cn(
                                            'group-cell relative flex h-10 w-10 cursor-pointer items-center justify-center rounded transition-background',
                                            isSelected
                                              ? 'bg-cyan-500/25 ring-1 ring-cyan-500'
                                              : isInActiveSelection
                                                ? 'bg-cyan-500/10 ring-1 ring-cyan-500/40'
                                                : isCrosshair
                                                  ? 'bg-zinc-800/30'
                                                  : isBeatMark
                                                    ? 'bg-zinc-800/50 hover:bg-zinc-700/60'
                                                    : 'bg-zinc-900/40 hover:bg-zinc-800/50',
                                            note ? 'text-zinc-100' : 'text-zinc-700'
                                          )}
                                        >
                                          {note ? (
                                            <div className='relative flex flex-col items-center justify-center leading-none'>
                                              <span className={cn(
                                                'text-sm font-black tracking-tighter',
                                                note.isDead ? 'text-zinc-500' : ''
                                              )}>
                                                {note.isDead ? '×' : note.fret}
                                              </span>
                                              {(note.isHammerOn || note.isPullOff) && (
                                                <span className={cn(
                                                  'mt-0.5 text-[9px] font-black',
                                                  note.isHammerOn ? 'text-amber-400' : 'text-red-400'
                                                )}>
                                                  {note.isHammerOn ? 'H' : 'P'}
                                                </span>
                                              )}
                                              {note.isTap && (
                                                <span className='mt-0.5 text-[9px] font-black text-purple-400'>T</span>
                                              )}
                                              {note.isVibrato && (
                                                <span className='mt-0.5 text-[9px] font-black text-cyan-300'>~</span>
                                              )}
                                              {note.isAccented && (
                                                <div className='absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-cyan-400' />
                                              )}
                                              {note.isPalmMute && (
                                                <div className='absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-amber-500/70' />
                                              )}
                                            </div>
                                          ) : (
                                            <span className='text-[14px] opacity-20'>·</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <div className='grid grid-cols-2 gap-1 rounded bg-zinc-950/40 p-1'>
                                    {[1, 0.5, 0.25, 0.125].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => updateDuration(mIdx, bIdx, d)}
                                            className={cn(
                                                'flex h-4 items-center justify-center whitespace-nowrap rounded px-1 transition-colors',
                                                beat.duration === d ? 'bg-cyan-500 text-[7px] font-black text-zinc-950' : 'text-[7px] font-black text-zinc-600 hover:text-zinc-400'
                                            )}>
                                            {DURATION_LABELS[d]}
                                        </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={addMeasure}
              className='group flex w-full flex-col items-center justify-center gap-3 rounded-lg bg-zinc-900/20 py-10 transition-background hover:bg-cyan-500/[0.03]'>
              <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800/60 transition-colors group-hover:bg-cyan-500/20 group-hover:text-cyan-400'>
                  <LucidePlus size={24} />
              </div>
              <div className='flex flex-col items-center'>
                  <span className='text-xs font-black tracking-[0.2em] text-zinc-500 transition-colors group-hover:text-cyan-400'>Add New Measure</span>
                  <span className='mt-1 text-[10px] font-bold text-zinc-700'>Append more steps to your pattern</span>
              </div>
            </button>
          </section>

        </div>

        {/* Note Inspector — mouse-friendly fret & articulation editor for the selected cell */}
        <div className='fixed right-6 top-1/2 z-40 hidden w-72 -translate-y-1/2 flex-col gap-5 rounded-lg bg-zinc-900/80 p-5 backdrop-blur-xl lg:flex'>
            {selectedCell ? (
              <>
                <div className='space-y-1'>
                  <span className='text-[10px] font-black italic tracking-widest text-cyan-400'>Note Editor</span>
                  <p className='text-[11px] font-bold text-zinc-500'>
                    Measure {selectedCell.measureIdx + 1} · Beat {selectedCell.beatIdx + 1} · String {selectedCell.stringIdx + 1}
                  </p>
                </div>

                <div className='space-y-2'>
                  <span className='text-[10px] font-bold text-zinc-500'>Fret</span>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setSelectedFret(Math.max(0, (selectedNote?.fret ?? 0) - 1))}
                      disabled={!selectedNote}
                      aria-label='Decrease fret'
                      className='flex h-10 w-10 items-center justify-center rounded bg-zinc-800/60 text-zinc-300 transition-colors hover:bg-zinc-700 disabled:pointer-events-none disabled:opacity-30'>
                      <LucideMinus size={16} />
                    </button>
                    <input
                      type='number'
                      min={0}
                      max={24}
                      value={selectedNote?.fret ?? ''}
                      placeholder='—'
                      onChange={(e) => setSelectedFret(Math.max(0, Math.min(24, parseInt(e.target.value) || 0)))}
                      className='h-10 w-full rounded bg-zinc-950/60 text-center text-xl font-black text-cyan-400 outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60'
                    />
                    <button
                      onClick={() => setSelectedFret(Math.min(24, (selectedNote?.fret ?? -1) + 1))}
                      aria-label='Increase fret'
                      className='flex h-10 w-10 items-center justify-center rounded bg-zinc-800/60 text-zinc-300 transition-colors hover:bg-zinc-700'>
                      <LucidePlus size={16} />
                    </button>
                  </div>
                  <div className='grid grid-cols-6 gap-1.5'>
                    {QUICK_FRETS.map(f => (
                      <button
                        key={f}
                        onClick={() => setSelectedFret(f)}
                        className={cn(
                          'flex h-7 items-center justify-center rounded text-[11px] font-bold transition-colors',
                          selectedNote?.fret === f ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                        )}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='space-y-2'>
                  <span className='text-[10px] font-bold text-zinc-500'>Articulation</span>
                  <div className='grid grid-cols-4 gap-1.5'>
                    {ARTICULATIONS.map(a => (
                      <button
                        key={a.type}
                        onClick={() => toggleSelectedArticulation(a.type)}
                        disabled={!selectedNote}
                        title={a.label}
                        aria-label={a.label}
                        className={cn(
                          'flex h-9 items-center justify-center rounded text-xs font-black transition-colors disabled:pointer-events-none disabled:opacity-30',
                          selectedNote?.[a.type] ? a.activeClass : 'bg-zinc-800/40 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200'
                        )}>
                        {a.letter}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={clearSelectedNote}
                  disabled={!selectedNote}
                  className='flex items-center justify-center gap-2 rounded bg-red-500/10 py-2 text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:pointer-events-none disabled:opacity-30'>
                  <LucideTrash2 size={13} />
                  Clear note
                </button>
              </>
            ) : (
              <>
                <div className='space-y-1'>
                  <span className='text-[10px] font-black italic tracking-widest text-zinc-400'>Note Editor</span>
                  <p className='text-[11px] font-bold leading-relaxed text-zinc-600'>
                    Click a cell in the grid to set its fret and articulations here.
                  </p>
                </div>
                <div className='space-y-3 text-[10px] font-bold text-zinc-600'>
                  <div className='flex items-center justify-between'>
                    <span>Navigate</span>
                    <span className='text-zinc-400'>↑ ↓ ← →</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Set fret</span>
                    <span className='text-zinc-400'>0–9</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Clear note</span>
                    <span className='text-zinc-400'>Del</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Undo / Redo</span>
                    <span className='text-zinc-400'>Ctrl+Z / Ctrl+Y</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Fret +/-</span>
                    <span className='text-zinc-400'>Scroll</span>
                  </div>
                </div>
              </>
            )}
        </div>

        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                        'fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-lg px-6 py-3 text-xs font-black tracking-widest backdrop-blur-xl',
                        toast.type === 'success' ? 'bg-cyan-500 text-zinc-950' : 'bg-red-500 text-white'
                    )}>
                    <div className={cn('h-2 w-2 rounded-full', toast.type === 'success' ? 'animate-pulse bg-black' : 'animate-bounce bg-white')} />
                    {toast.message}
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {contextMenu && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    className='fixed z-[110] min-w-[140px] overflow-hidden rounded-lg bg-zinc-900 p-1'
                    onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={handleCopySelection}
                        className='flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-black tracking-widest text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-400'>
                        <span>Copy</span>
                        <span className='text-[10px] opacity-40'>Ctrl+C</span>
                    </button>
                    <button
                        onClick={() => { handlePasteAtCursor(); setContextMenu(null); }}
                        className='flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-black tracking-widest text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-400'>
                        <span>Paste</span>
                        <span className='text-[10px] opacity-40'>Ctrl+V</span>
                    </button>
                    <button
                        onClick={() => { handleCopySelection(); handleDeleteSelection(); }}
                        className='flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-black tracking-widest text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-400'>
                        <span>Cut</span>
                        <span className='text-[10px] opacity-40'>Ctrl+X</span>
                    </button>
                    <button
                        onClick={handleDeleteSelection}
                        className='flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-black tracking-widest text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400'>
                        <span>Clear Area</span>
                        <span className='text-[10px] opacity-40'>Del</span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>
      </div>
    </>
  );

}
