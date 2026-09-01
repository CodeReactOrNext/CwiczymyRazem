import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { BackingTrackImportResult, BackingTracksApi } from "types/backingTracks";

import {
  createTrackObjectUrl,
  getBackingTrackApi,
  isDesktopBackingAvailable,
} from "../services/backingTrackBridge";
import {
  getYouTubeBackingConfig,
  saveYouTubeBackingConfig,
} from "../services/songBackingSync.service";
import type {
  BackingAlignment,
  BackingSource,
  BackingStem,
  BackingTrackAssignment,
  BackingTrackMeta,
  YouTubeBackingConfig,
} from "../types/backingTrack.types";
import { DEFAULT_ALIGNMENT, DEFAULT_STEM } from "../types/backingTrack.types";
import type { ScoreClock } from "../utils/backingSync";
import { achievableSessionBpms } from "../utils/backingSync";
import type { RecordingTempoMap } from "../utils/tempoMap";
import { createRecordingTempoMap } from "../utils/tempoMap";
import type { PlayableStem } from "./useFileStemsPlayer";
import { useFileStemsPlayer } from "./useFileStemsPlayer";
import { useYouTubeBackingPlayer } from "./useYouTubeBackingPlayer";
import type { YouTubeWaveform } from "./useYouTubeWaveform";
import { useYouTubeWaveform } from "./useYouTubeWaveform";

/** Slider drags fire continuously — settle before touching disk or Firestore. */
const PERSIST_DEBOUNCE_MS = 400;

// Neither the preload bridge nor the stored source ever changes for the life of
// the page, so there is nothing to subscribe to. useSyncExternalStore is here
// purely for its server snapshot: reading window/localStorage during the first
// client render would otherwise disagree with the server's HTML.
const subscribeNever = () => () => {};
const noDesktopOnServer = () => false;
const noStoredSourceOnServer = () => null;
const noCinemaOnServer = () => false;
const noVideoOverlayOnServer = () => false;

/** Stable identity, so deriving "no stems loaded" never looks like a change. */
const EMPTY_URLS: Record<string, string> = {};

const sourceStorageKey = (songId: string) => `rq_backing_source_${songId}`;
/** Whether the YouTube video plays over a file-based backing track. Per song,
 *  unlike cinema: it depends on there being a video worth watching for *this*
 *  song, and on the files being the better sound for it. */
const videoOverlayStorageKey = (songId: string) => `rq_backing_video_${songId}`;
/** Cinema is a way of practising, not a property of one song — stored globally. */
const CINEMA_STORAGE_KEY = "rq_backing_cinema";

const readStoredSource = (songId: string): BackingSource | null => {
  try {
    const raw = localStorage.getItem(sourceStorageKey(songId));
    return raw === "file" || raw === "youtube" || raw === "off" ? raw : null;
  } catch {
    return null;
  }
};

