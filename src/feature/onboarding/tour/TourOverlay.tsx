import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Kostek } from "components/Mascot/Kostek";
import { MOBILE_BOTTOM_NAV_ATTR } from "components/RockSidebar/MobileMoreSheet";
import {
  trackTourCompleted,
  trackTourSkipped,
  trackTourStepViewed,
} from "feature/onboarding/analytics/onboardingAnalytics";
import { useReducedMotion } from "framer-motion";
import { useMediaQuery } from "hooks/useMediaQuery";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { firebaseSaveTourOutcome } from "./tour.service";
import {
  getTourCtaHref,
  getTourSteps,
  GOAL_MODE,
  placeBubble,
  type TourRect,
  type TourStep,
} from "./tourSteps";
import { useTourStore } from "./tourStore";

/** How long a step waits for its element before giving up on it. */
const FIND_TIMEOUT_MS = 4000;
/** Room between the lit element and the edge of the hole. */
const HOLE_PAD = 6;
/** The bubble's size before it has been measured. */
const BUBBLE_ESTIMATE = { width: 340, height: 230 };

const findVisible = (key: string): HTMLElement | null => {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`);
  for (const node of Array.from(nodes)) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
};

/** The part of the element that is on screen, padded into a hole. */
const toHole = (rect: DOMRect): TourRect | null => {
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  if (bottom - top < 8) return null;
  return {
    left: Math.max(4, rect.left - HOLE_PAD),
    top: Math.max(4, top - HOLE_PAD),
    width: Math.min(window.innerWidth - 8, rect.width + HOLE_PAD * 2),
    height: bottom - top + HOLE_PAD * 2,
  };
};

const roundedRect = (
  { left: x, top: y, width: w, height: h }: TourRect,
  r = 12,
) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

interface Tracked {
  key: string;
  hole: TourRect | null;
  element: HTMLElement | null;
  missing: boolean;
}

/**
 * Finds the step's element (it may mount late — the feed only mounts once it is
 * scrolled to), scrolls it into view once, and follows it every frame so the
 * hole stays on it while the page scrolls or settles.
 */
const useTourTarget = (
  step: TourStep | undefined,
  onPage: boolean,
  onMissing: () => void,
): Tracked => {
  const reduceMotion = useReducedMotion();
  const key = step ? `${step.id}:${step.target ?? ""}` : "";
  const target = step?.target;
  const [tracked, setTracked] = useState<Tracked>({
    key: "",
    hole: null,
    element: null,
    missing: false,
  });
  const onMissingRef = useRef(onMissing);
  useEffect(() => {
    onMissingRef.current = onMissing;
  });

  useEffect(() => {
    if (!target || !onPage) return undefined;
    let frame = 0;
    let element: HTMLElement | null = null;
    let scrolled = false;
    let last = "";
    const startedAt = performance.now();

    const tick = () => {
      if (!element || !element.isConnected) element = findVisible(target);
      if (element) {
        if (!scrolled) {
          scrolled = true;
          element.scrollIntoView({
            block: "center",
            inline: "nearest",
            behavior: reduceMotion ? "auto" : "smooth",
          });
        }
        const hole = toHole(element.getBoundingClientRect());
        const signature = hole
          ? `${Math.round(hole.left)},${Math.round(hole.top)},${Math.round(hole.width)},${Math.round(hole.height)}`
          : "none";
        if (signature !== last) {
          last = signature;
          setTracked({ key, hole, element, missing: false });
        }
      } else if (performance.now() - startedAt > FIND_TIMEOUT_MS) {
        setTracked({ key, hole: null, element: null, missing: true });
        onMissingRef.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key, target, onPage, reduceMotion]);

  return tracked.key === key
    ? tracked
    : { key, hole: null, element: null, missing: false };
};

const subscribeResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};

/** Window size plus the phone's bottom bar, as one comparable string. */
const getViewportSnapshot = () => {
  const bar = document.querySelector(`[${MOBILE_BOTTOM_NAV_ATTR}]`);
  const barHeight = bar ? bar.getBoundingClientRect().height : 0;
  return `${window.innerWidth}x${window.innerHeight}x${Math.round(barHeight)}`;
};

const useViewport = () => {
  const snapshot = useSyncExternalStore(
    subscribeResize,
    getViewportSnapshot,
    () => "1280x800x0",
  );
  return useMemo(() => {
    const [width, height, bottomInset] = snapshot.split("x").map(Number);
    return { width, height, bottomInset };
  }, [snapshot]);
};

/**
 * The tour itself: the screen dimmed except for one element, and Kostek in a
 * bubble beside it saying one or two sentences about it. Rendered inside the
 * app shell, not in a portal — the theme's tokens do not reach portals.
 */
const TourOverlay = () => {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const { t: tHub } = useTranslation("practice_hub");
  const { t: tNav } = useTranslation("nav");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const viewport = useViewport();
  const compact = viewport.width < 640;

  const { index, direction, destination, noGuitar, startedAt, goTo, stop } =
    useTourStore(
      useShallow((s) => ({
        index: s.index,
        direction: s.direction,
        destination: s.destination,
        noGuitar: s.noGuitar,
        startedAt: s.startedAt,
        goTo: s.goTo,
        stop: s.stop,
      })),
    );

  const context = useMemo(
    () => ({ destination, noGuitar }),
    [destination, noGuitar],
  );
  const steps = useMemo(
    () => getTourSteps(context, { isDesktop }),
    [context, isDesktop],
  );
  const position = Math.min(index, steps.length - 1);
  const step = steps[position];
  const onPage = router.pathname === step.path;

  const move = useCallback(
    (to: number) => {
      const next = steps[to];
      if (!next) return;
      goTo(to);
      if (next.path !== router.pathname) void router.push(next.path);
    },
    [steps, goTo, router],
  );

  const skipMissing = useCallback(() => {
    if (!step.optional) return;
    const to = position + direction;
    if (to < 0 || to >= steps.length) return;
    move(to);
  }, [step, position, direction, steps.length, move]);

  const tracked = useTourTarget(step, onPage, skipMissing);
  const searching = Boolean(step.target) && !tracked.hole && !tracked.missing;
  const hole = tracked.hole;

  const skip = useCallback(() => {
    trackTourSkipped({
      step: step.id,
      index: position,
      total: steps.length,
      durationMs: Date.now() - startedAt,
    });
    void firebaseSaveTourOutcome({ status: "skipped", step: step.id }).catch(
      () => null,
    );
    stop();
    toast(t("tour.skipped_toast", { take: tNav("take_tour") }));
  }, [step.id, position, steps.length, startedAt, stop, t, tNav]);

  const finish = (href: string | null) => {
    trackTourCompleted({
      durationMs: Date.now() - startedAt,
      destination: href,
    });
    void firebaseSaveTourOutcome({ status: "completed", step: "done" }).catch(
      () => null,
    );
    stop();
    if (href) void router.push(href);
  };

  // Each step once per showing, for the drop-off funnel.
  useEffect(() => {
    if (!onPage) return;
    trackTourStepViewed({
      step: step.id,
      index: position,
      total: steps.length,
    });
  }, [onPage, step.id, position, steps.length]);

  // The lit element is the "Next" button on a click step.
  const element = tracked.element;
  useEffect(() => {
    if (!step.advanceOnClick || !element) return undefined;
    const onClick = () => goTo(position + 1);
    element.addEventListener("click", onClick);
    return () => element.removeEventListener("click", onClick);
  }, [step.advanceOnClick, element, goTo, position]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  // The bubble's real size, for placing it; until measured, an estimate.
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleSize, setBubbleSize] = useState(BUBBLE_ESTIMATE);
  useEffect(() => {
    const node = bubbleRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.target.getBoundingClientRect();
      setBubbleSize((prev) =>
        Math.round(prev.width) === Math.round(box.width) &&
        Math.round(prev.height) === Math.round(box.height)
          ? prev
          : { width: box.width, height: box.height },
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [onPage]);

  const primaryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!searching && onPage)
      primaryRef.current?.focus({ preventScroll: true });
  }, [step.id, searching, onPage]);

  if (!onPage) return null;

  const placement = placeBubble(step.big ? null : hole, bubbleSize, viewport, {
    compact: compact && !step.big,
  });

  const goalName = destination
    ? tHub(`modes.${GOAL_MODE[destination.goal]}.title`)
    : "";
  const ctaHref = getTourCtaHref(context);

  // Button and group names come from where the player sees them, so the
  // sentence names them the way the screen does in every language.
  const practiceLabel = tNav("practice");
  const copy = (() => {
    switch (step.id) {
      case "nav":
        return {
          title: t("tour.nav.title"),
          text: isDesktop
            ? t("tour.nav.text")
            : t("tour.nav.text_mobile", { more: tNav("more") }),
        };
      case "go_practice":
        return {
          title: t("tour.go_practice.title"),
          text: t("tour.go_practice.text", { practice: practiceLabel }),
        };
      case "hub":
        return {
          title: t("tour.hub.title"),
          text: t("tour.hub.text", {
            today: tHub("groups.today"),
            courses: tHub("groups.courses"),
            music: tHub("groups.music"),
            technique: tHub("groups.technique"),
            versus: tHub("groups.versus"),
          }),
        };
      case "stats":
        return {
          title: t("tour.stats.title"),
          text: t(isDesktop ? "tour.stats.text" : "tour.stats.text_mobile"),
        };
      case "start":
        return {
          title: t("tour.start.title", { name: goalName }),
          text: noGuitar
            ? t("tour.start.no_guitar", { name: goalName })
            : t(`tour.start.${destination?.goal ?? "journey"}`),
        };
      case "done":
        return {
          title: t("tour.done.title"),
          text: t("tour.done.text", { take: tNav("take_tour") }),
        };
      default:
        return {
          title: t(`tour.${step.id}.title`),
          text: t(`tour.${step.id}.text`),
        };
    }
  })();

  const progress = Math.round(((position + 1) / steps.length) * 100);
  const isLast = step.id === "done";

  return (
    <div className='tour-overlay'>
      {hole ? (
        <svg
          aria-hidden
          className='pointer-events-none fixed inset-0 z-[200] h-full w-full'>
          {/* evenodd: the hole is not filled, so it takes no clicks either */}
          <path
            d={`M-10 -10H${viewport.width + 10}V${viewport.height + 10}H-10Z${roundedRect(hole)}`}
            fillRule='evenodd'
            className='pointer-events-auto fill-zinc-950/75'
          />
        </svg>
      ) : (
        <div aria-hidden className='fixed inset-0 z-[200] bg-zinc-950/75' />
      )}

      {hole &&
        (step.advanceOnClick ? (
          <div
            aria-hidden
            className='pointer-events-none fixed z-[201] animate-pulse rounded-xl ring-2 ring-zinc-100/80'
            style={hole}
          />
        ) : (
          // Looking, not touching: the lit element is not clickable here.
          <div aria-hidden className='fixed z-[201]' style={hole} />
        ))}

      <div
        ref={bubbleRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='tour-title'
        aria-describedby='tour-text'
        className={cn(
          "fixed z-[202] flex flex-col gap-3 rounded-xl bg-zinc-900 p-4 text-left transition-[left,top,opacity] duration-300 ease-out motion-reduce:transition-none",
          step.big
            ? "w-[min(380px,calc(100vw-24px))] items-center gap-4 p-6 text-center"
            : compact
              ? "inset-x-3"
              : "w-[340px]",
          searching && "invisible opacity-0",
        )}
        style={
          compact && !step.big
            ? { top: placement.y }
            : { left: placement.x, top: placement.y }
        }>
        <div
          className={cn(
            "flex items-center gap-3",
            step.big && "flex-col gap-4",
          )}>
          <Kostek
            mood={step.big ? "wave" : "nudge"}
            lookAt={step.big ? undefined : placement.lookAt}
            cue={step.id}
            className={step.big ? "h-[132px]" : "h-14 shrink-0"}
          />
          <div className='flex min-w-0 flex-col gap-0.5'>
            <span className='text-xs tabular-nums text-zinc-500'>
              {t("tour.step", { n: position + 1, total: steps.length })}
            </span>
            <h2
              id='tour-title'
              className={cn(
                "font-semibold text-zinc-100",
                step.big ? "text-xl" : "text-base",
              )}>
              {copy.title}
            </h2>
          </div>
        </div>

        <p id='tour-text' className='text-sm leading-relaxed text-zinc-300'>
          {copy.text}
        </p>
        {step.advanceOnClick && (
          <p className='text-sm font-medium text-zinc-100'>
            {t("tour.go_practice.hint", { practice: practiceLabel })}
          </p>
        )}

        <div
          aria-hidden
          className='h-2 w-full overflow-hidden rounded-full bg-zinc-800'>
          <div
            className='h-full rounded-full bg-zinc-100 transition-[width] duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            step.big && "w-full flex-col items-stretch",
          )}>
          {isLast ? (
            <>
              {ctaHref && (
                <Button
                  ref={primaryRef}
                  type='button'
                  size='lg'
                  onClick={() => finish(ctaHref)}>
                  {noGuitar
                    ? t("tour.done.cta_no_guitar")
                    : t("tour.done.cta_go")}
                </Button>
              )}
              <Button
                ref={ctaHref ? undefined : primaryRef}
                type='button'
                variant={ctaHref ? "secondary" : "default"}
                size='lg'
                onClick={() => finish(null)}>
                {t("tour.done.finish")}
              </Button>
            </>
          ) : (
            <>
              {position > 0 && !step.big && (
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={() => move(position - 1)}>
                  {t("tour.back")}
                </Button>
              )}
              {!step.advanceOnClick && (
                <Button
                  ref={primaryRef}
                  type='button'
                  size={step.big ? "lg" : "sm"}
                  onClick={() => move(position + 1)}>
                  {step.id === "welcome"
                    ? t("tour.welcome.cta")
                    : t("tour.next")}
                </Button>
              )}
              <span className={cn("flex-1", step.big && "hidden")} />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={skip}
                className='text-zinc-400'>
                {t("tour.skip")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
