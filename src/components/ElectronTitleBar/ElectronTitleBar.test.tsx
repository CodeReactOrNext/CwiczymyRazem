import { act, cleanup, render, screen } from "@testing-library/react";
import type { ElectronWindowApi } from "types/electronWindow";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ElectronTitleBar } from "./ElectronTitleBar";

vi.mock("next/router", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

const buildApi = (overrides: Partial<ElectronWindowApi> = {}): ElectronWindowApi => ({
  isAvailable: true,
  platform: "win32",
  minimize: vi.fn(),
  toggleMaximize: vi.fn(),
  close: vi.fn(),
  isMaximized: vi.fn().mockResolvedValue(false),
  onMaximizedChange: vi.fn().mockReturnValue(() => {}),
  ...overrides,
});

describe("ElectronTitleBar", () => {
  afterEach(() => {
    cleanup();
    delete (window as { electronWindow?: ElectronWindowApi }).electronWindow;
  });

  it("renders nothing on the web build (no window.electronWindow)", () => {
    const { container } = render(<ElectronTitleBar />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nav + window controls once running in Electron", async () => {
    window.electronWindow = buildApi();
    render(<ElectronTitleBar />);

    expect(await screen.findByLabelText("Zamknij")).toBeTruthy();
    expect(screen.getByLabelText("Minimalizuj")).toBeTruthy();
    expect(screen.getByLabelText("Maksymalizuj")).toBeTruthy();
    expect(screen.getByLabelText("Wstecz")).toBeTruthy();
    expect(screen.getByLabelText("Dalej")).toBeTruthy();
    expect(screen.getByLabelText("Panel główny")).toBeTruthy();
  });

  it("renders nav but no window buttons on mac (native traffic lights instead)", async () => {
    window.electronWindow = buildApi({ platform: "darwin" });
    render(<ElectronTitleBar />);
    await act(async () => {});

    expect(screen.getByLabelText("Wstecz")).toBeTruthy();
    expect(screen.queryByLabelText("Zamknij")).toBeNull();
    expect(screen.queryByLabelText("Minimalizuj")).toBeNull();
  });
});
