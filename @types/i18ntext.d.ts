/**
 * If you want to enable locale keys typechecking and enhance IDE experience.
 *
 * Requires `resolveJsonModule:true` in your tsconfig.json.
 *
 * @link https://www.i18next.com/overview/typescript
 */
import "i18next";

import type common from "../public/locales/en/common.json";
import type landing from "../public/locales/en/landing.json";
import type login from "../public/locales/en/login.json";
import type signup from "../public/locales/en/signup.json";
import type footer from "../public/locales/en/footer.json";
import type faq from "../public/locales/en/faq.json";
import type report from "../public/locales/en/report.json";
import type achievements from "../public/locales/en/achievements.json";
import type not_found from "../public/locales/en/404.json";
import type yup_errors from "../public/locales/en/yup_errors.json";

interface I18nNamespaces {
  common: typeof common;
  landing: typeof landing;
  login: typeof login;
  signup: typeof signup;
  footer: typeof footer;
  faq: typeof faq;
  report: typeof report;
  achievements: typeof achievements;
  "404": typeof not_found;
  yup_errors: typeof yup_errors;
}
// interface I18nNamespaces
//   extends common,
//     landing,
//     login,
//     signup,
//     footer,
//     faq,
//     report {
//   report: typeof report;
// }

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: I18nNamespaces;
  }
}
