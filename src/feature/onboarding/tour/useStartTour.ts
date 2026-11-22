import { trackTourStarted } from "feature/onboarding/analytics/onboardingAnalytics";
import { useRouter } from "next/router";
import { useCallback } from "react";

import { HOME_PATH } from "./tourSteps";
import { useTourStore } from "./tourStore";

/**
 * The first-day tour again, from the start — the account menu on a computer,
 * the More sheet on a phone. A replay has no onboarding answer to end on, so
 * it goes without the "your start" step.
 */
export const useStartTour = () => {
  const router = useRouter();
  const start = useTourStore((s) => s.start);

  return useCallback(() => {
    start({ destination: null, noGuitar: false }, "menu");
    trackTourStarted({ source: "menu", goal: null, noGuitar: false });
    if (router.pathname !== HOME_PATH) void router.push(HOME_PATH);
  }, [router, start]);
};
