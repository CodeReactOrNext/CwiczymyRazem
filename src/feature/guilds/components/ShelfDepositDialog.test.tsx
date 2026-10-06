// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShelfDepositDialog } from "./ShelfDepositDialog";

const target = {
  kind: "guitar" as const,
  name: "Izanor RX-200",
  rarity: "Common",
  honor: 20,
};

describe("ShelfDepositDialog", () => {
  afterEach(cleanup);

  it("says what leaving the piece earns before anything moves", () => {
    const onConfirm = vi.fn();
    render(
      <ShelfDepositDialog
        target={target}
        busy={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Izanor RX-200")).toBeTruthy();
    expect(screen.getByText("+20")).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /leave it/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("holds the button while the deposit is on its way", () => {
    render(
      <ShelfDepositDialog
        target={target}
        busy
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      (screen.getByRole("button", { name: /leaving it/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("renders nothing while no piece is on its way", () => {
    render(
      <ShelfDepositDialog
        target={null}
        busy={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText(/into the guild stash/i)).toBeNull();
  });
});
