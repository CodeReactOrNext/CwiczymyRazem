import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { useMemo } from "react";

export const STRING_SPACING = 32;
export const NOTE_RADIUS    = 11;
export const STAFF_TOP      = 85;
export const STRING_COLORS  = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"] as const;

export interface NoteRD {
  noteKey: string;
  noteY: number;
  fret: number;
  color: string;
  isAccented?: boolean;
  isHammerOn?: boolean;
  isPullOff?: boolean;
  isBend?: boolean;
  bendSemitones?: number;
  isPreBend?: boolean;
  isRelease?: boolean;
  isVibrato?: boolean;
  isTap?: boolean;
  dynamics?: number;
  isDead?: boolean;
  isGhost?: boolean;
  isPalmMute?: boolean;
  isLetRing?: boolean;
  isStaccato?: boolean;
  harmonicType?: number;
  slideIn?: number;
  slideOut?: number;
}

export interface BeatRD {
  offsetX: number;
  duration: number;
  topNoteY: number;
  chordName?: string;
  beamRight: boolean;
  beamRight2: boolean;
  prevBeamRight: boolean;
  prevBeamRight2: boolean;
  notes: NoteRD[];
  isRest: boolean;
  tuplet?: number;
}

export interface TimeSigMarker { x: number; sig: [number, number]; }
export interface TupletGroup   { x1: number; x2: number; num: number; }
export interface TempoPoint    { beatPos: number; ratio: number; }

export interface TablatureRenderData {
  totalBeats: number;
  renderBeats: BeatRD[];
  measureEndXs: number[];
  timeSigMarkers: TimeSigMarker[];
  tupletGroups: TupletGroup[];
  tempoMap: TempoPoint[];
  hasAccentedNotes: boolean;
  hasDynamics: boolean;
}

const EMPTY: TablatureRenderData = {
  totalBeats: 1, renderBeats: [], measureEndXs: [],
  timeSigMarkers: [], tupletGroups: [], tempoMap: [],
  hasAccentedNotes: false, hasDynamics: false,
};

export function useTablatureRenderData(measures: TablatureMeasure[] | undefined): TablatureRenderData {
  return useMemo(() => {
    if (!measures) return EMPTY;

    let currentX = 0;
    const renderBeats: BeatRD[]       = [];
    const measureEndXs: number[]       = [];
    const timeSigMarkers: TimeSigMarker[] = [];
    const tupletGroups: TupletGroup[]  = [];
    let hasAccents = false, hasDyn = false;
    let prevSig: [number, number] | null = null;
    let activeTuplet: { num: number; x1: number; x2: number } | null = null;

    measures.forEach((measure, mIdx) => {
      const sig = measure.timeSignature;
      if (!prevSig || prevSig[0] !== sig[0] || prevSig[1] !== sig[1]) {
        timeSigMarkers.push({ x: currentX, sig });
        prevSig = sig;
      }

      measure.beats.forEach((beat, bIdx) => {
        const next        = measure.beats[bIdx + 1];
        const beatStartX  = currentX;

        const notes: NoteRD[] = beat.notes.map((note, nIdx) => {
          if (note.isAccented)             hasAccents = true;
          if (note.dynamics !== undefined) hasDyn     = true;
          return {
            noteKey:       `${mIdx}-${bIdx}-${nIdx}`,
            noteY:         STAFF_TOP + (note.string - 1) * STRING_SPACING,
            fret:          note.fret,
            color:         STRING_COLORS[note.string - 1] ?? "#ffffff",
            isAccented:    note.isAccented,
            isHammerOn:    note.isHammerOn,
            isPullOff:     note.isPullOff,
            isBend:        note.isBend,
            bendSemitones: note.bendSemitones,
            isPreBend:     note.isPreBend,
            isRelease:     note.isRelease,
            isVibrato:     note.isVibrato,
            isTap:         note.isTap,
            dynamics:      note.dynamics,
            isDead:        note.isDead,
            isGhost:       note.isGhost,
            isPalmMute:    note.isPalmMute,
            isLetRing:     note.isLetRing,
            isStaccato:    note.isStaccato,
            harmonicType:  note.harmonicType,
            slideIn:       note.slideIn,
            slideOut:      note.slideOut,
          };
        });

        const topString = beat.notes.length > 0 ? Math.min(...beat.notes.map(n => n.string)) : 1;
        renderBeats.push({
          offsetX:        currentX,
          duration:       beat.duration,
          topNoteY:       STAFF_TOP + (topString - 1) * STRING_SPACING,
          chordName:      beat.chordName,
          beamRight:      beat.duration <= 0.5  && !!next && next.duration <= 0.5,
          beamRight2:     beat.duration <= 0.25 && !!next && next.duration <= 0.25,
          prevBeamRight:  false,
          prevBeamRight2: false,
          notes,
          isRest: beat.notes.length === 0,
          tuplet: beat.tuplet,
        });
        currentX += beat.duration;

        const tupNum = beat.tuplet ?? null;
        if (tupNum !== null) {
          if (!activeTuplet || activeTuplet.num !== tupNum) {
            if (activeTuplet) tupletGroups.push({ ...activeTuplet });
            activeTuplet = { num: tupNum, x1: beatStartX, x2: currentX };
          } else {
            activeTuplet.x2 = currentX;
          }
        } else if (activeTuplet) {
          tupletGroups.push({ ...activeTuplet });
          activeTuplet = null;
        }
      });

      if (activeTuplet) { tupletGroups.push({ ...activeTuplet }); activeTuplet = null; }
      measureEndXs.push(currentX);
    });

    for (let i = 1; i < renderBeats.length; i++) {
      renderBeats[i].prevBeamRight  = renderBeats[i - 1].beamRight;
      renderBeats[i].prevBeamRight2 = renderBeats[i - 1].beamRight2;
    }

    const tempoMap: TempoPoint[] = [];
    let posX = 0;
    measures.forEach(m => {
      if (m.tempoChange !== undefined) tempoMap.push({ beatPos: posX, ratio: m.tempoChange });
      posX += m.beats.reduce((s, b) => s + b.duration, 0);
    });

    return { totalBeats: currentX, renderBeats, measureEndXs, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes: hasAccents, hasDynamics: hasDyn };
  }, [measures]);
}