const readStoredCinema = (): boolean => {
  try {
    return localStorage.getItem(CINEMA_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const readStoredVideoOverlay = (songId: string): boolean => {
  try {
    return localStorage.getItem(videoOverlayStorageKey(songId)) === "1";
  } catch {
    return false;
  }
};

const writeStoredSource = (songId: string, source: BackingSource) => {
  try {
    localStorage.setItem(sourceStorageKey(songId), source);
  } catch {
    /* private mode — the choice just won't survive a reload */
  }
};

interface UseBackingTrackSessionOptions {
  /** Null outside a song practice session — the hook then stays completely idle. */
  songId: string | null;
  userId: string | null;
  /** The Guitar Pro file's own tempo, used as the default tempo of a recording. */
  gpTempo: number | null;
  isPlaying: boolean;
  startTime: number | null;
  /**
   * The session's tempo curve, when the tab has one.
   *
   * Wall time from `startTime` counts *warped* beats — the metronome's own
   * coordinate — and every bar of tempo automation makes that a different
   * number from the bar of the score being played. Every clock in here needs
   * the score beat, so the crossing has to come from the session that owns it.
   *
   * A ref because it is rebuilt whenever a bar is pinned: a value would restart
   * the sync loops on every pixel of a drag.
   */
  scoreClockRef: MutableRefObject<ScoreClock | null>;
  /**
   * Score beat the next Play will start from, asked at draw time.
   *
   * Only consulted while the transport is stopped — see `sessionBeats`. A
   * function rather than a value because seeking while stopped moves it without
   * touching any React state, so a rendered copy would go stale silently.
   */
  getResumeBeat?: () => number;
  effectiveBpm: number;
  /** Metronome tempo before the practice speed multiplier — the domain the
   *  BPM control works in, so tempo suggestions can be handed back in it. */
  sessionBpm: number;
}

export interface BackingTrackController {
  enabled: boolean;
  /** False on the web build: no local files there, YouTube only. */
  desktopAvailable: boolean;

  source: BackingSource;
  setSource: (source: BackingSource) => void;

  library: BackingTrackMeta[];
  isImporting: boolean;
  /** Opens a multi-select picker and adds everything chosen as stems. */
  importTracks: () => Promise<void>;
  /** Imports audio files dropped anywhere on the alignment screen. */
  importDroppedFiles: (files: File[]) => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  /** Layers of the recording, in listening order. */
  stems: BackingStem[];
  addStem: (trackId: string) => void;
  removeStem: (trackId: string) => void;
  setStem: (
    trackId: string,
    patch: Partial<Omit<BackingStem, "trackId">>,
    options?: { realign?: boolean },
  ) => void;
  /** Only this stem audible, or all of them again when it already was. */
  soloStem: (trackId: string) => void;

  youtubeVideoId: string | null;
  setYouTubeVideoId: (videoId: string | null) => void;
  /** Pass to react-youtube's onReady so the sync loop can drive the iframe. */
  onYouTubePlayerReady: (event: { target: unknown }) => void;
  /** False when the video cannot hold the session tempo, so it free-runs. */
  youtubeCanFollowTempo: boolean;
  youtubeAppliedRate: number;
  /** Session tempos this video locks to exactly — what to offer when it can't
   *  hold the current one. Empty unless YouTube is the active source. */
  youtubeAchievableBpms: number[];
  /** Cinema mode: the video fills the session behind the notation. */
  isCinema: boolean;
  setCinema: (on: boolean) => void;

  /** Picture from YouTube over sound from local files. The user's choice, not
   *  its effect: it stays on while a video is still being pasted in. Only ever
   *  true while the file source is active — when YouTube *is* the source, the
   *  same video is already on screen with its own audio. */
  videoOverlay: boolean;
  setVideoOverlay: (on: boolean) => void;
  /** The video layer's own alignment, editable while the files are the sound —
   *  a video and a local recording almost never start at the same point. */
  videoAlignment: BackingAlignment;
  setVideoAlignment: (patch: Partial<BackingAlignment>, options?: { realign?: boolean }) => void;
  /** The video layer's own tempo map — see `tempoMap`. */
  videoTempoMap: RecordingTempoMap;

  /** Alignment of whichever source is active. */
  alignment: BackingAlignment;
  /** `realign: false` skips the immediate re-seek — for continuous gestures like
   *  dragging the alignment grid, where one seek per pointer event would stutter. */
  setAlignment: (patch: Partial<BackingAlignment>, options?: { realign?: boolean }) => void;
  /**
   * Where the tab's bars fall inside the active recording, anchors and all.
   *
   * The single source of truth for that mapping: with a drifting band,
   * `sourceBpm` and `offsetMs` no longer describe the timeline between them, so
   * every lane, clock and player reads this instead of doing its own arithmetic.
   */
  tempoMap: RecordingTempoMap;
  /** Blob URL per stem, so each lane can draw its own waveform. */
  stemUrls: Record<string, string>;
  /** The session clock, forwarded so alignment tools can measure against it. */
  startTime: number | null;
  effectiveBpm: number;

  /**
   * The video's waveform, learned by listening to it play.
   *
   * Lives on the session rather than on the Align screen so it fills in during
   * ordinary practice — the screen reads it, it does not drive it.
   */
  youtubeWaveform: YouTubeWaveform;
  /** Live sync error in ms — polled by the panel, never rendered from the session. */
  driftMsRef: MutableRefObject<number>;
  /** Handed straight back out so the alignment screen's lanes read the same
   *  clock the players do — see the option of the same name. */
  scoreClockRef: MutableRefObject<ScoreClock | null>;
  /** Handed back out for the lanes — see the option of the same name. */
  getResumeBeat?: () => number;
  playbackRate: number;
  durationSec: number | null;
  isTrackLoading: boolean;
  error: string | null;
}

/**
 * One place that owns the session's backing track: which source is active, how
 * it is aligned with the tab, and the players that keep it there.
 *
 * Mounted once per session (in PracticeSession, never in a view component —
 * the desktop and mobile views both mount at the same time, so anything holding
 * audio has to live above them).
 */
export function useBackingTrackSession({
  songId,
  userId,
  gpTempo,
  isPlaying,
  scoreClockRef,
  getResumeBeat,
  startTime,
  effectiveBpm,
  sessionBpm,
}: UseBackingTrackSessionOptions): BackingTrackController {
  const enabled = !!songId;

  const desktopAvailable = useSyncExternalStore(
    subscribeNever,
    isDesktopBackingAvailable,
    noDesktopOnServer,
  );
  const storedSource = useSyncExternalStore(
    subscribeNever,
    () => (songId ? readStoredSource(songId) : null),
    noStoredSourceOnServer,
  );
  const storedVideoOverlay = useSyncExternalStore(
    subscribeNever,
    () => (songId ? readStoredVideoOverlay(songId) : false),
    noVideoOverlayOnServer,
  );

  const [library, setLibrary] = useState<BackingTrackMeta[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [assignment, setAssignment] = useState<BackingTrackAssignment | null>(null);
  const [youtube, setYouTube] = useState<YouTubeBackingConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Which source the user picked *this* session, if any. Scoped to a song so it
  // can't leak across an exercise switch.
  const [sourceOverride, setSourceOverride] = useState<{
    songId: string;
    source: BackingSource;
  } | null>(null);
  // Object URLs for the loaded stems, tagged with the stem list they belong to
  // so a stale set is never shown against a changed one.
  const [loadedUrls, setLoadedUrls] = useState<{
    key: string;
    urls: Record<string, string>;
  } | null>(null);
  // Bumped on every offset change so the players re-align at once instead of
  // waiting for their correction loop — a nudge has to be audible immediately.
  // One key per layer: shifting the video must not re-seek the audio, which
  // would put an audible glitch into the very thing being aligned against.
  const [realignKey, setRealignKey] = useState(0);
  const [videoRealignKey, setVideoRealignKey] = useState(0);
  const [cinemaOverride, setCinemaOverride] = useState<boolean | null>(null);
  const [videoOverlayOverride, setVideoOverlayOverride] = useState<{
    songId: string;
    on: boolean;
  } | null>(null);

  // A recording of this song was played at the score's tempo unless told
  // otherwise, so that is the default divisor for the playback rate.
  const defaultSourceBpm = gpTempo && gpTempo > 0 ? gpTempo : DEFAULT_ALIGNMENT.sourceBpm;

  // ── Stored config for this song ───────────────────────────────────────────

  useEffect(() => {
    if (!songId) return;
    const api = getBackingTrackApi();

    let cancelled = false;
    Promise.resolve(api ? api.getAssignment(songId) : null)
      .then((stored) => {
        if (!cancelled) setAssignment(stored);
      })
      .catch(() => {
        if (!cancelled) setAssignment(null);
      });

    return () => {
      cancelled = true;
    };
  }, [songId, desktopAvailable]);

  useEffect(() => {
    if (!songId || !userId) return;

    let cancelled = false;
    getYouTubeBackingConfig(userId, songId)
      .then((stored) => {
        if (!cancelled) setYouTube(stored);
      })
      .catch(() => {
        if (!cancelled) setYouTube(null);
      });

    return () => {
      cancelled = true;
    };
  }, [songId, userId]);

  const refreshLibrary = useCallback(() => {
    const api = getBackingTrackApi();
    if (!api) return;
    api
      .listTracks()
      .then(setLibrary)
      .catch(() => setLibrary([]));
  }, []);

  useEffect(() => {
    if (enabled && desktopAvailable) refreshLibrary();
  }, [enabled, desktopAvailable, refreshLibrary]);

  // ── Active source ─────────────────────────────────────────────────────────
  //
  // Derived rather than initialised in an effect: the stored config arrives
  // asynchronously, so an "init once" effect would have to guess when to run.
  // An explicit choice this session always wins over the derivation.
  const resolvedSource = useMemo<BackingSource>(() => {
    if (!songId) return "off";
    // A file was chosen on some other machine — nothing to play here.
    if (storedSource === "file" && !desktopAvailable) return youtube?.videoId ? "youtube" : "off";
    if (storedSource) return storedSource;
    if (assignment?.stems?.length && desktopAvailable) return "file";
    if (youtube?.videoId) return "youtube";
    return "off";
  }, [songId, storedSource, desktopAvailable, assignment, youtube]);

  const source =
    sourceOverride && sourceOverride.songId === songId ? sourceOverride.source : resolvedSource;

  const videoOverlay =
    source === "file" &&
    (videoOverlayOverride && videoOverlayOverride.songId === songId
      ? videoOverlayOverride.on
      : storedVideoOverlay);

  // localStorage can't be read during the first client render without
  // disagreeing with the server's HTML — same reason as the stored source above.
  const storedCinema = useSyncExternalStore(subscribeNever, readStoredCinema, noCinemaOnServer);
  // Only while a video is actually on screen — cinema over sound alone would be
  // a black rectangle.
  const isCinema =
    (cinemaOverride ?? storedCinema) &&
    !!youtube?.videoId &&
    (source === "youtube" || videoOverlay);

  const setCinema = useCallback((on: boolean) => {
    setCinemaOverride(on);
    try {
      localStorage.setItem(CINEMA_STORAGE_KEY, on ? "1" : "0");
    } catch {
      /* private mode — the choice just won't survive a reload */
    }
  }, []);

  const setSource = useCallback(
    (next: BackingSource) => {
      if (!songId) return;
      setSourceOverride({ songId, source: next });
      setError(null);
      writeStoredSource(songId, next);
    },
    [songId],
  );

  const setVideoOverlay = useCallback(
    (on: boolean) => {
      if (!songId) return;
      setVideoOverlayOverride({ songId, on });
      try {
        localStorage.setItem(videoOverlayStorageKey(songId), on ? "1" : "0");
      } catch {
        /* private mode — the choice just won't survive a reload */
      }
    },
    [songId],
  );

  // ── Persistence (debounced — sliders fire on every pixel) ─────────────────

  const persistTimerRef = useRef<number | null>(null);
  const pendingRef = useRef<{
    file: Partial<BackingTrackAssignment>;
    yt: Partial<YouTubeBackingConfig>;
  }>({ file: {}, yt: {} });

  const flushPersist = useCallback(() => {
    const { file, yt } = pendingRef.current;
    pendingRef.current = { file: {}, yt: {} };
    if (!songId) return;

    const api = getBackingTrackApi();
    if (api && Object.keys(file).length > 0) {
      api.saveAssignment(songId, file).catch(() => {
        /* best-effort — the in-memory state already reflects the change */
      });
    }
    if (userId && Object.keys(yt).length > 0) {
      saveYouTubeBackingConfig(userId, songId, yt).catch(() => {
        /* best-effort */
      });
    }
  }, [songId, userId]);

  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current !== null) window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null;
      flushPersist();
    }, PERSIST_DEBOUNCE_MS);
  }, [flushPersist]);

  // Leaving the session mid-drag must not lose the last change.
  useEffect(
    () => () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
        flushPersist();
      }
    },
    [flushPersist],
  );

  // ── Active alignment (whichever source is selected) ───────────────────────

  const fileAlignment = useMemo<BackingAlignment>(
    () => ({
      offsetMs: assignment?.offsetMs ?? DEFAULT_ALIGNMENT.offsetMs,
      sourceBpm: assignment?.sourceBpm ?? defaultSourceBpm,
      tempoAnchors: assignment?.tempoAnchors ?? [],
      volume: assignment?.volume ?? DEFAULT_ALIGNMENT.volume,
      muted: assignment?.muted ?? DEFAULT_ALIGNMENT.muted,
    }),
    [assignment, defaultSourceBpm],
  );

  const videoAlignment = useMemo<BackingAlignment>(
    () => ({
      offsetMs: youtube?.offsetMs ?? DEFAULT_ALIGNMENT.offsetMs,
      sourceBpm: youtube?.sourceBpm ?? defaultSourceBpm,
      tempoAnchors: youtube?.tempoAnchors ?? [],
      volume: youtube?.volume ?? DEFAULT_ALIGNMENT.volume,
      muted: youtube?.muted ?? DEFAULT_ALIGNMENT.muted,
    }),
    [youtube, defaultSourceBpm],
  );

  const alignment = source === "youtube" ? videoAlignment : fileAlignment;

  /**
   * Where the tab's bars fall inside whichever recording is playing.
   *
   * One object rather than passing `sourceBpm` and `offsetMs` around, because
   * with anchors in play the two no longer describe the timeline between them —
   * only the map does, and every lane, clock and player has to read the same one
   * or they drift apart.
   */
  const tempoMap = useMemo(
    () =>
      createRecordingTempoMap({
        anchors: alignment.tempoAnchors,
        offsetMs: alignment.offsetMs,
        sourceBpm: alignment.sourceBpm,
      }),
    [alignment.tempoAnchors, alignment.offsetMs, alignment.sourceBpm],
  );

  const videoTempoMap = useMemo(
    () =>
      createRecordingTempoMap({
        anchors: videoAlignment.tempoAnchors,
        offsetMs: videoAlignment.offsetMs,
        sourceBpm: videoAlignment.sourceBpm,
      }),
    [videoAlignment.tempoAnchors, videoAlignment.offsetMs, videoAlignment.sourceBpm],
  );

  /**
   * Writes one layer's alignment. The layers stay independent on purpose: with
   * the video over a file, the recording and the video are two different takes
   * of the song, and each sits where it sits against the tab.
   */
  const patchAlignment = useCallback(
    (
      layer: "file" | "youtube",
      patch: Partial<BackingAlignment>,
      options?: { realign?: boolean },
    ) => {
      if (layer === "youtube") {
        setYouTube((prev) => ({
          videoId: prev?.videoId ?? null,
          offsetMs: prev?.offsetMs ?? DEFAULT_ALIGNMENT.offsetMs,
          sourceBpm: prev?.sourceBpm ?? defaultSourceBpm,
          tempoAnchors: prev?.tempoAnchors ?? [],
          volume: prev?.volume ?? DEFAULT_ALIGNMENT.volume,
          muted: prev?.muted ?? DEFAULT_ALIGNMENT.muted,
          ...patch,
        }));
        pendingRef.current.yt = { ...pendingRef.current.yt, ...patch };
      } else {
        setAssignment((prev) => ({
          stems: prev?.stems ?? [],
          offsetMs: prev?.offsetMs ?? DEFAULT_ALIGNMENT.offsetMs,
          sourceBpm: prev?.sourceBpm ?? defaultSourceBpm,
          tempoAnchors: prev?.tempoAnchors ?? [],
          volume: prev?.volume ?? DEFAULT_ALIGNMENT.volume,
          muted: prev?.muted ?? DEFAULT_ALIGNMENT.muted,
          ...patch,
        }));
        pendingRef.current.file = { ...pendingRef.current.file, ...patch };
      }
      if ("offsetMs" in patch && options?.realign !== false) {
        if (layer === "youtube") setVideoRealignKey((key) => key + 1);
        else setRealignKey((key) => key + 1);
      }
      schedulePersist();
    },
    [defaultSourceBpm, schedulePersist],
  );

  const setAlignment = useCallback(
    (patch: Partial<BackingAlignment>, options?: { realign?: boolean }) =>
      patchAlignment(source === "youtube" ? "youtube" : "file", patch, options),
    [patchAlignment, source],
  );

  const setVideoAlignment = useCallback(
    (patch: Partial<BackingAlignment>, options?: { realign?: boolean }) =>
      patchAlignment("youtube", patch, options),
    [patchAlignment],
  );

  // ── File source ───────────────────────────────────────────────────────────

  const stems = useMemo(() => assignment?.stems ?? [], [assignment]);
  /** The stems the players should be on right now. */
  const activeStems = useMemo(() => (source === "file" ? stems : []), [source, stems]);

  /** Writes a new stem list, keeping the alignment that describes it. */
  const commitStems = useCallback(
    (next: (previous: BackingStem[]) => BackingStem[]) => {
      setAssignment((prev) => {
        const stemsNext = next(prev?.stems ?? []);
        pendingRef.current.file = {
          ...pendingRef.current.file,
          stems: stemsNext,
        };
        return {
          // Alignment carries over on purpose: stems are layers of one
          // performance, so adding or dropping one changes nothing about where
          // that performance sits against the tab.
          stems: stemsNext,
          offsetMs: prev?.offsetMs ?? DEFAULT_ALIGNMENT.offsetMs,
          sourceBpm: prev?.sourceBpm ?? defaultSourceBpm,
          volume: prev?.volume ?? DEFAULT_ALIGNMENT.volume,
          muted: prev?.muted ?? DEFAULT_ALIGNMENT.muted,
        };
      });
      schedulePersist();
      setError(null);
    },
    [defaultSourceBpm, schedulePersist],
  );

  const addStem = useCallback(
    (trackId: string) => {
      commitStems((previous) =>
        previous.some((stem) => stem.trackId === trackId)
          ? previous
          : [...previous, { trackId, ...DEFAULT_STEM }],
      );
      setSource("file");
    },
    [commitStems, setSource],
  );

  const removeStem = useCallback(
    (trackId: string) => {
      commitStems((previous) => previous.filter((stem) => stem.trackId !== trackId));
    },
    [commitStems],
  );

  const setStem = useCallback(
    (
      trackId: string,
      patch: Partial<Omit<BackingStem, "trackId">>,
      options?: { realign?: boolean },
    ) => {
      commitStems((previous) =>
        previous.map((stem) => (stem.trackId === trackId ? { ...stem, ...patch } : stem)),
      );
      if ("offsetMs" in patch && options?.realign !== false) setRealignKey((key) => key + 1);
    },
    [commitStems],
  );

  const soloStem = useCallback(
    (trackId: string) => {
      commitStems((previous) => {
        // Already soloed — this is the way back to hearing everything.
        const isSoloed = previous.every((stem) => (stem.trackId === trackId) !== stem.muted);
        return previous.map((stem) => ({
          ...stem,
          muted: isSoloed ? false : stem.trackId !== trackId,
        }));
      });
    },
    [commitStems],
  );

  /** Shared by the picker and by dropping files — only the source differs. */
  const runImport = useCallback(
    async (load: (api: BackingTracksApi) => Promise<BackingTrackImportResult[]>) => {
      const api = getBackingTrackApi();
      if (!api) return;

      setIsImporting(true);
      setError(null);
      try {
        const results = await load(api);
        const imported = results.filter((result) => result.ok).map((result) => result.track);
        const failures = results.filter((result) => !result.ok);

        if (imported.length > 0) {
          refreshLibrary();
          commitStems((previous) => {
            const known = new Set(previous.map((stem) => stem.trackId));
            return [
              ...previous,
              ...imported
                .filter((track) => !known.has(track.id))
                .map((track) => ({ trackId: track.id, ...DEFAULT_STEM })),
            ];
          });
          setSource("file");
        }

        // Reported after the good ones are in, so a bad file costs nothing else.
        if (failures.length > 0) {
          setError(
            failures.length === 1
              ? `${failures[0].fileName}: ${failures[0].message}`
              : `${failures.length} files could not be imported.`,
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed.");
      } finally {
        setIsImporting(false);
      }
    },
    [refreshLibrary, commitStems, setSource],
  );

  const importTracks = useCallback(() => runImport((api) => api.importTracks()), [runImport]);

  /**
   * Imports files dropped onto the app.
   *
   * The path has to be read in the preload: Electron removed the `path` it used
   * to put on File objects, so the renderer alone cannot tell where a dropped
   * file lives. A file with no path (dragged out of a browser, say) is reported
   * rather than silently skipped.
   */
  const importDroppedFiles = useCallback(
    async (files: File[]) => {
      const api = getBackingTrackApi();
      if (!api || files.length === 0) return;

      const paths = files
        .map((file) => api.pathForFile(file))
        .filter((filePath): filePath is string => !!filePath);

      if (paths.length === 0) {
        setError("Those files have no path on disk — use “Add files” instead.");
        return;
      }
      await runImport((backing) => backing.importPaths(paths));
    },
    [runImport],
  );

  const deleteTrack = useCallback(
    async (trackId: string) => {
      const api = getBackingTrackApi();
      if (!api) return;
      await api.deleteTrack(trackId).catch(() => {
        /* already gone */
      });
      refreshLibrary();
      removeStem(trackId);
    },
    [refreshLibrary, removeStem],
  );

  // Bytes → Blob URL, one per stem. Revoked as stems come and go so a long
  // session doesn't leak a decoded copy of everything ever auditioned.
  const activeStemKey = activeStems.map((stem) => stem.trackId).join("|");
  useEffect(() => {
    if (!activeStemKey) return;
    const trackIds = activeStemKey.split("|");

    let cancelled = false;
    const created: string[] = [];

    Promise.all(
      trackIds.map((trackId) =>
        createTrackObjectUrl(trackId)
          .then((url) => [trackId, url] as const)
          .catch(() => [trackId, null] as const),
      ),
    ).then((entries) => {
      if (cancelled) {
        for (const [, url] of entries) if (url) URL.revokeObjectURL(url);
        return;
      }
      const urls: Record<string, string> = {};
      let missing = 0;
      for (const [trackId, url] of entries) {
        if (!url) {
          missing += 1;
          continue;
        }
        created.push(url);
        urls[trackId] = url;
      }
      setLoadedUrls({ key: activeStemKey, urls });
      if (missing > 0) setError("Some stems are missing from the library.");
    });

    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [activeStemKey]);

  const stemUrls = loadedUrls?.key === activeStemKey ? loadedUrls.urls : EMPTY_URLS;

  const playableStems = useMemo<PlayableStem[]>(
    () =>
      activeStems.map((stem) => ({
        trackId: stem.trackId,
        src: stemUrls[stem.trackId] ?? null,
        volume: stem.volume,
        muted: stem.muted,
        offsetMs: stem.offsetMs,
      })),
    [activeStems, stemUrls],
  );

  // "Loading" is simply the gap before every stem's bytes have arrived.
  const isTrackLoading =
    activeStems.length > 0 && playableStems.some((stem) => !stem.src) && !error;

  // ── Players ───────────────────────────────────────────────────────────────

  const filePlayer = useFileStemsPlayer({
    stems: playableStems,
    isPlaying: enabled && isPlaying,
    startTime,
    scoreClockRef,
    effectiveBpm,
    offsetMs: alignment.offsetMs,
    // Carries the recording's own tempo, and its curve where bars have been
    // pinned — so nothing here needs a second copy of it to disagree with.
    tempoMap,
    masterVolume: alignment.volume,
    masterMuted: alignment.muted,
    realignKey,
  });

  // The video runs off its own alignment either way — when YouTube is the
  // source that alignment *is* the active one, and when it only supplies the
  // picture this is what keeps the frame where it belongs.
  const youtubePlayer = useYouTubeBackingPlayer({
    videoId: source === "youtube" || videoOverlay ? (youtube?.videoId ?? null) : null,
    isPlaying: enabled && isPlaying,
    startTime,
    scoreClockRef,
    effectiveBpm,
    sourceBpm: videoAlignment.sourceBpm,
    offsetMs: videoAlignment.offsetMs,
    tempoMap: videoTempoMap,
    // Over a file the video is picture only: two takes of one song playing at
    // once is noise, and the files are the take the user chose to hear.
    volume: videoOverlay ? 0 : videoAlignment.volume,
    muted: videoOverlay || videoAlignment.muted,
    realignKey: videoRealignKey,
  });

  /**
   * The waveform the session *reads*. It never listens.
   *
   * Learning it alongside practice was meant to be free — the video is playing
   * anyway — and it is not: a tab capture, a second audio graph and a buffer
   * growing at 120 values a second all sit on the thread that has to keep a
   * metronome, a tab and a microphone in time, and that showed up as a session
   * that stutters. Capturing is now a job of its own, done deliberately in the
   * Align screen's capture dialog and stored; this copy just reads the store.
   */
  const youtubeWaveform = useYouTubeWaveform({
    videoId: source === "youtube" || videoOverlay ? (youtube?.videoId ?? null) : null,
    getClock: youtubePlayer.getPlayerClock,
    listen: false,
  });

  const setYouTubeVideoId = useCallback(
    (videoId: string | null) => {
      setYouTube((prev) => ({
        offsetMs: prev?.offsetMs ?? DEFAULT_ALIGNMENT.offsetMs,
        sourceBpm: prev?.sourceBpm ?? defaultSourceBpm,
        volume: prev?.volume ?? DEFAULT_ALIGNMENT.volume,
        muted: prev?.muted ?? DEFAULT_ALIGNMENT.muted,
        videoId,
      }));
      pendingRef.current.yt = { ...pendingRef.current.yt, videoId };
      schedulePersist();
      setError(null);
      // Choosing a video normally means wanting to hear it — except while local
      // files are the sound, where the video was asked for as picture only.
      if (videoId && source !== "file") setSource("youtube");
    },
    [defaultSourceBpm, schedulePersist, setSource, source],
  );

  const playbackRate =
    source === "youtube" ? youtubePlayer.appliedRate : effectiveBpm / (alignment.sourceBpm || 1);

  // The achievable rates are tempos in the *effective* domain; the BPM control
  // lives before the speed multiplier, so convert back through the same ratio.
  const youtubeAchievableBpms = useMemo(() => {
    if (source !== "youtube" && !videoOverlay) return [];
    const toSessionDomain = effectiveBpm > 0 ? sessionBpm / effectiveBpm : 1;
    return achievableSessionBpms(videoAlignment.sourceBpm, youtubePlayer.availableRates).map(
      (bpm) => Math.round(bpm * toSessionDomain),
    );
  }, [
    source,
    videoOverlay,
    videoAlignment.sourceBpm,
    youtubePlayer.availableRates,
    sessionBpm,
    effectiveBpm,
  ]);

  return {
    enabled,
    desktopAvailable,
    source,
    setSource,
    library,
    isImporting,
    importTracks,
    importDroppedFiles,
    deleteTrack,
    stems,
    addStem,
    removeStem,
    setStem,
    soloStem,
    youtubeVideoId: youtube?.videoId ?? null,
    setYouTubeVideoId,
    onYouTubePlayerReady:
      youtubePlayer.handleReady as BackingTrackController["onYouTubePlayerReady"],
    youtubeCanFollowTempo: youtubePlayer.canFollowTempo,
    youtubeAppliedRate: youtubePlayer.appliedRate,
    youtubeAchievableBpms,
    isCinema,
    setCinema,
    videoOverlay,
    setVideoOverlay,
    videoAlignment,
    setVideoAlignment,
    videoTempoMap,
    alignment,
    setAlignment,
    tempoMap,
    stemUrls,
    startTime,
    effectiveBpm,
    youtubeWaveform,
    driftMsRef: source === "youtube" ? youtubePlayer.driftMsRef : filePlayer.driftMsRef,
    scoreClockRef,
    getResumeBeat,
    playbackRate,
    durationSec: filePlayer.durationSec,
    isTrackLoading,
    error: error ?? filePlayer.error,
  };
}
