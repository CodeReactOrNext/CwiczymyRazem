// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import {
  parseOnboardingSource,
  trackOnboardingFirstRiffOpened,
} from "feature/onboarding/analytics/onboardingAnalytics";
import {
  FIRST_RIFF_EXERCISE_IDS,
  getAfterFirstRiffHref,
  isOnboardingLevel,
} from "feature/onboarding/data/onboardingGoals";
import { FirstRiffIntro } from "feature/onboarding/view/FirstRiffIntro";
import { useRequireUserAuth } from "hooks/useRequireUserAuth";
import { LocalizedRegion } from "lib/i18n/LocalizedRegion";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

/**
 * The onboarding's "Let's play": first the mic question and a three-slide
 * walk-through (FirstRiffIntro), then one 40-second exercise for the level the
 * player gave. It is a normal session — finishing it writes the practice log,
 * points and the first streak day — and every way out (the summary's Continue
 * or leaving early) goes back to the onboarding's goal question.
 */
const FirstRiffPage: NextPage = () => {
  const router = useRouter();
  const userAuth = useRequireUserAuth();
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [isLeaving, setIsLeaving] = useState(false);
  // null until the walk-through hands over the mic answer.
  const [withMic, setWithMic] = useState<boolean | null>(null);
  const opened = useRef(false);

  const rawLevel = Array.isArray(router.query.level)
    ? router.query.level[0]
    : router.query.level;
  const level = isOnboardingLevel(rawLevel) ? rawLevel : "new";
  const source = parseOnboardingSource(router.query.from);

  const plan = useMemo<ExercisePlan | null>(() => {
    if (!userAuth) return null;
    const exercise = exercisesAgregat.find(
      (ex) => ex.id === FIRST_RIFF_EXERCISE_IDS[level],
    );
    if (!exercise) return null;
    return {
      id: "onboarding-first-riff",
      title: exercise.title,
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userAuth,
      image: null,
    };
  }, [level, userAuth]);

  useEffect(() => {
    if (!router.isReady || !plan || opened.current) return;
    opened.current = true;
    trackOnboardingFirstRiffOpened({
      level,
      exerciseId: plan.exercises[0].id,
      source,
    });
  }, [router.isReady, plan, level, source]);

  const backToOnboarding = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    void router.replace(getAfterFirstRiffHref(level, source));
  };

  const head = (
    <Head>
      <title>Your first riff · Riff Quest</title>
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

  if (withMic === null) {
    return (
      <>
        {head}
        {/* Behind login and noindex, so it follows the player's language like the onboarding. */}
        <LocalizedRegion>
          <FirstRiffIntro
            level={level}
            bpm={plan.exercises[0].metronomeSpeed?.recommended ?? 60}
            isMobile={isMobile}
            source={source}
            onStart={setWithMic}
          />
        </LocalizedRegion>
      </>
    );
  }

  return (
    <>
      {head}
      <PracticeSession
        plan={plan}
        onClose={backToOnboarding}
        onFinish={backToOnboarding}
        isFinishing={isLeaving}
        micStart={withMic ? "setup" : "off"}
      />
    </>
  );
};

export default FirstRiffPage;

FirstRiffPage.getInitialProps = withAuthInitialProps();
