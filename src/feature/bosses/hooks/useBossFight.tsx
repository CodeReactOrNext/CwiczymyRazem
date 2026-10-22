import type { BossFightConfig } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { useEffect, useRef } from "react";

import { BossArena } from "../components/BossArena";
import { BossDraft } from "../components/BossDraft";
import { BossPhaseDirector } from "../components/BossPhaseDirector";
import { BossPhaseIntro } from "../components/BossPhaseIntro";
import { BossResultOverlay } from "../components/BossResultOverlay";
import { BossWebOverlay } from "../components/BossWebOverlay";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossDefinition, BossRecord } from "../types/boss.types";
import { phaseBpm, phaseNumber } from "../utils/bossEngine";
import type { RunResult } from "../utils/bossProgress";
import { isNewRecord } from "../utils/bossProgress";
import type { PhasePlan } from "../utils/phaseGenerator";

interface UseBossFightOptions {
  boss: BossDefinition;
  /** The player's record so far — shown in the arena, beaten or not at the end. */
  record: BossRecord;
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
export const useBossFight = ({ boss, record, onRunEnd }: UseBossFightOptions): BossFight => {
  const judge = useBossFightStore((s) => s.judge);
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
    useBossFightStore.getState().enterFight(boss.drill);
    return () => {
      const { fight } = useBossFightStore.getState();
      if (fight.outcome || fight.hits + fight.misses === 0) return;
      onRunEndRef.current({ phase: phaseNumber(fight), damage: fight.totalDamage });
    };
  }, [boss.drill]);

  useEffect(() => {
    if (outcome !== "lost") return;
    const { fight, setRunVerdict } = useBossFightStore.getState();
    const run = { phase: phaseNumber(fight), damage: fight.totalDamage };
    setRunVerdict({ newRecord: isNewRecord(recordRef.current, run), recordBefore: recordRef.current });
    onRunEndRef.current(run);
  }, [outcome]);

  return {
    plan,
    bpm,
    config: {
      bpm,
      phase,
      enraged,
      arena: <BossArena boss={boss} record={record} />,
      compactArena: <BossArena boss={boss} record={record} compact />,
      onNoteJudged: judge,
      onNewRun: newRun,
      isOver: outcome !== null,
      isHolding: holding,
      overlay: (
        <>
          <BossPhaseDirector />
          <BossPhaseIntro boss={boss} />
          <BossDraft boss={boss} />
          <BossResultOverlay boss={boss} />
        </>
      ),
      tabOverlay: <BossWebOverlay boss={boss} />,
    },
  };
};
