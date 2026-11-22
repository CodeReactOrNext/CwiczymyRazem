// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeHero } from "./HomeHero";

type Props = ComponentProps<typeof HomeHero>;

const renderHero = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    title: "Start today's practice",
    fact: { text: "3-day streak", isStreak: true },
    cta: { label: "Practice", isPrimary: true, onClick: vi.fn() },
    guitar: null,
    mascot: { mood: "nudge", lookAt: "left" },
    stackedStats: <span>stacked stats</span>,
    stripStats: <span>strip stats</span>,
    customize: {
      label: "Customize",
      refreshingLabel: "Updating…",
      isEditing: false,
      isRefreshing: false,
      onClick: vi.fn(),
    },
    ...overrides,
  };
  return { props, ...render(<HomeHero {...props} />) };
};

describe("HomeHero", () => {
  afterEach(cleanup);

  it("shows the title, the one fact under it and the practice key", () => {
    const { props } = renderHero();

    expect(
      screen.getByRole("heading", { name: "Start today's practice" }),
    ).toBeTruthy();
    expect(screen.getByText("3-day streak")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Practice" }));
    expect(props.cta.onClick).toHaveBeenCalledTimes(1);
  });

  it("leaves the line under the title out when there is no fact", () => {
    renderHero({ fact: null });

    expect(screen.queryByText("3-day streak")).toBeNull();
  });

  it("names the guitar once, in the stage's caption", () => {
    const { container } = renderHero({
      guitar: {
        src: "/static/images/rank/special/33.webp",
        caption: { name: "Izanor JTY", rarity: "Mythic" },
      },
    });

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/static/images/rank/special/33.webp",
    );
    // Only the caption on the stage (shown from lg up) — no second copy over
    // the title, which is what a phone would otherwise show.
    expect(screen.getAllByText("Izanor JTY")).toHaveLength(1);
    expect(screen.getAllByText("Mythic")).toHaveLength(1);
  });

  it("lights the stage in the guitar's rarity colour, further for a rarer one", () => {
    const washOf = (strength: number) => {
      const { container } = renderHero({
        guitar: {
          src: "/static/images/rank/special/33.webp",
          caption: { name: "Izanor JTY", rarity: "Mythic" },
          light: { color: "#fbbf24", strength },
        },
      });
      const wash = Array.from(
        container.querySelectorAll<HTMLElement>("[aria-hidden]"),
      ).find((el) => el.style.getPropertyValue("--hero-light"));
      const value = wash?.style.getPropertyValue("--hero-light");
      cleanup();
      return value;
    };

    expect(washOf(0.1)).toBe("color-mix(in srgb, #fbbf24 10%, transparent)");
    expect(washOf(0.27)).toBe("color-mix(in srgb, #fbbf24 27%, transparent)");
  });

  it("writes the rarity's name in the rarity colour", () => {
    renderHero({
      guitar: {
        src: "/static/images/rank/special/33.webp",
        caption: { name: "Izanor JTY", rarity: "Mythic" },
        light: { color: "#fbbf24", strength: 0.27 },
      },
    });

    for (const label of screen.getAllByText("Mythic")) {
      expect(label.getAttribute("style")).toContain("#fbbf24");
    }
  });

  it("gives the stage to Kostek when no guitar is equipped", () => {
    const { container } = renderHero();

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("opens Customize from the strip and locks the key while it is open", () => {
    const { props, rerender } = renderHero();

    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    expect(props.customize.onClick).toHaveBeenCalledTimes(1);

    rerender(
      <HomeHero
        {...props}
        customize={{ ...props.customize, isEditing: true }}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Customize" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("says the cards are refreshing without moving the strip", () => {
    renderHero({
      customize: {
        label: "Customize",
        refreshingLabel: "Updating…",
        isEditing: false,
        isRefreshing: true,
        onClick: vi.fn(),
      },
    });

    expect(screen.getByRole("status").textContent).toBe("Updating…");
  });
});
