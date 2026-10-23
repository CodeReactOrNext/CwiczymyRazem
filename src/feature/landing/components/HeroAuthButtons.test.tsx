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

describe("HeroAuthButtons", () => {
  beforeEach(() => {
    sessionStatus = "loading";
  });
  afterEach(cleanup);

  it("links to the dashboard as soon as the session is there, before the profile syncs", () => {
    sessionStatus = "authenticated";
    render(<HeroAuthButtons />);

    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link.getAttribute("href")).toBe("/dashboard");
    expect(screen.queryByText("Start tracking")).toBeNull();
  });

  it("offers sign-up to a visitor without a session", () => {
    sessionStatus = "unauthenticated";
    render(<HeroAuthButtons />);

    expect(screen.getByText("Start tracking")).toBeTruthy();
    expect(screen.queryByText("Go to Dashboard")).toBeNull();
  });
});
