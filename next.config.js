/** @type {import('next').NextConfig} */
const {
  i18n
} = require("./next-i18next.config");

const nextConfig = {
  reactStrictMode: true,
  i18n,
  productionBrowserSourceMaps: true,
  reactCompiler: true,
  turbopack: {},
  bundlePagesRouterDependencies: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    // Suppress "expression is too dynamic" warnings
    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false,
    };
    return config;
  },
};

module.exports = nextConfig;