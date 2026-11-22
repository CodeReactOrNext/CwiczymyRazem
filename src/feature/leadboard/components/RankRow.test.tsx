// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RankRow } from "./RankRow";

vi.mock("components/UI/Avatar", () => ({
  default: ({ name }: { name: string }) => (
    <span data-testid='avatar' aria-label={name} />
  ),
}));

const renderRow = (props: Partial<Parameters<typeof RankRow>[0]> = {}) =>
  render(
    <ol>
      <RankRow
        place={1}
        nick='Kasia'
        profileId='kasia-1'
        isCurrentUser={false}
        score='12,345'
        {...props}
      />
    </ol>,
  );

describe("RankRow", () => {
  afterEach(cleanup);

  it("renders the place, the player and the score", () => {
    renderRow({ meta: "LVL 7", scoreLabel: "ELO" });

    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("12,345")).toBeDefined();
    expect(screen.getByText("LVL 7")).toBeDefined();
    expect(screen.getByText("ELO")).toBeDefined();
    expect(screen.getByText("Kasia").closest("a")?.getAttribute("href")).toBe(
      "/user/kasia-1",
    );
  });

  it("wears the gold medal key on first place", () => {
    renderRow();
    expect(screen.getByText("1").className).toContain("bg-amber-400");
  });

  it("drops the medal and the podium light when podium is off", () => {
    const { container } = renderRow({ podium: false });

    const place = screen.getByText("1");
    expect(place.className).not.toContain("bg-amber-400");
    expect(place.className).toContain("bg-zinc-800");
    expect(container.innerHTML).not.toContain("from-amber-400");
    // The score loses the gold ink as well.
    expect(screen.getByText("12,345").className).not.toContain(
      "text-amber-400",
    );
  });

  it("lights the player's own row cyan", () => {
    const { container } = renderRow({ isCurrentUser: true, place: 5 });

    expect(container.innerHTML).toContain("from-cyan-400/15");
    expect(screen.getByText("Kasia").className).toContain("text-cyan-300");
    expect(screen.getByText("12,345").className).toContain("text-cyan-300");
  });

  it("does not link a row without a profile", () => {
    renderRow({ profileId: undefined });
    expect(screen.getByText("Kasia").closest("a")).toBeNull();
  });
});
