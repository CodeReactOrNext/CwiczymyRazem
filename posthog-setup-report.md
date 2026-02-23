<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your Next.js Pages Router guitar practice app (Riff Quest / CwiczymyRazem). The integration covers client-side analytics, server-side event capture, user identification, exception tracking, and a reverse proxy — all without hardcoding any API keys.

## What was set up

- **`instrumentation-client.ts`** (root) — Client-side PostHog init using `posthog-js`, with the EU host, reverse proxy, exception capture (`capture_exceptions: true`), and debug mode in development.
- **`next.config.js`** — Reverse proxy rewrites added (`/ingest/static/*` and `/ingest/*`) so PostHog requests are less likely to be blocked by ad blockers. `skipTrailingSlashRedirect: true` added.
- **`src/lib/posthog-server.ts`** — Singleton server-side PostHog client using `posthog-node` for API route event capture.
- **`.env.local`** — `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set securely.
- **`posthog-js`** and **`posthog-node`** packages installed.

## Events instrumented

| Event Name | Description | File |
|---|---|---|
| `user_signed_up` | User creates a new account | `src/feature/user/store/userSlice.asyncThunk.ts` |
| `user_logged_in` | User logs in (email or Google) | `src/feature/user/store/userSlice.asyncThunk.ts` |
| `user_logged_out` | User logs out; PostHog identity reset | `src/feature/user/store/userSlice.asyncThunk.ts` |
| `song_rated` | User rates a song (title, artist, rating, tier) | `src/feature/user/store/userSlice.asyncThunk.ts` |
| `daily_quest_claimed` | User claims their daily quest reward | `src/feature/user/store/userSlice.asyncThunk.ts` |
| `practice_session_completed` | User submits a practice report | `src/feature/user/view/ReportView/ReportView.tsx` |
| `practice_session_started` | User opens a practice session | `src/feature/exercisePlan/views/PracticeSession/PracticeSession.tsx` |
| `exercise_plan_created` | User creates a new exercise plan | `src/feature/exercisePlan/services/createExercisePlan.ts` |
| `ai_coach_roadmap_started` | User starts the AI coach roadmap interview | `src/feature/aiCoach/view/AiCoachView.tsx` |
| `server_login` | Server-side login (API route, correlated with client via Firebase UID) | `src/pages/api/auth/login.ts` |

`posthog.identify()` is called on all login and signup flows using the Firebase UID as the distinct ID, enabling cross-session and cross-device user tracking.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- 📊 **Dashboard — Analytics basics**: https://eu.posthog.com/project/130915/dashboard/537828
- 📈 **User Signups & Logins (Daily)**: https://eu.posthog.com/project/130915/insights/Zs8Lmk9M
- 🔽 **User Onboarding Funnel** (Signup → Practice Start → Practice Completion): https://eu.posthog.com/project/130915/insights/XmUWbBIi
- 🏋️ **Practice Session Engagement (Weekly)**: https://eu.posthog.com/project/130915/insights/9V3Cq6xQ
- 🎮 **Daily Quest & Song Rating Engagement**: https://eu.posthog.com/project/130915/insights/aZ7XEZmr
- 🚪 **User Churn Signal: Logout Rate**: https://eu.posthog.com/project/130915/insights/Dzf2epu4

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-pages-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
