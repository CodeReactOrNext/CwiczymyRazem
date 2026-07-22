import { Fraunces } from "next/font/google";

// Landing-only display face. Deliberately not Inter (nor `Plus Jakarta Sans`,
// which the app's `font-display` token points at but which is never actually
// loaded anywhere — see docs/STYLEGUIDE.md §5 "dług/pułapka"). Fraunces is a
// variable serif with a wide optical-size axis, so a single family carries
// both the huge hero headline and the smaller section titles while giving
// strong weight/style contrast against the Inter body copy.
//
// Scoped to `feature/landing` on purpose: the app-wide `font-display` token
// is used in ~30 other features and changing it would ripple far outside the
// scope of this landing-page redesign.
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
