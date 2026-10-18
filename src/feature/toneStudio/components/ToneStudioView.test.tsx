// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { resetAmpSimStoreForTests } from "feature/toneStudio/services/ampSimStore";
import { resetVstHostStoreForTests } from "feature/toneStudio/services/vstHostStore";
import {
  AMP_HEAD_SRC,
  OVERDRIVE_PEDAL_SRC,
} from "feature/toneStudio/utils/gearArt";
import type { VstLibrary, VstRackStatus } from "types/vstHost";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToneStudioView } from "./ToneStudioView";

afterEach(cleanup);

// The amp store is a module singleton now — knob changes in one test would
// otherwise carry into the next.
beforeEach(() => {
  resetAmpSimStoreForTests();
  localStorage.clear();
});

/**
 * The window renders with no Electron bridge at all (window.nativeAmp and
 * window.toneStudio both undefined) — same conditions as the dev preview page,
 * and the reason the view never gates on amp.available itself.
 */
describe("ToneStudioView", () => {
  it("renders the plugin window without the desktop bridge", () => {
    render(<ToneStudioView />);
    expect(screen.getByText(/No connection to the desktop app/)).toBeTruthy();
    expect(screen.getByTitle("Needs the desktop app")).toBeTruthy();
  });

  it("opens on the amp and swaps the faceplate when another unit is picked", () => {
    render(<ToneStudioView />);
    expect(screen.getByRole("slider", { name: "Preamp" })).toBeTruthy();

    fireEvent.click(screen.getByText("Delay"));
    expect(screen.getByRole("slider", { name: "Feedback" })).toBeTruthy();
    expect(screen.queryByRole("slider", { name: "Preamp" })).toBeNull();
  });

  it("stands the knobs on the amp head's own blank panel", () => {
    const { container } = render(<ToneStudioView />);
    // The head is drawn twice — once as the rack's slot thumbnail, once as the
    // stage — so the claim is that *one* of them is the knobs' own container,
    // not merely that a head exists somewhere.
    const heads = container.querySelectorAll(`img[src="${AMP_HEAD_SRC}"]`);
    expect(heads.length).toBeGreaterThan(0);
    const preamp = screen.getByRole("slider", { name: "Preamp" });
    const carriesKnobs = Array.from(heads).some((head) =>
      head.parentElement?.contains(preamp),
    );
    expect(carriesKnobs).toBe(true);
  });

  it("opens the I/O sheet from the interface named in the status strip", () => {
    render(<ToneStudioView />);
    expect(screen.queryByText("Audio interface")).toBeNull();

    // The strip is the only place the interface is named, so it is the place
    // people go looking when they want to change it.
    fireEvent.click(
      screen.getByTitle("Choose the audio interface, channels and buffer size"),
    );
    expect(screen.getByText("Audio interface")).toBeTruthy();
  });

  it("asks for an interface instead of reporting one when none is picked", () => {
    render(<ToneStudioView />);
    expect(screen.getByText("Choose an audio interface")).toBeTruthy();
  });

  it("labels the mains switch with the action, not the state", () => {
    render(<ToneStudioView />);
    // "Running" told you what was happening; a switch has to say what throwing
    // it will do. State lives on the second line instead.
    expect(screen.getByText("Turn on")).toBeTruthy();
    expect(screen.getByText("silent")).toBeTruthy();
    expect(screen.queryByText("Running")).toBeNull();
  });

  it("will not throw the mains switch with no desktop app behind it", () => {
    render(<ToneStudioView />);
    const rocker = screen.getByTitle("Needs the desktop app");
    expect(rocker.hasAttribute("disabled")).toBe(true);
  });

  it("stands the pedal's knobs on the pedal", () => {
    const { container } = render(<ToneStudioView />);
    fireEvent.click(screen.getByText("Overdrive"));

    const pedals = container.querySelectorAll(
      `img[src="${OVERDRIVE_PEDAL_SRC}"]`,
    );
    const drive = screen.getByRole("slider", { name: "Drive" });
    const carriesKnobs = Array.from(pedals).some((pedal) =>
      pedal.parentElement?.contains(drive),
    );
    expect(carriesKnobs).toBe(true);
  });

  it("switches the pedal from its footswitch and nowhere else", () => {
    const { container } = render(<ToneStudioView />);
    fireEvent.click(screen.getByText("Overdrive"));

    // Overdrive ships bypassed. The footswitch engages it…
    fireEvent.click(screen.getByTitle("Engage this pedal"));
    expect(screen.getByTitle("Bypass this pedal")).toBeTruthy();

    // …and nothing else on the pedal may undo that. Not a knob,
    fireEvent.click(screen.getByRole("slider", { name: "Drive" }));
    expect(screen.getByTitle("Bypass this pedal")).toBeTruthy();

    // nor the enclosure itself, which is a picture of a box with a switch on
    // it rather than one big switch.
    const enclosure = container.querySelector(
      `img[src="${OVERDRIVE_PEDAL_SRC}"]`,
    );
    expect(enclosure).toBeTruthy();
    fireEvent.click(enclosure as Element);
    expect(screen.getByTitle("Bypass this pedal")).toBeTruthy();
  });

  it("swaps the amp's knobs for the capture name on the Neural channel", () => {
    render(<ToneStudioView />);
    fireEvent.click(screen.getByText("Neural capture"));
    expect(screen.queryByRole("slider", { name: "Preamp" })).toBeNull();
    expect(screen.getByText("No capture loaded")).toBeTruthy();
  });

  it("keeps the rack's bypass lamp separate from picking a unit", () => {
    render(<ToneStudioView />);
    const lamp = screen.getByRole("switch", { name: /Bypass Overdrive/ });

    fireEvent.click(lamp);
    // Toggling a lamp must not drag the stage over to that unit.
    expect(screen.getByRole("slider", { name: "Preamp" })).toBeTruthy();
  });
});

