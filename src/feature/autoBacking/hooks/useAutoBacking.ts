import type {
  BackingTrack,
  Exercise,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { useEffect, useMemo } from "react";

import type { BossMusicOptions } from "../bossBacking";
import { generateBossBacking } from "../bossBacking";
import { isAutoBackingEligible } from "../eligibility";
import type { AutoBackingSummary } from "../generateAutoBacking";
import { AUTO_TRACK_IDS, generateAutoBacking } from "../generateAutoBacking";
import type { KeyHint } from "../keyDetection";
import { useAutoBackingStore } from "../store/autoBackingStore";

interface UseAutoBackingOptions {
  exercise: Exercise;
  /** The tab the session actually plays (tempo marks included). */
  measures: TablatureMeasure[] | undefined;
  tuningOffsets?: readonly number[];
  repeatCount: number;
  /** Something else owns the accompaniment right now (a Guitar Pro file, an
   *  exam's recorded backing, an ear-training riddle). */
  blocked: boolean;
  /** A boss fight: the backing plays the boss score for this phase. */
  boss?: BossMusicOptions;
}

interface UseAutoBackingResult {
  /** The tracks to play — undefined while the player has the backing off. */
  tracks: BackingTrack[] | undefined;
  summary: AutoBackingSummary | null;
  available: boolean;
}

/**
 * The generated band for the exercise on screen. The backing is worked out
 * whenever the exercise can have one — it takes a few milliseconds — so the
 * volume menu can say what it would play before the player switches it on.
 * Only PracticeSession may call this: it publishes the session's offer to the
 * shared store, and the desktop and phone layouts are both mounted at once.
 */
export function useAutoBacking({
  exercise,
  measures,
  tuningOffsets,
  repeatCount,
  blocked,
  boss,
}: UseAutoBackingOptions): UseAutoBackingResult {
  const { t } = useTranslation("session");
  const enabled = useAutoBackingStore((state) => state.enabled);
  const setSession = useAutoBackingStore((state) => state.setSession);

  const eligible =
    !blocked && isAutoBackingEligible(exercise) && !!measures?.length;

  // The tuning array is rebuilt with its owner; its contents are what matter.
  const tuningKey = tuningOffsets?.join(",") ?? "";
  // Generated scale drills know their key; that beats any guess from the notes.
  const generatorConfig = exercise._generatorConfig as KeyHint | undefined;
  const hintRoot = generatorConfig?.rootNote;
  const hintScale = generatorConfig?.scaleType;
  const keyHint = useMemo<KeyHint | undefined>(
    () =>
      hintRoot && hintScale
        ? { rootNote: hintRoot, scaleType: hintScale }
        : undefined,
    [hintRoot, hintScale],
  );

  const bossPhase = boss?.phase;
  const result = useMemo(() => {
    if (!eligible || !measures) return null;
    const tuning = tuningKey ? tuningKey.split(",").map(Number) : undefined;
    // A boss fight plays its own score; the drill's notes don't pick its harmony.
    if (bossPhase !== undefined) {
      return generateBossBacking(
        measures,
        exercise.metronomeSpeed?.recommended ?? 120,
        { phase: bossPhase },
        { tuningOffsets: tuning },
      );
    }
    return generateAutoBacking({
      measures,
      bpm: exercise.metronomeSpeed?.recommended ?? 80,
      title: exercise.title,
      description: exercise.description,
      tuningOffsets: tuning,
      repeatCount,
      keyHint,
      seed: exercise.id,
    });
  }, [
    eligible,
    measures,
    bossPhase,
    exercise.metronomeSpeed?.recommended,
    exercise.title,
    exercise.description,
    exercise.id,
    tuningKey,
    repeatCount,
    keyHint,
  ]);

  const names = useMemo<Record<string, string>>(
    () => ({
      [AUTO_TRACK_IDS.drums]: t("auto_backing.track.drums", "Drums"),
      [AUTO_TRACK_IDS.bass]: t("auto_backing.track.bass", "Bass"),
      [AUTO_TRACK_IDS.keys]: t("auto_backing.track.keys", "Pad"),
      [AUTO_TRACK_IDS.arp]: t("auto_backing.track.arp", "Arpeggio"),
    }),
    [t],
  );

  const tracks = useMemo(
    () =>
      enabled && result
        ? result.tracks.map((track) => ({
            ...track,
            name: names[track.id] ?? track.name,
          }))
        : undefined,
    [enabled, result, names],
  );

  const summary = result?.summary ?? null;
  useEffect(() => {
    setSession({ available: !!result, summary });
  }, [result, summary, setSession]);
  useEffect(
    () => () => setSession({ available: false, summary: null }),
    [setSession],
  );

  return { tracks, summary, available: !!result };
}
