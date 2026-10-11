// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { TraderPartOffer } from "feature/arsenal/types/trader.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PartOfferRow } from "./PartOfferRow";

const screws: TraderPartOffer = {
  id: "100-0",
  kind: "part",
  partId: "screws",
  tier: "Standard",
  stock: 40,
  unitPrice: 2,
  basePrice: 2,
  discountPct: 0,
};

const renderCard = (onBuy = vi.fn(), currentFame = 1000) => {
  render(
    <PartOfferRow
      offer={screws}
      remaining={40}
      owned={12}
      currentFame={currentFame}
      onBuy={onBuy}
      isBuying={false}
    />,
  );
  return {
    field: screen.getByLabelText("Quantity") as HTMLInputElement,
    buy: screen.getByRole("button", { name: /^buy/i }),
    onBuy,
  };
};

describe("PartOfferRow quantity", () => {
  afterEach(cleanup);

  it("buys the number typed into the field", () => {
    const { field, buy, onBuy } = renderCard();

    fireEvent.change(field, { target: { value: "25" } });
    expect(buy.textContent).toContain("50");

    fireEvent.click(buy);
    expect(onBuy).toHaveBeenCalledWith(25);
  });

  it("lands a number over the stock on the stock", () => {
    const { field } = renderCard();

    fireEvent.change(field, { target: { value: "99" } });

    expect(field.value).toBe("40");
  });

  it("ignores anything that is not a digit", () => {
    const { field } = renderCard();

    fireEvent.change(field, { target: { value: "1a2" } });

    expect(field.value).toBe("12");
  });

  it("lets the field be cleared while typing, then falls back on blur", () => {
    const { field } = renderCard();
    fireEvent.change(field, { target: { value: "7" } });

    fireEvent.change(field, { target: { value: "" } });
    expect(field.value).toBe("");

    fireEvent.blur(field);
    expect(field.value).toBe("7");
  });

  it("never goes below one", () => {
    const { field } = renderCard();

    fireEvent.change(field, { target: { value: "0" } });

    expect(field.value).toBe("1");
  });

  it("steps with the arrow keys", () => {
    const { field } = renderCard();

    fireEvent.keyDown(field, { key: "ArrowUp" });
    fireEvent.keyDown(field, { key: "ArrowUp" });
    fireEvent.keyDown(field, { key: "ArrowDown" });

    expect(field.value).toBe("2");
  });
});

describe("PartOfferRow owned and all", () => {
  afterEach(cleanup);

  it("shows how many of the part the player already owns", () => {
    renderCard();

    expect(screen.getByText("in stash").parentElement?.textContent).toBe(
      "12 in stash",
    );
  });

  it("fills the picker with the whole slot, priced on the buy button", () => {
    const { field, buy, onBuy } = renderCard();

    fireEvent.click(screen.getByRole("button", { name: "All 40" }));
    expect(field.value).toBe("40");
    expect(buy.textContent).toContain("80");

    fireEvent.click(buy);
    expect(onBuy).toHaveBeenCalledWith(40);
  });

  it("caps at what the player can afford when Fame runs out first", () => {
    const { field } = renderCard(vi.fn(), 50);

    fireEvent.click(screen.getByRole("button", { name: "Max 25" }));

    expect(field.value).toBe("25");
  });

  it("brings an unaffordable pick back down to the max", () => {
    const { field } = renderCard(vi.fn(), 50);
    fireEvent.change(field, { target: { value: "30" } });

    fireEvent.click(screen.getByRole("button", { name: "Max 25" }));

    expect(field.value).toBe("25");
  });
});
