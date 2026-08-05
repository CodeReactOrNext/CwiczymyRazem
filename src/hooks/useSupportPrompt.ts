import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserInfo,
} from "feature/user/store/userSlice";
import { doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";

// Give the user real value before asking (reciprocity).
const MIN_DAYS_SINCE_REGISTRATION = 7;
const MIN_SESSIONS = 5;

// Re-eligible only once BOTH have passed since the last time it was shown —
// prevents re-asking a binge-session user the same day, and a low-activity
// user just because a month went by.
const MIN_DAYS_SINCE_SHOWN = 1;
const MIN_SESSIONS_SINCE_SHOWN = 1;

// Extra cooldown in days after each explicit dismissal (index = dismissCount - 1).
// Never fully suppressed — repeat-dismissers land on the last value (40) forever.
const DISMISS_COOLDOWNS_DAYS = [7, 12, 30, 40];

const LS_KEY = "supportAskState";

interface LsState {
  lastShownAt: number;
  lastShownSessionCount: number;
  dismissCount: number;
  lastDismissedAt: number;
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

export const useSupportPrompt = () => {
  const [show, setShow] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const userStats = useAppSelector(selectCurrentUserStats);

  useEffect(() => {
    if (!userAuth || !userInfo || !userStats) return;

    const ls = getLsState();

    // Basic eligibility.
    const meetsSessions = userStats.sessionCount >= MIN_SESSIONS;
    const accountAgeDays = (Date.now() - toMs(userInfo.createdAt)) / 86_400_000;
    const meetsAge = accountAgeDays >= MIN_DAYS_SINCE_REGISTRATION;
    if (!meetsSessions || !meetsAge) return;

    // Cooldown since it was last shown (days AND sessions must both clear).
    const lastShownMs = Math.max(
      toMs(userInfo.supportAskLastShownAt),
      ls?.lastShownAt ?? 0
    );
    if (lastShownMs) {
      const lastShownSessionCount = Math.max(
        userInfo.supportAskLastShownSessionCount ?? 0,
        ls?.lastShownSessionCount ?? 0
      );
      const daysSinceShown = (Date.now() - lastShownMs) / 86_400_000;
      const sessionsSinceShown = userStats.sessionCount - lastShownSessionCount;
      if (
        daysSinceShown < MIN_DAYS_SINCE_SHOWN ||
        sessionsSinceShown < MIN_SESSIONS_SINCE_SHOWN
      ) {
        return;
      }
    }

    // Extra cooldown after an explicit dismissal.
    const dismissCount = Math.max(
      userInfo.supportAskDismissCount ?? 0,
      ls?.dismissCount ?? 0
    );
    if (dismissCount > 0) {
      const cooldownDays =
        DISMISS_COOLDOWNS_DAYS[dismissCount - 1] ??
        DISMISS_COOLDOWNS_DAYS[DISMISS_COOLDOWNS_DAYS.length - 1];
      const lastDismissedMs = Math.max(
        toMs(userInfo.supportAskLastDismissedAt),
        ls?.lastDismissedAt ?? 0
      );
      const daysSinceLastDismiss = lastDismissedMs
        ? (Date.now() - lastDismissedMs) / 86_400_000
        : Infinity;
      if (daysSinceLastDismiss < cooldownDays) return;
    }

    const timer = setTimeout(() => {
      setShow(true);
      setLsState({
        lastShownAt: Date.now(),
        lastShownSessionCount: userStats.sessionCount,
      });
      updateDoc(doc(db, "users", userAuth), {
        supportAskLastShownAt: serverTimestamp(),
        supportAskLastShownSessionCount: userStats.sessionCount,
      }).catch(() => {
        // localStorage fallback already saved above
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [userAuth, userInfo, userStats]);

  const markAsDismissed = async () => {
    if (!userAuth) return;
    setShow(false);
    const ls = getLsState();
    const newCount = Math.max(userInfo?.supportAskDismissCount ?? 0, ls?.dismissCount ?? 0) + 1;
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

  const markAsDonate = () => {
    setShow(false);
  };

  return { show, markAsDismissed, markAsDonate };
};
