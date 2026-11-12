// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let sessionStatus: "loading" | "authenticated" | "unauthenticated" = "loading";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: sessionStatus }),
}));

// One Tap and the Google thunk initialize Firebase at import time.
vi.mock("feature/user/components/GoogleOneTap/GoogleOneTap", () => ({
  GoogleOneTap: () => null,
}));
vi.mock("feature/user/store/userSlice", () => ({ selectIsFetching: vi.fn() }));
vi.mock("feature/user/store/userSlice.asyncThunk", () => ({
  logInViaGoogle: vi.fn(),
}));
vi.mock("lib/signupFunnel", () => ({ trackSignupCtaClicked: vi.fn() }));

// No profile in the store: the button must not wait for one.
vi.mock("store/hooks", () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: () => null,
}));

import { HeroAuthButtons } from "./HeroAuthButtons";

// Both labels stay in the DOM (the idle one is aria-hidden and rolled out of
// the key), so the state is read from the accessible names, not from the text.
describe("HeroAuthButtons", () => {
  beforeEach(() => {
    sessionStatus = "loading";
  });
  afterEach(cleanup);

  it("links to the dashboard as soon as the session is there, before the profile syncs", async () => {
    sessionStatus = "authenticated";
    render(<HeroAuthButtons />);

    // The first frame is the visitor's keys; the labels roll over on the next.
    const link = await screen.findByRole("link", { name: /go to dashboard/i });
    expect(link.getAttribute("href")).toBe("/dashboard");
    expect(screen.queryByRole("link", { name: /start tracking/i })).toBeNull();
    expect(
      screen
        .getByRole("link", { name: /start practicing/i })
        .getAttribute("href"),
    ).toBe("/timer");
  });

  it("offers sign-up to a visitor without a session", () => {
    sessionStatus = "unauthenticated";
    render(<HeroAuthButtons />);

    const link = screen.getByRole("link", { name: /start tracking/i });
    expect(link.getAttribute("href")).toBe("/signup");
    expect(
      screen.getByRole("link", { name: /continue with google/i }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: /go to dashboard/i })).toBeNull();
  });

  it("keeps the same keys in every state, so the hero below never moves", async () => {
    sessionStatus = "unauthenticated";
    const { container, rerender } = render(<HeroAuthButtons />);
    const before = container.querySelectorAll("a").length;

    sessionStatus = "authenticated";
    rerender(<HeroAuthButtons />);
    await screen.findByRole("link", { name: /go to dashboard/i });

    expect(container.querySelectorAll("a").length).toBe(before);
  });
});
