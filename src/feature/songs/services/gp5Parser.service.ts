import * as alphaTab from '@coderline/alphatab';
import type { BendPoint,TablatureBeat, TablatureMeasure, TablatureNote } from 'feature/exercisePlan/types/exercise.types';

interface GpTrack {
  name: string;
  measures: TablatureMeasure[];
  trackType: 'guitar' | 'bass' | 'drums' | 'vocals';
  pan: number; // -1.0 to 1.0
  /** Strings on the track's instrument — 4 for most basses, 7 for a seven-string. */
  stringCount: number;
  /** MIDI note of each open string as the file tunes it, string 1 (the highest) first.
   *  Absent on drums and vocals, and when the file doesn't say. */
  openStringMidi?: number[];
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

/** What a decoder leaves where the bytes weren't valid in its encoding. */
const UNDECODABLE = '�';

/**
 * Guitar Pro 3–5 store text in the author's Windows code page, not UTF-8, so
 * AlphaTab's default UTF-8 turns a Nordic "Spår" into "Sp�r". When the names
 * come out like that, the file is read again as Windows-1252.
 */
function loadScore(bytes: Uint8Array): any {
  const loader = (alphaTab as any).importer.ScoreLoader;
  const score = loader.loadScoreFromBytes(bytes);
  const names: unknown[] = [score?.title, score?.artist, ...(score?.tracks ?? []).map((t: any) => t.name)];
  if (!names.some(name => typeof name === 'string' && name.includes(UNDECODABLE))) return score;

  const settings = new alphaTab.Settings();
  settings.importer.encoding = 'windows-1252';
  return loader.loadScoreFromBytes(bytes, settings);
}

const TICKS_PER_QUARTER = 960;

/** One bar as it comes up in playback: which written bar, and the tempo over it. */
interface PlayedBar {
  /** Index of the written bar (the score's master bar). */
  index: number;
  /** Tempo in force over the bar: `at` in quarter notes from its start, in BPM. */
  tempo: { at: number; bpm: number }[];
}

const quartersIn = (masterBar: any): number => {
  const ticks = typeof masterBar?.calculateDuration === 'function' ? masterBar.calculateDuration() : 0;
  if (ticks > 0) return ticks / TICKS_PER_QUARTER;
  return (masterBar?.timeSignatureNumerator ?? 4) * (4 / (masterBar?.timeSignatureDenominator ?? 4));
};

/** The bars as written, start to end — what is left when AlphaTab can't say how it plays them. */
function writtenOrder(score: any): PlayedBar[] {
  let bpm: number = score.tempo > 0 ? score.tempo : 120;
  return (score.masterBars ?? []).map((masterBar: any, i: number): PlayedBar => {
    const length = quartersIn(masterBar);
    const automations: any[] = (masterBar.tempoAutomations ?? []).filter((a: any) => a.type === 0 && a.value > 0);
    const tempo = automations.map(a => ({ at: (a.ratioPosition ?? 0) * length, bpm: a.value as number }));
    if (tempo.length === 0 || tempo[0].at > 0) tempo.unshift({ at: 0, bpm });
    bpm = tempo[tempo.length - 1].bpm;
    return { index: typeof masterBar.index === 'number' ? masterBar.index : i, tempo };
  });
}

const ignore = () => {};
/** A MIDI handler that keeps nothing: only the generator's bar lookup is wanted. */
const SILENT_MIDI_HANDLER = {
  addTimeSignature: ignore, addRest: ignore, addNote: ignore, addControlChange: ignore,
  addProgramChange: ignore, addTempo: ignore, addBend: ignore, addNoteBend: ignore,
  finishTrack: ignore, addTickShift: ignore,
};

/**
 * The bars in the order they sound. The audio of a Guitar Pro file is AlphaTab's
 * own synthesizer, which plays repeats, alternate endings and D.S./coda jumps and
 * follows every tempo change, including the ones in the middle of a bar. The tab
 * has to be laid out the same way or it runs ahead of the music from the first
 * repeat on — so the order is taken from the very generator the player uses.
 */
function playbackOrder(score: any): PlayedBar[] {
  try {
    const Generator = (alphaTab as any).midi?.MidiFileGenerator;
    if (Generator) {
      const generator = new Generator(score, null, SILENT_MIDI_HANDLER);
      generator.generate();
      const played: PlayedBar[] = (generator.tickLookup?.masterBars ?? []).map((lookup: any) => ({
        index: lookup.masterBar.index,
        tempo: (lookup.tempoChanges ?? []).map((change: any) => ({
          at: (change.tick - lookup.start) / TICKS_PER_QUARTER,
          bpm: change.tempo,
        })),
      }));
      if (played.length > 0) return played;
    }
  } catch { /* fall through to the written order */ }
  return writtenOrder(score);
}

/** The tempo fields each played bar carries, as ratios of the score's tempo. */
function tempoFields(played: PlayedBar[], baseTempo: number): Pick<TablatureMeasure, 'tempoChange' | 'tempoShifts'>[] {
  let running = baseTempo;
  // The first bar always states its tempo, and so does the bar after one whose
  // tempo moved inside it: readers that only know `tempoChange` then go wrong
  // for that one bar at most.
  let restate = true;
  return played.map(bar => {
    const points = bar.tempo.filter(p => p.bpm > 0).sort((a, b) => a.at - b.at);
    const opening = points.filter(p => p.at <= 0).pop();
    const inside = points.filter(p => p.at > 0);
    const startBpm = opening ? opening.bpm : running;

    const fields: Pick<TablatureMeasure, 'tempoChange' | 'tempoShifts'> = {};
    if (restate || startBpm !== running) fields.tempoChange = startBpm / baseTempo;
    if (inside.length > 0) fields.tempoShifts = inside.map(p => ({ at: p.at, ratio: p.bpm / baseTempo }));

    restate = inside.length > 0;
    running = inside.length > 0 ? inside[inside.length - 1].bpm : startBpm;
    return fields;
  });
}

/**
 * The section that starts on each played bar, if one does. A Guitar Pro file
 * marks them on the written bar ("Intro", "[Chorus]", "Solo"), so a repeat that
 * goes back to a marked bar would announce the same section again: a marker is
 * only taken when it is not the one the song is already in.
 */
function sectionStarts(played: PlayedBar[], masterBars: any[]): (string | undefined)[] {
  let current = -1;
  return played.map(bar => {
    const marker = masterBars[bar.index]?.section;
    const raw: unknown = marker?.text || marker?.marker;
    if (typeof raw !== 'string') return undefined;
    // Tabbers often write the name in brackets; the brackets add nothing here.
    const name = raw.trim().replace(/^\[(.*)\]$/, '$1').trim();
    if (!name || bar.index === current) return undefined;
    current = bar.index;
    return name;
  });
}

/** Parse any Guitar Pro file (GP3 / GP4 / GP5 / GPX / GP7).
 *  AlphaTab auto-detects the format from the file's binary signature.
 */
export const parseGpFile = async (file: File): Promise<ParsedGp> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const score = loadScore(uint8Array);

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

