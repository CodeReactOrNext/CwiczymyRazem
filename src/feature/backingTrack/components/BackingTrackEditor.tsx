import { cn } from "assets/lib/utils";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { useTranslation } from "hooks/useTranslation";
import { Check, ChevronDown, FolderOpen, LocateFixed, Maximize2, Pause, Play, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";
import { PEAKS_PER_SECOND, recordingFeatures, useRecordingAnalysis } from "../hooks/useRecordingAnalysis";
import { useTimelineView } from "../hooks/useTimelineView";
import { requestAutoSync } from "../services/analysisClient";
import type { TabSourceMeasure } from "../utils/alignment";
import type { AutoSyncResult, SyncTrack } from "../utils/autoSync";
import { syncEventsFromTracks } from "../utils/autoSync";
import { isCleanStretch, sessionBeats } from "../utils/backingSync";
import { isLinedUp } from "../utils/backingTrackStatus";
import type { TempoAnchor } from "../utils/tempoMap";
import { shiftedBy, withAnchorAt } from "../utils/tempoMap";
import { AlignmentOverview } from "./AlignmentOverview";
import { BackingTrackIntro, hasSeenBackingIntro } from "./BackingTrackIntro";
import { RecordingsPanel } from "./RecordingsPanel";
import { ShiftAllControl } from "./ShiftAllControl";
import { SyncLane } from "./SyncLane";
import { TabLane } from "./TabLane";
import { TimelineClock } from "./TimelineClock";
import type { MixerTrack } from "./TrackMixer";
import { TrackMixer } from "./TrackMixer";
import { VideoPanel } from "./VideoPanel";

const SYNC_LANE_HEIGHT_PX = 220;
const TAB_LANE_HEIGHT_PX = 112;
const OVERVIEW_HEIGHT_PX = 44;

const fieldLabel = "text-xs text-zinc-400";
const button =
  "flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const primaryButton =
  "flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const keyCap = "rounded bg-zinc-950/70 px-1.5 text-[11px] font-semibold leading-5 text-zinc-300";

/** 4 → "4 s", 0.5 → "0.5 s". Whole numbers stay whole. */
const formatWindow = (sec: number) => `${Number(sec.toFixed(sec < 1 ? 2 : 1))} s`;

/** What automatic sync replaced, so one click puts it back. */
interface SyncSnapshot {
  offsetMs: number;
  sourceBpm: number;
  tempoAnchors: TempoAnchor[];
  sessionBpm?: number;
}

type AutoSyncState =
  | { status: "idle" | "running" | "failed" }
  | { status: "done"; result: AutoSyncResult; previous: SyncSnapshot }
  | { status: "unsure"; result: AutoSyncResult };

const sameAnchors = (a: TempoAnchor[] | undefined, b: TempoAnchor[] | undefined) =>
  JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

interface BackingTrackEditorProps {
  controller: BackingTrackController;
  beatsPerBar: number;
  /** The exercise's tablature, drawn as real tab under the recording. */
  measures?: TabSourceMeasure[];
  /**
   * Every track of the Guitar Pro file. Automatic sync listens for all of
   * them: a guitar backing track has the drums and bass but not the guitar.
   */
  syncTracks?: SyncTrack[];
  /** The Guitar Pro instruments, so the tab can be turned down against the recording. */
  mixerTracks?: MixerTrack[];
  onMixerChange?: (id: string, next: { volume?: number; isMuted?: boolean }) => void;
  /** The session's transport — syncing is listening, so it belongs here. */
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  /** Clicking the tab lane plays from that beat. */
  onSeekToBeat?: (beat: number) => void;
  /**
   * Moves the session's tempo along with the recording's.
   *
   * The two are a ratio — the recording plays at session ÷ recording tempo —
   * so naming what the song runs at must not also slow it down or speed it up.
   */
  onSessionBpmChange?: (bpm: number) => void;
  /** The session tempo now, so undoing automatic sync can put it back. */
  sessionBpm?: number;
  /** See VideoPanel — where the bar lays the video while this screen is up. */
  videoSlotRef?: (element: HTMLDivElement | null) => void;
  onClose: () => void;
}

/**
 * The one place a song's backing track is set up: which files play, where the
 * tab sits in them, and the video to watch while playing.
 *
 * Built around a single job. Syncing is two moves, said on screen in order —
 * put bar 1 on the first beat, then fix any bar that drifts — and both are the
 * same gesture on the same lane: drag the bar line onto the beat. Everything
 * the old editor spread over tool modes, a tempo popover and a second ruler is
 * gone; the files and the video sit in a column beside it, out of the way.
 *
 * The session keeps playing behind it, so every adjustment is heard at once.
 */
export function BackingTrackEditor({
  controller,
  beatsPerBar,
  measures,
  syncTracks,
  mixerTracks,
  onMixerChange,
  isPlaying,
  onTogglePlay,
  onSeekToBeat,
  onSessionBpmChange,
  sessionBpm,
  videoSlotRef,
  onClose,
}: BackingTrackEditorProps) {
  const { t } = useTranslation("backing_track");
  // The desktop title bar sits over every in-app layer, so the screen starts
  // below it — the same allowance every full-screen view in the app makes.
  const { isElectron } = useElectronWindowControls();
  const {
    desktopAvailable,
    stems,
    stemUrls,
    alignment,
    setAlignment,
    tempoMap,
    importTracks,
    importDroppedFiles,
    isImporting,
    startTime,
    effectiveBpm,
    scoreClockRef,
    getResumeBeat,
    playbackRate,
  } = controller;

  const [isDropping, setIsDropping] = useState(false);
  const [bpmDraft, setBpmDraft] = useState<string | null>(null);
  // Once per browser, before the editor is first used.
  const [showIntro, setShowIntro] = useState(() => !hasSeenBackingIntro());
  const [auto, setAuto] = useState<AutoSyncState>({ status: "idle" });
  const [showMixer, setShowMixer] = useState(false);

  const layers = stems.map((stem) => ({
    src: stemUrls[stem.trackId] ?? null,
    offsetMs: stem.offsetMs,
    muted: stem.muted,
  }));
  // While the session plays, the music gets the machine — the analysis for
  // snapping waits for a stop. Automatic sync starts it on demand anyway.
  const analysis = useRecordingAnalysis(layers, { analyse: !isPlaying });
  const durationSec = analysis.durationSec || controller.durationSec || 0;
  const events = useMemo(
    () =>
      syncEventsFromTracks(
        syncTracks?.length ? syncTracks : [{ trackType: "guitar", measures: measures ?? [] }],
      ),
    [syncTracks, measures],
  );

  const getPlayheadSec = useCallback(
    () =>
      tempoMap.secForBeat(
        sessionBeats(Date.now(), startTime, effectiveBpm, scoreClockRef.current, getResumeBeat),
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
    zoomTo,
    centreOn,
    parkView,
    attachContainer,
    attachLaneViewport,
    beginPan,
    panTo,
    endPan,
  } = useTimelineView({ getPlayheadSec, durationSec });

  const hasRecording = stems.length > 0;
  const anchorCount = alignment.tempoAnchors?.length ?? 0;
  const step = isLinedUp(alignment) ? 2 : 1;

  const setOffset = useCallback(
    (offsetMs: number, options?: { realign?: boolean }) => setAlignment({ offsetMs }, options),
    [setAlignment],
  );
  // ── Every bar at once ─────────────────────────────────────────────────────
  const laneRef = useRef<HTMLDivElement | null>(null);
  const attachLane = useCallback(
    (element: HTMLDivElement | null) => {
      laneRef.current = element;
      attachLaneViewport(element);
    },
    [attachLaneViewport],
  );
  /** Where everything was when the handle was grabbed — see ShiftAllControl. */
  const shiftBaseRef = useRef<{ offsetMs: number; tempoAnchors: TempoAnchor[] } | null>(null);
  const startShiftDrag = () => {
    // A still background, so it is the bars that are seen to move.
    parkView();
    shiftBaseRef.current = { offsetMs: alignment.offsetMs, tempoAnchors: alignment.tempoAnchors ?? [] };
  };
  const dragShift = (totalMs: number, options: { realign: boolean }) => {
    if (shiftBaseRef.current) setAlignment(shiftedBy(shiftBaseRef.current, totalMs), options);
  };
  const stepShift = (deltaMs: number) => setAlignment(shiftedBy(alignment, deltaMs), { realign: true });
  const laneSecondsPerPixel = () => windowSec / Math.max(1, laneRef.current?.clientWidth ?? 1);

  const setAnchor = useCallback(
    (beat: number, sec: number | null, options?: { realign?: boolean }) =>
      setAlignment({ tempoAnchors: withAnchorAt(alignment.tempoAnchors, beat, sec) }, options),
    [setAlignment, alignment.tempoAnchors],
  );

  const commitBpm = () => {
    const parsed = Number.parseFloat((bpmDraft ?? "").replace(",", "."));
    setBpmDraft(null);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const bpm = Math.min(400, Math.max(20, parsed));
    setAlignment({ sourceBpm: bpm }, { realign: true });
    onSessionBpmChange?.(bpm);
  };

  // ── Automatic sync ──────────────────────────────────────────────────────
  const canAutoSync = stems.length > 0 && events.length >= 4;

  const applyAutoSync = (result: AutoSyncResult, previous: SyncSnapshot) => {
    setAlignment(
      { offsetMs: result.offsetMs, sourceBpm: result.sourceBpm, tempoAnchors: result.tempoAnchors },
      { realign: true },
    );
    // Same rule as typing the tempo: the session moves with the recording,
    // so the recording keeps sounding as recorded.
    onSessionBpmChange?.(result.sourceBpm);
    setAuto({ status: "done", result, previous });
    // Straight to bar 1, so the next thing heard is whether it worked.
    setFollowing(true);
    onSeekToBeat?.(0);
  };

  const runAutoSync = () => {
    const previous: SyncSnapshot = {
      offsetMs: alignment.offsetMs,
      sourceBpm: alignment.sourceBpm,
      tempoAnchors: alignment.tempoAnchors ?? [],
      sessionBpm,
    };
    setAuto({ status: "running" });
    recordingFeatures(layers)
      .then((features) =>
        requestAutoSync({ features, events, beatsPerBar, nominalBpm: alignment.sourceBpm }),
      )
      .then((result) => {
        if (result.confident) applyAutoSync(result, previous);
        else setAuto({ status: "unsure", result });
      })
      .catch(() => setAuto({ status: "failed" }));
  };

  const undoAutoSync = (previous: SyncSnapshot) => {
    setAlignment(
      { offsetMs: previous.offsetMs, sourceBpm: previous.sourceBpm, tempoAnchors: previous.tempoAnchors },
      { realign: true },
    );
    if (previous.sessionBpm) onSessionBpmChange?.(previous.sessionBpm);
    setAuto({ status: "idle" });
  };

  /**
   * Said outright when the tab covers only part of the recording — a short
   * arrangement of a five-minute song can line up for its own minute and no
   * more, and that is the tab's doing, not the sync's.
   */
  const partialTab = (result: AutoSyncResult) =>
    result.coverage !== undefined && result.coverage < 0.6
      ? t("auto.partial", { percent: Math.max(1, Math.round(result.coverage * 100)) })
      : null;

  // The result stays on screen only while it is what is in force — once a
  // line has been dragged, "undo" would throw that work away too.
  const autoInForce =
    auto.status === "done" &&
    Math.round(alignment.offsetMs) === auto.result.offsetMs &&
    alignment.sourceBpm === auto.result.sourceBpm &&
    sameAnchors(alignment.tempoAnchors, auto.result.tempoAnchors);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showIntro) setShowIntro(false);
        else onClose();
        return;
      }
      if (showIntro) return;
      if (isTyping(event.target)) return;
      // The session's own shortcuts are held back while this screen is up, so
      // Space only plays — and without a count-in.
      if (event.code === "Space") {
        event.preventDefault();
        onTogglePlay?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onTogglePlay, showIntro]);

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

  const barSec = (60 / Math.max(1, alignment.sourceBpm)) * Math.max(1, beatsPerBar);
  const zoomPresets = [
    { label: t("transport.zoom_bar"), windowSec: barSec },
    { label: t("transport.zoom_bars"), windowSec: barSec * 4 },
    { label: t("transport.zoom_all"), windowSec: durationSec || barSec * 32 },
  ];

  /** Where the tab sits inside the recording, for the overview map. */
  const tabSpanSec = useMemo<[number, number] | null>(() => {
    if (!measures?.length) return null;
    const beats = measures.reduce(
      (sum, measure) => sum + measure.beats.reduce((s, beat) => s + (beat.duration || 0), 0),
      0,
    );
    return [tempoMap.secForBeat(0), tempoMap.secForBeat(beats)];
  }, [measures, tempoMap]);

  const anchorSecs = useMemo(
    () => tempoMap.points.filter((point) => point.beat > 0).map((point) => point.sec),
    [tempoMap],
  );

  const isFileDrag = (event: React.DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes("Files");

  const mixTracks = mixerTracks ?? [];

  return (
    // Must clear the session view (z-[999999]) and its own dialogs.
    <div
      role='dialog'
      aria-label={t("editor.title")}
      onDragOver={(event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        setIsDropping(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setIsDropping(false);
      }}
      onDrop={(event) => {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        setIsDropping(false);
        void importDroppedFiles(Array.from(event.dataTransfer.files));
      }}
      className={cn(
        // text-left: the session view this sits in centres its text, and that
        // leaked into every caption here.
        "fixed inset-0 z-[99999999] flex flex-col bg-zinc-950 text-left",
        isElectron && "pt-[56px]",
      )}>
      {isDropping && (
        <div className='pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/85'>
          <div className='flex flex-col items-center gap-2 rounded-xl bg-zinc-900 px-8 py-6'>
            <Upload className='h-6 w-6 text-zinc-200' />
            <span className='text-sm font-semibold text-zinc-100'>
              {desktopAvailable ? t("editor.drop") : t("editor.drop_desktop_only")}
            </span>
          </div>
        </div>
      )}

      {showIntro && (
        <BackingTrackIntro desktopAvailable={desktopAvailable} onDone={() => setShowIntro(false)} />
      )}

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <header className='flex shrink-0 items-center gap-4 px-6 py-4'>
        <h2 className='text-lg font-semibold text-zinc-100'>{t("editor.title")}</h2>
        <button type='button' onClick={() => setShowIntro(true)} className={cn(button, "ml-auto")}>
          {t("editor.how")}
        </button>
        <button type='button' onClick={onClose} className={primaryButton}>
          <Check className='h-4 w-4' />
          {t("editor.done")}
          <kbd className='rounded bg-zinc-950/10 px-1.5 text-[11px] font-semibold leading-5 text-zinc-600'>
            Esc
          </kbd>
        </button>
      </header>

      <div className='flex min-h-0 flex-1 gap-5 px-6 pb-5'>
        {/* ── What plays, and what is shown ───────────────────────────── */}
        {/* data-video-clip: the video is laid over its box from outside this
            column, and clipped to it as the column scrolls (BackingTrackBar). */}
        <aside
          data-video-clip
          className='flex w-80 shrink-0 flex-col gap-6 overflow-y-auto pr-1'>
          <RecordingsPanel controller={controller} />
          <VideoPanel controller={controller} videoSlotRef={videoSlotRef} />
          {mixTracks.length > 0 && onMixerChange && (
            // Folded by default: a Guitar Pro file can carry ten instruments,
            // and their sliders used to push everything else off the column.
            <section className='flex flex-col gap-3'>
              <button
                type='button'
                onClick={() => setShowMixer((open) => !open)}
                aria-expanded={showMixer}
                className='flex items-center gap-2 self-start rounded-md text-sm font-semibold text-zinc-100 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                <ChevronDown
                  className={cn("h-4 w-4 text-zinc-400 transition-transform", !showMixer && "-rotate-90")}
                />
                {t("editor.tab_mix")}
                <span className='text-xs font-medium tabular-nums text-zinc-500'>{mixTracks.length}</span>
              </button>
              {showMixer && (
                <TrackMixer tracks={mixTracks} onChange={onMixerChange} className='grid-cols-1' />
              )}
            </section>
          )}
        </aside>

        {/* ── Sync ───────────────────────────────────────────────────── */}
        <main className='flex min-w-0 flex-1 flex-col gap-5 rounded-xl bg-zinc-900/40 p-5'>
          {!hasRecording ? (
            <div className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
              <h3 className='text-base font-semibold text-zinc-100'>
                {desktopAvailable ? t("editor.empty_title") : t("editor.web_title")}
              </h3>
              <p className='max-w-md text-sm leading-relaxed text-zinc-400'>
                {desktopAvailable ? t("editor.empty_body") : t("editor.web_body")}
              </p>
              {desktopAvailable && (
                <button
                  type='button'
                  onClick={importTracks}
                  disabled={isImporting}
                  className={cn(primaryButton, "disabled:opacity-50")}>
                  <FolderOpen className='h-4 w-4' />
                  {isImporting ? t("recordings.importing") : t("recordings.add")}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* What to do next, in the order it gets done — or let the app do it. */}
              <div className='flex flex-col gap-3'>
                <div className='flex flex-wrap items-center gap-x-4 gap-y-3'>
                  <div className='flex min-w-0 flex-1 items-baseline gap-3'>
                    <span className='shrink-0 text-xs font-semibold tabular-nums text-zinc-500'>
                      {t("editor.step", { n: step, total: 2 })}
                    </span>
                    <p className='text-sm leading-relaxed text-zinc-200'>
                      {step === 1 ? t("editor.step1") : t("editor.step2")}
                    </p>
                  </div>
                  {canAutoSync && (
                    <button
                      type='button'
                      onClick={runAutoSync}
                      disabled={auto.status === "running"}
                      title={t("auto.title")}
                      className={cn(
                        step === 1 && !autoInForce ? primaryButton : button,
                        "shrink-0 disabled:cursor-wait disabled:opacity-60",
                      )}>
                      {auto.status !== "running"
                        ? t("auto.run")
                        : analysis.features
                          ? t("auto.running")
                          : t("auto.analysing")}
                    </button>
                  )}
                </div>

                {autoInForce && auto.status === "done" && (
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-zinc-950/50 px-4 py-3'>
                    <p className='min-w-0 flex-1 text-sm leading-relaxed text-zinc-300'>
                      {t("auto.done", {
                        start: (auto.result.offsetMs / 1000).toFixed(2),
                        bpm: auto.result.sourceBpm.toFixed(1),
                      })}
                      {auto.result.tempoAnchors.length > 0 &&
                        ` ${t("auto.drift", { count: auto.result.tempoAnchors.length })}`}{" "}
                      {t("auto.listen")}
                      {partialTab(auto.result) && ` ${partialTab(auto.result)}`}
                    </p>
                    <button
                      type='button'
                      onClick={() => undoAutoSync(auto.previous)}
                      className={cn(button, "py-1.5")}>
                      {t("auto.undo")}
                    </button>
                  </div>
                )}
                {auto.status === "unsure" && (
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-zinc-950/50 px-4 py-3'>
                    <p className='min-w-0 flex-1 text-sm leading-relaxed text-amber-400'>
                      {t("auto.unsure")}
                      {partialTab(auto.result) && ` ${partialTab(auto.result)}`}
                    </p>
                    <button
                      type='button'
                      onClick={() =>
                        applyAutoSync(auto.result, {
                          offsetMs: alignment.offsetMs,
                          sourceBpm: alignment.sourceBpm,
                          tempoAnchors: alignment.tempoAnchors ?? [],
                          sessionBpm,
                        })
                      }
                      className={cn(button, "py-1.5")}>
                      {t("auto.apply_anyway")}
                    </button>
                  </div>
                )}
                {auto.status === "failed" && (
                  <p className='text-sm text-red-400'>{t("auto.failed")}</p>
                )}
              </div>

              <div ref={attachContainer} className='flex flex-col gap-2'>
                {/* Right on top of the recording: that is where people reach
                    to move it, so the grip for moving every bar lives there. */}
                <ShiftAllControl
                  offsetMs={alignment.offsetMs}
                  onDragStart={startShiftDrag}
                  onDrag={dragShift}
                  onStep={stepShift}
                  getSecondsPerPixel={laneSecondsPerPixel}
                />
                <div ref={attachLane}>
                  <SyncLane
                    {...timeline}
                    peaks={analysis.peaks}
                    peaksPerSecond={PEAKS_PER_SECOND}
                    onset={analysis.features?.onset ?? null}
                    onsetFps={analysis.features?.onsetFps ?? 0}
                    heightPx={SYNC_LANE_HEIGHT_PX}
                    onOffsetChange={setOffset}
                    onAnchorChange={setAnchor}
                    onEditStart={parkView}
                    onPanStart={beginPan}
                    onPanMove={panTo}
                    onPanEnd={endPan}
                  />
                </div>
                <TabLane
                  {...timeline}
                  measures={measures}
                  heightPx={TAB_LANE_HEIGHT_PX}
                  onSeekToBeat={onSeekToBeat}
                  className='rounded-lg'
                />
              </div>

              {/* The numbers behind the lane, for finishing by ear. */}
              <div className='flex flex-wrap items-end gap-x-8 gap-y-4'>

                <div className='flex flex-col gap-1.5'>
                  <span className={fieldLabel} title={t("sync.tempo_title")}>
                    {t("sync.tempo")}
                  </span>
                  <div className='flex h-8 items-center gap-2'>
                    <label className='flex h-8 items-center gap-1 rounded-lg bg-zinc-950/60 px-2'>
                      <input
                        type='text'
                        inputMode='decimal'
                        aria-label={t("sync.tempo")}
                        value={bpmDraft ?? alignment.sourceBpm.toFixed(2)}
                        onChange={(event) => setBpmDraft(event.target.value)}
                        onBlur={commitBpm}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitBpm();
                          if (event.key === "Escape") setBpmDraft(null);
                        }}
                        className='w-16 bg-transparent text-right text-sm font-semibold tabular-nums text-zinc-100 outline-none'
                      />
                      <span className='text-xs text-zinc-500'>BPM</span>
                    </label>
                    {!isCleanStretch(playbackRate) && (
                      <span className='text-xs tabular-nums text-amber-400'>
                        {t("sync.stretched", { rate: playbackRate.toFixed(2) })}
                      </span>
                    )}
                  </div>
                </div>

                {anchorCount > 0 && (
                  <div className='flex flex-col gap-1.5'>
                    <span className={fieldLabel}>{t("sync.pinned_label")}</span>
                    <div className='flex h-8 items-center gap-3'>
                      <span className='text-sm font-semibold tabular-nums text-orange-400'>
                        {t("sync.pinned", { count: anchorCount })}
                      </span>
                      <button
                        type='button'
                        onClick={() => setAlignment({ tempoAnchors: [] }, { realign: true })}
                        title={t("sync.unpin_title")}
                        className={cn(button, "py-1.5")}>
                        {t("sync.unpin")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* The whole song, for getting around it. */}
              <div className='flex flex-col gap-1.5'>
                <span className={fieldLabel}>{t("editor.whole_song")}</span>
                {analysis.peaks ? (
                  <AlignmentOverview
                    {...timeline}
                    peaks={analysis.peaks}
                    peaksPerSecond={PEAKS_PER_SECOND}
                    durationSec={durationSec}
                    tabSpanSec={tabSpanSec}
                    anchorSecs={anchorSecs}
                    onScrub={centreOn}
                    heightPx={OVERVIEW_HEIGHT_PX}
                  />
                ) : (
                  <p className='text-xs text-zinc-500'>
                    {analysis.isLoading ? t("editor.reading") : t("editor.no_waveform")}
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Transport ─────────────────────────────────────────────────── */}
      {hasRecording && (
        <footer className='flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 bg-zinc-900 px-6 py-3'>
          {onTogglePlay && (
            <button
              type='button'
              onClick={onTogglePlay}
              aria-label={isPlaying ? t("transport.stop") : t("transport.play")}
              className={cn(button, "px-4 text-sm text-zinc-100")}>
              {isPlaying ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
              {isPlaying ? t("transport.stop") : t("transport.play")}
              <kbd className={keyCap}>{t("transport.space")}</kbd>
            </button>
          )}

          <TimelineClock
            getPlayheadSec={getPlayheadSec}
            durationSec={durationSec}
            tempoMap={tempoMap}
            beatsPerBar={beatsPerBar}
          />

          <div className='flex items-center gap-1.5'>
            <button
              type='button'
              onClick={zoomOut}
              aria-label={t("transport.zoom_out")}
              className={iconButton}>
              <ZoomOut className='h-3.5 w-3.5' />
            </button>
            <span className='w-14 text-center text-sm font-semibold tabular-nums text-zinc-100'>
              {formatWindow(windowSec)}
            </span>
            <button
              type='button'
              onClick={zoomIn}
              aria-label={t("transport.zoom_in")}
              className={iconButton}>
              <ZoomIn className='h-3.5 w-3.5' />
            </button>
            {zoomPresets.map((preset, index) => (
              <button
                key={preset.label}
                type='button'
                onClick={() => zoomTo(preset.windowSec)}
                className={cn(button, "py-1.5")}>
                {index === zoomPresets.length - 1 && <Maximize2 className='h-3.5 w-3.5' />}
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type='button'
            onClick={() => setFollowing(!isFollowing)}
            aria-pressed={isFollowing}
            title={t("transport.follow_title")}
            className={cn(
              button,
              "py-1.5",
              isFollowing && "bg-zinc-700 text-zinc-100 hover:bg-zinc-600",
            )}>
            <LocateFixed className='h-3.5 w-3.5' />
            {t("transport.follow")}
          </button>

          <p className='ml-auto text-xs text-zinc-500'>{t("transport.keys")}</p>
        </footer>
      )}
    </div>
  );
}
