import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { TablatureViewer } from 'feature/exercisePlan/views/PracticeSession/components/TablatureViewer';
import { useTablatureAudio } from 'feature/exercisePlan/hooks/useTablatureAudio';
import { TablatureMeasure, TablatureBeat, TablatureNote } from 'feature/exercisePlan/types/exercise.types';
import { motion, AnimatePresence } from 'framer-motion';
import { LucidePlus, LucideTrash2, LucidePlay, LucideSquare, LucideCopy, LucideEraser, LucideWand2, LucideVolume2, LucideVolumeX } from 'lucide-react';
import { cn } from 'assets/lib/utils';


export default function TabEditor() {
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
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

  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.stringify(measures)]);
      setHistoryIdx(0);
    }
  }, []);

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

  const importCode = () => {
    const processed = processImportText(importText);
    if (processed) {
        setMeasures(processed);
        saveHistory(processed);
        setIsImportModalOpen(false);
        setImportText("");
        showToast("Import successful!", "success");
    } else {
        showToast("Invalid code format.", "error");
    }
  };

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
    const duration = 4 / steps; // 4 quarter notes / number of steps

    const newBeats = Array(steps).fill(null).map((_, i) => {
      if (i < currentBeats.length) {
        return { ...currentBeats[i], duration };
      }
      return { duration, notes: [] };
    });

    newMeasures[mIdx].beats = newBeats;
    setMeasures(newMeasures);
    saveHistory(newMeasures);
    showToast(`Takt #${mIdx + 1}: ${steps} kroków`, "info");
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

  const toggleFret = (measureIdx: number, beatIdx: number, stringIdx: number, fret: number) => {
    const string = stringIdx + 1;
    const newMeasures = [...measures];
    const beat = newMeasures[measureIdx].beats[beatIdx];
    const noteIndex = beat.notes.findIndex(n => n.string === string);

    if (noteIndex > -1) {
      if (beat.notes[noteIndex].fret === fret) {
        beat.notes.splice(noteIndex, 1);
      } else {
        beat.notes[noteIndex].fret = fret;
      }
    } else {
      beat.notes.push({ string, fret });
    }

    setMeasures(newMeasures);
    saveHistory(newMeasures);
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

  const toggleEffect = (measureIdx: number, beatIdx: number, stringIdx: number, type: 'isHammerOn' | 'isPullOff' | 'isAccented') => {
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
      }
    }

    setMeasures(newMeasures);
  };

  const generateBasicPattern = () => {
    const newMeasures: TablatureMeasure[] = [{
      timeSignature: [4, 4],
      beats: Array(16).fill(null).map((_, i) => ({
        duration: 0.25,
        notes: i < 4 ? [{ string: 6, fret: i + 1 }] : []
      }))
    }];
    setMeasures(newMeasures);
  };

  const copyCode = () => {
    const cleanMeasures = measures.map(m => ({
      ...m,
      beats: m.beats.filter(b => b.notes.length > 0)
    })).filter(m => m.beats.length > 0);

    const formattedCode = `tablature: ${JSON.stringify(cleanMeasures, (key, value) => {
      if (key === 'isHammerOn' || key === 'isPullOff') return value || undefined;
      return value;
    }, 2)},`;
    
    navigator.clipboard.writeText(formattedCode);
    showToast("Full tablature code exported to clipboard!", "success");
  };

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
    if (isImportModalOpen) return;

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
    } else if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'a') {
        const typeMap: Record<string, 'isHammerOn' | 'isPullOff' | 'isAccented'> = { h: 'isHammerOn', p: 'isPullOff', a: 'isAccented' };
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
  }, [selectedCell, measures, activeSelection, clipboard, handlePasteAtCursor, handleCopySelection, handleDeleteSelection, showToast, isImportModalOpen, undo, redo, toggleEffect, updateFret, autoAdvance, setSelectedCell, setMeasures, saveHistory]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (isImportModalOpen) return;
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
  }, [isImportModalOpen, saveHistory, selectedCell, measures, showToast, processImportText, setMeasures]);

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
          const rect = container.getBoundingClientRect();
          const boxLeft = Math.min(startAbsoluteX, e.clientX);
          const boxRight = Math.max(startAbsoluteX, e.clientX);
          const boxTop = Math.min(startAbsoluteY, e.clientY);
          const boxBottom = Math.max(startAbsoluteY, e.clientY);
          
          let minB = measures[mIdx].beats.length, maxB = -1, minS = 6, maxS = -1;
          const cells = container.querySelectorAll('.group-cell');
          const BUFFER = 2; // Selection must overlap cell by 2px to be counted

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

  return (
    <>
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
        <Head>
          <title>Tablature Editor | Riff Quest</title>
        </Head>

        {/* Fixed Header/Toolbar */}
        <div className="fixed top-0 left-0 right-0 z-[60] bg-[#050505]/80 backdrop-blur-2xl border-b border-white/10 p-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center rotate-3">
                      <LucideWand2 className="text-black" size={18} />
                  </div>
                  <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40 uppercase">
                  Tab Editor
                  </h1>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-[10px] font-black group"
              >
                <span>PASTE CODE</span>
              </button>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl transition-all text-[10px] font-black group shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                <LucideCopy size={14} />
                <span>COPY EXPORT</span>
              </button>
              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
              <button
                onClick={generateBasicPattern}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-[10px] font-bold text-white/60 hover:text-white"
              >
                <LucideWand2 size={12} />
                <span>1234</span>
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl transition-all text-[10px] font-bold text-white/40 hover:text-red-400"
              >
                <LucideEraser size={12} />
                <span>CLEAR</span>
              </button>
              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
              <div className="flex items-center gap-1 bg-black rounded-xl border border-white/10 p-1">
                <button
                  onClick={() => isPlaying ? stopPlayback() : startPlayback()}
                  className={cn(
                    "p-2 w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                    isPlaying ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {isPlaying ? <LucideSquare size={14} fill="currentColor" /> : <LucidePlay size={14} fill="currentColor" className="ml-0.5" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                      "p-2 w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                      isMuted ? "text-red-400 bg-red-400/10" : "text-white/40 hover:text-white"
                  )}
                >
                  {isMuted ? <LucideVolumeX size={14} /> : <LucideVolume2 size={14} />}
                </button>
                <div className="px-2 py-1 flex flex-col justify-center min-w-[40px]">
                  <span className="text-[7px] uppercase font-black text-white/20 leading-tight">BPM</span>
                  <input 
                      type="number" 
                      value={bpm} 
                      onChange={(e) => setBpm(parseInt(e.target.value) || 80)}
                      className="bg-transparent text-[11px] font-black w-8 outline-none text-cyan-400"
                  />
                </div>
                <div className="flex items-center gap-1 bg-black/40 rounded-xl border border-white/10 p-0.5">
                    {[1, 0.5, 0.25, 0.125].map(d => (
                        <button
                            key={d}
                            onClick={() => setGlobalDuration(d)}
                            className={cn(
                                "px-2 h-7 flex items-center justify-center rounded-lg transition-all text-[8px] font-black uppercase whitespace-nowrap",
                                d === (measures[0]?.beats[0]?.duration) ? "bg-cyan-500 text-black" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {d === 1 && "1/4"}
                            {d === 0.5 && "1/8"}
                            {d === 0.25 && "1/16"}
                            {d === 0.125 && "1/32"}
                        </button>
                    ))}
                </div>
                <div className="h-6 w-px bg-white/10 mx-1" />
                <button
                    onClick={() => setAutoAdvance(!autoAdvance)}
                    className={cn(
                        "px-2 h-8 flex items-center justify-center rounded-lg transition-all text-[8px] font-black uppercase tracking-widest gap-2",
                        autoAdvance ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-white/5 text-white/40 hover:text-white"
                    )}
                >
                    <div className={cn("w-1 h-1 rounded-full", autoAdvance ? "bg-black animate-pulse" : "bg-white/20")} />
                    Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-12 pt-32 pb-24 px-4 md:px-8">

          {/* Import Modal */}
          <AnimatePresence>
            {isImportModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl"
                >
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-cyan-400">Import Tablature</h3>
                    <p className="text-sm text-white/40 font-medium">Paste your exercise code snippet or JSON array here.</p>
                  </div>
                  
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="tablature: [ ... ]"
                    className="w-full h-64 bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-[11px] text-cyan-100/70 outline-none focus:border-cyan-500/50 transition-all resize-none custom-scrollbar"
                  />

                  <div className="flex gap-4">
                    <button
                      onClick={() => { setIsImportModalOpen(false); setImportText(""); }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black transition-all uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={importCode}
                      className="flex-1 py-3 bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all uppercase tracking-widest"
                    >
                      Import & Load
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Preview Section */}
          <section className="space-y-4">
              <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Real-time Visualization</h2>
              </div>
              <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-duration-500" />
                  <TablatureViewer 
                      measures={measures}
                      bpm={bpm}
                      isPlaying={isPlaying}
                      startTime={startTime}
                      className="h-56 relative z-10 backdrop-blur-3xl"
                  />
              </div>
          </section>

          {/* Editor Grid Container */}
          <section className="space-y-6">
            <AnimatePresence>
              {measures.map((measure, mIdx) => (
                <motion.div 
                  key={mIdx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                >
                  <div className="bg-white/[0.02] p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-6">
                        <div className="bg-white/5 px-3 py-1 rounded-full">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Measure #{mIdx + 1}</span>
                        </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-white/20">
                            <span>4 / 4 TIME</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
                                {[8, 12, 16, 24, 32].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateMeasureSteps(mIdx, s)}
                                        className={cn(
                                            "px-2 py-0.5 rounded transition-all whitespace-nowrap",
                                            measure.beats.length === s 
                                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                                                : "hover:bg-white/5 text-white/20"
                                        )}
                                    >
                                        {s === 12 ? "Triole (12)" : s === 24 ? "Sekstole (24)" : `${s} KROKÓW`}
                                    </button>
                                ))}
                            </div>
                          </div>
                    </div>
                    <button 
                      onClick={() => removeMeasure(mIdx)}
                      className="p-2.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20"
                    >
                      <LucideTrash2 size={18} />
                    </button>
                  </div>
                  
                    <div className="p-8 overflow-x-auto custom-scrollbar relative">
                      <div className="min-w-max">
                          <div 
                              id={`measure-grid-${mIdx}`} 
                              className="flex gap-4 relative"
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
                              {/* Selection Rect Overlay (Direct DOM) */}
                              <div 
                                id={`selection-box-${mIdx}`}
                                className="absolute z-20 pointer-events-none border border-cyan-400 bg-cyan-400/20 shadow-[0_0_10px_rgba(6,182,212,0.1)] hidden"
                              />
                            {/* String Labels */}
                            <div className="flex flex-col justify-between py-2 mb-10 text-[10px] font-black text-white/20 w-4">
                              {[1, 2, 3, 4, 5, 6].map(s => (
                                <span key={s}>{s}</span>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              {measure.beats.map((beat, bIdx) => (
                                <div key={bIdx} className="space-y-4">
                                  <div className="space-y-2">
                                      {[0, 1, 2, 3, 4, 5].map(sIdx => {
                                        const note = beat.notes.find(n => n.string === sIdx + 1);
                                        const isSelected = selectedCell?.measureIdx === mIdx && selectedCell?.beatIdx === bIdx && selectedCell?.stringIdx === sIdx;
                                        const isInActiveSelection = !isDragging && activeSelection?.measureIdx === mIdx &&
                                          bIdx >= Math.min(activeSelection.startBeat, activeSelection.endBeat) && 
                                          bIdx <= Math.max(activeSelection.startBeat, activeSelection.endBeat) &&
                                          sIdx >= Math.min(activeSelection.startString, activeSelection.endString) &&
                                          sIdx <= Math.max(activeSelection.startString, activeSelection.endString);
                                      const isHovered = hoveredCell?.mIdx === mIdx && hoveredCell?.bIdx === bIdx && hoveredCell?.sIdx === sIdx;
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
                                            "w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border-2 relative group-cell",
                                            isSelected 
                                              ? "border-cyan-500 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                                              : isInActiveSelection
                                                ? "border-cyan-500/40 bg-cyan-500/10"
                                                : isCrosshair
                                                  ? "border-white/5 bg-white/[0.02]"
                                                  : isBeatMark 
                                                    ? "border-white/10 bg-white/[0.03] hover:bg-white/10" 
                                                    : "border-white/5 bg-transparent hover:bg-white/5",
                                            note ? "text-white scale-100" : "text-white/10 scale-95 hover:scale-100"
                                          )}
                                        >
                                          {note ? (
                                            <div className="flex flex-col items-center justify-center leading-none relative">
                                              <span className="text-sm font-black tracking-tighter">{note.fret}</span>
                                              {(note.isHammerOn || note.isPullOff) && (
                                                <span className={cn(
                                                  "text-[9px] font-black mt-0.5",
                                                  note.isHammerOn ? "text-amber-400" : "text-red-400"
                                                )}>
                                                  {note.isHammerOn ? 'H' : 'P'}
                                                </span>
                                              )}
                                              {note.isAccented && (
                                                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-[14px] opacity-20">·</span>
                                          )}
                                          {isBeatMark && !note && !isSelected && (
                                              <div className="absolute inset-0 bg-white/[0.02] rounded-xl pointer-events-none" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <div className="grid grid-cols-2 gap-1 p-1 bg-white/[0.02] rounded-lg border border-white/5">
                                    {[1, 0.5, 0.25, 0.125].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => updateDuration(mIdx, bIdx, d)}
                                            className={cn(
                                                "h-4 px-1 rounded flex items-center justify-center transition-all whitespace-nowrap",
                                                beat.duration === d ? "bg-cyan-500 text-[7px] text-black font-black" : "text-[7px] font-black text-white/20 hover:text-white/40"
                                            )}
                                        >
                                            {d === 1 && "Ćwierć"}
                                            {d === 0.5 && "8-ka"}
                                            {d === 0.25 && "16-ka"}
                                            {d === 0.125 && "32-ka"}
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
              className="w-full py-10 border-2 border-dashed border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/[0.02] rounded-3xl flex flex-col items-center justify-center gap-3 group transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 group-hover:rotate-90 transition-all duration-500">
                  <LucidePlus size={24} />
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-cyan-400 transition-all">Add New Measure</span>
                  <span className="text-[10px] font-bold text-white/10 uppercase mt-1">Append 16 more steps to your pattern</span>
              </div>
            </button>
          </section>

        </div>

        {/* Floating Shortcuts Sidebar */}
        <div className="fixed top-1/2 -translate-y-1/2 right-6 z-40 hidden xl:flex flex-col gap-4 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl">
            <div className="flex flex-col items-center gap-1 border-b border-white/5 pb-4 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Shortcuts</span>
            </div>
            
            <div className="space-y-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1">
                        <kbd className="w-[28px] h-7 flex items-center justify-center bg-white/10 rounded-lg text-[11px] font-black border border-white/10 shadow-lg shadow-black">↑</kbd>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="w-[28px] h-7 flex items-center justify-center bg-white/10 rounded-lg text-[11px] font-black border border-white/10 shadow-lg shadow-black">←</kbd>
                        <kbd className="w-[28px] h-7 flex items-center justify-center bg-white/10 rounded-lg text-[11px] font-black border border-white/10 shadow-lg shadow-black">↓</kbd>
                        <kbd className="w-[28px] h-7 flex items-center justify-center bg-white/10 rounded-lg text-[11px] font-black border border-white/10 shadow-lg shadow-black">→</kbd>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-1">Navigate</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <kbd className="px-3 h-7 flex items-center justify-center bg-white/10 rounded-lg text-[11px] font-black border border-white/10 shadow-lg shadow-black">0-9</kbd>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Fret</span>
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center gap-1">
                        <kbd className="w-8 h-8 flex items-center justify-center bg-amber-400/20 text-amber-400 rounded-lg text-[11px] font-black border border-amber-400/20 shadow-lg shadow-black">H</kbd>
                        <kbd className="w-8 h-8 flex items-center justify-center bg-red-400/20 text-red-400 rounded-lg text-[11px] font-black border border-red-400/20 shadow-lg shadow-black">P</kbd>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Legato</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <kbd className="w-8 h-8 flex items-center justify-center bg-cyan-400/20 text-cyan-400 rounded-lg text-[11px] font-black border border-cyan-400/20 shadow-lg shadow-black shadow-cyan-500/10">A</kbd>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Accent</span>
                </div>

                <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5">
                    <kbd className="px-2 h-7 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black border border-red-500/20 shadow-lg shadow-black">DEL</kbd>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Clear</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 h-7 flex items-center justify-center bg-cyan-500/10 text-cyan-400 rounded-lg text-[9px] font-black border border-cyan-500/20 shadow-lg shadow-black">CTRL+Z</kbd>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Undo</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 h-7 flex items-center justify-center bg-white/10 rounded-lg text-[10px] font-black border border-white/10 shadow-lg shadow-black">SCROLL</kbd>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Fret +/-</span>
                </div>
            </div>
      </div>
        
        <AnimatePresence>
            {toast && (
                <motion.div 
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                        "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl",
                        toast.type === 'success' ? "bg-cyan-500 text-black" : "bg-red-500 text-white"
                    )}
                >
                    <div className={cn("w-2 h-2 rounded-full", toast.type === 'success' ? "bg-black animate-pulse" : "bg-white animate-bounce")} />
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
                    className="fixed z-[110] bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 min-w-[140px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={handleCopySelection}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-xs font-black uppercase tracking-widest text-white/60 hover:text-cyan-400 flex items-center justify-between transition-all"
                    >
                        <span>Copy</span>
                        <span className="text-[10px] opacity-30">CTRL+C</span>
                    </button>
                    <button 
                        onClick={() => { handlePasteAtCursor(); setContextMenu(null); }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-xs font-black uppercase tracking-widest text-white/60 hover:text-cyan-400 flex items-center justify-between transition-all"
                    >
                        <span>Paste</span>
                        <span className="text-[10px] opacity-30">CTRL+V</span>
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    <button 
                        onClick={() => { handleCopySelection(); handleDeleteSelection(); }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-xs font-black uppercase tracking-widest text-white/60 hover:text-cyan-400 flex items-center justify-between transition-all"
                    >
                        <span>Cut</span>
                        <span className="text-[10px] opacity-30">CTRL+X</span>
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    <button 
                        onClick={handleDeleteSelection}
                        className="w-full text-left px-3 py-2 hover:bg-red-500/10 rounded-lg text-xs font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 flex items-center justify-between transition-all"
                    >
                        <span>Clear Area</span>
                        <span className="text-[10px] opacity-30">DEL</span>
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
