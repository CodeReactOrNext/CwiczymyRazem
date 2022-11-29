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
import type footer from "../public/locales/en/footer.json";

interface I18nNamespaces {
  common: typeof common;
  landing: typeof landing;
  login: typeof login;
  footer: typeof footer;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: I18nNamespaces;
  }
}
