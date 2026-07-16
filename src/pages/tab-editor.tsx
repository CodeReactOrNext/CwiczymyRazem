import { Button } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { useTablatureAudio } from "feature/exercisePlan/hooks/useTablatureAudio";
import type {
  TablatureBeat,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";
import {
  beatsDurationInQuarters,
  isMeasureComplete,
  measureDurationInQuarters,
  stepsForDuration,
} from "feature/exercisePlan/utils/measureDuration";
import {
  createMeasure,
  DEFAULT_STEPS,
  DEFAULT_TIME_SIGNATURE,
  regridMeasure,
} from "feature/exercisePlan/utils/measureGrid";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import { ImportTablature } from "feature/songs/components/ImportTablature/ImportTablature";
import { AnimatePresence, motion } from "framer-motion";
import {
  LucideChevronsRight,
  LucideEraser,
  LucideFileMusic,
  LucideMinus,
  LucideMonitor,
  LucidePlay,
  LucidePlus,
  LucideRedo2,
  LucideSquare,
  LucideTrash2,
  LucideTriangleAlert,
  LucideUndo2,
  LucideVolume2,
  LucideVolumeX,
} from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";

type ArticulationType =
  | "isHammerOn"
  | "isPullOff"
  | "isAccented"
  | "isDead"
  | "isVibrato"
  | "isTap"
  | "isPalmMute";

const ARTICULATIONS: {
  type: ArticulationType;
  letter: string;
  label: string;
  activeClass: string;
}[] = [
  {
    type: "isHammerOn",
    letter: "H",
    label: "Hammer-on",
    activeClass: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40",
  },
  {
    type: "isPullOff",
    letter: "P",
    label: "Pull-off",
    activeClass: "bg-red-500/20 text-red-400 ring-1 ring-red-500/40",
  },
  {
    type: "isAccented",
    letter: "A",
    label: "Accent",
    activeClass: "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40",
  },
  {
    type: "isDead",
    letter: "D",
    label: "Dead note",
    activeClass: "bg-zinc-500/20 text-zinc-200 ring-1 ring-zinc-500/40",
  },
  {
    type: "isVibrato",
    letter: "V",
    label: "Vibrato",
    activeClass:
      "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40",
  },
  {
    type: "isTap",
    letter: "T",
    label: "Tap",
    activeClass: "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/40",
  },
  {
    type: "isPalmMute",
    letter: "M",
    label: "Palm mute",
    activeClass: "bg-amber-600/20 text-amber-500 ring-1 ring-amber-600/40",
  },
];

const QUICK_FRETS = [0, 1, 2, 3, 5, 7, 9, 12, 15, 17, 19, 22];

const DURATIONS: { value: number; short: string; label: string }[] = [
  { value: 1, short: "1/4", label: "Quarter note" },
  { value: 0.5, short: "1/8", label: "Eighth note" },
  { value: 0.25, short: "1/16", label: "Sixteenth note" },
  { value: 0.125, short: "1/32", label: "Thirty-second note" },
];

const STEP_OPTIONS: { value: number; title: string }[] = [
  { value: 8, title: "8 steps — eighth notes" },
  { value: 12, title: "12 steps — triplets" },
  { value: 16, title: "16 steps — sixteenth notes" },
  { value: 24, title: "24 steps — sextuplets" },
  { value: 32, title: "32 steps — thirty-second notes" },
];

const TIME_SIGNATURES: [number, number][] = [
  [4, 4],
  [3, 4],
  [2, 4],
  [5, 4],
  [6, 8],
  [7, 8],
];

const FRET_MAX = 24;
const HISTORY_LIMIT = 50;

// Same range the metronome offers (see Metronome/hooks/useMetronome).
const BPM_MIN = 40;
const BPM_MAX = 208;
const BPM_FALLBACK = 80;

const clampBpm = (value: number) => Math.max(BPM_MIN, Math.min(BPM_MAX, value));

// A wheel gesture fires a tick every few ms. Ticks on the same cell within this
// window collapse into a single history entry, so one flick of the wheel costs
// one undo instead of flooding the whole buffer.
const HISTORY_COALESCE_MS = 600;

/** Trims float noise from triplet grids: 3.9999999999999982 → "4". */
function formatQuarters(quarters: number): string {
  return String(Number(quarters.toFixed(2)));
}

// String 1 (top row) = high e, string 6 = low E — standard tuning labels.
const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];

// Cell geometry used by the click/drag fallback math below — keep in sync
// with the h-8/w-8 cells in the grid.
const CELL_SIZE = 32;

function NoteDurationIcon({
  duration,
  size = 14,
}: {
  duration: number;
  size?: number;
}) {
  const flags =
    duration >= 1 ? 0 : duration >= 0.5 ? 1 : duration >= 0.25 ? 2 : 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'>
      <ellipse
        cx='5.7'
        cy='12.1'
        rx='3'
        ry='2.1'
        fill='currentColor'
        transform='rotate(-20 5.7 12.1)'
      />
      <path
        d='M8.5 12.1V1.8'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
      {Array.from({ length: flags }, (_, i) => (
        <path
          key={i}
          d={`M8.5 ${1.8 + i * 2.4}c2.5 0.9 3.4 2.4 2.7 4.6`}
          stroke='currentColor'
          strokeWidth='1.2'
          strokeLinecap='round'
        />
      ))}
    </svg>
  );
}

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  hoverClass = "hover:bg-zinc-800 hover:text-zinc-100",
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
        "flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
        active ? "bg-zinc-700 text-zinc-100" : hoverClass,
      )}>
      <Icon size={14} />
    </button>
  );
}

type HistoryState = {
  entries: string[];
  idx: number;
  /** Identifies the gesture that wrote the newest entry, for coalescing. */
  lastKey: string | null;
  lastAt: number;
};

const EMPTY_HISTORY: HistoryState = {
  entries: [],
  idx: -1,
  lastKey: null,
  lastAt: 0,
};

