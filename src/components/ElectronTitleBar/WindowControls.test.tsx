import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WindowControls } from "./WindowControls";

describe("WindowControls", () => {
  afterEach(() => {
    cleanup();
  });

  it("fires the minimize/maximize/close callbacks", () => {
    const onMinimize = vi.fn();
    const onToggleMaximize = vi.fn();
    const onClose = vi.fn();

    render(
      <WindowControls
        isMaximized={false}
        onMinimize={onMinimize}
        onToggleMaximize={onToggleMaximize}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText("Minimalizuj"));
    fireEvent.click(screen.getByLabelText("Maksymalizuj"));
    fireEvent.click(screen.getByLabelText("Zamknij"));

    expect(onMinimize).toHaveBeenCalledTimes(1);
    expect(onToggleMaximize).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("swaps the maximize label/glyph for restore once maximized", () => {
    const { rerender } = render(
      <WindowControls
        isMaximized={false}
        onMinimize={vi.fn()}
        onToggleMaximize={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Maksymalizuj")).toBeTruthy();
    expect(screen.queryByLabelText("Przywróć")).toBeNull();

    rerender(
      <WindowControls
        isMaximized={true}
        onMinimize={vi.fn()}
        onToggleMaximize={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Przywróć")).toBeTruthy();
    expect(screen.queryByLabelText("Maksymalizuj")).toBeNull();
  });
});
