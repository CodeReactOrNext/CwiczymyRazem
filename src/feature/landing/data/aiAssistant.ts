import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

/**
 * Feature landing for AI assistants (the MCP server at /api/mcp): connect
 * Claude, ChatGPT or Cursor to a riff.quest account. A supporter perk — every
 * claim here matches lib/mcp (tools, limits, the supporter gate), and the
 * numbers come in as props from lib/mcp/auth so they can't drift.
 */
export const AI_ASSISTANT_META = {
  slug: "features/ai-guitar-practice-assistant",
  eyebrow: "AI assistants · a supporter perk",
  title: "Ask Claude about your guitar practice",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Connect Claude to Your Guitar Practice | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "Connect Claude, ChatGPT or Cursor to Riff Quest. It reads your real practice, plans sessions, sets tempo goals and writes exercises with tabs.",
  publishedAt: "2026-11-01",
  updatedAt: "2026-11-01",
  ogImage: "/images/og-image.png",
} as const;

/** Same address for everyone: the account comes from signing in, not the URL. */
export const AI_ASSISTANT_SERVER_URL = "https://riff.quest/api/mcp";

const signupThen = (path: string) => `/signup?next=${encodeURIComponent(path)}`;

export const AI_ASSISTANT_APP_PATH = "/supporter";
export const AI_ASSISTANT_CTA_HREF = signupThen(AI_ASSISTANT_APP_PATH);
export const AI_ASSISTANT_STEPS_ANCHOR = "how-to-connect";

/** Connecting, in the words the screens use. */
export const AI_ASSISTANT_STEPS = [
  {
    label: "Become a supporter",
    desc: "Any donation puts the supporter badge on your account. That's what unlocks AI assistants.",
  },
  {
    label: "Add riff.quest as a connector",
    desc: "In Claude: Settings → Connectors → Add custom connector, then paste the address below. ChatGPT, Cursor and Claude Code take the same address.",
  },
  {
    label: "Sign in and press Allow",
    desc: "Claude opens a riff.quest page. Reading your practice is always included; switch on Allow changes if it may save plans, goals, songs and exercises too.",
  },
] as const;

/** What to ask, and what happens behind it. Each one maps to real tools. */
export const AI_ASSISTANT_PROMPTS = [
  {
    label: "“What have I been neglecting this month?”",
    desc: "It reads your practice history, skills and weak spots, and answers from what you actually logged.",
  },
  {
    label: "“Plan a 30-minute session around my weakest skill.”",
    desc: "It picks exercises from the library and, if you agree, saves the plan to your account.",
  },
  {
    label: "“Set a goal of 140 BPM on my alternate picking drill.”",
    desc: "It creates a tempo goal you then climb in the app, a few clean runs at a time.",
  },
  {
    label: "“Turn this riff into an exercise I can practise.”",
    desc: "Paste a riff and it writes the tab, checks it, shows you a preview with playback and saves it as your own private exercise.",
  },
] as const;

export const AI_ASSISTANT_CANNOT = [
  "see other players' data",
  "post anything or message anyone",
  "log practice time or change your points",
  "join rankings, guilds or duels for you",
] as const;

export const AI_ASSISTANT_FAQS: faqQuestionInterface[] = [
  {
    title: "Do I need to be a supporter?",
    message:
      "Yes. Any donation unlocks it for your account. Practising, logging, the library and everything else in Riff Quest stays free for everyone.",
  },
  {
    title: "Which AI apps work?",
    message:
      "Claude (add the connector on the web or desktop, then it works on mobile too), plus anything that supports remote MCP connectors, such as ChatGPT, Cursor or Claude Code. Apps that can't sign in take a personal key you create in Settings → AI assistants.",
  },
  {
    title: "Will it change things without asking?",
    message:
      "By default Claude asks before each change it wants to save, unless you tell it to always allow that kind. If you don't switch on Allow changes when you connect, it can only read.",
  },
  {
    title: "Does Riff Quest run an AI for this?",
    message:
      "No. All the thinking happens in the assistant you connect. Riff Quest only hands it your practice data and saves the changes you approve.",
  },
  {
    title: "How do I disconnect?",
    message:
      "Settings → AI assistants → Disconnect. Access ends at once, whatever the AI app still shows.",
  },
];
