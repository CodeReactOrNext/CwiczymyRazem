import { Button } from "assets/components/ui/button";
import { m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useState } from "react";

import type { NoteHuntMode } from "../../../utils/huntModes";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { ANSWER_CHIME_LEAD_MS } from "../helpers/answerChime";
import { loadClickHuntNoteSoundPreference } from "../helpers/clickHuntNoteSound";
import { INTERVAL_PHRASE_HOLD_MS } from "../helpers/intervalPreview";
import { useIntervalRoundWords } from "../hooks/useIntervalRoundWords";
import type { HuntRoundEnd } from "../hooks/useNoteHuntRotation";
import { Strip, type VerdictTone } from "./SessionVerdict";

/** How long a round's verdict stands before the next note comes up by itself —
 *  both hands are on the guitar. A missed round has names to read. */
const ROUND_VERDICT_MS: Record<HuntRoundEnd["kind"], number> = { solved: 2000, timeUp: 5000 };

const INTERVAL_TIME_UP_MS = 3000;
const INTERVAL_SILENT_MS = 1800;

/** An interval round stands until its phrase has been heard, or read when muted. */
const intervalVerdictMs = (kind: HuntRoundEnd["kind"]) =>
  kind === "timeUp"
    ? INTERVAL_TIME_UP_MS
    : loadClickHuntNoteSoundPreference()
      ? ANSWER_CHIME_LEAD_MS + INTERVAL_PHRASE_HOLD_MS
      : INTERVAL_SILENT_MS;

export const getRoundVerdictMs = (kind: HuntRoundEnd["kind"], mode: NoteHuntMode) =>
  mode === "intervalClick" ? intervalVerdictMs(kind) : ROUND_VERDICT_MS[kind];

export const ROUND_VERDICT_TONE: Record<HuntRoundEnd["kind"], VerdictTone> = { solved: "good", timeUp: "plain" };

interface RoundStripProps {
  kind: HuntRoundEnd["kind"];
  title: string;
  detail: string;
  holdMs: number;
  onContinue: () => void;
}

const RoundStrip = ({ kind, title, detail, holdMs, onContinue }: RoundStripProps) => {
  const { t } = useTranslation("session");
  return (
    <Strip tone={ROUND_VERDICT_TONE[kind]} title={title} detail={detail}>
      <Button size='lg' onClick={onContinue} className='relative overflow-hidden'>
        {t("verdict.continue")}
        <m.span
          aria-hidden
          className='absolute inset-0 origin-left bg-black/10'
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: holdMs / 1000, ease: "linear" }}
        />
      </Button>
    </Strip>
  );
};

interface HuntRoundStripProps {
  roundEnd: HuntRoundEnd;
  onContinue: () => void;
}

/** The answer to one round of a hunt, over the session bar. The bar under it
 *  stays as it was: the session is not over, only its clock is held. */
export const HuntRoundStrip = ({ roundEnd, onContinue }: HuntRoundStripProps) => {
  const { t } = useTranslation("session");
  const { noteHunt, huntTarget } = useNoteMatchingContext();
  const octaves = noteHunt?.octaves ?? [];
  const missed = octaves.filter((octave) => !noteHunt?.foundOctaves.includes(octave));
  const solved = roundEnd.kind === "solved";

  return (
    <RoundStrip
      kind={roundEnd.kind}
      holdMs={ROUND_VERDICT_MS[roundEnd.kind]}
      onContinue={onContinue}
      title={solved
        ? t("note_hunt.round_solved", { total: octaves.length, seconds: roundEnd.seconds })
        : t("note_hunt.round_missed", { found: octaves.length - missed.length, total: octaves.length })}
      detail={solved
        ? t("note_hunt.round_next")
        : t("note_hunt.round_missed_detail", { notes: missed.map((octave) => `${huntTarget ?? ""}${octave}`).join(", ") })}
    />
  );
};

/** The same answer to a round of the interval drill. */
export const IntervalRoundStrip = ({ roundEnd, isExamMode, onContinue }: HuntRoundStripProps & { isExamMode: boolean }) => {
  const words = useIntervalRoundWords(roundEnd, isExamMode);
  const [holdMs] = useState(() => intervalVerdictMs(roundEnd.kind));
  return <RoundStrip kind={roundEnd.kind} holdMs={holdMs} onContinue={onContinue} {...words} />;
};
