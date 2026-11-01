import not_found from "../../../public/locales/en/404.json";
import common from "../../../public/locales/en/common.json";
import desktop from "../../../public/locales/en/desktop.json";
import exercise_content from "../../../public/locales/en/exercise_content.json";
import faq from "../../../public/locales/en/faq.json";
import footer from "../../../public/locales/en/footer.json";
import login from "../../../public/locales/en/login.json";
import nav from "../../../public/locales/en/nav.json";
import signup from "../../../public/locales/en/signup.json";
import toast from "../../../public/locales/en/toast.json";
import ui from "../../../public/locales/en/ui.json";
import yup_errors from "../../../public/locales/en/yup_errors.json";

/** One file per namespace, per locale. The names match the JSON filenames. */
export const TRANSLATION_NAMESPACES = [
  "404",
  "achievements",
  "ai_coach",
  "arsenal",
  "backing_track",
  "bosses",
  "calendar",
  "calibration",
  "challenges",
  "chat",
  "common",
  "community",
  "dashboard",
  "desktop",
  "duels",
  "exercise_content",
  "exercises",
  "faq",
  "feed",
  "feedback",
  "footer",
  "goals",
  "guilds",
  "journey",
  "leadboard",
  "level_gate",
  "library",
  "login",
  "metronome",
  "milestones",
  "nav",
  "notifications",
  "onboarding",
  "plans",
  "playlists",
  "practice",
  "practice_hub",
  "practice_log",
  "profile",
  "recordings",
  "report",
  "rotation",
  "scale_tree",
  "session",
  "session_summary",
  "settings",
  "signup",
  "skills",
  "songs",
  "supporter",
  "tab_settings",
  "timer",
  "toast",
  "tone_studio",
  "ui",
  "wiki",
  "yup_errors",
] as const;

export type TranslationNamespace = (typeof TRANSLATION_NAMESPACES)[number];

/** Namespace used when a caller does not name one. */
export const DEFAULT_NAMESPACE: TranslationNamespace = "common";

/** A parsed namespace file: nested objects of strings, addressed with dot paths. */
export type TranslationDict = Record<string, unknown>;

export type LocaleCatalog = Partial<
  Record<TranslationNamespace, TranslationDict>
>;

/**
 * Namespaces whose English text ships in every page's bundle.
 *
 * Public pages (landing, blog, song guides, SEO landings) render only these, so
 * they do not download the ~500 KB of app-only English text. Everything else is
 * registered by `lib/i18n/fullCatalog`, which every page of the logged-in app
 * imports. `publicCatalog.test.ts` walks the import graph of every page and
 * fails when a page that does not import the full catalog uses a namespace that
 * is missing here.
 */
export const CORE_NAMESPACES = [
  "404",
  "common",
  "desktop",
  "exercise_content",
  "faq",
  "footer",
  "login",
  "nav",
  "signup",
  "toast",
  "ui",
  "yup_errors",
] as const satisfies readonly TranslationNamespace[];

/**
 * English for the core namespaces, bundled rather than fetched.
 *
 * English is the fallback for every other language, so it has to be there on the
 * very first render — including during SSR, where there is nothing to fetch from.
 */
export const EN_CORE_CATALOG: LocaleCatalog = {
  "404": not_found,
  common,
  desktop,
  exercise_content,
  faq,
  footer,
  login,
  nav,
  signup,
  toast,
  ui,
  yup_errors,
};

export function isTranslationNamespace(
  value: unknown,
): value is TranslationNamespace {
  return (
    typeof value === "string" &&
    (TRANSLATION_NAMESPACES as readonly string[]).includes(value)
  );
}
