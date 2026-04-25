import * as alphaTab from '@coderline/alphatab';
import type { BendPoint,TablatureBeat, TablatureMeasure, TablatureNote } from 'feature/exercisePlan/types/exercise.types';

interface GpTrack {
  name: string;
  measures: TablatureMeasure[];
  trackType: 'guitar' | 'bass' | 'drums' | 'vocals';
  pan: number; // -1.0 to 1.0
}

export interface ParsedGp {
  tempo: number;
  tracks: GpTrack[];
}

// Legacy aliases
type Gp5Track = GpTrack;
type ParsedGp5 = ParsedGp;

/** Supported Guitar Pro file extensions */
export const GP_EXTENSIONS = ['.gp3', '.gp4', '.gp5', '.gpx', '.gp'] as const;
type GpExtension = typeof GP_EXTENSIONS[number];

export function isGpFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return GP_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function detectTrackType(track: any): 'guitar' | 'bass' | 'drums' | 'vocals' {
  // Name-based detection (most reliable for GP5 files)
  const name = (track.name || '').toLowerCase();
  if (/vocal|voice|wok|śpiew|sing|chant|choir|lead\s*voc|back.*voc|lyric/i.test(name)) return 'vocals';
  if (/drum|perk|perc|batterie|kit/i.test(name)) return 'drums';
  if (/\bbass\b|bas\b|basse\b/i.test(name)) return 'bass';

  // MIDI-based fallback
  const info = track.playbackInfo;
  if (info) {
    // Channel 9 (0-indexed) is the GM drum channel
    if (info.primaryChannel === 9 || info.secondaryChannel === 9) return 'drums';
    const prog = info.program ?? -1;
    // GM MIDI program numbers 52–55: Choir Aahs, Voice Oohs, Synth Voice, Orchestra Hit
    if (prog >= 52 && prog <= 55) return 'vocals';
    // GM MIDI program numbers for bass instruments: 32–39
    if (prog >= 32 && prog <= 39) return 'bass';
  }

  return 'guitar';
}

/** Parse any Guitar Pro file (GP3 / GP4 / GP5 / GPX / GP7).
 *  AlphaTab auto-detects the format from the file's binary signature.
 */
