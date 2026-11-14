import type { SupportModalVariant } from "feature/support/components/SupportModal";
import { getSupportPrompt } from "feature/support/utils/supportPromptRules";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserInfo,
} from "feature/user/store/userSlice";
import { doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";

// Long enough for the page the player landed on after the session to settle.
const SHOW_DELAY_MS = 1500;

const HOUR_MS = 3_600_000;

const LS_KEY = "supportAskState";

interface LsState {
  lastShownAt: number;
  lastShownSessionCount: number;
  dismissCount: number;
  lastDismissedAt: number;
  /** Session count the last time this browser checked — see the rules. */
  seenSessionCount: number;
  /** Last click on the ask's donate button. */
  lastDonateClickAt: number;
  /** Supporter notes shown so far — every fourth is the "again" one. */
  supporterNoteCount: number;
}

const getLsState = (): Partial<LsState> | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setLsState = (patch: Partial<LsState>) => {
  try {
    const current = getLsState() ?? {};
    localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
};

const toMs = (value: any): number => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const s = value.seconds ?? value._seconds ?? 0;
  return s * 1000;
};

const getLocalDay = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export type SupportPromptCloseVia = "button" | "x" | "backdrop";

export const useSupportPrompt = () => {
  const [shown, setShown] = useState<SupportModalVariant | null>(null);
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const userStats = useAppSelector(selectCurrentUserStats);
  const { isSupport, isLoading: isRosterLoading } = useSupportTeam();
  const isSupporter = isSupport(userAuth);

  useEffect(() => {
    if (!userAuth || !userInfo || !userStats) return;
    // Until the roster lands everyone reads as a non-supporter; waiting keeps
    // a supporter from being asked for money they already gave.
    if (isRosterLoading) return;

    const ls = getLsState();
    const sessionCount = userStats.sessionCount;

    const variant = getSupportPrompt({
      now: Date.now(),
      accountCreatedMs: toMs(userInfo.createdAt),
      sessionCount,
      isSupporter,
      seenSessionCount: ls?.seenSessionCount ?? null,
      // Absent on old accounts: without it the session count alone decides.
      practicedToday:
        !userStats.lastPracticeLocalDay ||
        userStats.lastPracticeLocalDay === getLocalDay(),
      lastShownMs: Math.max(
        toMs(userInfo.supportAskLastShownAt),
        ls?.lastShownAt ?? 0,
      ),
      lastDonateClickMs: ls?.lastDonateClickAt ?? 0,
      supporterNoteCount: ls?.supporterNoteCount ?? 0,
    });

    if (!variant) {
      // This session has been looked at; it will not trigger a prompt later.
      setLsState({ seenSessionCount: sessionCount });
      return;
    }

    // The session stays "unseen" until the timer fires, so a re-run of this
    // effect inside the delay reaches the same decision instead of losing it.
    const timer = setTimeout(() => {
      setShown(variant);
      setLsState({
        seenSessionCount: sessionCount,
        lastShownAt: Date.now(),
        lastShownSessionCount: sessionCount,
        ...(variant === "ask"
          ? {}
          : { supporterNoteCount: (ls?.supporterNoteCount ?? 0) + 1 }),
      });
      posthog.capture("support_prompt_shown", { variant });
      updateDoc(doc(db, "users", userAuth), {
        supportAskLastShownAt: serverTimestamp(),
        supportAskLastShownSessionCount: sessionCount,
      }).catch(() => {
        // localStorage fallback already saved above
      });
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [userAuth, userInfo, userStats, isRosterLoading, isSupporter]);

  const markAsDismissed = async (via: SupportPromptCloseVia = "button") => {
    const variant = shown;
    setShown(null);
    if (!userAuth || !variant) return;
    posthog.capture("support_prompt_dismissed", { variant, via });

    // Closing a note to a supporter is not turning down an ask.
    if (variant !== "ask") return;

    const ls = getLsState();
    const newCount =
      Math.max(userInfo?.supportAskDismissCount ?? 0, ls?.dismissCount ?? 0) + 1;
    setLsState({ dismissCount: newCount, lastDismissedAt: Date.now() });
    try {
      await updateDoc(doc(db, "users", userAuth), {
        supportAskDismissCount: increment(1),
        supportAskLastDismissedAt: serverTimestamp(),
      });
    } catch {
      // localStorage fallback already saved above
    }
  };

  /** The modal's main button: the donate link, or the panel for a supporter. */
  const markAsDonate = () => {
    if (shown) posthog.capture("support_prompt_cta_clicked", { variant: shown });
    if (shown === "ask") setLsState({ lastDonateClickAt: Date.now() });
    setShown(null);
  };

  const time = userStats?.time;
  const practiceHours = time
    ? Math.floor(
        (time.technique + time.theory + time.hearing + time.creativity) /
          HOUR_MS,
      )
    : 0;

  return {
    show: shown !== null,
    variant: shown ?? (isSupporter ? "thanks" : "ask"),
    name: userInfo?.displayName ?? undefined,
    practiceHours,
    markAsDismissed,
    markAsDonate,
  };
};
