// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import {
  getRecordingContract,
  sessionParts,
} from "feature/guilds/data/guildRecording";
import { fetchRecording } from "feature/guilds/services/guildRecording.service";
import { buildRecordingExercise } from "feature/guilds/utils/recordingRiff";
import { logger } from "feature/logger/Logger";
import { useRequireUserAuth } from "hooks/useRequireUserAuth";
import { useTranslation } from "hooks/useTranslation";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const BACK = { pathname: "/guilds", query: { tab: "recording" } };

/**
 * One part of the guild's open recording session, played as a single
 * exercise: a take (one minute, mic on, its score laid on the guild's tape
 * when it ends) or, with `?rehearse=1`, a rehearsal of the same tab that
 * counts for nothing and can be slowed down and learnt. Opened from the
 * guild's Recording tab; without an open session, or for a part the track
 * does not have, it goes back there.
 */
export default function RecordingPartPage() {
  const router = useRouter();
  const userAuth = useRequireUserAuth();
  const { t } = useTranslation("guilds");
  const partId =
    typeof router.query.partId === "string" ? router.query.partId : null;
  const rehearsal = router.query.rehearse === "1";
  const [open, setOpen] = useState<{
    contractId: string;
    seed: number;
    tier: number;
  } | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (!router.isReady || !userAuth || !partId) return undefined;
    let cancelled = false;
    fetchRecording()
      .then(({ view }) => {
        if (cancelled) return;
        const session = view.session;
        // Only the parts this session's tier records of the client.
        const known =
          !!session && session.parts.some((part) => part.id === partId);
        // A take with none left today would be played for nothing.
        const spent = !rehearsal && session?.me.takesLeft === 0;
        if (!session || !known || spent) {
          router.replace(BACK);
          return;
        }
        setOpen({
          contractId: session.contractId,
          seed: session.seed,
          tier: session.tier,
        });
      })
      .catch((error) => {
        logger.error(error, { context: "RecordingPartPage" });
        router.replace(BACK);
      });
    return () => {
      cancelled = true;
    };
  }, [router, router.isReady, userAuth, partId, rehearsal]);

  const plan = useMemo<ExercisePlan | null>(() => {
    const contract = getRecordingContract(open?.contractId);
    const part =
      contract &&
      open &&
      sessionParts(contract, open.tier).find((entry) => entry.id === partId);
    if (!open || !contract || !part || !userAuth) return null;

    const partName = t(`recording.parts.${part.role}`, part.name);
    const exercise = buildRecordingExercise(contract, part, open.seed, {
      title: `${contract.track} — ${partName}`,
      rehearsal,
      tier: open.tier,
    });
    return {
      id: `recording-${contract.id}-${part.id}`,
      title: rehearsal
        ? t("recording.session.rehearsal_title", "Rehearsal")
        : t("recording.session.take_title", "Recording session"),
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userAuth,
      image: null,
      recording: { partId: part.id, rehearsal },
    };
  }, [open, partId, rehearsal, userAuth, t]);

  const backToStudio = () => {
    router.push(BACK);
  };

  // The in-app player, not a landing page — keep it out of the index.
  const noIndex = (
    <Head>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
  );

  if (!router.isReady || !plan) {
    return (
      <>
        {noIndex}
        <PracticeLoadingScreen isReady={false} />
      </>
    );
  }

  return (
    <>
      {noIndex}
      <PracticeSession
        // A take and a rehearsal of the same part are two different sessions.
        key={rehearsal ? "rehearsal" : "take"}
        plan={plan}
        // A rehearsal is as long as the player wants it to be.
        freeMode={rehearsal}
        onClose={backToStudio}
        onFinish={() => {
          setIsFinishing(true);
          backToStudio();
        }}
        isFinishing={isFinishing}
      />
    </>
  );
}