export const parseGpFile = async (file: File): Promise<ParsedGp> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const score = (alphaTab as any).importer.ScoreLoader.loadScoreFromBytes(uint8Array);

  if (!score || !score.tracks || score.tracks.length === 0) {
    throw new Error('Could not parse Guitar Pro file');
  }

  // Find tempo at the start of the score
  let tempo = 120;
  if (score.tempo && score.tempo > 0) {
    tempo = score.tempo;
  } else if (score.masterBars && score.masterBars.length > 0 && score.masterBars[0].tempo > 0) {
    tempo = score.masterBars[0].tempo;
  }

  const tracks: Gp5Track[] = [];

  // Count guitar tracks for auto-panning
  let guitarTrackCount = 0;

  score.tracks.forEach((track: any) => {
    const staff = track.staves[0];
    if (!staff) return;

    const trackType = detectTrackType(track);

    // Auto-pan guitar tracks: first guitar -0.3, second +0.3, then -0.25, +0.25 …
    let pan = 0;
    if (trackType === 'guitar') {
      pan = guitarTrackCount % 2 === 0 ? -0.3 : 0.3;
      guitarTrackCount++;
    }

    const measures: TablatureMeasure[] = [];
    let prevMasterBarIndex = -1;

    staff.bars.forEach((bar: any) => {
      const masterBar = bar.masterBar;
      const timeSignature: [number, number] = [
        masterBar.timeSignatureNumerator,
        masterBar.timeSignatureDenominator
      ];

      // ── Multi-measure rest gap fill ────────────────────────────────────────
      // Some GP formats (GPX/GP7) compress N consecutive whole-rest bars into a
      // single Bar entry in staff.bars, while creating N individual MasterBars.
      // If masterBar.index jumps by more than 1, fill the gap with whole rests.
      const currentMasterBarIndex = typeof masterBar.index === 'number' ? masterBar.index : prevMasterBarIndex + 1;
      const skippedBars = currentMasterBarIndex - (prevMasterBarIndex + 1);
      if (skippedBars > 0) {
        const gapDuration = timeSignature[0] * (4 / timeSignature[1]);
        for (let g = 0; g < skippedBars; g++) {
          measures.push({ beats: [{ notes: [], duration: gapDuration }], timeSignature });
        }
      }
      prevMasterBarIndex = currentMasterBarIndex;

      const beats: TablatureBeat[] = [];

      // Expected measure duration in quarter notes from the time signature.
      // Used as a fallback when the voice is missing or has no beats (e.g. completely
      // empty/rest bars that AlphaTab returns with an empty beats array).
      // Formula: numerator × (4 / denominator)  →  e.g. 4/4 = 4, 3/4 = 3, 6/8 = 3
      const expectedMeasureDuration =
        timeSignature[0] * (4 / timeSignature[1]);

      // Only parse the first voice (Voice 0) to avoid overlapping beats being added sequentially
      const mainVoice = bar.voices[0];
      if (mainVoice && mainVoice.beats) {
        mainVoice.beats.forEach((altBeat: any) => {
          // ── Skip grace notes ──────────────────────────────────────────────
          // Grace notes (graceType !== 0) are ornamental — AlphaTab plays them
          // before the beat without consuming measure time.  Including their
          // duration here would shift every subsequent beat forward by a fixed
          // offset (the classic "slide desync" bug).
          if (typeof altBeat.graceType === 'number' && altBeat.graceType !== 0) return;

          // ── Duration in quarter notes ─────────────────────────────────────
          // AlphaTab's Beat.displayDuration is in MIDI ticks where 960 = 1 quarter note.
          // It already includes dots, tuplets and all edge cases (DoubleWhole etc.),
          // so using it directly guarantees our cursor grid matches AlphaTab's playback grid.
          // Fallback: reconstruct from Duration enum + dots + tuplets (legacy path).
          const TICKS_PER_QUARTER = 960;
          let durationInQuarterNotes: number;

          if (typeof altBeat.displayDuration === 'number' && altBeat.displayDuration > 0) {
            // Primary: AlphaTab's own display grid — exact match with what it plays.
            durationInQuarterNotes = altBeat.displayDuration / TICKS_PER_QUARTER;
          } else {
            // Fallback: reconstruct from Duration enum + dots + tuplets.
            // Duration enum:  Whole=1, Half=2, Quarter=4, Eighth=8, …
            //   positive n → quarter_notes = 4 / n
            // Negative values are extended notes:
            //   DoubleWhole=-2 → 8 QN,  QuadrupleWhole=-4 → 16 QN
            //   formula: quarter_notes = 4 * |n|
            const durEnum = altBeat.duration;
            if (typeof durEnum === 'number' && durEnum < 0) {
              durationInQuarterNotes = 4 * Math.abs(durEnum);
            } else {
              const rawDurEnum = typeof durEnum === 'number' && durEnum > 0 ? durEnum : 4;
              durationInQuarterNotes = 4 / rawDurEnum;
            }
            const tupN = altBeat.tupletNumerator;
            const tupD = altBeat.tupletDenominator;
            if (typeof tupN === 'number' && typeof tupD === 'number' && tupN > 1 && tupD > 1) {
              durationInQuarterNotes *= (tupD / tupN);
            }
            if (altBeat.dots === 1) durationInQuarterNotes *= 1.5;
            else if (altBeat.dots === 2) durationInQuarterNotes *= 1.75;
          }

          // ── Skip tied-note destinations — they extend the previous note,
          //    not create a new one.  The beat itself still occupies time (below).
          // ── Skip rests — no audible/visual content.
          const isRestBeat = altBeat.isRest === true;

          const notes: TablatureNote[] = isRestBeat ? [] : (altBeat.notes || [])
            .filter((altNote: any) => !altNote.isTieDestination)
            .map((altNote: any) => {
            // ── Bend curve — full point-by-point automation ───────────────
            let bendCurve: BendPoint[] | undefined;
            let bendSemitones: number | undefined;
            if (altNote.bendPoints && altNote.bendPoints.length > 0) {
              // AlphaTab bend point: offset 0-60 (position), value in quarter-tones
              // 1 quarter-tone = 25 cents, so cents = value * 25
              bendCurve = (altNote.bendPoints as any[]).map((p: any) => ({
                position: p.offset / 60,   // normalise to 0.0–1.0
                cents:    p.value * 25,     // quarter-tones → cents
              }));
              // Keep peak semitones for the visual badge (max cents / 100)
              const maxCents = Math.max(...bendCurve.map(p => p.cents));
              bendSemitones = Math.round(maxCents / 100);
            }

            let isHammerOn = false;
            let isPullOff = false;
            if (altNote.hammerPullOrigin) {
              if (altNote.fret > altNote.hammerPullOrigin.fret) isHammerOn = true;
              else if (altNote.fret < altNote.hammerPullOrigin.fret) isPullOff = true;
            }

            const stringCount = staff.stringCount || 6;
            const mappedString = stringCount - altNote.string + 1;

            // For vocals: note.value holds the direct MIDI pitch (standard notation track)
            // For drums:  resolve GM MIDI note via track.percussionArticulations
            let midiNote: number | undefined;
            if (trackType === 'vocals') {
              const rawPitch = altNote.value ?? altNote.fret;
              if (typeof rawPitch === 'number' && rawPitch >= 0 && rawPitch <= 127) {
                midiNote = rawPitch;
              }
            } else if (trackType === 'drums') {
              // AlphaTab stores drum MIDI note in track.percussionArticulations[note.percussionArticulation].outputMidiNumber
              const artIdx = altNote.percussionArticulation;
              if (typeof artIdx === 'number') {
                const art = track.percussionArticulations?.[artIdx];
                if (art && typeof art.outputMidiNumber === 'number' && art.outputMidiNumber >= 25) {
                  midiNote = art.outputMidiNumber;
                }
              }
              // Fallback: some AlphaTab versions expose MIDI pitch directly on note.value
              if (!midiNote) {
                const rawVal = altNote.value ?? altNote.fret;
                if (typeof rawVal === 'number' && rawVal >= 25) {
                  midiNote = rawVal;
                }
              }
            }

            // Map AlphaTab dynamic enum (1=ppp … 8=fff) to 0.0–1.0
            const dynamics = typeof altBeat.dynamic === 'number' && altBeat.dynamic >= 1
              ? (altBeat.dynamic - 1) / 7
              : 0.8;

            // Detect pre-bend / release from curve shape
            const isPreBend = !!bendCurve && bendCurve[0]?.cents > 0;
            const isRelease = !!bendCurve && bendCurve.length > 1 &&
              bendCurve[bendCurve.length - 1].cents < (bendCurve[0]?.cents ?? 0);

            return {
              string: mappedString,
              fret: altNote.fret,
              midiNote,
              isAccented: altNote.accentuated !== 0,
              isHammerOn,
              isPullOff,
              isVibrato: altNote.vibrato !== 0,
              isTap: altNote.isLeftHandTapped,
              isBend: !!bendCurve && bendCurve.some(p => p.cents > 0),
              bendCurve,
              bendSemitones,
              isPreBend,
              isRelease,
              dynamics,
              // Extended techniques
              isDead:       altNote.isDead      ?? false,
              isGhost:      altNote.isGhost     ?? false,
              isPalmMute:   altNote.isPalmMute  ?? false,
              isLetRing:    altNote.isLetRing   ?? false,
              isStaccato:   altNote.isStaccato  ?? false,
              harmonicType: typeof altNote.harmonicType === 'number' ? altNote.harmonicType : 0,
              slideIn:      typeof altNote.slideInType  === 'number' ? altNote.slideInType  : 0,
              slideOut:     typeof altNote.slideOutType === 'number' ? altNote.slideOutType : 0,
            };
          }); // end .map — closes filter().map() chain started above

          beats.push({
            notes,
            duration: durationInQuarterNotes,
            chordName: altBeat.chord?.name || (altBeat.chordId ? "Chord" : undefined),
          });
        });
      }

      // ── Empty / all-rest measure guard ───────────────────────────────────
      // If the voice was missing, empty, or all beats are rests, collapse the
      // measure to a single whole-measure rest beat.
      // This avoids half-note / quarter-note rest fragments when Guitar Pro
      // stores e.g. two half-rests per 4/4 bar — the display should always
      // show a single whole-measure rest symbol and the timing stays correct.
      if (beats.length === 0) {
        beats.push({ notes: [], duration: expectedMeasureDuration });
      } else {
        const parsedTotal = beats.reduce((s, b) => s + b.duration, 0);
        const allRests    = beats.every(b => b.notes.length === 0);
        if (parsedTotal < expectedMeasureDuration * 0.1 || allRests) {
          // Either near-zero total (bad parse) or all rests — use full-measure rest
          beats.length = 0;
          beats.push({ notes: [], duration: expectedMeasureDuration });
        }
      }

      // ── Tempo automation ratio ────────────────────────────────────────────
      // Store fileTempo / score.tempo so the TablatureViewer cursor can compute
      // effectiveBpm = ratio * userBpm — matching AlphaTabPlayer's playbackSpeed.
      const tempoAuto = (masterBar.tempoAutomations ?? []).find((a: any) => a.type === 0);
      const tempoRatio = tempoAuto && tempo > 0
        ? (tempoAuto.value as number) / tempo
        : measures.length === 0 ? 1.0 : undefined; // bar 0 always seeds ratio=1.0

      measures.push({
        beats,
        timeSignature,
        ...(tempoRatio !== undefined ? { tempoChange: tempoRatio } : {}),
      });
    });

    tracks.push({
      name: track.name || `Track ${tracks.length + 1}`,
      measures,
      trackType,
      pan,
    });
  });

  return {
    tempo,
    tracks
  };
};

/** @deprecated Use parseGpFile instead */
const parseGp5File = parseGpFile;
