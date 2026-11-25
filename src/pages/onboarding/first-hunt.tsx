// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import {
  parseOnboardingSource,
  trackOnboardingFirstHuntOpened,
  trackOnboardingFirstMinuteLeft,
} from "feature/onboarding/analytics/onboardingAnalytics";
import {
  getFirstHuntExercise,
  isOnboardingLevel,
  toFirstMinutePlan,
} from "feature/onboarding/data/onboardingGoals";
import { getTourHref } from "feature/onboarding/tour/tourSteps";
import { useRequireUserAuth } from "hooks/useRequireUserAuth";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

/**
 * The onboarding's other first minute: one minute of the Fretboard module's
 * Click Hunt for the player's level — a note name comes up, they click where
 * it lives. No guitar and no mic, so there is no setup before it. A normal
 * session: finishing writes the practice log and the first streak day. Every
 * way out goes to Home, where Kostek's tour starts.
 */
const FirstHuntPage: NextPage = () => {
  const router = useRouter();
  const userAuth = useRequireUserAuth();
  const [isLeaving, setIsLeaving] = useState(false);
  const opened = useRef(false);

  const rawLevel = Array.isArray(router.query.level)
    ? router.query.level[0]
    : router.query.level;
  const level = isOnboardingLevel(rawLevel) ? rawLevel : "new";
  const source = parseOnboardingSource(router.query.from);

  const plan = useMemo(
    () =>
      userAuth
        ? toFirstMinutePlan(getFirstHuntExercise(level), "hunt", userAuth)
        : null,
    [level, userAuth],
  );

  useEffect(() => {
    if (!router.isReady || !plan || opened.current) return;
    opened.current = true;
    trackOnboardingFirstHuntOpened({
      level,
      exerciseId: plan.exercises[0].id,
      source,
    });
  }, [router.isReady, plan, level, source]);

  const leave = (finished: boolean) => {
    if (isLeaving) return;
    setIsLeaving(true);
    trackOnboardingFirstMinuteLeft({ kind: "hunt", level, finished, source });
    void router.replace(getTourHref(null));
  };

  const head = (
    <Head>
      <title>Find notes on the neck · Riff Quest</title>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
  );

  if (!router.isReady || !plan) {
    return (
      <>
        {head}
        <PracticeLoadingScreen isReady={false} />
      </>
    );
  }

  return (
    <>
      {head}
      <PracticeSession
        plan={plan}
        onClose={() => leave(false)}
        onFinish={() => leave(true)}
        isFinishing={isLeaving}
        micStart='off'
      />
    </>
  );
};

export default FirstHuntPage;

FirstHuntPage.getInitialProps = withAuthInitialProps();
