import { cn } from "assets/lib/utils";
import dynamic from "next/dynamic";
import Router, { useRouter } from "next/router";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import styles from "./SessionEntry.module.css";
import {
  beginSessionEntry,
  COVER_MS,
  endSessionEntryNavigation,
  isSessionEntryPath,
  useSessionEntryStore,
} from "./sessionEntryStore";

// Kostek and the strings: loaded when the first cut starts, so pages that
// never open a session don't carry them. The bands below need no script.
const SessionEntryScene = dynamic(() => import("./SessionEntryScene").then((mod) => mod.SessionEntryScene), { ssr: false });

const BAND_EDGES = ["#fafafa", "#22d3ee", "#52525b", "#fafafa", "#52525b", "#22d3ee"];

type Navigate = NonNullable<typeof Router.router>["push"];

/** A way into a session from another page, and not yet under the cut. */
const leadsIntoSession = (path: string) =>
  isSessionEntryPath(path) && path !== window.location.pathname && useSessionEntryStore.getState().phase !== "in";

/**
 * Next swaps the page the moment its code is there — with prefetching, a frame
 * or two after the click, long before the bands have covered anything. So a
 * navigation into a session waits for the cover: the bands wipe in over the
 * page the player pressed the button on, and the route changes behind them.
 * The page's code is fetched meanwhile, so the wait costs nothing.
 *
 * Patched on the router itself: links, `router.push` and `Router.push` all
 * end up here, and none of the dozens of ways into a session has to know.
 */
const coverBeforeNavigating = (router: NonNullable<typeof Router.router>) => {
  const wrap = (original: Navigate): Navigate =>
    function coveredNavigate(url, as, options) {
      const href = as ?? url;
      const path = typeof href === "string" ? href.split(/[?#]/)[0] : (href.pathname ?? "");
      if (options?.shallow || !leadsIntoSession(path)) return original.call(router, url, as, options);
      beginSessionEntry();
      void router.prefetch(typeof url === "string" ? url : (url.pathname ?? path)).catch(() => undefined);
      return new Promise<boolean>((resolve, reject) => {
        setTimeout(() => {
          // routeChangeComplete / Error end it too; this covers a navigation
          // that gave up before either was sent.
          original.call(router, url, as, options).finally(endSessionEntryNavigation).then(resolve, reject);
        }, COVER_MS);
      });
    };
  const { push, replace } = router;
  router.push = wrap(push);
  router.replace = wrap(replace);
  return () => {
    router.push = push;
    router.replace = replace;
  };
};

const STREAKS = [
  { y: "21%", len: "38vw", h: 2, c: "#fafafa", d: 0 },
  { y: "43%", len: "56vw", h: 3, c: "#22d3ee", d: 0.05 },
  { y: "64%", len: "30vw", h: 1.5, c: "#a1a1aa", d: 0.02 },
  { y: "82%", len: "46vw", h: 2, c: "#fafafa", d: 0.09 },
];

/**
 * The cut into a practice session, for every way in: an exercise, a song, a
 * plan, a boss, a duel. Pressing the button wipes dark bands in from the right
 * over the page you are on; Kostek strikes the strings while the session
 * loads; then it all leaves to the left and the session is there.
 *
 * Mounted once in _app, so it outlives the route change. It starts on a
 * navigation towards a session page (which waits until the page is covered),
 * or when a screen swaps itself for a session (`useSessionEntryGate`), and
 * `PracticeLoadingScreen` keeps it up for as long as the session is loading
 * (see sessionEntryStore).
 */
export const SessionEntryTransition = () => {
  const router = useRouter();
  const phase = useSessionEntryStore((s) => s.phase);
  const instant = useSessionEntryStore((s) => s.instant);
  const run = useSessionEntryStore((s) => s.run);

  useEffect(() => {
    const start = (url: string, { shallow }: { shallow: boolean }) => {
      if (shallow) return;
      const path = url.split(/[?#]/)[0];
      // Changing the query of the session you are in is not a way in.
      if (!isSessionEntryPath(path) || path === window.location.pathname) return;
      beginSessionEntry();
    };
    const restore = Router.router ? coverBeforeNavigating(Router.router) : undefined;
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", endSessionEntryNavigation);
    router.events.on("routeChangeError", endSessionEntryNavigation);
    return () => {
      restore?.();
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", endSessionEntryNavigation);
      router.events.off("routeChangeError", endSessionEntryNavigation);
    };
  }, [router.events]);

  if (phase === "idle") return null;

  // At <body> level with the highest z-index: the session portals its own
  // content to <body> on phones, and this has to sit above it. `force-dark`:
  // the cut is a dark scene in the light theme too, like Kostek's own colours.
  return createPortal(
    <div
      key={run}
      role='status'
      aria-busy={phase === "in"}
      className={cn("force-dark", styles.root, instant && styles.instant, phase === "out" && styles.out)}>
      <div aria-hidden>
        {BAND_EDGES.map((edge, i) => (
          <span key={i} className={styles.band} style={{ "--i": i, "--edge": edge } as CSSProperties} />
        ))}
        {STREAKS.map((s, i) => (
          <span
            key={i}
            className={styles.streak}
            style={{ "--y": s.y, "--len": s.len, "--h": `${s.h}px`, "--c": s.c, "--d": `${s.d}s` } as CSSProperties}
          />
        ))}
      </div>
      <SessionEntryScene />
    </div>,
    document.body,
  );
};
