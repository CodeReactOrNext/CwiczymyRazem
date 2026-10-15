import { m } from "framer-motion";
import { EASE } from "lib/motion/motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/** Route changes that finish sooner than this never show the bar. */
const SHOW_DELAY_MS = 150;
/** How long the full bar stays on screen while it fades out. */
const FINISH_MS = 250;

type Phase = "idle" | "loading" | "finishing";

/**
 * Top progress bar for route changes that are actually slow.
 *
 * In-app navigation is usually instant — the page's code is prefetched and nothing
 * waits on the server — and a bar flashing on every click reads as "loading" when
 * nothing is. This one appears only after SHOW_DELAY_MS: a first visit to a heavy
 * page, a slow network. (Replaces nextjs-toploader, which has no delay.)
 */
export const RouteProgress = () => {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let shown = false;

    const start = (_url: string, { shallow }: { shallow: boolean }) => {
      if (shallow) return;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      showTimer = setTimeout(() => {
        shown = true;
        setPhase("loading");
      }, SHOW_DELAY_MS);
    };

    const done = () => {
      clearTimeout(showTimer);
      if (!shown) return;
      shown = false;
      setPhase("finishing");
      hideTimer = setTimeout(() => setPhase("idle"), FINISH_MS);
    };

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [router.events]);

  if (phase === "idle") return null;

  return (
    <div aria-hidden className='pointer-events-none fixed inset-x-0 top-0 z-[1600] h-0.5'>
      <m.div
        className='h-full origin-left bg-cyan-500'
        initial={{ scaleX: 0 }}
        animate={
          phase === "loading"
            ? // Crawls towards 80 % and waits there for the page.
              { scaleX: 0.8, transition: { duration: 6, ease: [0.1, 0.6, 0.3, 1] } }
            : { scaleX: 1, opacity: 0, transition: { duration: FINISH_MS / 1000, ease: EASE.out } }
        }
      />
    </div>
  );
};
