// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./ConfirmDialog";

const renderDialog = (props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) => {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title='Delete plan?'
      description='This cannot be undone.'
      confirmLabel='Delete'
      cancelLabel='Keep it'
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onConfirm, onOpenChange };
};

describe("ConfirmDialog", () => {
  afterEach(cleanup);

  it("renders the title, description and both labels", () => {
    renderDialog();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("Delete plan?")).toBeTruthy();
    expect(screen.getByText("This cannot be undone.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Keep it" })).toBeTruthy();
  });

  it("calls onConfirm without closing the dialog itself", () => {
    const { onConfirm, onOpenChange } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes through onOpenChange on cancel", () => {
    const { onConfirm, onOpenChange } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("paints the confirm key red when destructive", () => {
    renderDialog({ destructive: true });
    expect(screen.getByRole("button", { name: "Delete" }).className).toContain(
      "bg-destructive",
    );
  });

  it("uses the default key when not destructive", () => {
    renderDialog();
    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm.className).toContain("bg-primary");
    expect(confirm.className).not.toContain("bg-destructive");
  });

  it("locks only the confirm key when confirmDisabled", () => {
    const { onConfirm } = renderDialog({ confirmDisabled: true });
    const confirm = screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Keep it" }) as HTMLButtonElement).disabled,
    ).toBe(false);
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("locks both keys while loading", () => {
    renderDialog({ loading: true });
    expect(
      (screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Keep it" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