export default function TabEditor() {
  const router = useRouter();
  const [measures, setMeasures] = useState<TablatureMeasure[]>([
    createMeasure(),
  ]);
  const [bpm, setBpm] = useState(BPM_FALLBACK);
  // Holds what's literally in the BPM field while it's being typed, so the box
  // can sit empty or half-typed ("12" on the way to "120") instead of snapping
  // to a fallback on every keystroke. Null = not editing, show `bpm`.
  const [bpmDraft, setBpmDraft] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{
    measureIdx: number;
    beatIdx: number;
    stringIdx: number;
  } | null>(null);
  const [isGpModalOpen, setIsGpModalOpen] = useState(false);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const selectionStartRef = React.useRef<{
    mIdx: number;
    bIdx: number;
    sIdx: number;
    x: number;
    y: number;
  } | null>(null);
  const [activeSelection, setActiveSelection] = useState<{
    measureIdx: number;
    startBeat: number;
    endBeat: number;
    startString: number;
    endString: number;
  } | null>(null);
  const [clipboard, setClipboard] = useState<{
    beats: TablatureBeat[];
    baseStringIdx: number;
  } | null>(null);
  const [history, setHistory] = useState<HistoryState>(EMPTY_HISTORY);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 2000);
    },
    [setToast],
  );

  // Mirrors `measures` for callers that run outside React's render cycle — the
  // native wheel listener fires faster than we re-render, so consecutive ticks
  // have to build on each other's result rather than on a stale closure.
  const measuresRef = React.useRef(measures);
  useEffect(() => {
    measuresRef.current = measures;
  }, [measures]);

  /**
   * Records a snapshot. `coalesceKey` folds a burst of edits from one gesture
   * into a single entry: repeated calls with the same key inside
   * HISTORY_COALESCE_MS overwrite the newest entry instead of appending.
   */
  const saveHistory = useCallback(
    (newMeasures: TablatureMeasure[], coalesceKey?: string) => {
      const serialized = JSON.stringify(newMeasures);
      const now = Date.now();

      setHistory((prev) => {
        if (prev.entries[prev.idx] === serialized) return prev;

        const entries = prev.entries.slice(0, prev.idx + 1);
        const canCoalesce =
          coalesceKey != null &&
          coalesceKey === prev.lastKey &&
          entries.length > 1 &&
          now - prev.lastAt < HISTORY_COALESCE_MS;

        if (canCoalesce) entries[entries.length - 1] = serialized;
        else entries.push(serialized);
        if (entries.length > HISTORY_LIMIT) entries.shift();

        return {
          entries,
          idx: entries.length - 1,
          lastKey: coalesceKey ?? null,
          lastAt: now,
        };
      });
    },
    [],
  );

  /**
   * The single write path for the tablature: state, the ref mirror and history
   * always move together, so no edit can silently skip undo.
   */
  const commit = useCallback(
    (newMeasures: TablatureMeasure[], coalesceKey?: string) => {
      measuresRef.current = newMeasures;
      setMeasures(newMeasures);
      saveHistory(newMeasures, coalesceKey);
    },
    [saveHistory],
  );

  const canUndo = history.idx > 0;
  const canRedo = history.idx < history.entries.length - 1;

  const undo = useCallback(() => {
    if (history.idx <= 0) return;
    const previous = JSON.parse(history.entries[history.idx - 1]);
    measuresRef.current = previous;
    setMeasures(previous);
    setHistory((prev) => ({ ...prev, idx: prev.idx - 1, lastKey: null }));
  }, [history]);

  const redo = useCallback(() => {
    if (history.idx >= history.entries.length - 1) return;
    const next = JSON.parse(history.entries[history.idx + 1]);
    measuresRef.current = next;
    setMeasures(next);
    setHistory((prev) => ({ ...prev, idx: prev.idx + 1, lastKey: null }));
  }, [history]);

  const editId =
    typeof router.query.edit === "string" ? router.query.edit : null;
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // On mount, restore any saved draft so navigating away and back (e.g. a
  // round-trip to the publish page) doesn't wipe the editor. Works for both
  // edit mode (draft holds the exercise's tablature) and create mode.
  useEffect(() => {
    const seed = (initial: TablatureMeasure[]) => {
      measuresRef.current = initial;
      setMeasures(initial);
      setHistory({
        entries: [JSON.stringify(initial)],
        idx: 0,
        lastKey: null,
        lastAt: 0,
      });
    };

    let restored = false;
    try {
      const raw = localStorage.getItem("tab-editor-draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          seed(parsed);
          restored = true;
        }
      }
    } catch {}
    if (!restored) seed(measures);
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
    isMuted,
  });

  const startPlayback = () => {
    setStartTime(Date.now());
    setIsPlaying(true);
  };

  const commitBpmDraft = () => {
    const parsed = parseInt(bpmDraft ?? "", 10);
    if (!Number.isNaN(parsed)) setBpm(clampBpm(parsed));
    setBpmDraft(null);
  };

  const nudgeBpm = (delta: number) => {
    setBpmDraft(null);
    setBpm((current) => clampBpm(current + delta));
  };

  const processImportText = useCallback((text: string) => {
    try {
      let cleanText = text.trim();
      if (cleanText.includes("tablature:")) {
        const startIndex = cleanText.indexOf("[");
        const endIndex = cleanText.lastIndexOf("]");
        if (startIndex !== -1 && endIndex !== -1) {
          cleanText = cleanText.substring(startIndex, endIndex + 1);
        }
      }

      if (cleanText.endsWith(",")) {
        cleanText = cleanText.slice(0, -1).trim();
      }

      const parseValue = (raw: string) => {
        return new Function(`return (${raw})`)();
      };

      const parsed = parseValue(cleanText);
      if (!Array.isArray(parsed)) return null;

      let processedMeasures: TablatureMeasure[] = [];
      const isAlreadyMeasures = parsed.length > 0 && "beats" in parsed[0];

      if (isAlreadyMeasures) {
        processedMeasures = parsed.map((m) => ({
          timeSignature: m.timeSignature || [4, 4],
          beats: (m.beats || []).map((b: any) => ({
            duration: b.duration || 0.25,
            notes: (b.notes || []).map((n: any) => ({
              string: n.string,
              fret: n.fret,
              isAccented: !!n.isAccented,
              isHammerOn: !!n.isHammerOn,
              isPullOff: !!n.isPullOff,
            })),
          })),
        }));
      } else {
        const BEATS_PER_MEASURE = 16;
        for (let i = 0; i < parsed.length; i += BEATS_PER_MEASURE) {
          const beatsInMeasure = parsed
            .slice(i, i + BEATS_PER_MEASURE)
            .map((b: any) => ({
              duration: b.duration || 0.25,
              notes: (b.notes || []).map((n: any) => ({
                string: n.string,
                fret: n.fret,
                isAccented: !!n.isAccented,
                isHammerOn: !!n.isHammerOn,
                isPullOff: !!n.isPullOff,
              })),
            }));

          while (beatsInMeasure.length < BEATS_PER_MEASURE) {
            beatsInMeasure.push({ duration: 0.25, notes: [] });
          }

          processedMeasures.push({
            timeSignature: [4, 4],
            beats: beatsInMeasure,
          });
        }
      }
      return processedMeasures;
    } catch {
      return null;
    }
  }, []);

  const handleGpImported = useCallback(
    (
      importedMeasures: TablatureMeasure[],
      fileName: string,
      tempo: number,
      trackName: string,
    ) => {
      if (!importedMeasures || importedMeasures.length === 0) {
        showToast("This track has no tablature notes.", "error");
        return;
      }
      commit(importedMeasures);
      if (tempo > 0) setBpm(Math.round(tempo));
      setSelectedCell(null);
      setActiveSelection(null);
      showToast(`Loaded "${trackName}" from ${fileName}`, "success");
    },
    [commit, showToast],
  );

  const stopPlayback = () => {
    setIsPlaying(false);
    setStartTime(null);
  };

  const addMeasure = () => {
    // Inherit the last measure's signature and grid — a 3/4 piece shouldn't
    // sprout a 4/4 bar at the end.
    const last = measures[measures.length - 1];
    commit([
      ...measures,
      createMeasure(
        last?.timeSignature ?? DEFAULT_TIME_SIGNATURE,
        last?.beats.length ?? DEFAULT_STEPS,
      ),
    ]);
  };

  const regridAt = (
    mIdx: number,
    timeSignature: [number, number],
    steps: number,
  ) => {
    commit(
      measures.map((m, i) =>
        i === mIdx ? regridMeasure(m, timeSignature, steps) : m,
      ),
    );
    if (selectedCell?.measureIdx === mIdx && selectedCell.beatIdx >= steps) {
      setSelectedCell({ ...selectedCell, beatIdx: steps - 1 });
    }
  };

  const updateMeasureSteps = (mIdx: number, steps: number) => {
    regridAt(mIdx, measures[mIdx].timeSignature, steps);
    showToast(`Measure #${mIdx + 1}: ${steps} steps`, "info");
  };

  const updateTimeSignature = (
    mIdx: number,
    timeSignature: [number, number],
  ) => {
    const current = measures[mIdx].timeSignature;
    if (current[0] === timeSignature[0] && current[1] === timeSignature[1])
      return;
    regridAt(mIdx, timeSignature, measures[mIdx].beats.length);
    showToast(
      `Measure #${mIdx + 1}: ${timeSignature[0]}/${timeSignature[1]}`,
      "info",
    );
  };

  const removeMeasure = (index: number) => {
    if (measures.length > 1) {
      commit(measures.filter((_, i) => i !== index));
      setSelectedCell(null);
      setActiveSelection(null);
    }
  };

  const clearAll = () => {
    if (confirm("Clear all measures?")) {
      commit([createMeasure()]);
      setSelectedCell(null);
      setActiveSelection(null);
    }
  };

  const updateDuration = (
    measureIdx: number,
    beatIdx: number,
    duration: number,
  ) => {
    const newMeasures = [...measures];
    newMeasures[measureIdx].beats[beatIdx].duration = duration;
    setMeasures(newMeasures);
    saveHistory(newMeasures);
  };

  /**
   * Re-grid every measure so one step equals `duration`. The step count is
   * derived per measure from its own signature, which is what keeps each bar the
   * right length — setting the duration alone (the old behaviour) turned a
   * 16-step 4/4 bar into 16 quarter notes, i.e. four bars of material.
   */
  const applyGridResolution = (duration: number) => {
    commit(
      measures.map((m) =>
        regridMeasure(
          m,
          m.timeSignature,
          stepsForDuration(m.timeSignature, duration),
        ),
      ),
    );
  };

  const updateFret = (
    measureIdx: number,
    beatIdx: number,
    stringIdx: number,
    fret: number,
  ) => {
    const string = stringIdx + 1;
    const newMeasures = [...measures];
    const beat = newMeasures[measureIdx].beats[beatIdx];
    const note = beat.notes.find((n) => n.string === string);

    if (note) {
      note.fret = Math.max(0, Math.min(24, fret));
    } else {
      beat.notes.push({ string, fret });
    }

    setMeasures(newMeasures);
  };

  const toggleEffect = (
    measureIdx: number,
    beatIdx: number,
    stringIdx: number,
    type: ArticulationType,
  ) => {
    const string = stringIdx + 1;
    const newMeasures = [...measures];
    const beat = newMeasures[measureIdx].beats[beatIdx];
    const note = beat.notes.find((n) => n.string === string);

    if (note) {
      if (type === "isHammerOn") {
        note.isHammerOn = !note.isHammerOn;
        if (note.isHammerOn) note.isPullOff = false;
      } else if (type === "isPullOff") {
        note.isPullOff = !note.isPullOff;
        if (note.isPullOff) note.isHammerOn = false;
      } else if (type === "isAccented") {
        note.isAccented = !note.isAccented;
      } else if (type === "isDead") {
        note.isDead = !note.isDead;
      } else if (type === "isVibrato") {
        note.isVibrato = !note.isVibrato;
      } else if (type === "isTap") {
        note.isTap = !note.isTap;
      } else if (type === "isPalmMute") {
        note.isPalmMute = !note.isPalmMute;
      }
    }

    setMeasures(newMeasures);
  };

  // Fret nudging with the wheel. React registers `wheel` as a passive listener
  // at the root, so an onWheel prop can never preventDefault the page scroll —
  // it has to be a native listener with { passive: false }. One listener on the
  // grid container covers every cell via event delegation.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;

    const onWheel = (e: WheelEvent) => {
      // Horizontal gesture: that's the tab strip being scrolled, not a fret nudge.
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      const cell = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-bidx]",
      );
      const measureEl = cell?.closest<HTMLElement>("[data-midx]");
      if (!cell || !measureEl) return;

      const mIdx = Number(measureEl.dataset.midx);
      const bIdx = Number(cell.dataset.bidx);
      const sIdx = Number(cell.dataset.sidx);

      const current = measuresRef.current;
      const note = current[mIdx]?.beats[bIdx]?.notes.find(
        (n) => n.string === sIdx + 1,
      );
      // Empty cell: leave the wheel alone so the page still scrolls over it.
      if (!note) return;

      const fret = Math.max(
        0,
        Math.min(FRET_MAX, note.fret + (e.deltaY < 0 ? 1 : -1)),
      );
      e.preventDefault();
      if (fret === note.fret) return;

      const next = current.map((m, i) =>
        i !== mIdx
          ? m
          : {
              ...m,
              beats: m.beats.map((b, j) =>
                j !== bIdx
                  ? b
                  : {
                      ...b,
                      notes: b.notes.map((n) =>
                        n.string === sIdx + 1 ? { ...n, fret } : n,
                      ),
                    },
              ),
            },
      );
      commit(next, `wheel:${mIdx}:${bIdx}:${sIdx}`);
    };

    grid.addEventListener("wheel", onWheel, { passive: false });
    return () => grid.removeEventListener("wheel", onWheel);
  }, [commit]);

  const clearSelectedNote = useCallback(() => {
    if (!selectedCell) return;
    const newMeasures = [...measures];
    const beat =
      newMeasures[selectedCell.measureIdx].beats[selectedCell.beatIdx];
    beat.notes = beat.notes.filter(
      (n) => n.string !== selectedCell.stringIdx + 1,
    );
    setMeasures(newMeasures);
    saveHistory(newMeasures);
  }, [selectedCell, measures, saveHistory]);

  const handlePasteAtCursor = useCallback(
    (
      rightClickCell?: {
        measureIdx: number;
        beatIdx: number;
        stringIdx: number;
      } | null,
    ) => {
      const target = rightClickCell || selectedCell;
      if (!clipboard || !target) return;

      const newMeasures = JSON.parse(JSON.stringify(measures));
      const stringOffset = target.stringIdx - clipboard.baseStringIdx;

      clipboard.beats.forEach((beat: TablatureBeat, offset: number) => {
        let tMIdx = target.measureIdx;
        let tBIdx = target.beatIdx + offset;

        while (
          tMIdx < newMeasures.length &&
          tBIdx >= newMeasures[tMIdx].beats.length
        ) {
          tBIdx -= newMeasures[tMIdx].beats.length;
          tMIdx++;
        }

        if (tMIdx < newMeasures.length) {
          const targetBeat = newMeasures[tMIdx].beats[tBIdx];
          targetBeat.duration = beat.duration;

          beat.notes.forEach((note: TablatureNote) => {
            const newString = note.string + stringOffset;
            if (newString >= 1 && newString <= 6) {
              const existingNoteIdx = targetBeat.notes.findIndex(
                (n: TablatureNote) => n.string === newString,
              );
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
    },
    [clipboard, selectedCell, measures, saveHistory, showToast],
  );

  const handleCopySelection = useCallback(() => {
    if (activeSelection) {
      const beats = measures[activeSelection.measureIdx].beats.slice(
        Math.min(activeSelection.startBeat, activeSelection.endBeat),
        Math.max(activeSelection.startBeat, activeSelection.endBeat) + 1,
      );

      const minS = Math.min(
        activeSelection.startString,
        activeSelection.endString,
      );
      const maxS = Math.max(
        activeSelection.startString,
        activeSelection.endString,
      );

      const filteredBeats = beats.map((beat: TablatureBeat) => ({
        ...beat,
        notes: beat.notes.filter(
          (n: TablatureNote) => n.string - 1 >= minS && n.string - 1 <= maxS,
        ),
      }));

      setClipboard({
        beats: JSON.parse(JSON.stringify(filteredBeats)),
        baseStringIdx: minS,
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
      const minS = Math.min(
        activeSelection.startString,
        activeSelection.endString,
      );
      const maxS = Math.max(
        activeSelection.startString,
        activeSelection.endString,
      );

      for (let b = minB; b <= maxB; b++) {
        newMeasures[activeSelection.measureIdx].beats[b].notes = newMeasures[
          activeSelection.measureIdx
        ].beats[b].notes.filter(
          (n: TablatureNote) => n.string - 1 < minS || n.string - 1 > maxS,
        );
      }
      setMeasures(newMeasures);
      saveHistory(newMeasures);
      showToast("Selection cleared", "info");
      setContextMenu(null);
    }
  }, [
    activeSelection,
    measures,
    saveHistory,
    showToast,
    setMeasures,
    setContextMenu,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isGpModalOpen) return;

      // Text fields own their keystrokes. This listener lives on window, so
      // without the guard the digits typed into BPM (or the fret box) would
      // *also* be written into the selected cell, and Backspace would wipe the
      // note instead of a character.
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      )
        return;

      // Every Ctrl/Cmd chord is handled here and nowhere else. Without this
      // gate the single-letter branches below would swallow them — Ctrl+V used
      // to toggle vibrato instead of pasting, Ctrl+A set an accent while the
      // browser selected the page, and so on for Ctrl+P/D/T.
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            return;
          case "y":
            e.preventDefault();
            redo();
            return;
          case "x":
            e.preventDefault();
            handleCopySelection();
            handleDeleteSelection();
            return;
          case "c":
            handleCopySelection();
            return;
          case "v":
            // No preventDefault: the window `paste` listener still needs the
            // event to import tablature sitting in the system clipboard.
            handlePasteAtCursor();
            return;
          default:
            // Leave the rest to the browser (Ctrl+A, Ctrl+P, Ctrl+T, …).
            return;
        }
      }

      if (e.key === "Escape") {
        setSelectedCell(null);
        setActiveSelection(null);
        setContextMenu(null);
        return;
      }

      if (!selectedCell) return;
      const { measureIdx, beatIdx, stringIdx } = selectedCell;

      if (e.key >= "0" && e.key <= "9") {
        const beat = measures[measureIdx].beats[beatIdx];
        const note = beat.notes.find((n) => n.string === stringIdx + 1);
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
            setSelectedCell({
              measureIdx: measureIdx + 1,
              beatIdx: 0,
              stringIdx,
            });
          }
        }
      } else if (e.key === "Backspace" || e.key === "Delete") {
        const newMeasures = [...measures];
        if (activeSelection) {
          const minB = Math.min(
            activeSelection.startBeat,
            activeSelection.endBeat,
          );
          const maxB = Math.max(
            activeSelection.startBeat,
            activeSelection.endBeat,
          );
          const minS = Math.min(
            activeSelection.startString,
            activeSelection.endString,
          );
          const maxS = Math.max(
            activeSelection.startString,
            activeSelection.endString,
          );
          for (let b = minB; b <= maxB; b++) {
            newMeasures[activeSelection.measureIdx].beats[b].notes =
              newMeasures[activeSelection.measureIdx].beats[b].notes.filter(
                (n: TablatureNote) =>
                  n.string - 1 < minS || n.string - 1 > maxS,
              );
          }
        } else {
          newMeasures[measureIdx].beats[beatIdx].notes = newMeasures[
            measureIdx
          ].beats[beatIdx].notes.filter(
            (n: TablatureNote) => n.string !== stringIdx + 1,
          );
        }
        setMeasures(newMeasures);
        saveHistory(newMeasures);
      } else if (
        ["h", "p", "a", "d", "v", "t", "m"].includes(e.key.toLowerCase())
      ) {
        const typeMap: Record<string, ArticulationType> = {
          h: "isHammerOn",
          p: "isPullOff",
          a: "isAccented",
          d: "isDead",
          v: "isVibrato",
          t: "isTap",
          m: "isPalmMute",
        };
        const type = typeMap[e.key.toLowerCase()];
        if (activeSelection) {
          const newMeasures = [...measures];
          const minB = Math.min(
            activeSelection.startBeat,
            activeSelection.endBeat,
          );
          const maxB = Math.max(
            activeSelection.startBeat,
            activeSelection.endBeat,
          );
          const minS = Math.min(
            activeSelection.startString,
            activeSelection.endString,
          );
          const maxS = Math.max(
            activeSelection.startString,
            activeSelection.endString,
          );
          for (let b = minB; b <= maxB; b++) {
            for (let s = minS; s <= maxS; s++) {
              const note = newMeasures[activeSelection.measureIdx].beats[
                b
              ].notes.find((n: TablatureNote) => n.string === s + 1);
              if (note) {
                if (type === "isHammerOn") {
                  note.isHammerOn = !note.isHammerOn;
                  if (note.isHammerOn) note.isPullOff = false;
                } else if (type === "isPullOff") {
                  note.isPullOff = !note.isPullOff;
                  if (note.isPullOff) note.isHammerOn = false;
                } else if (type === "isAccented")
                  note.isAccented = !note.isAccented;
                else if (type === "isDead") note.isDead = !note.isDead;
                else if (type === "isVibrato") note.isVibrato = !note.isVibrato;
                else if (type === "isTap") note.isTap = !note.isTap;
                else if (type === "isPalmMute")
                  note.isPalmMute = !note.isPalmMute;
              }
            }
          }
          setMeasures(newMeasures);
          saveHistory(newMeasures);
        } else {
          toggleEffect(measureIdx, beatIdx, stringIdx, type);
          saveHistory(measures);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextBeat = beatIdx + 1;
        if (nextBeat < measures[measureIdx].beats.length)
          setSelectedCell({ ...selectedCell, beatIdx: nextBeat });
        else if (measureIdx + 1 < measures.length)
          setSelectedCell({
            measureIdx: measureIdx + 1,
            beatIdx: 0,
            stringIdx,
          });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevBeat = beatIdx - 1;
        if (prevBeat >= 0)
          setSelectedCell({ ...selectedCell, beatIdx: prevBeat });
        else if (measureIdx > 0)
          setSelectedCell({
            measureIdx: measureIdx - 1,
            beatIdx: measures[measureIdx - 1].beats.length - 1,
            stringIdx,
          });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (stringIdx > 0)
          setSelectedCell({ ...selectedCell, stringIdx: stringIdx - 1 });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (stringIdx < 5)
          setSelectedCell({ ...selectedCell, stringIdx: stringIdx + 1 });
      }
    },
    [
      selectedCell,
      measures,
      activeSelection,
      clipboard,
      handlePasteAtCursor,
      handleCopySelection,
      handleDeleteSelection,
      showToast,
      isGpModalOpen,
      undo,
      redo,
      toggleEffect,
      updateFret,
      autoAdvance,
      setSelectedCell,
      setMeasures,
      saveHistory,
    ],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (isGpModalOpen) return;
      const text = e.clipboardData?.getData("text");
      if (text) {
        const processed = processImportText(text);
        if (processed) {
          e.preventDefault();
          const isSnippet = !text.includes("timeSignature");

          if (isSnippet && selectedCell) {
            const newMeasures = [...measures];
            const flatBeats = processed.flatMap((m) => m.beats);

            let currentM = selectedCell.measureIdx;
            let currentB = selectedCell.beatIdx;

            flatBeats.forEach((beat) => {
              if (currentM < newMeasures.length) {
                newMeasures[currentM].beats[currentB] = JSON.parse(
                  JSON.stringify(beat),
                );
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
    },
    [
      isGpModalOpen,
      saveHistory,
      selectedCell,
      measures,
      showToast,
      processImportText,
      setMeasures,
    ],
  );

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

          box.style.display = "block";
          box.style.left = `${left}px`;
          box.style.top = `${top}px`;
          box.style.width = `${width}px`;
          box.style.height = `${height}px`;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && selectionStartRef.current) {
        const {
          mIdx,
          x: startAbsoluteX,
          y: startAbsoluteY,
        } = selectionStartRef.current;
        const container = document.getElementById(`measure-grid-${mIdx}`);
        const box = document.getElementById(`selection-box-${mIdx}`);

        if (container) {
          const boxLeft = Math.min(startAbsoluteX, e.clientX);
          const boxRight = Math.max(startAbsoluteX, e.clientX);
          const boxTop = Math.min(startAbsoluteY, e.clientY);
          const boxBottom = Math.max(startAbsoluteY, e.clientY);

          let minB = measures[mIdx].beats.length,
            maxB = -1,
            minS = 6,
            maxS = -1;
          const cells = container.querySelectorAll(".group-cell");
          const BUFFER = 2;

          cells.forEach((cell: any) => {
            const cRect = cell.getBoundingClientRect();
            if (
              Math.max(boxLeft + BUFFER, cRect.left) <
                Math.min(boxRight - BUFFER, cRect.right) &&
              Math.max(boxTop + BUFFER, cRect.top) <
                Math.min(boxBottom - BUFFER, cRect.bottom)
            ) {
              const bIdx = parseInt(cell.getAttribute("data-bidx"));
              const sIdx = parseInt(cell.getAttribute("data-sidx"));
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
              endString: maxS,
            });
          } else {
            setActiveSelection(null);
          }
        }

        if (box) box.style.display = "none";
      }
      setIsDragging(false);
      selectionStartRef.current = null;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, [handleKeyDown, handlePaste, isDragging]);

  // The grid resolution only counts as "active" when every beat in the piece
  // actually sits on it. Reading measures[0].beats[0] used to light a button up
  // even after the rest of the tab had been re-gridded by hand.
  const uniformDuration = React.useMemo(() => {
    const durations = new Set(
      measures.flatMap((m) => m.beats.map((b) => b.duration)),
    );
    return durations.size === 1 ? [...durations][0] : null;
  }, [measures]);

  const incompleteMeasures = React.useMemo(
    () => measures.map((m) => !isMeasureComplete(m)),
    [measures],
  );
  const incompleteCount = incompleteMeasures.filter(Boolean).length;

  const selectedMeasure = selectedCell
    ? measures[selectedCell.measureIdx]
    : undefined;
  const selectedBeat = selectedCell
    ? measures[selectedCell.measureIdx]?.beats[selectedCell.beatIdx]
    : undefined;
  const selectedNote = selectedCell
    ? selectedBeat?.notes.find((n) => n.string === selectedCell.stringIdx + 1)
    : undefined;

  const setSelectedFret = (fret: number) => {
    if (!selectedCell) return;
    updateFret(
      selectedCell.measureIdx,
      selectedCell.beatIdx,
      selectedCell.stringIdx,
      fret,
    );
    saveHistory(measures);
  };

  const toggleSelectedArticulation = (type: ArticulationType) => {
    if (!selectedCell || !selectedNote) return;
    toggleEffect(
      selectedCell.measureIdx,
      selectedCell.beatIdx,
      selectedCell.stringIdx,
      type,
    );
    saveHistory(measures);
  };

  const cellFromPointer = (e: React.MouseEvent, mIdx: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const bIdx = Math.max(
      0,
      Math.min(measures[mIdx].beats.length - 1, Math.floor(localX / CELL_SIZE)),
    );
    const sIdx = Math.max(0, Math.min(5, Math.floor(localY / CELL_SIZE)));
    return { bIdx, sIdx };
  };

  return (
    <>
      {/* Mobile blocker */}
      <div className='fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-zinc-950 p-8 text-center md:hidden'>
        <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-900'>
          <LucideMonitor className='text-zinc-500' size={32} />
        </div>
        <div className='space-y-3'>
          <h2 className='text-xl font-black tracking-tight text-zinc-100'>
            Desktop Only
          </h2>
          <p className='max-w-xs text-sm leading-relaxed text-zinc-500'>
            Tab Editor requires a keyboard and larger screen. Please open it on
            a desktop or laptop computer.
          </p>
        </div>
      </div>

      <div className='min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-cyan-500/30'>
        <Head>
          <title>Tablature Editor | Riff Quest</title>
        </Head>

        {/* Fixed Header/Toolbar */}
        <div className='fixed left-0 right-0 top-0 z-[60] border-b border-zinc-800 bg-zinc-950/85 p-4 backdrop-blur-2xl md:px-8'>
          <div className='mx-auto flex max-w-[1700px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center gap-4'>
              <BackLink label='Back' onClick={() => router.back()} />
              <div>
                <h1 className='text-xl font-bold text-zinc-100'>Tab Editor</h1>
                <p className='text-[11px] font-bold text-zinc-500'>
                  {measures.length} measure{measures.length !== 1 ? "s" : ""} ·{" "}
                  {editId ? "Editing exercise" : "New exercise"}
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1'>
                <button
                  onClick={() => setIsGpModalOpen(true)}
                  className='flex items-center gap-2 rounded px-3 py-1.5 text-[11px] font-bold text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
                  <LucideFileMusic size={13} className='text-zinc-400' />
                  <span>Import GP</span>
                </button>
                <div className='mx-1 h-5 w-px bg-zinc-800' />
                <ToolbarIconButton
                  icon={LucideUndo2}
                  label='Undo'
                  onClick={undo}
                  disabled={!canUndo}
                />
                <ToolbarIconButton
                  icon={LucideRedo2}
                  label='Redo'
                  onClick={redo}
                  disabled={!canRedo}
                />
                <div className='mx-1 h-5 w-px bg-zinc-800' />
                <ToolbarIconButton
                  icon={LucideEraser}
                  label='Clear all measures'
                  onClick={clearAll}
                  hoverClass='hover:bg-red-500/10 hover:text-red-400'
                />
              </div>

              <div className='flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1'>
                <button
                  onClick={() => (isPlaying ? stopPlayback() : startPlayback())}
                  aria-label={isPlaying ? "Stop playback" : "Start playback"}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isPlaying
                      ? "bg-red-500 text-white"
                      : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
                  )}>
                  {isPlaying ? (
                    <LucideSquare size={13} fill='currentColor' />
                  ) : (
                    <LucidePlay
                      size={13}
                      fill='currentColor'
                      className='ml-0.5'
                    />
                  )}
                </button>
                <ToolbarIconButton
                  icon={isMuted ? LucideVolumeX : LucideVolume2}
                  label={isMuted ? "Unmute" : "Mute"}
                  onClick={() => setIsMuted(!isMuted)}
                  active={isMuted}
                  hoverClass={
                    isMuted ? "" : "hover:bg-zinc-800 hover:text-zinc-100"
                  }
                />
                <div className='mx-1 h-5 w-px bg-zinc-800' />
                <ToolbarIconButton
                  icon={LucideMinus}
                  label='Decrease tempo'
                  onClick={() => nudgeBpm(-1)}
                  disabled={bpm <= BPM_MIN}
                />
                <label
                  className='flex items-baseline gap-1 px-1'
                  title={`Tempo in beats per minute (${BPM_MIN}–${BPM_MAX})`}>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={bpmDraft ?? String(bpm)}
                    aria-label='Tempo in beats per minute'
                    onChange={(e) =>
                      setBpmDraft(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    onFocus={(e) => e.target.select()}
                    onBlur={commitBpmDraft}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        setBpmDraft(null);
                        e.currentTarget.blur();
                      }
                    }}
                    className='w-10 rounded bg-transparent text-right text-lg font-bold tabular-nums text-zinc-100 outline-none transition-colors focus-visible:bg-zinc-800/60'
                  />
                  <span className='text-[10px] font-bold text-zinc-500'>
                    BPM
                  </span>
                </label>
                <ToolbarIconButton
                  icon={LucidePlus}
                  label='Increase tempo'
                  onClick={() => nudgeBpm(1)}
                  disabled={bpm >= BPM_MAX}
                />
              </div>

              <div className='flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1'>
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => applyGridResolution(d.value)}
                    title={`Grid resolution: ${d.short} (${d.label.toLowerCase()}) — re-grids every measure and replaces the current rhythm`}
                    aria-label={`Set grid resolution to ${d.label}`}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      uniformDuration === d.value
                        ? "bg-zinc-700 text-zinc-100"
                        : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200",
                    )}>
                    <NoteDurationIcon duration={d.value} size={15} />
                  </button>
                ))}
                <div className='mx-1 h-5 w-px bg-zinc-800' />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setAutoAdvance(!autoAdvance)}
                      aria-pressed={autoAdvance}
                      className={cn(
                        "flex h-8 items-center justify-center gap-2 rounded px-2.5 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        autoAdvance
                          ? "bg-zinc-700 text-zinc-100"
                          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200",
                      )}>
                      <div
                        className={cn(
                          "h-1 w-1 rounded-full",
                          autoAdvance
                            ? "animate-pulse bg-emerald-400"
                            : "bg-zinc-600",
                        )}
                      />
                      Auto next
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom' className='max-w-[260px]'>
                    <p className='font-bold'>
                      Auto next — {autoAdvance ? "on" : "off"}
                    </p>
                    <p className='mt-1 font-normal leading-relaxed'>
                      Type a fret and the cursor jumps to the next beat on the
                      same string, so you can enter a run without arrowing
                      across. It wraps into the following measure and stops at
                      the end of the tab.
                    </p>
                    <p className='mt-1.5 font-normal leading-relaxed'>
                      Turn it off to type frets above 9: two-digit frets need
                      both digits in the same cell (1 then 2 → 12), and
                      auto-advance moves the cursor after the first one.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Button
                onClick={() => {
                  localStorage.setItem(
                    "tab-editor-draft",
                    JSON.stringify(measures),
                  );
                  router.push(
                    editId
                      ? `/tab-editor/publish?edit=${editId}`
                      : "/tab-editor/publish",
                  );
                }}
                className='gap-2 bg-zinc-100 text-zinc-900 shadow-none hover:bg-zinc-200'>
                <span>{editId ? "Save changes" : "Publish exercise"}</span>
                <LucideChevronsRight size={14} />
              </Button>
            </div>
          </div>
        </div>

        <div className='mx-auto max-w-[1700px] space-y-8 px-4 pb-24 pt-36 md:px-8 lg:pr-80'>
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
                  className='custom-scrollbar max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-8'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='space-y-2'>
                      <h3 className='text-xl font-black italic tracking-tighter text-zinc-100'>
                        Import Guitar Pro
                      </h3>
                      <p className='text-sm font-medium text-zinc-500'>
                        Drop a GP3/GP4/GP5/GPX/GP file, then pick a track to
                        load it into the editor.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsGpModalOpen(false)}
                      className='shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-bold text-zinc-300 transition-colors hover:bg-zinc-700'>
                      Done
                    </button>
                  </div>

                  <ImportTablature
                    onImported={(
                      importedMeasures,
                      fileName,
                      tempo,
                      trackName,
                    ) =>
                      handleGpImported(
                        importedMeasures,
                        fileName,
                        tempo,
                        trackName,
                      )
                    }
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Preview Section */}
          <section className='overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40'>
            <div className='flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5'>
              <div className='h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500' />
              <h2 className='text-xs font-bold text-zinc-300'>Live preview</h2>
            </div>
            <div className='relative p-4'>
              <TablatureViewer
                measures={measures}
                bpm={bpm}
                isPlaying={isPlaying}
                startTime={startTime}
                className='relative z-10 h-[280px] rounded-lg backdrop-blur-3xl'
              />
            </div>
          </section>

          {/* Editor Grid — all measures side by side in one continuous tab strip */}
          <section className='overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40'>
            <div className='flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5'>
              <h2 className='text-xs font-bold text-zinc-300'>Tablature</h2>
              <span className='text-[11px] font-semibold text-zinc-500'>
                {measures.length} measure{measures.length !== 1 ? "s" : ""}
              </span>
              {incompleteCount > 0 && (
                <span className='flex items-center gap-1.5 rounded bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-400'>
                  <LucideTriangleAlert size={11} />
                  {incompleteCount} measure{incompleteCount !== 1 ? "s" : ""}{" "}
                  {incompleteCount !== 1 ? "don't" : "doesn't"} fill{" "}
                  {incompleteCount !== 1 ? "their" : "its"} time signature
                </span>
              )}
            </div>
            <div className='p-5'>
              <div className='flex'>
                {/* String labels (standard tuning, high e on top) */}
                <div className='mr-2 flex flex-col pt-[25px]'>
                  {STRING_LABELS.map((label, sIdx) => (
                    <span
                      key={sIdx}
                      className='flex h-8 w-5 items-center justify-end pr-1 text-[10px] font-bold text-zinc-500'>
                      {label}
                    </span>
                  ))}
                </div>

                <div className='custom-scrollbar flex-1 overflow-x-auto pb-2'>
                  <div className='flex min-w-max' ref={gridRef}>
                    <div className='flex overflow-hidden rounded-lg border border-zinc-800'>
                      {measures.map((measure, mIdx) => {
                        // Group columns per beat (e.g. 16 steps in 4/4 → 4 columns per beat)
                        // so vertical separators land on musical beats, like real tab.
                        const groupSize = Math.max(
                          1,
                          Math.round(
                            measure.beats.length / measure.timeSignature[0],
                          ),
                        );
                        const isSelectedMeasure =
                          selectedCell?.measureIdx === mIdx;
                        const isIncomplete = incompleteMeasures[mIdx];
                        // Show the signature on the first bar and wherever it changes.
                        const showSignature =
                          mIdx === 0 ||
                          measures[mIdx - 1].timeSignature[0] !==
                            measure.timeSignature[0] ||
                          measures[mIdx - 1].timeSignature[1] !==
                            measure.timeSignature[1];

                        return (
                          <div
                            key={mIdx}
                            className={cn(
                              "flex flex-col",
                              mIdx > 0 && "border-l-2 border-zinc-600",
                            )}>
                            <div className='flex h-6 items-center gap-1.5 border-b border-zinc-800 bg-zinc-900/60 px-1.5'>
                              <span
                                className={cn(
                                  "text-[10px] font-bold",
                                  isSelectedMeasure
                                    ? "text-zinc-200"
                                    : "text-zinc-500",
                                )}>
                                {mIdx + 1}
                              </span>
                              {showSignature && (
                                <span className='text-[10px] font-bold text-cyan-400'>
                                  {measure.timeSignature[0]}/
                                  {measure.timeSignature[1]}
                                </span>
                              )}
                              {isIncomplete && (
                                <LucideTriangleAlert
                                  size={10}
                                  className='text-rose-400'
                                  aria-label={`Measure ${mIdx + 1} does not fill ${measure.timeSignature[0]}/${measure.timeSignature[1]}`}
                                />
                              )}
                            </div>
                            <div
                              id={`measure-grid-${mIdx}`}
                              data-midx={mIdx}
                              className='relative flex'
                              onMouseDown={(e) => {
                                if (e.button !== 0) return;
                                const target = (
                                  e.target as HTMLElement
                                ).closest(".group-cell");
                                let bIdx, sIdx;

                                if (target) {
                                  bIdx = parseInt(
                                    target.getAttribute("data-bidx") || "0",
                                  );
                                  sIdx = parseInt(
                                    target.getAttribute("data-sidx") || "0",
                                  );
                                } else {
                                  ({ bIdx, sIdx } = cellFromPointer(e, mIdx));
                                }

                                setSelectedCell({
                                  measureIdx: mIdx,
                                  beatIdx: bIdx,
                                  stringIdx: sIdx,
                                });
                                selectionStartRef.current = {
                                  mIdx,
                                  bIdx,
                                  sIdx,
                                  x: e.clientX,
                                  y: e.clientY,
                                };
                                setActiveSelection(null);
                                setIsDragging(true);
                                setContextMenu(null);
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                const target = (
                                  e.target as HTMLElement
                                ).closest(".group-cell");
                                let bIdx, sIdx;

                                if (target) {
                                  bIdx = parseInt(
                                    target.getAttribute("data-bidx") || "0",
                                  );
                                  sIdx = parseInt(
                                    target.getAttribute("data-sidx") || "0",
                                  );
                                } else {
                                  ({ bIdx, sIdx } = cellFromPointer(e, mIdx));
                                }

                                const isCellInSelection =
                                  activeSelection &&
                                  activeSelection.measureIdx === mIdx &&
                                  bIdx >=
                                    Math.min(
                                      activeSelection.startBeat,
                                      activeSelection.endBeat,
                                    ) &&
                                  bIdx <=
                                    Math.max(
                                      activeSelection.startBeat,
                                      activeSelection.endBeat,
                                    ) &&
                                  sIdx >=
                                    Math.min(
                                      activeSelection.startString,
                                      activeSelection.endString,
                                    ) &&
                                  sIdx <=
                                    Math.max(
                                      activeSelection.startString,
                                      activeSelection.endString,
                                    );

                                if (!isCellInSelection) {
                                  setSelectedCell({
                                    measureIdx: mIdx,
                                    beatIdx: bIdx,
                                    stringIdx: sIdx,
                                  });
                                  setActiveSelection(null);
                                }

                                let x = e.clientX;
                                let y = e.clientY;
                                const menuWidth = 160;
                                const menuHeight = 220;
                                if (x + menuWidth > window.innerWidth)
                                  x -= menuWidth;
                                if (y + menuHeight > window.innerHeight)
                                  y -= menuHeight;
                                setContextMenu({ x, y });
                              }}>
                              {/* Selection Rect Overlay */}
                              <div
                                id={`selection-box-${mIdx}`}
                                className='pointer-events-none absolute z-20 hidden bg-cyan-400/20 ring-1 ring-cyan-400'
                              />
                              <div className='flex'>
                                {measure.beats.map((beat, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className={cn(
                                      "flex flex-col",
                                      bIdx % groupSize === 0 &&
                                        bIdx !== 0 &&
                                        "border-l border-zinc-800",
                                    )}>
                                    {[0, 1, 2, 3, 4, 5].map((sIdx) => {
                                      const note = beat.notes.find(
                                        (n) => n.string === sIdx + 1,
                                      );
                                      const isSelected =
                                        selectedCell?.measureIdx === mIdx &&
                                        selectedCell?.beatIdx === bIdx &&
                                        selectedCell?.stringIdx === sIdx;
                                      const isInActiveSelection =
                                        !isDragging &&
                                        activeSelection?.measureIdx === mIdx &&
                                        bIdx >=
                                          Math.min(
                                            activeSelection.startBeat,
                                            activeSelection.endBeat,
                                          ) &&
                                        bIdx <=
                                          Math.max(
                                            activeSelection.startBeat,
                                            activeSelection.endBeat,
                                          ) &&
                                        sIdx >=
                                          Math.min(
                                            activeSelection.startString,
                                            activeSelection.endString,
                                          ) &&
                                        sIdx <=
                                          Math.max(
                                            activeSelection.startString,
                                            activeSelection.endString,
                                          );
                                      const isCrosshair =
                                        selectedCell?.measureIdx === mIdx &&
                                        (selectedCell?.beatIdx === bIdx ||
                                          selectedCell?.stringIdx === sIdx);

                                      return (
                                        <button
                                          key={sIdx}
                                          data-bidx={bIdx}
                                          data-sidx={sIdx}
                                          className={cn(
                                            "group-cell relative flex h-8 w-8 cursor-pointer items-center justify-center transition-colors",
                                            isSelected
                                              ? "bg-cyan-500/20"
                                              : isInActiveSelection
                                                ? "bg-cyan-500/10"
                                                : isCrosshair
                                                  ? "bg-zinc-800/40 hover:bg-zinc-800/60"
                                                  : "hover:bg-zinc-800/50",
                                          )}>
                                          {/* Tab string line running through the cell */}
                                          <div className='pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-800' />
                                          {isSelected && (
                                            <div className='pointer-events-none absolute inset-0 z-20 ring-1 ring-inset ring-cyan-500' />
                                          )}
                                          {note && (
                                            <>
                                              <span
                                                className={cn(
                                                  "relative z-10 flex min-w-[18px] items-center justify-center rounded bg-zinc-800 px-1 text-xs font-bold",
                                                  note.isDead
                                                    ? "text-zinc-400"
                                                    : "text-zinc-100",
                                                )}>
                                                {note.isDead ? "×" : note.fret}
                                              </span>
                                              {(note.isHammerOn ||
                                                note.isPullOff ||
                                                note.isTap ||
                                                note.isVibrato) && (
                                                <span className='pointer-events-none absolute right-0 top-0 z-10 flex gap-px text-[8px] font-black leading-none'>
                                                  {note.isHammerOn && (
                                                    <span className='text-amber-400'>
                                                      H
                                                    </span>
                                                  )}
                                                  {note.isPullOff && (
                                                    <span className='text-red-400'>
                                                      P
                                                    </span>
                                                  )}
                                                  {note.isTap && (
                                                    <span className='text-purple-400'>
                                                      T
                                                    </span>
                                                  )}
                                                  {note.isVibrato && (
                                                    <span className='text-emerald-400'>
                                                      ~
                                                    </span>
                                                  )}
                                                </span>
                                              )}
                                              {note.isAccented && (
                                                <div className='pointer-events-none absolute left-0.5 top-0.5 z-10 h-1 w-1 rounded-full bg-orange-400' />
                                              )}
                                              {note.isPalmMute && (
                                                <div className='pointer-events-none absolute inset-x-1.5 bottom-0.5 z-10 h-0.5 rounded-full bg-amber-500/70' />
                                              )}
                                            </>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={addMeasure}
                      title='Add measure'
                      aria-label='Add measure'
                      className='ml-3 mt-[25px] flex h-48 w-10 items-center justify-center rounded border border-dashed border-zinc-700 bg-zinc-800/40 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-200'>
                      <LucidePlus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Note Inspector — mouse-friendly fret & articulation editor for the selected cell */}
        <div className='fixed right-6 top-1/2 z-40 hidden w-72 -translate-y-1/2 flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-xl lg:flex'>
          {selectedCell ? (
            <>
              <div className='space-y-1'>
                <span className='text-xs font-bold text-zinc-200'>
                  Note Editor
                </span>
                <p className='text-[11px] font-semibold text-zinc-500'>
                  Measure {selectedCell.measureIdx + 1} · Beat{" "}
                  {selectedCell.beatIdx + 1} · String{" "}
                  {STRING_LABELS[selectedCell.stringIdx]}
                </p>
              </div>

              <div className='space-y-2 border-t border-zinc-800 pt-4'>
                <span className='text-[11px] font-semibold text-zinc-500'>
                  Fret
                </span>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() =>
                      setSelectedFret(
                        Math.max(0, (selectedNote?.fret ?? 0) - 1),
                      )
                    }
                    disabled={!selectedNote}
                    aria-label='Decrease fret'
                    className='flex h-10 w-10 items-center justify-center rounded border border-zinc-800 bg-zinc-800/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30 hover:bg-zinc-700'>
                    <LucideMinus size={16} />
                  </button>
                  <input
                    type='number'
                    min={0}
                    max={24}
                    value={selectedNote?.fret ?? ""}
                    placeholder='—'
                    onChange={(e) =>
                      setSelectedFret(
                        Math.max(
                          0,
                          Math.min(24, parseInt(e.target.value) || 0),
                        ),
                      )
                    }
                    className='h-10 w-full rounded border border-zinc-800 bg-zinc-950/60 text-center text-xl font-black text-zinc-100 outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  />
                  <button
                    onClick={() =>
                      setSelectedFret(
                        Math.min(24, (selectedNote?.fret ?? -1) + 1),
                      )
                    }
                    aria-label='Increase fret'
                    className='flex h-10 w-10 items-center justify-center rounded border border-zinc-800 bg-zinc-800/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700'>
                    <LucidePlus size={16} />
                  </button>
                </div>
                <div className='grid grid-cols-6 gap-1.5'>
                  {QUICK_FRETS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFret(f)}
                      className={cn(
                        "flex h-7 items-center justify-center rounded border text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        selectedNote?.fret === f
                          ? "border-zinc-600 bg-zinc-700 text-zinc-100"
                          : "border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                      )}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-2 border-t border-zinc-800 pt-4'>
                <span className='text-[11px] font-semibold text-zinc-500'>
                  Beat duration
                </span>
                <div className='flex gap-1.5'>
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() =>
                        updateDuration(
                          selectedCell.measureIdx,
                          selectedCell.beatIdx,
                          d.value,
                        )
                      }
                      title={`${d.label} (${d.short})`}
                      aria-label={d.label}
                      className={cn(
                        "flex h-9 flex-1 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        selectedBeat?.duration === d.value
                          ? "border-zinc-600 bg-zinc-700 text-zinc-100"
                          : "border-zinc-800 bg-zinc-800/40 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200",
                      )}>
                      <NoteDurationIcon duration={d.value} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-2 border-t border-zinc-800 pt-4'>
                <span className='text-[11px] font-semibold text-zinc-500'>
                  Articulation
                </span>
                <div className='grid grid-cols-2 gap-1.5'>
                  {ARTICULATIONS.map((a) => (
                    <button
                      key={a.type}
                      onClick={() => toggleSelectedArticulation(a.type)}
                      disabled={!selectedNote}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
                        selectedNote?.[a.type]
                          ? a.activeClass
                          : "border border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                      )}>
                      <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-950/60 text-[10px] font-black'>
                        {a.letter}
                      </span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-2 border-t border-zinc-800 pt-4'>
                <span className='text-[11px] font-semibold text-zinc-500'>
                  Time signature
                </span>
                <div className='grid grid-cols-6 gap-1'>
                  {TIME_SIGNATURES.map((ts) => (
                    <button
                      key={`${ts[0]}/${ts[1]}`}
                      onClick={() =>
                        updateTimeSignature(selectedCell.measureIdx, ts)
                      }
                      title={`${ts[0]}/${ts[1]} — re-grids measure #${selectedCell.measureIdx + 1}`}
                      className={cn(
                        "flex h-7 items-center justify-center rounded text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        selectedMeasure?.timeSignature[0] === ts[0] &&
                          selectedMeasure?.timeSignature[1] === ts[1]
                          ? "bg-zinc-700 text-zinc-100"
                          : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                      )}>
                      {ts[0]}/{ts[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-2 border-t border-zinc-800 pt-4'>
                <span className='text-[11px] font-semibold text-zinc-500'>
                  Measure steps
                </span>
                <div className='flex gap-1'>
                  {STEP_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() =>
                        updateMeasureSteps(selectedCell.measureIdx, s.value)
                      }
                      title={s.title}
                      className={cn(
                        "flex h-7 flex-1 items-center justify-center rounded border text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        measures[selectedCell.measureIdx]?.beats.length ===
                          s.value
                          ? "border-zinc-600 bg-zinc-700 text-zinc-100"
                          : "border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                      )}>
                      {s.value}
                    </button>
                  ))}
                </div>
                {selectedMeasure && !isMeasureComplete(selectedMeasure) && (
                  <p className='flex items-start gap-2 rounded bg-rose-500/10 p-2 text-[11px] font-semibold leading-relaxed text-rose-400'>
                    <LucideTriangleAlert size={13} className='mt-px shrink-0' />
                    <span>
                      Beats add up to{" "}
                      {formatQuarters(
                        beatsDurationInQuarters(selectedMeasure.beats),
                      )}{" "}
                      of the{" "}
                      {formatQuarters(
                        measureDurationInQuarters(
                          selectedMeasure.timeSignature,
                        ),
                      )}{" "}
                      quarter notes in {selectedMeasure.timeSignature[0]}/
                      {selectedMeasure.timeSignature[1]}. Pick a step count to
                      re-grid it.
                    </span>
                  </p>
                )}
              </div>

              <div className='flex gap-1.5 border-t border-zinc-800 pt-4'>
                <button
                  onClick={clearSelectedNote}
                  disabled={!selectedNote}
                  className='flex flex-1 items-center justify-center gap-2 rounded border border-red-500/20 bg-red-500/10 py-2 text-[11px] font-bold text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30 hover:bg-red-500/20'>
                  <LucideEraser size={13} />
                  Clear note
                </button>
                <button
                  onClick={() => removeMeasure(selectedCell.measureIdx)}
                  disabled={measures.length === 1}
                  className='flex flex-1 items-center justify-center gap-2 rounded border border-red-500/20 bg-red-500/10 py-2 text-[11px] font-bold text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30 hover:bg-red-500/20'>
                  <LucideTrash2 size={13} />
                  Delete measure
                </button>
              </div>
            </>
          ) : (
            <>
              <div className='space-y-1'>
                <span className='text-xs font-bold text-zinc-200'>
                  Note Editor
                </span>
                <p className='text-[11px] font-semibold leading-relaxed text-zinc-500'>
                  Click a cell in the grid to set its fret, duration and
                  articulations here.
                </p>
              </div>
              <div className='space-y-3 text-[11px] font-semibold text-zinc-500'>
                <div className='flex items-center justify-between'>
                  <span>Navigate</span>
                  <span className='text-zinc-300'>↑ ↓ ← →</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Set fret</span>
                  <span className='text-zinc-300'>0–9</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Fret +/-</span>
                  <span className='text-zinc-300'>Scroll</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Articulations</span>
                  <span className='text-zinc-300'>H P A D V T M</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Clear note</span>
                  <span className='text-zinc-300'>Del</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Copy / Paste</span>
                  <span className='text-zinc-300'>Ctrl+C / Ctrl+V</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Undo / Redo</span>
                  <span className='text-zinc-300'>Ctrl+Z / Ctrl+Y</span>
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
                "fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-lg px-6 py-3 text-xs font-bold backdrop-blur-xl",
                toast.type === "success"
                  ? "bg-emerald-500 text-zinc-950"
                  : toast.type === "error"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-800 text-zinc-100",
              )}>
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
              className='fixed z-[110] min-w-[140px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-1'
              onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleCopySelection}
                className='flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
                <span>Copy</span>
                <span className='text-[10px] text-zinc-500'>Ctrl+C</span>
              </button>
              <button
                onClick={() => {
                  handlePasteAtCursor();
                  setContextMenu(null);
                }}
                className='flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
                <span>Paste</span>
                <span className='text-[10px] text-zinc-500'>Ctrl+V</span>
              </button>
              <button
                onClick={() => {
                  handleCopySelection();
                  handleDeleteSelection();
                }}
                className='flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
                <span>Cut</span>
                <span className='text-[10px] text-zinc-500'>Ctrl+X</span>
              </button>
              <button
                onClick={handleDeleteSelection}
                className='flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10'>
                <span>Clear Area</span>
                <span className='text-[10px] opacity-60'>Del</span>
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
