import not_found from "../../../public/locales/en/404.json";
import achievements from "../../../public/locales/en/achievements.json";
import chat from "../../../public/locales/en/chat.json";
import common from "../../../public/locales/en/common.json";
import exercises from "../../../public/locales/en/exercises.json";
import faq from "../../../public/locales/en/faq.json";
import footer from "../../../public/locales/en/footer.json";
import leadboard from "../../../public/locales/en/leadboard.json";
import login from "../../../public/locales/en/login.json";
import practice from "../../../public/locales/en/practice.json";
import practice_log from "../../../public/locales/en/practice_log.json";
import profile from "../../../public/locales/en/profile.json";
import report from "../../../public/locales/en/report.json";
import settings from "../../../public/locales/en/settings.json";
import signup from "../../../public/locales/en/signup.json";
import skills from "../../../public/locales/en/skills.json";
import songs from "../../../public/locales/en/songs.json";
import timer from "../../../public/locales/en/timer.json";
import toast from "../../../public/locales/en/toast.json";
import yup_errors from "../../../public/locales/en/yup_errors.json";

/** One file per namespace, per locale. The names match the JSON filenames. */
export const TRANSLATION_NAMESPACES = [
  "404",
  "achievements",
  "chat",
  "common",
  "exercises",
  "faq",
  "footer",
  "leadboard",
  "login",
  "practice",
  "practice_log",
  "profile",
  "report",
  "settings",
  "signup",
  "skills",
  "songs",
  "timer",
  "toast",
  "yup_errors",
] as const;

export type TranslationNamespace = (typeof TRANSLATION_NAMESPACES)[number];

/** Namespace used when a caller does not name one. */
export const DEFAULT_NAMESPACE: TranslationNamespace = "common";

/** A parsed namespace file: nested objects of strings, addressed with dot paths. */
export type TranslationDict = Record<string, unknown>;

export type LocaleCatalog = Partial<Record<TranslationNamespace, TranslationDict>>;

/**
 * English, bundled rather than fetched.
 *
 * It is the fallback for every other language, so it has to be there on the very
 * first render — including during SSR, where there is nothing to fetch from.
 */
export const EN_CATALOG: LocaleCatalog = {
  "404": not_found,
  achievements,
  chat,
  common,
  exercises,
  faq,
  footer,
  leadboard,
  login,
  practice,
  practice_log,
  profile,
  report,
  settings,
  signup,
  skills,
  songs,
  timer,
  toast,
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