  // Worked out once for the whole score: every track plays the same bars.
  const played = playbackOrder(score);
  const playedTempo = tempoFields(played, tempo);
  const masterBars: any[] = score.masterBars ?? [];
  const playedSections = sectionStarts(played, masterBars);
  // A score with repeats or jumps is stored as it is played, so each bar also
  // says where it is written (the notation view still shows the page as written).
  const isUnfolded = played.length !== masterBars.length || played.some((bar, i) => bar.index !== i);

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

    // The tuning the track is written in. AlphaTab lists the staff's open strings
    // top line first, which is our string 1 — the same order the notes are mapped in.
    const staffTuning: unknown = staff.tuning;
    const openStringMidi = (trackType === 'guitar' || trackType === 'bass')
      && Array.isArray(staffTuning) && staffTuning.length > 0
      && staffTuning.every((midi): midi is number => typeof midi === 'number')
      ? [...staffTuning]
      : undefined;

    // The track's bars as written, by master bar index. Some GP formats (GPX/GP7)
    // compress N consecutive whole-rest bars into a single Bar entry in staff.bars
    // while creating N individual MasterBars, so an index can be missing here —
    // those come out as whole rests when the bars are laid out below.
    const written = new Map<number, Pick<TablatureMeasure, 'beats' | 'timeSignature'>>();
    let prevMasterBarIndex = -1;

