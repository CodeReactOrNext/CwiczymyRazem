import not_found from "../../../public/locales/en/404.json";
import achievements from "../../../public/locales/en/achievements.json";
import ai_coach from "../../../public/locales/en/ai_coach.json";
import calibration from "../../../public/locales/en/calibration.json";
import challenges from "../../../public/locales/en/challenges.json";
import chat from "../../../public/locales/en/chat.json";
import common from "../../../public/locales/en/common.json";
import community from "../../../public/locales/en/community.json";
import dashboard from "../../../public/locales/en/dashboard.json";
import desktop from "../../../public/locales/en/desktop.json";
import exercises from "../../../public/locales/en/exercises.json";
import faq from "../../../public/locales/en/faq.json";
import feed from "../../../public/locales/en/feed.json";
import feedback from "../../../public/locales/en/feedback.json";
import footer from "../../../public/locales/en/footer.json";
import guilds from "../../../public/locales/en/guilds.json";
import journey from "../../../public/locales/en/journey.json";
import leadboard from "../../../public/locales/en/leadboard.json";
import level_gate from "../../../public/locales/en/level_gate.json";
import login from "../../../public/locales/en/login.json";
import metronome from "../../../public/locales/en/metronome.json";
import milestones from "../../../public/locales/en/milestones.json";
import nav from "../../../public/locales/en/nav.json";
import notifications from "../../../public/locales/en/notifications.json";
import onboarding from "../../../public/locales/en/onboarding.json";
import plans from "../../../public/locales/en/plans.json";
import playlists from "../../../public/locales/en/playlists.json";
import practice from "../../../public/locales/en/practice.json";
import practice_hub from "../../../public/locales/en/practice_hub.json";
import practice_log from "../../../public/locales/en/practice_log.json";
import profile from "../../../public/locales/en/profile.json";
import recordings from "../../../public/locales/en/recordings.json";
import report from "../../../public/locales/en/report.json";
import session from "../../../public/locales/en/session.json";
import session_summary from "../../../public/locales/en/session_summary.json";
import settings from "../../../public/locales/en/settings.json";
import signup from "../../../public/locales/en/signup.json";
import skills from "../../../public/locales/en/skills.json";
import songs from "../../../public/locales/en/songs.json";
import supporter from "../../../public/locales/en/supporter.json";
import tab_settings from "../../../public/locales/en/tab_settings.json";
import timer from "../../../public/locales/en/timer.json";
import toast from "../../../public/locales/en/toast.json";
import ui from "../../../public/locales/en/ui.json";
import yup_errors from "../../../public/locales/en/yup_errors.json";

/** One file per namespace, per locale. The names match the JSON filenames. */
export const TRANSLATION_NAMESPACES = [
  "404",
  "achievements",
  "ai_coach",
  "calibration",
  "challenges",
  "chat",
  "common",
  "community",
  "dashboard",
  "desktop",
  "exercises",
  "faq",
  "feed",
  "feedback",
  "footer",
  "guilds",
  "journey",
  "leadboard",
  "level_gate",
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
  "ui",
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
 * English, bundled rather than fetched.
 *
 * It is the fallback for every other language, so it has to be there on the very
 * first render — including during SSR, where there is nothing to fetch from.
 */
export const EN_CATALOG: LocaleCatalog = {
  "404": not_found,
  achievements,
  ai_coach,
  calibration,
  challenges,
  chat,
  common,
  community,
  dashboard,
  desktop,
  exercises,
  faq,
  feed,
  feedback,
  footer,
  guilds,
  journey,
  leadboard,
  level_gate,
  login,
  metronome,
  milestones,
  nav,
  notifications,
  onboarding,
  plans,
  playlists,
  practice,
  practice_hub,
  practice_log,
  profile,
  recordings,
  report,
  session,
  session_summary,
  settings,
  signup,
  skills,
  songs,
  supporter,
  tab_settings,
  timer,
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
