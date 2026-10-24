import {
  selectIsUserSnapshot,
  selectUserAuth,
  selectUserInfo,
} from "feature/user/store/userSlice";
import { answerEmailConsent } from "feature/user/store/userSlice.asyncThunk";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

// Let the page settle before asking.
const SHOW_DELAY = 1500;
// Mid-practice is no time for a question.
const QUIET_ROUTES = ["/timer", "/practice"];
// Under a day old: a Google sign-up that has just arrived, not an old account.
const NEW_ACCOUNT_MS = 24 * 60 * 60 * 1000;

const SESSION_KEY = "emailConsentPromptClosed";
const wasClosedThisSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};
const markClosedThisSession = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}
};

const toMs = (value: any): number => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const s = value.seconds ?? value._seconds ?? 0;
  return s * 1000;
};

/**
 * Asks once whether we may email the player, for the accounts that were never
 * asked: everyone who signed up before the question existed, and Google
 * sign-ups (the email form has its own checkbox). Until they answer, none of
 * the optional emails go out (see lib/email/consent). Closing it without an
 * answer only puts the question off until the next visit.
 */
export const useEmailConsentPrompt = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useRouter();
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  // The copy saved on the last visit may predate the answer.
  const isUserSnapshot = useAppSelector(selectIsUserSnapshot);
  const [show, setShow] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);
  // Answered or closed in this visit — also keeps the other prompts away.
  const [isHandled, setIsHandled] = useState(false);

  const isUnanswered =
    !!userAuth && !!userInfo && !isUserSnapshot && !userInfo.emailConsent;
  const isQuietRoute = QUIET_ROUTES.some((route) => pathname.startsWith(route));
  const createdAtMs = toMs(userInfo?.createdAt);

  useEffect(() => {
    if (!isUnanswered || isQuietRoute || isHandled || wasClosedThisSession()) {
      return;
    }
    const timer = setTimeout(() => {
      setIsNewAccount(Date.now() - createdAtMs < NEW_ACCOUNT_MS);
      setShow(true);
    }, SHOW_DELAY);
    return () => clearTimeout(timer);
  }, [isUnanswered, isQuietRoute, isHandled, createdAtMs]);

  const answer = (granted: boolean) => {
    setShow(false);
    setIsHandled(true);
    void dispatch(answerEmailConsent(granted));
  };

  const close = () => {
    setShow(false);
    setIsHandled(true);
    markClosedThisSession();
  };

  return {
    show,
    isNewAccount,
    answer,
    close,
    /** One question per visit: the feedback and support asks wait for the next. */
    blocksOtherPrompts: show || isHandled,
  };
};