    staff.bars.forEach((bar: any) => {
      const masterBar = bar.masterBar;
      const timeSignature: [number, number] = [
        masterBar.timeSignatureNumerator,
        masterBar.timeSignatureDenominator
      ];

      const currentMasterBarIndex = typeof masterBar.index === 'number' ? masterBar.index : prevMasterBarIndex + 1;
      prevMasterBarIndex = currentMasterBarIndex;

      const beats: TablatureBeat[] = [];

      // How long AlphaTab plays the bar for, in quarter notes: the time signature
      // (4/4 = 4, 3/4 = 3, 6/8 = 3), or what a pickup bar actually holds.
      // Used when the voice is missing or has no beats (e.g. completely
      // empty/rest bars that AlphaTab returns with an empty beats array).
      const expectedMeasureDuration = quartersIn(masterBar);

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
              // AlphaTab bend point: offset is 0..60 across the note. `value` is in half-semitone
              // (50 cents) units — confirmed against MidiFileGenerator.getPitchWheel, which derives
              // the actual playback pitch shift as `value / 2` semitones (see tablatureToAlphaTex.ts
              // for the matching export-direction conversion).
              bendCurve = (altNote.bendPoints as any[]).map((p: any) => ({
                position: p.offset / 60,   // normalise to 0.0–1.0
                cents:    p.value * 50,     // half-semitones → cents
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
              // Fallback: some AlphaTab versions expose the key directly, on `value`
              // for a percussion stave and on `fret` for older files. Both get tried:
              // `value ?? fret` stops at a `value` of 0 and never reaches the `fret`
              // that actually held the key, which left every hit unresolved and piled
              // onto a single row of the drum lane.
              if (!midiNote) {
                // A drum tab's line index is a small number and the GM percussion map
                // starts at 27, so anything from there up can only be a key.
                midiNote = [altNote.value, altNote.fret].find(
                  (candidate: unknown): candidate is number =>
                    typeof candidate === 'number' && candidate >= 27 && candidate <= 127,
                );
              }
            } else {
              // Guitar / bass — real sounding pitch from the track's actual tuning.
              // Without this, scoring falls back to standard tuning and expects the
              // wrong pitch on Drop C/D, 7-string, capo, etc. (tab shows fret 5 but
              // the scorer wants the standard-tuning pitch of fret 5).
              // stringTuning is AlphaTab's open-string MIDI for this note's string;
              // fall back to the staff tuning array (top line = highest string).
              const openMidi = typeof altNote.stringTuning === 'number'
                ? altNote.stringTuning
                : staff.tuning?.[stringCount - altNote.string];
              if (typeof openMidi === 'number' && typeof altNote.fret === 'number') {
                midiNote = openMidi + altNote.fret;
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

          // AlphaTab PickStroke enum: 0 = None, 1 = Up, 2 = Down.
          const pickStroke = altBeat.pickStroke === 1 ? 'up'
            : altBeat.pickStroke === 2 ? 'down'
            : undefined;

          beats.push({
            notes,
            duration: durationInQuarterNotes,
            chordName: altBeat.chord?.name || (altBeat.chordId ? "Chord" : undefined),
            ...(pickStroke ? { pickStroke } : {}),
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

      written.set(currentMasterBarIndex, { beats, timeSignature });
    });

    // ── Lay the bars out as they are played ─────────────────────────────────
    // Tempo is stored as fileTempo / score.tempo so the TablatureViewer cursor can
    // compute effectiveBpm = ratio * userBpm — matching AlphaTabPlayer's playbackSpeed.
    const timesPlayed = new Map<number, number>();
    const measures: TablatureMeasure[] = played.map((playedBar, i) => {
      const masterBar = masterBars[playedBar.index];
      const source = written.get(playedBar.index) ?? {
        beats: [{ notes: [], duration: quartersIn(masterBar) }],
        timeSignature: [
          masterBar?.timeSignatureNumerator ?? 4,
          masterBar?.timeSignatureDenominator ?? 4,
        ] as [number, number],
      };

      // A bar that comes round again gets its own copy: each pass is scored and
      // drawn as a bar of its own.
      const occurrence = timesPlayed.get(playedBar.index) ?? 0;
      timesPlayed.set(playedBar.index, occurrence + 1);
      const beats = occurrence === 0
        ? source.beats
        : source.beats.map(beat => ({ ...beat, notes: beat.notes.map(note => ({ ...note })) }));

      return {
        beats,
        timeSignature: source.timeSignature,
        ...playedTempo[i],
        ...(playedSections[i] ? { section: playedSections[i] } : {}),
        ...(isUnfolded && typeof masterBar?.start === 'number'
          ? { scoreBeat: masterBar.start / TICKS_PER_QUARTER }
          : {}),
      };
    });

    tracks.push({
      name: track.name || `Track ${tracks.length + 1}`,
      measures,
      trackType,
      pan,
      stringCount: staff.stringCount || 6,
      ...(openStringMidi && { openStringMidi }),
    });
  });

  return {
    tempo,
    tracks
  };
};

/** @deprecated Use parseGpFile instead */
const parseGp5File = parseGpFile;
