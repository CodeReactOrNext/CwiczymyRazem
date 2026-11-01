/**
 * English for every namespace outside `CORE_NAMESPACES`.
 *
 * Importing this module registers the text synchronously, at module evaluation,
 * so it is in the store before the first render on both the server and the
 * client and hydration sees the same strings. Import it (for its side effect)
 * from any page or lazily loaded component that renders app-only namespaces;
 * `AppLayout` already does. Public pages must not import it — that is the
 * whole point of the split. See `CORE_NAMESPACES` in `./namespaces`.
 */
import achievements from "../../../public/locales/en/achievements.json";
import ai_coach from "../../../public/locales/en/ai_coach.json";
import arsenal from "../../../public/locales/en/arsenal.json";
import backing_track from "../../../public/locales/en/backing_track.json";
import bosses from "../../../public/locales/en/bosses.json";
import calendar from "../../../public/locales/en/calendar.json";
import calibration from "../../../public/locales/en/calibration.json";
import challenges from "../../../public/locales/en/challenges.json";
import chat from "../../../public/locales/en/chat.json";
import community from "../../../public/locales/en/community.json";
import dashboard from "../../../public/locales/en/dashboard.json";
import duels from "../../../public/locales/en/duels.json";
import exercises from "../../../public/locales/en/exercises.json";
import feed from "../../../public/locales/en/feed.json";
import feedback from "../../../public/locales/en/feedback.json";
import goals from "../../../public/locales/en/goals.json";
import guilds from "../../../public/locales/en/guilds.json";
import journey from "../../../public/locales/en/journey.json";
import leadboard from "../../../public/locales/en/leadboard.json";
import level_gate from "../../../public/locales/en/level_gate.json";
import library from "../../../public/locales/en/library.json";
import metronome from "../../../public/locales/en/metronome.json";
import milestones from "../../../public/locales/en/milestones.json";
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
import rotation from "../../../public/locales/en/rotation.json";
import scale_tree from "../../../public/locales/en/scale_tree.json";
import session from "../../../public/locales/en/session.json";
import session_summary from "../../../public/locales/en/session_summary.json";
import settings from "../../../public/locales/en/settings.json";
import skills from "../../../public/locales/en/skills.json";
import songs from "../../../public/locales/en/songs.json";
import supporter from "../../../public/locales/en/supporter.json";
import tab_settings from "../../../public/locales/en/tab_settings.json";
import timer from "../../../public/locales/en/timer.json";
import tone_studio from "../../../public/locales/en/tone_studio.json";
import wiki from "../../../public/locales/en/wiki.json";
import { registerEnglish } from "./localeStore";
import type { LocaleCatalog } from "./namespaces";

export const EN_APP_CATALOG: LocaleCatalog = {
  achievements,
  ai_coach,
  arsenal,
  backing_track,
  bosses,
  calendar,
  calibration,
  challenges,
  chat,
  community,
  dashboard,
  duels,
  exercises,
  feed,
  feedback,
  goals,
  guilds,
  journey,
  leadboard,
  level_gate,
  library,
  metronome,
  milestones,
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
  rotation,
  scale_tree,
  session,
  session_summary,
  settings,
  skills,
  songs,
  supporter,
  tab_settings,
  timer,
  tone_studio,
  wiki,
};

registerEnglish(EN_APP_CATALOG);
