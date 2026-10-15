// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DROPPABLE_GUITARS } from "../../data/guitarDefinitions";
import { CaseShop } from "./CaseShop";

afterEach(cleanup);

const Wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const renderShop = (overrides = {}) => {
  const props = {
    currentFame: 5000,
    onOpenCase: vi.fn(),
    onOpenPack: vi.fn(),
    isOpening: false,
    lastResult: null,
    ...overrides,
  };
  render(<CaseShop {...props} />, { wrapper: Wrapper });
  return props;
};

const card = (name: string) =>
  screen.getByRole("heading", { name }).closest("article") as HTMLElement;

describe("CaseShop", () => {
  it("leads with the featured hero and lists today's pool under it", () => {
    renderShop();

    expect(screen.getByRole("heading", { name: "Featured Case" })).toBeTruthy();
    expect(screen.getByText(/Refreshes in/)).toBeTruthy();
    expect(screen.getByText("Inside this drop")).toBeTruthy();
    expect(
      document.querySelector('img[src="/images/case-featured-hero.webp"]'),
    ).toBeTruthy();
  });

  it("shelves six cards: the ladder across the top, the side cases under it", () => {
    renderShop();

    const names = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    // A guitar and a pedal case share one card, so the shelf holds one card per
    // rung however many pools the rung draws from.
    expect(names).toEqual([
      "Standard Case",
      "Premium Guitar Case",
      "Elite Guitar Case",
      "Vault Guitar Case",
      "Supporter Case",
      "Parts Crate",
    ]);

    const art = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        "article img[alt$='Case'], article img[alt$='Crate']",
      ),
    ).map((img) => img.getAttribute("src"));
    expect(art).toEqual([
      "/images/case-guitar-standard.webp",
      "/images/case-guitar-premium.webp",
      "/images/case-guitar-elite.webp",
      "/images/case-guitar-vault.webp",
      "/images/case-supporter.webp",
      "/images/case-parts.webp",
    ]);
  });

  it("switches a rung between its guitar and pedal case on the same card", () => {
    renderShop();

    const elite = card("Elite Guitar Case");
    fireEvent.click(
      Array.from(elite.querySelectorAll("button")).find(
        (b) => b.textContent === "Pedal",
      )!,
    );

    expect(
      screen.getByRole("heading", { name: "Elite Effects Case" }),
    ).toBeTruthy();
    expect(
      document.querySelector('img[src="/images/case-effects-elite.webp"]'),
    ).toBeTruthy();
  });

  it("gives the vault art of its own, for guitars and for pedals", () => {
    renderShop();

    const vault = card("Vault Guitar Case");
    fireEvent.click(
      Array.from(vault.querySelectorAll("button")).find(
        (b) => b.textContent === "Pedal",
      )!,
    );

    expect(
      document.querySelector('img[src="/images/case-effects-vault.webp"]'),
    ).toBeTruthy();
    // And not a second Elite.
    expect(
      document.querySelector('img[src="/images/case-effects-elite.webp"]'),
    ).toBeNull();
  });

  it("opens the featured case with Fame and a shelf case with a free token", () => {
    const { onOpenCase } = renderShop({ freeTokens: 2 });

    fireEvent.click(
      screen.getByRole("button", { name: /Open case\s*·\s*260/ }),
    );
    expect(onOpenCase).toHaveBeenLastCalledWith("daily", undefined);

    const [firstFree] = screen.getAllByRole("button", { name: /Open free/ });
    fireEvent.click(firstFree);
    expect(onOpenCase).toHaveBeenLastCalledWith("daily", true);
  });

  it("keeps the free-case button off the vault, which no token can open", () => {
    renderShop({ freeTokens: 2 });

    const vault = card("Vault Guitar Case");
    expect(
      Array.from(vault.querySelectorAll("button")).some((b) =>
        /Open free/.test(b.textContent ?? ""),
      ),
    ).toBe(false);
    const elite = card("Elite Guitar Case");
    expect(
      Array.from(elite.querySelectorAll("button")).some((b) =>
        /Open free/.test(b.textContent ?? ""),
      ),
    ).toBe(true);
  });

  it("prices a pack at the single price times its size", () => {
    const { onOpenPack } = renderShop();

    const standard = card("Standard Case");
    fireEvent.click(
      Array.from(standard.querySelectorAll("button")).find((b) =>
        /×5/.test(b.textContent ?? ""),
      )!,
    );
    expect(onOpenPack).toHaveBeenLastCalledWith("standard", 5);
    expect(standard.textContent).toContain("900");
    expect(standard.textContent).toContain("1800");
  });

  it("opens the pack of the case the switch is on, not the one it started on", () => {
    const { onOpenPack } = renderShop();

    const elite = card("Elite Guitar Case");
    fireEvent.click(
      Array.from(elite.querySelectorAll("button")).find(
        (b) => b.textContent === "Pedal",
      )!,
    );
    const effects = card("Elite Effects Case");
    fireEvent.click(
      Array.from(effects.querySelectorAll("button")).find((b) =>
        /×10/.test(b.textContent ?? ""),
      )!,
    );
    expect(onOpenPack).toHaveBeenLastCalledWith("elite-effect", 10);
  });

  it("disables a pack the player cannot pay for in full", () => {
    renderShop({ currentFame: 1000 });

    const standard = card("Standard Case");
    const buttons = Array.from(standard.querySelectorAll("button"));
    const five = buttons.find((b) => /×5/.test(b.textContent ?? ""))!;
    const ten = buttons.find((b) => /×10/.test(b.textContent ?? ""))!;
    expect((five as HTMLButtonElement).disabled).toBe(false);
    expect((ten as HTMLButtonElement).disabled).toBe(true);
  });

  it("prints a case's pity counters, and says so when the next open is owed", () => {
    renderShop({
      casePity: { "elite-guitar": { sinceNew: 1, sinceTop: 3 } },
    });

    const elite = card("Elite Guitar Case");
    expect(elite.textContent).toContain("New model on your next open");
    expect(elite.textContent).toContain("Legendary or better in 5");
  });

  it("starts a fresh counter at the full distance", () => {
    renderShop();

    const vault = card("Vault Guitar Case");
    expect(vault.textContent).toContain("Mythic or better in 10");
    // The Vault has no new-model rule to count.
    expect(vault.textContent).not.toContain("New model");
  });

  it("hides the new-model counter once nothing new is within reach", () => {
    // Every guitar in the Dex: the Elite guitar case has nothing left to hand
    // over that is new, so a "new model in 5" line would be a promise it cannot
    // keep. Its Legendary counter is a different rule and stays.
    renderShop({ dexGuitarIds: DROPPABLE_GUITARS.map((g) => g.id) });

    const elite = card("Elite Guitar Case");
    expect(elite.textContent).not.toContain("New model");
    expect(elite.textContent).toContain("Legendary or better in 8");
    // Pedals are untouched, and so is the mixed Standard case that draws them.
    expect(card("Standard Case").textContent).toContain("New model in 4");
  });

  it("gives the Parts Crate no counter", () => {
    renderShop();

    const parts = card("Parts Crate");
    expect(parts.textContent).not.toContain("New model");
    expect(parts.textContent).not.toContain("or better in");
    expect(parts.textContent).toContain("80");
  });

  it("marks a case the player cannot afford", () => {
    renderShop({ currentFame: 200 });

    const elite = card("Elite Guitar Case");
    const openButton = Array.from(elite.querySelectorAll("button")).find((b) =>
      /Open case/.test(b.textContent ?? ""),
    ) as HTMLButtonElement;
    expect(openButton.disabled).toBe(true);
    expect(elite.textContent).toContain("500");
  });
});
