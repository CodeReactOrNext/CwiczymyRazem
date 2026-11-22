import { animate, useReducedMotion } from "framer-motion";
import { transitions } from "lib/motion/motion";
import type { RefObject } from "react";
import { useLayoutEffect } from "react";

/**
 * Every tab of a `PageTabs` rail is its own page, so a switch unmounts the rail
 * and mounts a fresh one — there is nothing left to animate from. The click is
 * remembered here instead, and the new rail replays it: the underline slides
 * from the old tab to the new one, and `data-tab-switch` on the rail lets
 * globals.css bring the section's content in.
 *
 * The record is not consumed on use, so React's dev double-mount still sees it;
 * it simply expires.
 */
interface TabSwitch {
  from: string;
  to: string;
  at: number;
}

let lastSwitch: TabSwitch | null = null;

/** Long enough for the next page's getInitialProps, short enough to never replay on a later visit. */
const SWITCH_TTL_MS = 3000;
/** Outlasts the content entrance (`base`) so the attribute never cuts it short. */
const CONTENT_ENTRANCE_MS = 600;

export const markTabSwitch = (from: string, to: string) => {
  if (from !== to) lastSwitch = { from, to, at: Date.now() };
};

/**
 * True while `path` is the page a tab was just clicked for. The shell uses it
 * to skip its whole-page fade: the hero, rail and frame look the same on both
 * sides of a tab switch, so fading them in from nothing only made them blink.
 */
export const isTabSwitchTo = (path: string) =>
  !!lastSwitch &&
  lastSwitch.to === path.split(/[?#]/)[0] &&
  Date.now() - lastSwitch.at <= SWITCH_TTL_MS;

const findTab =(rail: HTMLElement, href: string) =>
  Array.from(rail.querySelectorAll<HTMLElement>("[data-tab-href]")).find(
    (tab) => tab.dataset.tabHref === href,
  );

export const useTabSwitchMotion = (
  railRef: RefObject<HTMLElement | null>,
  barRef: RefObject<HTMLElement | null>,
  activeHref: string,
) => {
  const reduceMotion = useReducedMotion();

  // Layout effect: the rail is marked before the first paint, so the new page
  // never shows its content or its static underline for a frame first.
  useLayoutEffect(() => {
    const rail = railRef.current;
    const bar = barRef.current;
    const tabSwitch = lastSwitch;
    if (
      !rail ||
      !bar ||
      !tabSwitch ||
      tabSwitch.to !== activeHref ||
      Date.now() - tabSwitch.at > SWITCH_TTL_MS
    ) {
      return undefined;
    }

    rail.dataset.tabSwitch = "";
    const clearSwitch = window.setTimeout(() => {
      delete rail.dataset.tabSwitch;
    }, CONTENT_ENTRANCE_MS);

    const fromTab = findTab(rail, tabSwitch.from);
    const toTab = findTab(rail, activeHref);
    if (!fromTab || !toTab || reduceMotion) {
      return () => {
        window.clearTimeout(clearSwitch);
        delete rail.dataset.tabSwitch;
      };
    }

    // The active tab's own underline hides while the bar travels to it.
    rail.dataset.tabSliding = "";
    bar.style.opacity = "1";
    const finish = () => {
      delete rail.dataset.tabSliding;
      bar.style.opacity = "0";
    };
    const slide = animate(
      bar,
      {
        x: [fromTab.offsetLeft, toTab.offsetLeft],
        width: [fromTab.offsetWidth, toTab.offsetWidth],
      },
      transitions.move,
    );
    slide.then(finish);

    return () => {
      slide.stop();
      finish();
      window.clearTimeout(clearSwitch);
      delete rail.dataset.tabSwitch;
    };
  }, [activeHref, barRef, railRef, reduceMotion]);
};
