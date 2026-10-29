import type { BossFightConfig } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { useEffect, useRef } from "react";

import { bossCuePlayer } from "../audio/bossCuePlayer";
import { BossArena } from "../components/BossArena";
import { BossDraft } from "../components/BossDraft";
import { BossPhaseDirector } from "../components/BossPhaseDirector";
import { BossPhaseIntro } from "../components/BossPhaseIntro";
import { BossResultOverlay } from "../components/BossResultOverlay";
import { BossSounds } from "../components/BossSounds";
import { BossWebOverlay } from "../components/BossWebOverlay";
import { ChangesBoard } from "../components/ChangesBoard";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossDefinition, BossDifficulty, BossRecord } from "../types/boss.types";
import type { BossFightState } from "../utils/bossEngine";
import { phaseBpm, phaseNumber, runScore } from "../utils/bossEngine";
import type { RunResult } from "../utils/bossProgress";
import { isNewRecord } from "../utils/bossProgress";
import type { PhasePlan } from "../utils/phaseGenerator";

interface UseBossFightOptions {
  boss: BossDefinition;
  /** The player's record so far — shown in the arena, beaten or not at the end. */
  record: BossRecord;
  difficulty: BossDifficulty;
  /** The savepoint the run starts at, 1-based. */
  startPhase: number;
  /** Banks a finished run. */
  onRunEnd: (run: RunResult) => void;
}

interface BossFight {
  config: BossFightConfig;
  /** The phase being fought — its drill is the tab the session plays… */
  plan: PhasePlan;
  /** …at this tempo, the run's boons on it. */
  bpm: number;
}

/**
 * Runs one endless fight next to the practice session: deals a fresh run on
 * entry, hands the session the current phase's drill and tempo (both change
 * the moment the boss breaks into its next phase, while the run is held),
 * and banks the run when the player falls.
 */
/** What a run banks into the record. */
const runResultOf = (fight: BossFightState): RunResult => ({
  phase: phaseNumber(fight),
  damage: fight.totalDamage,
  score: runScore(fight).total,
  difficulty: fight.difficulty,
});

export const useBossFight = ({ boss, record, difficulty, startPhase, onRunEnd }: UseBossFightOptions): BossFight => {
  const judge = useBossFightStore((s) => s.judge);
  const feedFreePlay = useBossFightStore((s) => s.feedFreePlay);
  const newRun = useBossFightStore((s) => s.newRun);
  const outcome = useBossFightStore((s) => s.fight.outcome);
  const holding = useBossFightStore((s) => s.fight.holding);
  const phase = useBossFightStore((s) => phaseNumber(s.fight));
  const enraged = useBossFightStore((s) => s.fight.enraged);
  const plan = useBossFightStore((s) => s.fight.plan);
  // The phase's tempo with the run's boons on it (slow down, overdrive).
  const bpm = useBossFightStore((s) => phaseBpm(s.fight));

  // Read when the run ends: the record it has to beat is the one from before it.
  const recordRef = useRef(record);
  const onRunEndRef = useRef(onRunEnd);
  useEffect(() => {
    recordRef.current = record;
    onRunEndRef.current = onRunEnd;
  });

  // A fresh run on entry. Leaving in the middle of one still banks how far it
  // got — a player who walks away in phase 8 has reached phase 8.
  useEffect(() => {
    useBossFightStore.getState().enterFight(boss.drill, { difficulty, startPhase });
    return () => {
      const { fight } = useBossFightStore.getState();
      if (fight.outcome || fight.hits + fight.misses === 0) return;
      onRunEndRef.current(runResultOf(fight));
    };
  }, [boss.drill, difficulty, startPhase]);

  useEffect(() => {
    if (outcome !== "lost") return;
    const { fight, setRunVerdict } = useBossFightStore.getState();
    // On entry the store can still hold the last fight's loss: the entry
    // effect has dealt a fresh run by now, and that one is lost by nobody.
    if (fight.outcome !== "lost") return;
    const run = runResultOf(fight);
    setRunVerdict({ newRecord: isNewRecord(recordRef.current, run), recordBefore: recordRef.current });
    onRunEndRef.current(run);
  }, [outcome]);

  return {
    plan,
    bpm,
    config: {
      bpm,
      phase,
      // The changeling is soloed over: its band comps instead of riffing.
      score: boss.drill === "changes" ? "changes" : "battle",
      enraged,
      arena: <BossArena boss={boss} record={record} />,
      compactArena: <BossArena boss={boss} record={record} compact />,
      onNoteJudged: judge,
      onAudioClock: bossCuePlayer.setClock,
      // The changeling has no notes to match: it hears the solo itself.
      onFreePlay: boss.drill === "changes" ? feedFreePlay : undefined,
      onNewRun: newRun,
      isOver: outcome !== null,
      isHolding: holding,
      overlay: (
        <>
          <BossSounds />
          <BossPhaseDirector />
          <BossPhaseIntro boss={boss} />
          <BossDraft boss={boss} />
          <BossResultOverlay boss={boss} />
        </>
      ),
      tabOverlay: boss.drill === "changes" ? <ChangesBoard boss={boss} /> : <BossWebOverlay boss={boss} />,
    },
  };
};