describe("ToneStudioView with VST hosting", () => {
  beforeEach(() => {
    resetVstHostStoreForTests();
    const rack: VstRackStatus = {
      supported: true,
      error: null,
      toneMode: "builtin",
      slots: [],
      latencyMs: 0,
    };
    const library: VstLibrary = {
      scannedAt: null,
      plugins: [],
      failed: [],
      sources: { folders: [], files: [] },
    };
    window.vstHost = {
      isAvailable: true,
      listPlugins: vi.fn().mockResolvedValue(library),
      scan: vi.fn().mockResolvedValue(library),
      addFile: vi.fn().mockResolvedValue(null),
      addFolder: vi.fn().mockResolvedValue(null),
      removeSource: vi.fn().mockResolvedValue(library),
      getRack: vi.fn().mockResolvedValue(rack),
      addToRack: vi.fn().mockResolvedValue(rack),
      removeFromRack: vi.fn().mockResolvedValue(rack),
      moveInRack: vi.fn().mockResolvedValue(rack),
      setBypass: vi.fn().mockResolvedValue(rack),
      openEditor: vi.fn().mockResolvedValue(rack),
      closeEditor: vi.fn().mockResolvedValue(rack),
      onEvent: vi.fn(() => () => {}),
      onScanProgress: vi.fn(() => () => {}),
    };
  });

  afterEach(() => {
    delete window.vstHost;
  });

  it("asks built-in vs VST first, then opens the chosen world", async () => {
    render(<ToneStudioView />);
    expect(
      await screen.findByText("How do you want to shape your sound?"),
    ).toBeTruthy();
    expect(screen.queryByRole("slider", { name: "Preamp" })).toBeNull();

    fireEvent.click(screen.getByText("Your VST plugins"));
    expect(screen.getByText("Your rack is empty")).toBeTruthy();
    // Never scanned: the library offers the scan instead of running it.
    expect(
      await screen.findByText("Find the plugins on this computer"),
    ).toBeTruthy();
    expect(window.vstHost?.scan).not.toHaveBeenCalled();
  });

  it("switches between the two worlds from the rail once chosen", async () => {
    localStorage.setItem("tone_studio_mode_chosen", "1");
    render(<ToneStudioView />);
    expect(await screen.findByRole("slider", { name: "Preamp" })).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "VST rack" }));
    expect(screen.getByText("Your rack is empty")).toBeTruthy();
    expect(screen.queryByRole("slider", { name: "Preamp" })).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "Built-in" }));
    expect(screen.getByRole("slider", { name: "Preamp" })).toBeTruthy();
  });
});
