// @ts-check
const path = require("path");

/**
 * @type {import('next-i18next').UserConfig}
 */

module.exports = {
  i18n: {
    defaultLocale: "pl",
    locales: ["en", "pl"],
    localePath: path.resolve("./public/locales"),
  },
};
