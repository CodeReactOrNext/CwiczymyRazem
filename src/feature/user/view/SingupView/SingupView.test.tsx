// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SingupView from "./SingupView";

// The view only reads `isFetching` off the store and dispatches thunks, so the
// whole Redux/Firebase chain is stubbed rather than booted.
vi.mock("store/hooks", () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: () => null,
}));

vi.mock("feature/user/store/userSlice", () => ({
  selectIsFetching: () => null,
}));

vi.mock("feature/user/store/userSlice.asyncThunk", () => ({
  createAccount: vi.fn(),
  logInViaGoogle: vi.fn(),
}));

vi.mock("lib/signupFunnel", () => ({
  trackSignupCompleted: vi.fn(),
  trackSignupFormViewed: vi.fn(),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ query: {}, push: vi.fn() }),
}));

vi.mock("store/useResponsiveStore", () => ({
  useResponsiveStore: () => false,
}));

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("SingupView", () => {
  afterEach(cleanup);

  it("puts the one-click Google option above the email form", () => {
    const { container } = render(<SingupView />);

    const google = screen.getByRole("button", { name: /signup:google_button/ });
    const firstField = container.querySelector("#email") as HTMLElement;

    // Node.compareDocumentPosition: 4 = the field follows the button in the tree.
    expect(google.compareDocumentPosition(firstField)).toBe(
      container.ownerDocument.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("asks for email before username", () => {
    const { container } = render(<SingupView />);

    const labels = Array.from(container.querySelectorAll("label")).map(
      (label) => label.textContent
    );

    expect(labels).toEqual([
      "signup:email_label",
      "signup:username_label",
      "signup:password_label",
    ]);
  });

  it("no longer asks anyone to retype their password", () => {
    const { container } = render(<SingupView />);

    expect(container.querySelector("#repeat_password")).toBeNull();
  });

  it("repeats the landing page's promise above the form", () => {
    render(<SingupView />);

    expect(screen.getByText("signup:value_prop")).toBeDefined();
  });
});
