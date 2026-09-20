import type { PlannerTarget } from "feature/landing/data/practicePlanner";
import type { SignupCtaLocation } from "lib/signupFunnel";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import posthog from "posthog-js";

/**
 * One event per CTA on the planner landing, carrying which of the three
 * planning paths (or the worked example) the visitor picked. The product
 * CTAs also feed the shared sign-up funnel, because every one of them goes
 * through `/signup?next=`; the example anchor does not, so it only reports
 * here. Consent is handled where PostHog is initialised, same as every other
 * capture in the app.
 */
export const trackPlannerCtaClicked = (
  target: PlannerTarget,
  location: SignupCtaLocation,
) => {
  posthog.capture("planner_cta_clicked", {
    planner_target: target,
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  if (target !== "example") {
    trackSignupCtaClicked(location, { planner_target: target });
  }
};
