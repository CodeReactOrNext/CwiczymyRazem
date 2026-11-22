import { trackTourStarted } from "feature/onboarding/analytics/onboardingAnalytics";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useSyncExternalStore } from "react";

import { parseTourQuery } from "./tourSteps";
import { useTourStore } from "./tourStore";

// Only the players on a tour download it.
const TourOverlay = dynamic(() => import("./TourOverlay"), { ssr: false });

const noopSubscribe = () => () => {};

/**
 * Mounted once in the app shell. Starts the tour when the onboarding sends the
 * player to `?tour=1`, and shows it while it runs — across pages, since its
 * place is kept in the store.
 */
export const AppTour = () => {
  const router = useRouter();
  const active = useTourStore((s) => s.active);
  const start = useTourStore((s) => s.start);
  // The store is read from sessionStorage on the client only; the server's
  // HTML never has the tour in it, so it appears after hydration.
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const tourQuery = router.query.tour;
  useEffect(() => {
    if (!router.isReady || tourQuery !== "1") return;
    const context = parseTourQuery(router.query);
    if (!context) return;
    start(context, "onboarding");
    trackTourStarted({
      source: "onboarding",
      goal: context.destination?.goal ?? null,
      noGuitar: context.noGuitar,
    });
    // Out of the address bar, so a reload does not start it over.
    void router.replace(router.pathname, undefined, { shallow: true });
    // Once per arrival with the flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, tourQuery]);

  return isClient && active ? <TourOverlay /> : null;
};
