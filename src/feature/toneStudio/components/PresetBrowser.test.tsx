// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BUILT_IN_PRESETS } from "feature/toneStudio/data/builtInPresets";
import type { TonePreset } from "types/toneStudio";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PresetBrowser } from "./PresetBrowser";

afterEach(cleanup);

const base = BUILT_IN_PRESETS[0].params;

const preset = (id: string): TonePreset => ({
  id,
  name: `Preset ${id}`,
  params: { ...base },
  builtIn: false,
  createdAt: 0,
});

const presets = [preset("a"), preset("b"), preset("c")];

const renderBrowser = (overrides = {}) => {
  const props = {
    presets,
    activePresetId: "b" as string | null,
    params: { ...base },
    onLoad: vi.fn(),
    onSaveNew: vi.fn(),
    onOverwrite: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<PresetBrowser {...props} />);
  return props;
};

describe("PresetBrowser", () => {
  it("steps to the next preset in the library", () => {
    const { onLoad } = renderBrowser();
    fireEvent.click(screen.getByTitle("Next preset"));
    expect(onLoad).toHaveBeenCalledWith("c", presets[2].params);
  });

  it("wraps around the end of the library", () => {
    const { onLoad } = renderBrowser({ activePresetId: "c" });
    fireEvent.click(screen.getByTitle("Next preset"));
    expect(onLoad).toHaveBeenCalledWith("a", presets[0].params);
  });

  it("wraps backwards off the start of the library", () => {
    const { onLoad } = renderBrowser({ activePresetId: "a" });
    fireEvent.click(screen.getByTitle("Previous preset"));
    expect(onLoad).toHaveBeenCalledWith("c", presets[2].params);
  });

  it("starts at the top of the library when nothing is loaded", () => {
    const { onLoad } = renderBrowser({ activePresetId: null });
    fireEvent.click(screen.getByTitle("Next preset"));
    expect(onLoad).toHaveBeenCalledWith("a", presets[0].params);
  });

  it("offers Update only once the live knobs have drifted from the preset", () => {
    renderBrowser();
    expect(screen.queryByText("Update")).toBeNull();

    cleanup();
    renderBrowser({ params: { ...base, drive: base.drive + 0.2 } });
    expect(screen.getByText("Update")).toBeTruthy();
  });

  it("never offers to overwrite a built-in preset", () => {
    renderBrowser({
      presets: [{ ...preset("a"), builtIn: true }],
      activePresetId: "a",
      params: { ...base, drive: base.drive + 0.2 },
    });
    expect(screen.queryByText("Update")).toBeNull();
  });

  it("saves a named preset from the rail", () => {
    const { onSaveNew } = renderBrowser();
    fireEvent.click(
      screen.getByTitle("Save the current settings as a new preset"),
    );
    fireEvent.change(screen.getByPlaceholderText("Name this tone"), {
      target: { value: "  Bedroom crunch  " },
    });
    fireEvent.click(screen.getByText("Save"));
    expect(onSaveNew).toHaveBeenCalledWith("Bedroom crunch");
  });
});
