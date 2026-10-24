// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dispatch = vi.fn();
let pathname = "/dashboard";
let state: {
  userAuth: string | null;
  userInfo: Record<string, unknown> | null;
  isUserSnapshot: boolean;
};

vi.mock("feature/user/store/userSlice", () => ({
  selectUserAuth: (s: typeof state) => s.userAuth,
  selectUserInfo: (s: typeof state) => s.userInfo,
  selectIsUserSnapshot: (s: typeof state) => s.isUserSnapshot,
}));

vi.mock("feature/user/store/userSlice.asyncThunk", () => ({
  answerEmailConsent: (granted: boolean) => ({ type: "answer", granted }),
}));

vi.mock("store/hooks", () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: (selector: (s: typeof state) => unknown) => selector(state),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ pathname }),
}));

import { useEmailConsentPrompt } from "./useEmailConsentPrompt";

const YEAR_AGO = { _seconds: Date.now() / 1000 - 365 * 86_400 };

const renderPrompt = () => {
  const hook = renderHook(() => useEmailConsentPrompt());
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  return hook;
};

describe("useEmailConsentPrompt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    dispatch.mockClear();
    pathname = "/dashboard";
    state = {
      userAuth: "uid-1",
      userInfo: { emailConsent: null, createdAt: YEAR_AGO },
      isUserSnapshot: false,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks an account that was never asked", () => {
    const { result } = renderPrompt();

    expect(result.current.show).toBe(true);
    expect(result.current.isNewAccount).toBe(false);
  });

  it("tells a sign-up from today it is a first question, not a late one", () => {
    state.userInfo = { emailConsent: null, createdAt: { _seconds: Date.now() / 1000 } };

    expect(renderPrompt().result.current.isNewAccount).toBe(true);
  });

  it("never asks someone who already answered, yes or no", () => {
    state.userInfo = { emailConsent: { granted: false, source: "signup" } };

    expect(renderPrompt().result.current.show).toBe(false);
  });

  it("waits for the fresh profile instead of trusting last visit's copy", () => {
    state.isUserSnapshot = true;

    expect(renderPrompt().result.current.show).toBe(false);
  });

  it("stays quiet in the middle of a practice session", () => {
    pathname = "/timer/practice";

    expect(renderPrompt().result.current.show).toBe(false);
  });

  it("saves the answer and keeps the other prompts away for the visit", () => {
    const { result } = renderPrompt();

    act(() => result.current.answer(true));

    expect(dispatch).toHaveBeenCalledWith({ type: "answer", granted: true });
    expect(result.current.show).toBe(false);
    expect(result.current.blocksOtherPrompts).toBe(true);
  });

  it("closing without an answer puts the question off until the next visit", () => {
    const first = renderPrompt();
    act(() => first.result.current.close());
    first.unmount();

    expect(dispatch).not.toHaveBeenCalled();
    expect(renderPrompt().result.current.show).toBe(false);
  });
});
