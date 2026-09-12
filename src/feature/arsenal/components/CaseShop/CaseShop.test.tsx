// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CaseShop } from "./CaseShop";

afterEach(cleanup);

const renderShop = (overrides = {}) => {
  const props = {
    currentFame: 1000,
    onOpenCase: vi.fn(),
    isOpening: false,
    lastResult: null,
    ...overrides,
  };
  render(<CaseShop {...props} />);
  return props;
};

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

  it("shelves the six cases as a tier ladder with their own renders", () => {
    renderShop();

    const names = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(names).toEqual([
      "Standard Case",
      "Premium Guitar Case",
      "Elite Guitar Case",
      "Supporter Case",
      "Premium Effects Case",
      "Elite Effects Case",
    ]);

    const art = Array.from(
      document.querySelectorAll<HTMLImageElement>("article img[alt$='Case']"),
    ).map((img) => img.getAttribute("src"));
    expect(art).toEqual([
      "/images/case-guitar-standard.webp",
      "/images/case-guitar-premium.webp",
      "/images/case-guitar-elite.webp",
      "/images/case-supporter.webp",
      "/images/case-effects-premium.webp",
      "/images/case-effects-elite.webp",
    ]);
  });

  it("opens the featured case with Fame and a shelf case with a free token", () => {
    const { onOpenCase } = renderShop({ freeTokens: 2 });

    fireEvent.click(
      screen.getByRole("button", { name: /Open case\s*·\s*160/ }),
    );
    expect(onOpenCase).toHaveBeenLastCalledWith("daily", undefined);

    const [firstFree] = screen.getAllByRole("button", { name: /Open free/ });
    fireEvent.click(firstFree);
    expect(onOpenCase).toHaveBeenLastCalledWith("daily", true);
  });

  it("marks a case the player cannot afford", () => {
    renderShop({ currentFame: 200 });

    const elite = screen
      .getByRole("heading", { name: "Elite Guitar Case" })
      .closest("article") as HTMLElement;
    const openButton = Array.from(elite.querySelectorAll("button")).find((b) =>
      /Open case/.test(b.textContent ?? ""),
    ) as HTMLButtonElement;
    expect(openButton.disabled).toBe(true);
    expect(elite.textContent).toContain("350");
  });
});
