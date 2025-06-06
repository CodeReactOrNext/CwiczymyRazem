/**
 * If you want to enable locale keys typechecking and enhance IDE experience.
 *
 * Requires `resolveJsonModule:true` in your tsconfig.json.
 *
 * @link https://www.i18next.com/overview/typescript
 */
import "i18next";

import type not_found from "../../public/locales/en/404.json";
import type achievements from "../../public/locales/en/achievements.json";
import type chat from "../../public/locales/en/chat.json";
import type common from "../../public/locales/en/common.json";
import type exercises from "../../public/locales/en/exercises.json";
import type faq from "../../public/locales/en/faq.json";
import type footer from "../../public/locales/en/footer.json";
import type leadboard from "../../public/locales/en/leadboard.json";
import type login from "../../public/locales/en/login.json";
import type profile from "../../public/locales/en/profile.json";
import type report from "../../public/locales/en/report.json";
import type settings from "../../public/locales/en/settings.json";
import type signup from "../../public/locales/en/signup.json";
import type skills from "../../public/locales/en/skills.json";
import type songs from "../../public/locales/en/songs.json";
import type timer from "../../public/locales/en/timer.json";
import type toast from "../../public/locales/en/toast.json";
import type yup_errors from "../../public/locales/en/yup_errors.json";


interface I18nNamespaces {
  common: typeof common;
  profile: typeof profile;
  login: typeof login;
  signup: typeof signup;
  footer: typeof footer;
  faq: typeof faq;
  leadboard: typeof leadboard;
  songs: typeof songs;
  report: typeof report;
  achievements: typeof achievements;
  "404": typeof not_found;
  yup_errors: typeof yup_errors;
  settings: typeof settings;
  timer: typeof timer;
  toast: typeof toast;
  skills: typeof skills;
  chat: typeof chat;
  exercises: typeof exercises;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    achievements: "achievements";
    toast: "toast";
    resources: I18nNamespaces;
  }
}
