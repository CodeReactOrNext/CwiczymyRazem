// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FinishSessionDialog } from "./FinishSessionDialog";

afterEach(cleanup);

describe("FinishSessionDialog", () => {
  it("spells out the trade before an early finish: time kept, nothing scored", () => {
    render(
      <FinishSessionDialog open mode='early' onOpenChange={vi.fn()} onConfirm={vi.fn()} />,
    );

    expect(screen.getByText("End early?")).toBeDefined();
    expect(screen.getByText("Your practice time is saved")).toBeDefined();
    expect(screen.getByText("Nothing from this run is scored")).toBeDefined();
  });

  it("drops the forfeit copy when the session met its bar", () => {
    render(
      <FinishSessionDialog open mode='plan' onOpenChange={vi.fn()} onConfirm={vi.fn()} />,
    );

    expect(screen.getByText("Finish the plan early?")).toBeDefined();
    expect(screen.queryByText("Nothing from this run is scored")).toBeNull();
  });

  it("confirms the early finish once the player accepts it", () => {
    const onConfirm = vi.fn();
    render(
      <FinishSessionDialog open mode='early' onOpenChange={vi.fn()} onConfirm={onConfirm} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /end early & save time/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("blocks the confirm until something is worth logging, and says why", () => {
    const onConfirm = vi.fn();
    render(
      <FinishSessionDialog open mode='early' disabled onOpenChange={vi.fn()} onConfirm={onConfirm} />,
    );

    const confirm = screen.getByRole("button", { name: /end early & save time/i }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(
      screen.getByText("Practice for at least 20 seconds before the session can be saved."),
    ).toBeDefined();

    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
