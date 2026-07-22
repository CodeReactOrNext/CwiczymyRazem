import { Plus_Jakarta_Sans } from "next/font/google";

// Landing-only display face. `docs/STYLEGUIDE.md` §5 already documents
// `font-display`/`font-jakarta` as "Plus Jakarta Sans", but that token is
// never actually loaded anywhere (no `next/font` call, no `<link>`), so the
// landing silently rendered in Inter. A previous pass swapped in Fraunces
// (a serif) instead, but a serif display face reads as mismatched against
// this app's dark, glassy, gamified UI language, elsewhere the product is
// entirely geometric sans. Loading the family the docs already call for
// fixes the "dług/pułapka" bug and gives real weight contrast against the
// Inter body copy without introducing a new, undocumented font choice.
//
// Scoped to `feature/landing` on purpose: the app-wide `font-display` token
// is used in ~30 other features and changing it would ripple far outside the
// scope of this landing-page redesign.
export const jakartaLanding = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-landing",
  display: "swap",
});
