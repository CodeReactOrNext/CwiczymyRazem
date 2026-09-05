import posthog from "posthog-js";

/**
 * The acquisition funnel the 2026-09-05 audit asked for: landing -> CTA click ->
 * form view -> account created -> first practice.
 *
 * Only the last step already existed (`practice_session_started`), so "121 exits
 * from /signup" could not be read as a form-abandon rate — there was no event
 * telling the two apart. Every step below carries the page it happened on, so
 * the funnel can be split by landing page, and by organic vs the rest.
 *
 * Deliberately three small events rather than one generic one: PostHog funnels
 * are defined per event name, and a shared name with a `step` property makes
 * every funnel definition a filter chain.
 */

/** Where on the page the CTA sits — used to compare hero vs mid vs footer. */
export type SignupCtaLocation =
  | "landing_hero"
  | "landing_mid"
  | "landing_final"
  | "guide_hero"
  | "guide_cta"
  | "song_card";

const currentPath = (): string =>
  typeof window === "undefined" ? "" : window.location.pathname;

export const trackSignupCtaClicked = (
  location: SignupCtaLocation,
  extra?: Record<string, unknown>
) => {
  posthog.capture("signup_cta_clicked", {
    cta_location: location,
    from_path: currentPath(),
    ...extra,
  });
};

/** Fired once when the sign-up form itself is on screen, not on a redirect. */
export const trackSignupFormViewed = (destination: string) => {
  posthog.capture("signup_form_viewed", {
    // Set when the visitor arrived from a link that carried a destination —
    // a song card, say — so we can tell intent-carrying arrivals apart.
    intended_destination: destination,
    referrer: typeof document === "undefined" ? "" : document.referrer,
  });
};

export const trackSignupCompleted = (destination: string) => {
  posthog.capture("signup_completed", { intended_destination: destination });
};
