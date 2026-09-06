// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SupporterStrip } from "./SupporterStrip";

const wall = vi.hoisted(() => ({
  members: [] as SupportTeamMember[],
  isLoading: false,
}));

vi.mock("feature/supportTeam/hooks/useSupporterWall", () => ({
  useSupporterWall: () => wall,
}));

// The real card reaches into Firestore on open and pulls the whole responsive
// store with it; the strip only owes it a trigger, so that is what is asserted.
vi.mock("components/UserTooltip/UserTooltip", () => ({
  UserTooltip: ({
    userId,
    children,
  }: {
    userId: string | null;
    children: React.ReactNode;
  }) => <div data-testid={`tooltip-${userId}`}>{children}</div>,
}));

vi.mock("feature/supportTeam/hooks/useSupportTeam", () => ({
  useSupportTeam: () => ({
    getSupportMember: (uid: string) => ({
      uid,
      displayName: uid,
      avatar: null,
      title: null,
    }),
  }),
}));

afterEach(() => {
  cleanup();
  wall.members = [];
  wall.isLoading = false;
});

const member = (n: number): SupportTeamMember => ({
  uid: `u${n}`,
  displayName: `Player ${n}`,
  avatar: null,
  title: null,
});

const renderStrip = () => render(<SupporterStrip />).container;

describe("SupporterStrip", () => {
  it("stays out of the hero entirely while the roster loads or is empty", () => {
    wall.isLoading = true;
    expect(renderStrip().textContent).not.toContain("Funded by");

    cleanup();
    wall.isLoading = false;
    expect(renderStrip().firstChild).toBeNull();
  });

  it("shows every supporter rather than a sample behind a counter", () => {
    wall.members = Array.from({ length: 23 }, (_, i) => member(i));
    renderStrip();

    expect(screen.getByText("23 players")).toBeTruthy();
    expect(
      screen
        .getAllByRole("link")
        .filter((el) => el.getAttribute("href")?.startsWith("/user/")),
    ).toHaveLength(23);
    // Nothing is folded away, so there is no overflow pill to click.
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });

  it("keeps the caption plain text — every link here goes to a profile", () => {
    wall.members = [member(1)];
    renderStrip();

    expect(
      screen
        .getAllByRole("link")
        .some((el) => el.textContent?.includes("Funded by")),
    ).toBe(false);
    expect(screen.getByText("1 player")).toBeTruthy();
  });

  it("gives each face the stats hover card and a link to that profile", () => {
    wall.members = [member(7)];
    renderStrip();

    const trigger = screen.getByTestId("tooltip-u7");

    expect(trigger.querySelector('a[href="/user/u7"]')).toBeTruthy();
  });
});
