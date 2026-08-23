import { cn } from "assets/lib/utils";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import {
  AudioLines,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Hand,
  Keyboard,
  LocateFixed,
  Maximize2,
  Minus,
  MoveHorizontal,
  Pause,
  Play,
  Plus,
  Square,
  Target,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";
import { useTimelineView } from "../hooks/useTimelineView";
import { PEAKS_PER_SECOND, useWaveformPeaks } from "../hooks/useWaveformPeaks";
import type { TabSourceMeasure } from "../utils/alignment";
import { sessionBeats } from "../utils/backingSync";
import { blendForDisplay } from "../utils/peakBuilder";
import { withAnchorAt } from "../utils/tempoMap";
import { AlignmentGrid } from "./AlignmentGrid";
import { AlignmentOverview } from "./AlignmentOverview";
import { MixerMenu } from "./MixerMenu";
import { StemLane, TRACK_HEADER_WIDTH } from "./StemLane";
import { SyncDriftReadout } from "./SyncDriftReadout";
import { TabLane } from "./TabLane";
import { TempoAnchorPopover } from "./TempoAnchorPopover";
import { TimelineClock } from "./TimelineClock";
import { TimelineRuler } from "./TimelineRuler";
import type { MixerTrack } from "./TrackMixer";

const NUDGE_MS = 20;
const NUDGE_COARSE_FACTOR = 5;

/** One press of the tempo steppers. Fine enough to chase a band by hundredths. */
const BPM_STEP = 0.01;
const BPM_STEP_COARSE = 0.1;

const LANE_HEIGHT_PX = 84;

/** Six strings with readable fret numbers between them need real room — at the
 *  old 64px the digits would have been touching their neighbours' strings. */
const TAB_LANE_HEIGHT_PX = 112;
const OVERVIEW_HEIGHT_PX = 60;
/** Tall enough for a tempo chip above a bar number without either crowding. */
const RULER_ROW_HEIGHT_PX = 52;

/** What a plain drag across a lane does. The middle button always pans. */
type DragMode = "pan" | "stems";

/**
 * Structural rules, in one place so they stay one weight and one colour.
 *
 * The project's style guide separates with space rather than lines, and that is
 * right for cards in a feed. A timeline is a different animal: the lines *are*
 * the instrument — they say where one track stops and the next begins, and
 * where the headers stop and the recording starts. Owner-approved exception,
 * deliberately kept to structure only, never a frame around anything.
 */
const RULE = "border-zinc-800";

const button =
  "flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-zinc-100";
const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40 disabled:hover:bg-zinc-800/60";
/** Section captions. Sentence case and readable — never the 10px caps of a DAW. */
const panelLabel = "text-xs font-semibold text-zinc-400";

/**
 * A row of related buttons sharing one recess, so they read as one control
 * rather than as loose buttons that happen to be neighbours.
 */
const segment = "flex items-center gap-1 rounded-lg bg-zinc-950/60 p-1";
const segmentButton =
  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const segmentOn = "bg-cyan-500/10 text-cyan-400";
const segmentOff = "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200";
/** A fact about the recording, not a button — so it never looks pressable. */
const chip = "rounded-full px-2.5 py-1 text-xs font-medium";

/**
 * One cluster of the toolbar: what it is called, then the controls it owns.
 *
 * Everything used to sit in a single undivided row, so nothing said which
 * control belonged with which — the zoom presets looked like siblings of the
 * follow toggle. Naming the group *beside* its controls only half-fixed it: the
 * caption fell into the same line as the readings and the row still read as one
 * long sentence ("Drag Move view Move audio At 0:00"). The name belongs on its
 * own line above, where it is a heading rather than another word in the row.
 */
function ToolGroup({
  label,
  hint,
  children,
}: {
  label: string;
  /** The thing about this group nobody would guess. Kept to a short phrase. */
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col justify-center gap-1.5 rounded-xl bg-zinc-900/70 px-3.5 py-2'>
      <span className='flex items-baseline gap-2 text-[11px] leading-none'>
        <span className='font-semibold text-zinc-400'>{label}</span>
        {hint && <span className='text-zinc-500'>{hint}</span>}
      </span>
      <div className='flex items-center gap-2'>{children}</div>
    </div>
  );
}

/** A number the player is actually reading off the screen. */
const readout = "text-sm font-semibold tabular-nums text-zinc-100";
/** A keyboard shortcut, printed on the button it triggers rather than in a
 *  sentence underneath where nobody connects the two. */
const keyCap =
  "rounded bg-zinc-950/70 px-1.5 text-xs font-semibold leading-5 text-zinc-300";

/** Kept in step with BPM_PER_PX in TimelineRuler, purely for the hint text. */
const BPM_PER_PX_LABEL = "0.05 BPM";

/** 4 → "4s", 0.5 → "0.5s". Whole numbers stay whole. */
const formatWindow = (sec: number) =>
  `${Number(sec.toFixed(sec < 1 ? 2 : 1))}s`;

interface AlignmentScreenProps {
  controller: BackingTrackController;
  beatsPerBar: number;
  /** The exercise's tablature, drawn as real tab on the timeline. */
  measures?: TabSourceMeasure[];
  /** The Guitar Pro instruments whose levels the tablature header controls. */
  mixerTracks?: MixerTrack[];
  onMixerChange?: (
    id: string,
    next: { volume?: number; isMuted?: boolean },
  ) => void;
  /** The session's transport. Aligning means listening, so it belongs here. */
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  /** Clicking the tab lane plays from that beat. */
  onSeekToBeat?: (beat: number) => void;
  /**
   * Moves the session's tempo.
   *
   * Setting the recording's tempo here has to move the session's with it: the
   * two are a ratio, and changing only one would re-pitch the recording. Naming
   * what the song runs at is not the same as asking to hear it slower — that is
   * what the session's own speed control is for.
   */
  onSessionBpmChange?: (bpm: number) => void;
  /**
   * Every control the backing track has — source, files, tempo, levels.
   *
   * Passed in rather than built here because the bar owns their state and their
   * player: the YouTube iframe has to stay mounted whether this screen is open
   * or shut, so only the controls travel.
   */
  setup?: React.ReactNode;
  onClose: () => void;
}

/**
 * Full-screen alignment editor built the way a DAW is: track headers down the
 * left, one shared timeline beside them, the whole recording mapped above, and
 * the transport pinned to the bottom.
 *
 * The session keeps playing behind it, so every adjustment is heard at once.
 *
 * Two things this screen has to get right that a static mock never shows. First,
 * moving around: a drag used to mean only "shift the audio", which left the
 * overview map as the sole way to look elsewhere — so the toolbar now names what
 * a drag does, and wheel, middle-drag and an explicit follow toggle work
 * everywhere. Second, legibility: the lanes carry numbers you are reading while
 * listening, so they are set at a size and contrast you can actually read rather
 * than the tiny grey capitals this kind of tool usually gets.
 */
export function AlignmentScreen({
  controller,
  beatsPerBar,
  measures,
  mixerTracks,
  onMixerChange,
  isPlaying,
  onTogglePlay,
  onSeekToBeat,
  onSessionBpmChange,
  setup,
  onClose,
}: AlignmentScreenProps) {
  // The desktop title bar is fixed at the very top with the maximum z-index, so
  // it sits over this screen however high it stacks. Content has to start below
  // it or the heading is cut in half — the same allowance every full-screen view
  // in the app makes.
  const { isElectron } = useElectronWindowControls();
  const {
    source,
    stems,
    setStem,
    soloStem,
    removeStem,
    library,
    youtubeVideoId,
    alignment,
    setAlignment,
    tempoMap,
    desktopAvailable,
    importDroppedFiles,
    isImporting,
    youtubeWaveform: ytWaveform,
    driftMsRef,
    stemUrls,
    startTime,
    effectiveBpm,
    scoreClockRef,
    getResumeBeat,
  } = controller;

  const [dragMode, setDragMode] = useState<DragMode>("pan");
  /** Bar whose tempo the toolbar is editing, picked by clicking its line. */
  const [selectedBeat, setSelectedBeat] = useState<number | null>(null);
  /** What is literally in the tempo box while it is being typed. */
  const [bpmDraft, setBpmDraft] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  /** True while a file is being dragged over the screen. */
  const [isDropping, setIsDropping] = useState(false);
  /** What is in the base-tempo box while it is being typed. */
  const [sourceBpmDraft, setSourceBpmDraft] = useState<string | null>(null);
  /** Per-stem lane heights, so a busy mix can give the important track room. */
  const [laneHeights, setLaneHeights] = useState<Record<string, number>>({});
  /** Setup starts open while there is nothing to align — that is the first job. */
  const [showSetup, setShowSetup] = useState(false);
  const [setupTouched, setSetupTouched] = useState(false);

  // The map shows the first stem — normally the full backing, and the best
  // single picture of the recording's shape. Peaks are cached, so the lane below
  // draws from the same decode.
  //
  // A local file is decoded in one go. A video's audio is unreachable from the
  // page, so its waveform is learned by listening to it play — different route,
  // same shape of data, so everything downstream reads one pair of values.
  const mapUrl =
    source === "file" ? (stemUrls[stems[0]?.trackId] ?? null) : null;
  const fileWaveform = useWaveformPeaks(mapUrl);

  const isFile = source === "file";

  // Listening runs with the session, not with this screen — but handing the
  // waveform over is expensive, so it is only handed over often while a screen
  // is actually drawing it.
  const watchWaveform = ytWaveform.watch;
  useEffect(() => watchWaveform(), [watchWaveform]);

  // A learned waveform is drawn from its attacks rather than its amplitude. A
  // loud mix is a solid block at peak level with nothing in it to put a bar
  // line on; the same passage as attack strength is a row of drum hits, which
  // is what a downbeat is actually found by.
  const learnedPeaks = useMemo(
    () => blendForDisplay(ytWaveform.peaks, ytWaveform.onsets),
    // The waveform fills in without its length changing, so the revision is the
    // only thing that says its contents moved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ytWaveform.peaks, ytWaveform.onsets, ytWaveform.revision],
  );

  const peaks = isFile ? fileWaveform.peaks : learnedPeaks;
  const peaksPerSecond = isFile ? PEAKS_PER_SECOND : ytWaveform.peaksPerSecond;
  const durationSec = isFile
    ? fileWaveform.durationSec
    : ytWaveform.durationSec;
  const isLoading = isFile
    ? fileWaveform.isLoading
    : ytWaveform.status === "listening";
  /** Bumped whenever the drawn waveform's contents changed, so the cached
   *  bitmaps downstream know to repaint something whose length never moves. */
  const peaksRevision = isFile ? 0 : ytWaveform.revision;

  // Where the recording is right now, worked out the same way the lanes do it.
  // The view needs this to hold its place the moment a pan detaches it from a
  // playhead it was chasing.
  const getPlayheadSec = useCallback(
    () =>
      tempoMap.secForBeat(
        sessionBeats(
          Date.now(),
          startTime,
          effectiveBpm,
          scoreClockRef.current,
          getResumeBeat,
        ),
      ),
    [tempoMap, startTime, effectiveBpm, scoreClockRef, getResumeBeat],
  );

  const {
    windowSec,
    centreSecOverride,
    isFollowing,
    setFollowing,
    zoomIn,
    zoomOut,
    centreOn,
    shiftCentre,
    parkView,
    zoomTo,
    jumpToPlayhead,
    attachContainer,
    attachLaneViewport,
    beginPan,
    panTo,
    endPan,
    isPanning,
  } = useTimelineView({ getPlayheadSec, durationSec });

  const applyOffset = useCallback(
    (next: number, options?: { realign?: boolean }) =>
      setAlignment({ offsetMs: next }, options),
    [setAlignment],
  );

  /**
   * Drags the recording under the pointer, which is not the same as changing
   * the offset.
   *
   * The waveform is drawn at its own seconds and the grid is drawn from the
   * offset, so moving the offset moves the *grid*. That reads as the audio
   * moving only while the view is following the playhead — which itself sits at
   * the offset — and reads as the grid sliding the moment the view is parked.
   * Same gesture, two different pictures, and the ruler's own drag went the
   * other way again. Carrying the centre along makes the lane mean one thing:
   * the recording follows your hand, wherever the view happens to be.
   */
  const dragRecording = useCallback(
    (deltaMs: number, options?: { realign?: boolean }) => {
      applyOffset(alignment.offsetMs + deltaMs, options);
      if (centreSecOverride !== null) shiftCentre(deltaMs / 1000);
    },
    [applyOffset, alignment.offsetMs, centreSecOverride, shiftCentre],
  );

  /**
   * Pins one bar to the moment it actually happens in the recording.
   *
   * A band that speeds up or drags leaves a single tempo lining up at the start
   * and a bar out by the end. Pinning bars gives the tab a tempo curve to follow
   * instead of one average that is wrong nearly everywhere.
   */
  const applyAnchor = useCallback(
    (beat: number, sec: number | null, options?: { realign?: boolean }) =>
      setAlignment(
        { tempoAnchors: withAnchorAt(alignment.tempoAnchors, beat, sec) },
        options,
      ),
    [setAlignment, alignment.tempoAnchors],
  );

  const anchorCount = alignment.tempoAnchors?.length ?? 0;

  /**
   * The recording's own tempo — what every pinned bar is a ratio of.
   *
   * It was shown as a word ("Even") and could only be changed by opening the
   * setup panel, even though it is the first number you want to correct when a
   * grid drifts evenly across the whole song.
   */
  const commitSourceBpm = () => {
    const parsed = Number.parseFloat((sourceBpmDraft ?? "").replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) {
      const bpm = Math.min(400, Math.max(20, parsed));
      setAlignment({ sourceBpm: bpm }, { realign: true });
      // The playback rate is effectiveBpm ÷ sourceBpm, so moving one alone would
      // speed the recording up or slow it down. Moving both keeps the ratio, and
      // the recording keeps sounding exactly as it was recorded.
      onSessionBpmChange?.(bpm);
    }
    setSourceBpmDraft(null);
  };

  /**
   * Sets a bar's tempo outright.
   *
   * Dragging is good for finding the beat by eye but poor for landing on an
   * exact number, so the same span arithmetic the drag uses is exposed here:
   * pick the second that makes the run from the previous anchor come out at
   * this BPM.
   */
  const setBarBpm = useCallback(
    (beat: number, bpm: number) => {
      if (!Number.isFinite(bpm) || bpm <= 0 || beat <= 0) return;
      const previous = tempoMap.points
        .filter((point) => point.beat < beat)
        .pop();
      const fromBeat = previous?.beat ?? 0;
      const fromSec = previous?.sec ?? tempoMap.secForBeat(0);
      applyAnchor(beat, fromSec + ((beat - fromBeat) * 60) / bpm, {
        realign: true,
      });
    },
    [tempoMap, applyAnchor],
  );

  /** The tempo the selected bar plays at, which the box shows when not typing. */
  const selectedBpm =
    selectedBeat === null
      ? null
      : tempoMap.bpmAtBeat(Math.max(0, selectedBeat - 1));

  const stepBarBpm = (delta: number) => {
    if (selectedBeat === null || selectedBpm === null) return;
    setBpmDraft(null);
    setBarBpm(selectedBeat, selectedBpm + delta);
  };

  const commitBpmDraft = () => {
    const parsed = Number.parseFloat((bpmDraft ?? "").replace(",", "."));
    if (selectedBeat !== null && Number.isFinite(parsed))
      setBarBpm(selectedBeat, parsed);
    setBpmDraft(null);
  };

  useEffect(() => {
    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showShortcuts) setShowShortcuts(false);
        else onClose();
        return;
      }
      if (isTyping(event.target)) return;
      if (event.key === "?") setShowShortcuts((open) => !open);
      if (event.code === "Space") {
        // Play, the way the app's own shortcut legend says Space works. The
        // session's handler is held back while this screen is up, so this is the
        // only thing the key does here — and it starts without a count-in.
        event.preventDefault();
        onTogglePlay?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, showShortcuts, onTogglePlay]);

  const nudge = (steps: number) =>
    applyOffset(alignment.offsetMs + steps * NUDGE_MS, { realign: true });

  const nameOf = (trackId: string) =>
    library.find((track) => track.id === trackId)?.name ?? "Missing file";
  const hasSomethingToAlign =
    (source === "file" && stems.length > 0) ||
    (source === "youtube" && !!youtubeVideoId);
  // Open until there is something to work on, then out of the way — unless the
  // player has said otherwise, in which case their choice stands.
  const isSetupOpen = setupTouched ? showSetup : !hasSomethingToAlign;

  /**
   * Nothing pinned and the start never moved — the first job is still undone.
   *
   * Bar 1 is what every other bar is measured from, so getting it onto the first
   * beat has to happen before anything else is worth doing. The screen used to
   * look equally ready before and after that, which is no help at all.
   */
  const needsFirstStep =
    hasSomethingToAlign &&
    anchorCount === 0 &&
    Math.round(alignment.offsetMs) === 0;

  const timeline = {
    startTime,
    effectiveBpm,
    scoreClockRef,
    getResumeBeat,
    sourceBpm: alignment.sourceBpm,
    offsetMs: alignment.offsetMs,
    tempoMap,
    beatsPerBar,
    windowSec,
    centreSecOverride,
  };

  /** Seconds one bar takes at the recording's nominal tempo. */
  const barSec =
    (60 / Math.max(1, alignment.sourceBpm)) * Math.max(1, beatsPerBar);

  /** Where the tab sits inside the recording, for the overview map. */
  const tabSpanSec = useMemo<[number, number] | null>(() => {
    if (!measures?.length) return null;
    const beats = measures.reduce(
      (sum, m) => sum + m.beats.reduce((s, b) => s + (b.duration || 0), 0),
      0,
    );
    return [tempoMap.secForBeat(0), tempoMap.secForBeat(beats)];
  }, [measures, tempoMap]);

  const anchorSecs = useMemo(
    () =>
      tempoMap.points
        .filter((point) => point.beat > 0)
        .map((point) => point.sec),
    [tempoMap],
  );

  /** Every lane gets the same drag behaviour, so nothing is a special case. */
  const laneDrag = {
    dragMode,
    onPanStart: beginPan,
    onPanMove: panTo,
    onPanEnd: endPan,
  };

  const zoomPresets: { label: string; windowSec: number; title: string }[] = [
    {
      label: "1 bar",
      windowSec: barSec,
      title: "Zoom so one bar fills the screen",
    },
    {
      label: "4 bars",
      windowSec: barSec * 4,
      title: "Zoom so four bars fill the screen",
    },
    {
      label: "Whole song",
      windowSec: durationSec || barSec * 32,
      title: "The whole recording end to end",
    },
  ];

  /**
   * One row of the timeline: a track header, then the lane it labels.
   *
   * The header column carries its own background and a rule down its right edge,
   * which is what makes a stack of these read as a track list rather than
   * captions floating beside pictures.
   */
  /** Only react to a drag carrying actual files, not to text or a lane drag. */
  const isFileDrag = (event: React.DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes("Files");

  const laneRow = (
    caption: React.ReactNode,
    lane: React.ReactNode,
    heightPx: number,
  ) => (
    <div className={cn("flex items-stretch border-b", RULE)}>
      <div
        className={cn(
          TRACK_HEADER_WIDTH,
          "flex shrink-0 flex-col justify-center gap-1 border-r bg-zinc-900/60 px-4",
          RULE,
        )}
        style={{ height: heightPx }}>
        {caption}
      </div>
      <div className='min-w-0 flex-1 px-3 py-1'>{lane}</div>
    </div>
  );

  /** The overview row's contents: the map itself, or why there isn't one. */
  const overviewLane = peaks ? (
    <AlignmentOverview
      peaks={peaks}
      peaksPerSecond={peaksPerSecond}
      durationSec={durationSec}
      startTime={startTime}
      effectiveBpm={effectiveBpm}
      scoreClockRef={scoreClockRef}
      getResumeBeat={getResumeBeat}
      sourceBpm={alignment.sourceBpm}
      tempoMap={tempoMap}
      offsetMs={alignment.offsetMs}
      windowSec={windowSec}
      centreSecOverride={centreSecOverride}
      tabSpanSec={tabSpanSec}
      anchorSecs={anchorSecs}
      onScrub={centreOn}
      revision={peaksRevision}
      heightPx={52}
    />
  ) : (
    <div className='flex h-[52px] items-center gap-3 rounded-lg bg-zinc-900/40 px-4 text-xs text-zinc-400'>
      {isFile ? (
        <span>
          {isLoading ? "Reading the recording…" : "No waveform to map."}
        </span>
      ) : ytWaveform.status === "unsupported" ? (
        <span>
          This browser can&apos;t share tab audio, so there is no waveform to
          draw. Chrome or Edge can; Firefox and Safari cannot. Align by ear
          below.
        </span>
      ) : ytWaveform.status === "listening" ? (
        <span>
          Listening — the map appears as soon as there is enough of the video to
          draw.
        </span>
      ) : (
        <span>
          Nothing heard yet. The waveform fills itself in while the video plays.
        </span>
      )}
    </div>
  );

  /**
   * What listening is up to, as a line under the map.
   *
   * There is deliberately no "learn the waveform" button in the ordinary case.
   * A video's waveform can only come from hearing the video play, and the video
   * plays during practice anyway — so listening runs with the session and this
   * row reports on it rather than asking for permission to start. The button
   * only appears where the platform genuinely needs a click: a browser, which
   * will not hand over tab audio without one.
   */
  const listeningStrip =
    isFile || ytWaveform.status === "unsupported" ? null : (
      <div className='flex items-center gap-3 px-4 pb-1 pt-2 text-xs text-zinc-400'>
        {ytWaveform.status === "error" ? (
          <>
            <span className='text-amber-400'>{ytWaveform.error}</span>
            <button type='button' onClick={ytWaveform.start} className={button}>
              Try again
            </button>
          </>
        ) : (
          <>
            {ytWaveform.status === "listening" && (
              <span
                aria-hidden
                className='h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cyan-400'
              />
            )}
            <span className='tabular-nums'>
              {ytWaveform.isComplete
                ? "Whole video heard."
                : `${Math.round(ytWaveform.coverage * 100)}% of the video heard`}
            </span>
            <span className='text-zinc-500'>
              {ytWaveform.isComplete
                ? "Nothing left to listen for."
                : ytWaveform.status === "listening"
                  ? "Filling in as it plays — the gaps close on their own."
                  : "Plays fill in the rest."}
            </span>
            {ytWaveform.status === "listening" ? (
              <button type='button' onClick={ytWaveform.stop} className={button}>
                <Square className='h-3.5 w-3.5' />
                Stop listening
              </button>
            ) : (
              !ytWaveform.isComplete && (
                <button
                  type='button'
                  onClick={ytWaveform.start}
                  className={button}>
                  <AudioLines className='h-3.5 w-3.5' />
                  Listen
                </button>
              )
            )}
            {/* The correction that decides whether the picture sits where the
                song actually is. Worth stating: an uncorrected waveform is a
                consistent picture in the wrong place, which is far harder to
                spot than a broken one. */}
            {ytWaveform.coverage > 0 && (
              <span className='ml-auto text-zinc-500 tabular-nums'>
                {ytWaveform.latencyMs === null
                  ? "capture delay not measured"
                  : `capture delay ${Math.round(ytWaveform.latencyMs)} ms, corrected`}
              </span>
            )}
          </>
        )}
      </div>
    );

  return (
    // Must clear the session view (z-[999999]), same as the shortcuts dialog.
    <div
      onDragOver={(event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        setIsDropping(true);
      }}
      onDragLeave={(event) => {
        // Only when the pointer leaves the screen itself, not a child of it.
        if (event.currentTarget.contains(event.relatedTarget as Node | null))
          return;
        setIsDropping(false);
      }}
      onDrop={(event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        setIsDropping(false);
        void importDroppedFiles(Array.from(event.dataTransfer.files));
      }}
      className={cn(
        "fixed inset-0 z-[99999999] flex flex-col bg-zinc-950",
        // The desktop title bar is pinned above everything, so start below it.
        isElectron && "pt-10",
      )}>
      {isDropping && (
        <div className='pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/80'>
          <div className='flex flex-col items-center gap-2 rounded-lg bg-cyan-500/10 px-8 py-6'>
            <Upload className='h-6 w-6 text-cyan-400' />
            <span className='text-sm font-semibold text-cyan-400'>
              {desktopAvailable
                ? "Drop to add as a stem"
                : "Adding files needs the desktop app"}
            </span>
          </div>
        </div>
      )}
      {/* ── Title ───────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center justify-between gap-4 border-b bg-zinc-900 px-6 py-3",
          RULE,
        )}>
        <div className='flex items-center gap-3'>
          <Crosshair className='h-4 w-4 text-cyan-400' />
          <h2 className='text-base font-semibold text-zinc-100'>
            Align backing track
          </h2>
          <span className='rounded bg-zinc-800/60 px-2 py-0.5 text-xs font-medium text-zinc-300'>
            {source === "file"
              ? `${stems.length} ${stems.length === 1 ? "stem" : "stems"}`
              : "YouTube"}
          </span>
        </div>

        <div className='flex items-center gap-4'>
          {desktopAvailable && (
            // Nothing on the old screen suggested files could be dropped, and a
            // drop target you cannot see is a drop target nobody uses.
            <span className='flex items-center gap-2 text-xs text-zinc-400'>
              <Upload className='h-3.5 w-3.5 text-zinc-400' />
              {isImporting
                ? "Adding files…"
                : "Drop audio files anywhere to add a stem"}
            </span>
          )}

          {/* The way out was a grey button among grey buttons. It is the one
              control every visit ends with, so it looks like it. */}
          <button
            type='button'
            onClick={onClose}
            className='flex items-center gap-2 rounded-lg bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-cyan-500/25'>
            <Check className='h-3.5 w-3.5' />
            Done
            <kbd className='font-mono rounded bg-zinc-950/50 px-1.5 text-xs leading-5 text-cyan-400/80'>
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {setup && (
        <div className={cn("shrink-0 border-b bg-zinc-900/40", RULE)}>
          <button
            type='button'
            onClick={() => {
              setSetupTouched(true);
              setShowSetup((open) => !open);
            }}
            aria-expanded={isSetupOpen}
            className='flex w-full items-center gap-2 px-6 py-2.5 text-left transition-colors hover:bg-zinc-800/40'>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-zinc-400 transition-transform",
                !isSetupOpen && "-rotate-90",
              )}
            />
            <span className={panelLabel}>Source &amp; mix</span>
            {!hasSomethingToAlign && (
              <span className='text-xs text-amber-400'>
                pick a recording to start
              </span>
            )}
          </button>
          {isSetupOpen && <div className='px-6 pb-4'>{setup}</div>}
        </div>
      )}

      {!hasSomethingToAlign ? (
        // With a setup panel above, the band already says what to do. Without
        // one — this screen rendered on its own — say it here instead.
        setup ? (
          <div className='flex-1' />
        ) : (
          <p className='p-6 text-sm text-zinc-400'>
            Pick a backing track first, then come back here.
          </p>
        )
      ) : (
        <>
          {/* ── Toolbar: the tool, where you are, how much you see, the tempo ─ */}
          {/* Four named cards, not one row of thirty controls. The gap between
              cards is wider than the gap inside one, which is the whole of what
              tells a reader where one group stops and the next begins. */}
          <div
            className={cn(
              "flex shrink-0 flex-wrap items-stretch gap-x-5 gap-y-2 border-b bg-zinc-950 px-6 py-3",
              RULE,
            )}>
            <ToolGroup label='Drag a lane to'>
              <div className={segment}>
                {(
                  [
                    {
                      mode: "pan",
                      icon: Hand,
                      label: "Move view",
                      title:
                        "Look somewhere else. The recording stays exactly where it is.",
                    },
                    {
                      mode: "stems",
                      icon: MoveHorizontal,
                      label: "Move audio",
                      title:
                        "Slide the recording against the tab. The middle button still moves the view.",
                    },
                  ] as const
                ).map(({ mode, icon: Icon, label, title }) => (
                  <button
                    key={mode}
                    type='button'
                    onClick={() => setDragMode(mode)}
                    aria-pressed={dragMode === mode}
                    title={title}
                    className={cn(
                      segmentButton,
                      dragMode === mode ? segmentOn : segmentOff,
                    )}>
                    <Icon className='h-3.5 w-3.5' />
                    {label}
                  </button>
                ))}
              </div>
            </ToolGroup>

            {/* Where the playhead is, and whether the view is chasing it. The
                follow toggle used to sit among the zoom presets, which is the
                one place it has nothing to do with. */}
            <ToolGroup label='Playhead'>
              <TimelineClock
                getPlayheadSec={getPlayheadSec}
                durationSec={durationSec}
                tempoMap={tempoMap}
                beatsPerBar={beatsPerBar}
                className='px-1'
              />
              <div className={segment}>
                <button
                  type='button'
                  onClick={() => setFollowing(!isFollowing)}
                  aria-pressed={isFollowing}
                  title='Keep the view centred on the playhead as it moves'
                  className={cn(
                    segmentButton,
                    isFollowing ? segmentOn : segmentOff,
                  )}>
                  <LocateFixed className='h-3.5 w-3.5' />
                  Follow playback
                </button>
                {!isFollowing && (
                  <button
                    type='button'
                    onClick={jumpToPlayhead}
                    aria-label='Bring the playhead into view'
                    title='Bring the playhead into view, and stay put'
                    className={cn(segmentButton, segmentOff)}>
                    <Target className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>
            </ToolGroup>

            <ToolGroup label='Zoom' hint='or scroll over the timeline'>
              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={zoomOut}
                  aria-label='Zoom out'
                  title='See more of the recording at once'
                  className={iconButton}>
                  <ZoomOut className='h-3.5 w-3.5' />
                </button>
                <span
                  className={cn(readout, "w-14 text-center")}
                  title='How much of the recording fits across the screen'>
                  {formatWindow(windowSec)}
                </span>
                <button
                  type='button'
                  onClick={zoomIn}
                  aria-label='Zoom in'
                  title='See less of it, in more detail'
                  className={iconButton}>
                  <ZoomIn className='h-3.5 w-3.5' />
                </button>
              </div>
              <div className={segment}>
                {zoomPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type='button'
                    onClick={() => zoomTo(preset.windowSec)}
                    title={preset.title}
                    className={cn(segmentButton, segmentOff)}>
                    {preset.label === "Whole song" ? (
                      <Maximize2 className='h-3.5 w-3.5' />
                    ) : null}
                    {preset.label}
                  </button>
                ))}
              </div>
            </ToolGroup>

            {/* Named for what it draws — the bar lines — rather than "Recording
                tempo" again: the setup panel above already owns that name, and
                two controls with one name is the confusion, not the cure.
                "sets the session too" used to trail the input like a fourth
                control. It explains the whole group, so it sits with the name. */}
            <ToolGroup
              label='Tempo grid'
              hint={onSessionBpmChange ? "sets the session too" : undefined}>
              <div className='flex items-center gap-1.5'>
                <input
                  type='text'
                  inputMode='decimal'
                  aria-label="The recording's own tempo"
                  title='What the song runs at. Sets the session tempo to match, so the recording keeps sounding as recorded — slow down in the session, not here.'
                  value={sourceBpmDraft ?? alignment.sourceBpm.toFixed(2)}
                  onChange={(event) => setSourceBpmDraft(event.target.value)}
                  onBlur={commitSourceBpm}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitSourceBpm();
                    if (event.key === "Escape") setSourceBpmDraft(null);
                  }}
                  className='h-8 w-20 rounded-lg bg-zinc-950/60 px-2 text-center text-sm font-semibold tabular-nums text-zinc-100 outline-none transition-colors focus:bg-zinc-950'
                />
                <span className='text-xs font-medium text-zinc-400'>BPM</span>
              </div>
              <span
                title={
                  anchorCount === 0
                    ? "One tempo for the whole recording. Drag a bar line to pin a bar that drifts."
                    : "Bars pinned to a tempo of their own, so the grid follows a band that drifts."
                }
                className={cn(
                  chip,
                  anchorCount > 0
                    ? "bg-orange-500/10 text-orange-400"
                    : "bg-zinc-800/60 text-zinc-400",
                )}>
                {anchorCount === 0
                  ? "even throughout"
                  : `${anchorCount} ${anchorCount === 1 ? "bar" : "bars"} pinned`}
              </span>
              {anchorCount > 0 && (
                <button
                  type='button'
                  onClick={() =>
                    setAlignment({ tempoAnchors: [] }, { realign: true })
                  }
                  title='Back to one tempo for the whole recording'
                  className={cn(button, "px-2.5 py-1")}>
                  Reset
                </button>
              )}
            </ToolGroup>

            {/* Named, not a lone glyph: the shortcuts are half of what makes
                this screen quick, and an unlabelled key icon hides them. */}
            <button
              type='button'
              onClick={() => setShowShortcuts((open) => !open)}
              aria-label='Keyboard shortcuts'
              title='Keyboard shortcuts — ?'
              className={cn(button, "ml-auto self-center")}>
              <Keyboard className='h-3.5 w-3.5' />
              Shortcuts
              <kbd className={keyCap}>?</kbd>
            </button>
          </div>

          {/* ── Whole-recording map ─────────────────────────────────────── */}
          {/* A row like the tracks below it, so the rule between headers and
              lanes runs unbroken from the top of the stack to the bottom. */}
          <div className='shrink-0'>
            {laneRow(
              <>
                <span className='text-sm font-semibold text-zinc-100'>
                  Overview
                </span>
                <span className='text-xs text-zinc-400'>
                  {centreSecOverride === null
                    ? "follows playback"
                    : "click to jump"}
                </span>
              </>,
              overviewLane,
              OVERVIEW_HEIGHT_PX,
            )}
            {listeningStrip}
          </div>

          {/* ── Timeline ────────────────────────────────────────────────── */}
          <div
            ref={attachContainer}
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-y-auto",
              isPanning && "cursor-grabbing",
            )}>
            {laneRow(
              <>
                <span className='text-sm font-semibold text-zinc-100'>
                  Bars
                </span>
                <span className='text-xs text-zinc-400'>
                  drag a line onto the beat
                </span>
              </>,
              <div ref={attachLaneViewport} className='relative py-1'>
                <TempoAnchorPopover
                  beat={selectedBeat}
                  tempoMap={tempoMap}
                  windowSec={windowSec}
                  centreSecOverride={centreSecOverride}
                  getPlayheadSec={getPlayheadSec}>
                  <span className='shrink-0 text-xs font-medium text-cyan-400'>
                    Bar{" "}
                    {Math.floor(
                      (selectedBeat ?? 0) / Math.max(1, beatsPerBar),
                    ) + 1}
                  </span>
                  <button
                    type='button'
                    onClick={(e) =>
                      stepBarBpm(-(e.shiftKey ? BPM_STEP_COARSE : BPM_STEP))
                    }
                    aria-label='Slower by a hundredth'
                    title='Slower — Shift for a tenth'
                    className={cn(iconButton, "h-7 w-7 shrink-0")}>
                    <Minus className='h-3.5 w-3.5' />
                  </button>
                  <input
                    type='text'
                    inputMode='decimal'
                    aria-label='Tempo of the selected bar'
                    value={bpmDraft ?? (selectedBpm ?? 0).toFixed(2)}
                    onChange={(e) => setBpmDraft(e.target.value)}
                    onBlur={commitBpmDraft}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitBpmDraft();
                      if (e.key === "Escape") setBpmDraft(null);
                    }}
                    className='h-7 min-w-0 flex-1 rounded bg-zinc-900 px-2 text-center text-sm font-semibold tabular-nums text-zinc-100 outline-none'
                  />
                  <button
                    type='button'
                    onClick={(e) =>
                      stepBarBpm(e.shiftKey ? BPM_STEP_COARSE : BPM_STEP)
                    }
                    aria-label='Faster by a hundredth'
                    title='Faster — Shift for a tenth'
                    className={cn(iconButton, "h-7 w-7 shrink-0")}>
                    <Plus className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setBpmDraft(null);
                      setSelectedBeat(null);
                    }}
                    aria-label='Stop editing this bar'
                    className={cn(iconButton, "h-7 w-7 shrink-0")}>
                    <X className='h-3.5 w-3.5' />
                  </button>
                </TempoAnchorPopover>
                <TimelineRuler
                  {...timeline}
                  tempoEditing={{
                    peaks,
                    peaksPerSecond,
                    selectedBeat,
                    onSelectBar: (beat) => {
                      setBpmDraft(null);
                      // Bar 1 is the offset, not a tempo — nothing to edit there.
                      setSelectedBeat(beat === 0 ? null : beat);
                    },
                    onAnchorChange: applyAnchor,
                    onOffsetChange: applyOffset,
                    // A bar line can only be seen to move against a still
                    // background, and a following view is not one.
                    onEditStart: parkView,
                  }}
                />
              </div>,
              RULER_ROW_HEIGHT_PX,
            )}

            {/* The mixer sits on this header rather than in a row of its own:
                it is the same question as "what am I hearing against the
                recording", asked where the part itself is being read, and it
                costs the timeline no height while it is shut. */}
            {laneRow(
              <>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-semibold text-cyan-400'>
                    Tablature
                  </span>
                  {mixerTracks && mixerTracks.length > 0 && onMixerChange && (
                    <MixerMenu
                      tracks={mixerTracks}
                      onChange={onMixerChange}
                      className='ml-auto'
                    />
                  )}
                </div>
                <span className='text-xs text-zinc-400'>what you play</span>
              </>,
              <TabLane
                {...timeline}
                measures={measures}
                heightPx={TAB_LANE_HEIGHT_PX}
                onSeekToBeat={onSeekToBeat}
              />,
              TAB_LANE_HEIGHT_PX,
            )}

            {source === "file"
              ? stems.map((stem, index) => (
                  <StemLane
                    key={stem.trackId}
                    {...timeline}
                    {...laneDrag}
                    stem={stem}
                    index={index}
                    name={nameOf(stem.trackId)}
                    src={stemUrls[stem.trackId] ?? null}
                    heightPx={laneHeights[stem.trackId] ?? LANE_HEIGHT_PX}
                    onResize={(height) =>
                      setLaneHeights((current) => ({
                        ...current,
                        [stem.trackId]: Math.min(320, Math.max(56, height)),
                      }))
                    }
                    onStemOffsetChange={(next, options) =>
                      setStem(stem.trackId, { offsetMs: next }, options)
                    }
                    onVolumeChange={(volume) =>
                      setStem(stem.trackId, { volume })
                    }
                    onToggleMute={() =>
                      setStem(stem.trackId, { muted: !stem.muted })
                    }
                    onSolo={() => soloStem(stem.trackId)}
                    onRemove={() => removeStem(stem.trackId)}
                  />
                ))
              : laneRow(
                  <>
                    <span className='text-sm font-semibold text-zinc-100'>
                      YouTube
                    </span>
                    <span className='text-xs text-zinc-400'>tap to align</span>
                  </>,
                  <AlignmentGrid
                    {...timeline}
                    {...laneDrag}
                    peaks={peaks}
                    peaksPerSecond={peaksPerSecond}
                    revision={peaksRevision}
                    heightPx={LANE_HEIGHT_PX}
                    onDragOffset={dragRecording}
                  />,
                  LANE_HEIGHT_PX,
                )}

            <div className='flex min-h-[3rem] flex-1 items-stretch'>
              <div
                className={cn(
                  TRACK_HEADER_WIDTH,
                  "shrink-0 border-r bg-zinc-900/60",
                  RULE,
                )}
              />
              <div className='min-w-0 flex-1' />
            </div>
          </div>

          {/* ── Transport ───────────────────────────────────────────────── */}
          <div
            className={cn(
              "flex shrink-0 flex-col gap-3 border-t bg-zinc-900 px-6 py-4",
              RULE,
            )}>
            <div className='flex flex-wrap items-center gap-x-8 gap-y-3'>
              {onTogglePlay && (
                <button
                  type='button'
                  onClick={onTogglePlay}
                  aria-label={isPlaying ? "Stop playback" : "Start playback"}
                  className={cn(
                    button,
                    "px-4",
                    isPlaying
                      ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                      : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
                  )}>
                  {isPlaying ? (
                    <Pause className='h-3.5 w-3.5' />
                  ) : (
                    <Play className='h-3.5 w-3.5' />
                  )}
                  {isPlaying ? "Stop" : "Play"}
                </button>
              )}

              <div className='flex items-center gap-2'>
                <span className={panelLabel}>Drift</span>
                <SyncDriftReadout
                  driftMsRef={driftMsRef}
                  active={!!isPlaying}
                  className='w-16'
                />
              </div>

              <div className='flex items-center gap-2'>
                <span className={panelLabel}>Start</span>
                <button
                  type='button'
                  onClick={(e) => nudge(e.shiftKey ? -NUDGE_COARSE_FACTOR : -1)}
                  aria-label='Nudge the backing track earlier'
                  title={`Earlier by ${NUDGE_MS} ms — Shift for ${NUDGE_MS * NUDGE_COARSE_FACTOR}`}
                  className={cn(iconButton, "w-auto gap-2 px-2.5")}>
                  <ChevronLeft className='h-4 w-4' />
                  <kbd className={keyCap}>[</kbd>
                </button>
                <span
                  className={cn(
                    readout,
                    "min-w-[4.5rem] text-center text-amber-400",
                  )}>
                  {alignment.offsetMs > 0 ? "+" : ""}
                  {Math.round(alignment.offsetMs)} ms
                </span>
                <button
                  type='button'
                  onClick={(e) => nudge(e.shiftKey ? NUDGE_COARSE_FACTOR : 1)}
                  aria-label='Nudge the backing track later'
                  title={`Later by ${NUDGE_MS} ms — Shift for ${NUDGE_MS * NUDGE_COARSE_FACTOR}`}
                  className={cn(iconButton, "w-auto gap-2 px-2.5")}>
                  <kbd className={keyCap}>]</kbd>
                  <ChevronRight className='h-4 w-4' />
                </button>
                <span className='text-xs text-zinc-400'>
                  moves the whole recording · Shift for{" "}
                  {NUDGE_MS * NUDGE_COARSE_FACTOR} ms
                </span>
              </div>
            </div>

            {needsFirstStep ? (
              <p className='flex items-center gap-2 text-xs text-cyan-400'>
                <Target className='h-3.5 w-3.5 shrink-0' />
                Start here: drag bar 1 on the ruler onto the first beat you
                hear. Everything else is measured from it.
              </p>
            ) : (
              <p className='text-xs text-zinc-400'>
                Space plays without a count-in · middle-drag moves the view ·
                press ? for every shortcut
              </p>
            )}
          </div>
        </>
      )}

      {showShortcuts && (
        <div
          role='dialog'
          aria-label='Keyboard shortcuts'
          className='absolute right-6 top-20 z-30 w-80 rounded-lg bg-zinc-800 p-4'>
          <div className='mb-3 flex items-center justify-between'>
            <span className='text-sm font-semibold text-zinc-100'>
              Shortcuts
            </span>
            <button
              type='button'
              onClick={() => setShowShortcuts(false)}
              aria-label='Close the shortcut list'
              className={cn(iconButton, "h-7 w-7")}>
              <X className='h-3.5 w-3.5' />
            </button>
          </div>
          <dl className='flex flex-col gap-2 text-xs'>
            {[
              ["Scroll", "Zoom where the pointer is"],
              ["Shift + scroll", "Move along the recording"],
              ["Space", "Play or stop, with no count-in"],
              ["Middle-drag", "Drag the view"],
              ["[  ]", `Move the whole recording by ${NUDGE_MS} ms`],
              [
                "Shift + [  ]",
                `Move it by ${NUDGE_MS * NUDGE_COARSE_FACTOR} ms`,
              ],
              [
                "Drag a bar line",
                `Change that bar's tempo, ${BPM_PER_PX_LABEL} a pixel`,
              ],
              ["Shift + drag", "A fifth of that, for the last hundredths"],
              ["Alt + drag", "Ignore the transient snap"],
              ["Click a bar line", "Type its tempo exactly"],
              ["Double-click", "Unpin that bar"],
              ["Esc", "Close"],
            ].map(([keys, what]) => (
              <div
                key={keys}
                className='flex items-baseline justify-between gap-4'>
                <dt className='font-mono shrink-0 rounded bg-zinc-950/70 px-1.5 text-xs leading-5 text-zinc-300'>
                  {keys}
                </dt>
                <dd className='text-right text-zinc-400'>{what}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
