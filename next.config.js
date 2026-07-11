/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /\/api\/.*/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /\/monitoring.*/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /\/ingest.*/i,
        handler: "NetworkOnly",
      },
    ],
  },
});

const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {},
  bundlePagesRouterDependencies: true,
  serverExternalPackages: ["@openai/agents"],
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
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      // Navigation redesign: /practice/plans and /practice/auto were duplicate
      // routes of the canonical /timer/* pages; keep old deep links working.
      {
        source: '/practice/plans',
        destination: '/timer/plans',
        permanent: true,
      },
      {
        source: '/practice/auto',
        destination: '/timer/auto',
        permanent: true,
      },
      // Navigation redesign: orphan pages with no nav entry, removed.
      {
        source: '/session-summary',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/recordings',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/profile/exercises',
        destination: '/practice-log',
        permanent: true,
      },
      {
        source: '/guitar-practice-tracker',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      {
        source: '/guitar-practice-routine',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/practice-habits',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      // SEO consolidation: merged duplicate "guitar practice routine" posts into the
      // canonical beginner pillar to resolve keyword cannibalization.
      {
        source: '/blog/beginner-guitar-practice-routine',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/guitar-practice-routine-build-one-15-minutes',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      // Tool page removed in 94770b1b but still ranking in search (pos ~6) — keep the equity.
      {
        source: '/guitar-practice-builder',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      // SEO consolidation (2026-07): merged posts that cannibalized the same query intent
      // into a single canonical post per topic. See issue #626.
      {
        source: '/blog/track-guitar-practice-progress-effectively',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      {
        source: '/blog/how-to-set-guitar-practice-goals',
        destination: '/blog/guitar-practice-goal-setting',
        permanent: true,
      },
      // SEO consolidation (2026-07): resolved a second round of keyword cannibalization
      // across six topic clusters, each collapsed onto its best-performing post per
      // Search Console data. See issue #644.
      // Cluster: "best app for guitar practice"
      {
        source: '/blog/guitar-practice-tracker',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      {
        source: '/blog/guitar-practice-software-for-musicians',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      {
        source: '/blog/best-guitar-practice-apps-for-beginners',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      {
        source: '/blog/best-way-to-learn-guitar',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      {
        source: '/blog/free-guitar-practice-software',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      {
        source: '/blog/best-guitar-practice-statistics-app',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      {
        source: '/blog/online-guitar-practice-platform',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      {
        source: '/blog/structured-guitar-learning-platform-review',
        destination: '/blog/best-app-for-guitar-practice',
        permanent: true,
      },
      // Cluster: "get better at guitar fast"
      {
        source: '/blog/learn-guitar-songs-faster-proven-methods',
        destination: '/blog/get-better-at-guitar-fast-app',
        permanent: true,
      },
      {
        source: '/blog/effective-strategies-for-learning-new-guitar-songs-quickly',
        destination: '/blog/get-better-at-guitar-fast-app',
        permanent: true,
      },
      {
        source: '/blog/how-to-learn-guitar-faster',
        destination: '/blog/get-better-at-guitar-fast-app',
        permanent: true,
      },
      {
        source: '/blog/how-to-master-guitar-faster',
        destination: '/blog/get-better-at-guitar-fast-app',
        permanent: true,
      },
      {
        source: '/blog/improve-guitar-skills-faster',
        destination: '/blog/get-better-at-guitar-fast-app',
        permanent: true,
      },
      // Cluster: "guitar practice routine / builder"
      {
        source: '/blog/guitar-practice-routine',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/guitar-practice-routine-for-beginners',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/guitar-practice-routine-busy-adults',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/guitar-practice-plan-intermediate-players',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/structured-guitar-practice-routine',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/effective-guitar-practice-strategies',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/guitar-practice-tips-for-consistency',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/how-to-structure-guitar-practice',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      {
        source: '/blog/structured-practice-technical-vs-musical-focus',
        destination: '/blog/guitar-practice-routine-builder',
        permanent: true,
      },
      // Cluster: "track guitar practice progress"
      {
        source: '/blog/how-to-measure-guitar-progress',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      {
        source: '/blog/do-analytics-improve-guitar-practice',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      {
        source: '/blog/guitar-practice-journal-benefits',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      {
        source: '/blog/daily-guitar-practice-log-template',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      {
        source: '/blog/guitar-practice-accountability-partner',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      {
        source: '/blog/why-practice-logs-improve-guitar-skills',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      {
        source: '/blog/practice-habits',
        destination: '/blog/how-to-track-guitar-practice-progress-effectively',
        permanent: true,
      },
      // Cluster: "guitar practice stagnation"
      {
        source: '/blog/why-youre-not-improving-at-guitar-8-common-reasons',
        destination: '/blog/guitar-practice-stagnation-solutions',
        permanent: true,
      },
      {
        source: '/blog/why-am-i-not-improving-at-guitar',
        destination: '/blog/guitar-practice-stagnation-solutions',
        permanent: true,
      },
      {
        source: '/blog/why-is-my-guitar-playing-not-improving-after-months',
        destination: '/blog/guitar-practice-stagnation-solutions',
        permanent: true,
      },
      {
        source: '/blog/why-is-my-guitar-practice-inconsistent',
        destination: '/blog/guitar-practice-stagnation-solutions',
        permanent: true,
      },
      // Cluster: "how long to practice guitar daily"
      {
        source: '/blog/how-much-guitar-practice-a-day',
        destination: '/blog/how-long-practice-guitar-daily',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.contentsquare.net https://*.contentsquare.com https://app.contentsquare.com",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "riff-quest",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // tunnelRoute disabled to reduce Vercel edge requests
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
