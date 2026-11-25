import { intervalBySemitones, semitonesBetween } from "feature/exercisePlan/intervals/intervalDefinitions";
import { useTranslation } from "hooks/useTranslation";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import type { HuntRoundEnd } from "./useNoteHuntRotation";

type Cell = { string: number; fret: number };

const cellOf = (key: string | undefined): Cell | null => {
  if (!key) return null;
  const [string, fret] = key.split("-").map(Number);
  return { string, fret };
};

/** What the verdict on an interval round says: the sum, and the way there. */
export const useIntervalRoundWords = (roundEnd: HuntRoundEnd, isExamMode: boolean) => {
  const { t } = useTranslation("session");
  const { intervalClickHunt, customGoalPrompt, huntTarget } = useNoteMatchingContext();

  const root = customGoalPrompt?.title ?? "";
  const target = huntTarget ?? "";
  const interval = intervalBySemitones(semitonesBetween(root, target))?.name ?? "";

  if (roundEnd.kind === "timeUp") {
    return {
      title: t("interval_click.time_up"),
      // An exam doesn't hand out answers.
      detail: isExamMode ? t("interval_click.next_round") : t("interval_click.answer_was", { root, interval, target }),
    };
  }

  const from = intervalClickHunt?.anchor ?? null;
  const to = cellOf(intervalClickHunt?.foundIntervalKeys[0]);
  const strings = from && to ? from.string - to.string : 0;
  const frets = from && to ? to.fret - from.fret : 0;
  const path =
    from && to
      ? [
          strings === 0
            ? t("interval_click.same_string")
            : t(strings > 0 ? "interval_click.strings_higher" : "interval_click.strings_lower", { count: Math.abs(strings) }),
          frets === 0
            ? t("interval_click.same_fret")
            : t(frets > 0 ? "interval_click.frets_up" : "interval_click.frets_down", { count: Math.abs(frets) }),
        ].join(", ")
      : t("interval_click.next_round");

  return { title: t("interval_click.solved", { root, interval, target }), detail: path };
};
