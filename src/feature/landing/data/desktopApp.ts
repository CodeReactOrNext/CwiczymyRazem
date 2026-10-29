import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

/**
 * Feature landing for the desktop app (Electron shell around riff.quest).
 *
 * Intent: "a guitar practice app for my computer that hears my interface
 * properly". The wiki (`desktop-app`) stays the how-to — which file, the
 * first-launch warnings — and this page sells why: the guitar goes through
 * the driver instead of the browser's microphone path.
 *
 * Every number here was measured, and says where: latency on one Windows
 * machine with an ASIO interface, dropouts with the bench script in
 * electron/test-audio-process-vs-main.js. Don't round them into promises.
 */
export const DESKTOP_APP_META = {
  slug: "features/desktop-guitar-practice-app",
  eyebrow: "Desktop app",
  title: "Plug in, and the app hears you the moment you play",
  /** SERP title, brand included; ≤ 60 chars. */
  metaTitle: "Guitar Practice App for Windows, Mac and Linux | Riff Quest",
  /** ≤ 160 chars. */
  metaDescription:
    "The Riff Quest desktop app reads your audio interface through its driver: lower latency note detection, an amp sim with NAM captures, and your VST plugins.",
  publishedAt: "2026-10-29",
  updatedAt: "2026-10-29",
  /** Hand-made WebP (images.unoptimized is on), also the og:image. */
  ogImage: "/images/desktop-app/og.webp",
} as const;

/** Anchor of the downloads section, linked from the hero. */
export const DESKTOP_APP_DOWNLOAD_ANCHOR = "download";

/**
 * Input latency, guitar to app, measured once on a Windows machine with an
 * audio interface on its ASIO driver (memory: electron native audio, 2026-07).
 * The browser figure is the getUserMedia path on the same machine.
 */
export const DESKTOP_APP_LATENCY = {
  desktopMs: 12,
  browserMs: 120,
} as const;

/** The two routes a note takes, drawn by the hero animation. */
export const DESKTOP_APP_ROUTES = {
  browser: [
    "Interface",
    "System mixer",
    "Browser microphone",
    "Web Audio",
    "Riff Quest",
  ],
  desktop: ["Interface", "Driver (ASIO, Core Audio)", "Riff Quest"],
} as const;

/**
 * Engine-process bench (electron/test-audio-process-vs-main.js): a 10 s NAM
 * stream at 128 frames with synthetic load on the app's main thread.
 */
export const DESKTOP_APP_DROPOUT_BENCH = {
  bufferFrames: 128,
  sharedProcess: "13–31",
  ownProcess: 0,
} as const;

export const DESKTOP_APP_INPUT_PARTS = [
  {
    label: "Straight off the driver",
    desc: "The app opens your interface itself, through ASIO or WASAPI on Windows and Core Audio on a Mac, instead of borrowing the browser's microphone.",
  },
  {
    label: "The right input, not just a device",
    desc: "Pick the interface, then the channel your jack is on. An eight-input interface stops being a guessing game.",
  },
  {
    label: "Your buffer, your trade-off",
    desc: "Set the buffer size yourself: smaller is quicker, too small crackles. The browser never lets you choose.",
  },
] as const;

export const DESKTOP_APP_EXTRAS = [
  {
    label: "Your screen stays on",
    desc: "Reading a tab with both hands on the guitar means no mouse for minutes. The app keeps the display awake while you play.",
  },
  {
    label: "Progress on the taskbar",
    desc: "The taskbar or dock icon fills up as the exercise runs, so a glance tells you how much is left.",
  },
  {
    label: "Quick jumps from the tray",
    desc: "Home, My Exercises or the Practice Log, straight from the tray icon, without hunting for the window.",
  },
  {
    label: "Your own backing tracks",
    desc: "Load an mp3, wav or flac from your disk as a song's backing track and line it up with the tab.",
  },
  {
    label: "Updates itself",
    desc: "New versions download in the background and install on a restart you choose.",
  },
  {
    label: "Same account, same progress",
    desc: "Every session counts exactly as it does in the browser: same points, same streak, same rankings.",
  },
] as const;

export const DESKTOP_APP_FIT = [
  {
    who: "You play electric through an audio interface",
    verdict: "Yes, easily. This is the setup it was built for.",
    fits: true,
  },
  {
    who: "You want to hear an amp while you practise",
    verdict: "Yes. Tone Studio only exists in the desktop app.",
    fits: true,
  },
  {
    who: "You play acoustic into a laptop microphone",
    verdict: "Not really. Detection works in the browser and you gain little.",
    fits: false,
  },
  {
    who: "You practise on a phone, a work laptop or an Intel Mac",
    verdict:
      "Stay on the website. Nothing about your progress is missing there.",
    fits: false,
  },
] as const;

export const DESKTOP_APP_FAQS: faqQuestionInterface[] = [
  {
    title: "Is the desktop app free?",
    message:
      "Yes. It comes with your Riff Quest account, which is free. Sign in with the same account you use in the browser.",
  },
  {
    title: "Do I need it to use note detection?",
    message:
      "No. Detection works in the browser through a microphone or an interface. The desktop app makes it quicker and steadier, because it reads the interface through its driver.",
  },
  {
    title: "Why does Windows or macOS warn me about the installer?",
    message:
      "The builds are not signed with a paid certificate yet, so the first launch is stopped once. On Windows choose More info, then Run anyway. On a Mac right-click the app and choose Open.",
  },
  {
    title: "Does it work offline?",
    message:
      "No. The app runs the same Riff Quest you see in the browser, so it needs a connection. If the connection drops it shows an offline screen and reconnects by itself.",
  },
  {
    title: "Which plugins can I load?",
    message:
      "VST3 plugins you own, on Windows and on Apple Silicon Macs, in any order, each with its own window. Tone Studio also loads NAM captures (.nam) and cabinet impulse responses (.wav) on every system.",
  },
  {
    title: "Is there a version for Intel Macs?",
    message:
      "Not at the moment. The Mac build is for Apple Silicon only, so on an Intel Mac use Riff Quest in the browser.",
  },
];
