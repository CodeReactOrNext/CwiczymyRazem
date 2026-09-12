// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { resetAmpSimStoreForTests } from "feature/toneStudio/services/ampSimStore";
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

  it("carries the amp switch, outside the bar's drag region", async () => {
    window.electronWindow = buildApi();
    (window as unknown as { nativeAmp: unknown }).nativeAmp = {
      isAvailable: true,
      start: vi.fn(),
      stop: vi.fn(),
      setParams: vi.fn(),
      getStatus: vi.fn().mockResolvedValue({ isOpen: false, info: null }),
      onOverload: vi.fn().mockReturnValue(() => {}),
      onConnectionIssue: vi.fn().mockReturnValue(() => {}),
      onDevicesChanged: vi.fn().mockReturnValue(() => {}),
    };
    resetAmpSimStoreForTests();
    render(<ElectronTitleBar />);

    const amp = await screen.findByTitle("Amp simulator (ASIO, live)");
    // A draggable ancestor would swallow the click that opens the panel.
    expect(amp.closest(".\\[-webkit-app-region\\:no-drag\\]")).toBeTruthy();

    delete (window as { nativeAmp?: unknown }).nativeAmp;
  });

  it("leaves the amp switch out of the web build", () => {
    window.electronWindow = buildApi();
    resetAmpSimStoreForTests();
    render(<ElectronTitleBar />);
    expect(screen.queryByTitle("Amp simulator (ASIO, live)")).toBeNull();
  });

  it("carries the tuner next to the amp once native capture is available", async () => {
    window.electronWindow = buildApi();
    window.nativeAudio = {
      isAvailable: true,
      listDevices: vi.fn().mockResolvedValue({ api: "ASIO", devices: [] }),
      start: vi.fn(),
      stop: vi.fn().mockResolvedValue(true),
      getStatus: vi.fn().mockResolvedValue({ isOpen: false, info: null }),
      onFrame: vi.fn().mockReturnValue(() => {}),
      onConnectionIssue: vi.fn().mockReturnValue(() => {}),
      onDevicesChanged: vi.fn().mockReturnValue(() => {}),
    } as unknown as NonNullable<Window["nativeAudio"]>;
    render(<ElectronTitleBar />);

    const tuner = await screen.findByTitle("Tuner");
    expect(tuner.closest(".\\[-webkit-app-region\\:no-drag\\]")).toBeTruthy();

    delete window.nativeAudio;
  });

  it("leaves the tuner out without the native audio bridge", () => {
    window.electronWindow = buildApi();
    render(<ElectronTitleBar />);
    expect(screen.queryByTitle("Tuner")).toBeNull();
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
