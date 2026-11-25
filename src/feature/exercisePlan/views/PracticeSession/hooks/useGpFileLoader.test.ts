// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGpFileLoader } from "./useGpFileLoader";

const downloads = new Map<string, (file: File) => void>();

vi.mock("feature/songs/services/userGpFiles.service", () => ({
  fetchGpFileAsFile: (url: string) => new Promise<File>((resolve) => { downloads.set(url, resolve); }),
}));
vi.mock("feature/songs/services/gp5Parser.service", () => ({
  parseGpFile: async (file: File) => ({
    tempo: 120,
    tracks: [{ name: file.name, measures: [], trackType: "guitar", stringCount: 6, openStringMidi: [], pan: 0 }],
  }),
}));

beforeEach(() => downloads.clear());
afterEach(cleanup);

const finish = (url: string) => act(async () => { downloads.get(url)?.(new File([], url)); });

const render = () =>
  renderHook((props: { gpFileUrl?: string }) => useGpFileLoader({ ...props, exerciseTitle: "song" }), {
    initialProps: { gpFileUrl: "a" } as { gpFileUrl?: string },
  });

describe("useGpFileLoader", () => {
  it("loads and parses the exercise's file", async () => {
    const { result } = render();
    expect(result.current.isFetchingGpFile).toBe(true);
    await finish("a");
    expect(result.current.isFetchingGpFile).toBe(false);
    expect(result.current.isParsingGpFile).toBe(false);
    expect(result.current.parsedGpTracks?.[0].name).toBe("a");
    expect(result.current.gpTempo).toBe(120);
  });

  it("shows no tab of the last exercise while the next one loads", async () => {
    const { result, rerender } = render();
    await finish("a");
    rerender({ gpFileUrl: "b" });
    expect(result.current.effectiveRawGpFile).toBeUndefined();
    expect(result.current.parsedGpTracks).toBeNull();
    expect(result.current.isFetchingGpFile).toBe(true);
  });

  it("ignores a download that comes in after the plan moved on", async () => {
    const { result, rerender } = render();
    rerender({ gpFileUrl: "b" });
    await finish("b");
    await finish("a");
    expect(result.current.parsedGpTracks?.[0].name).toBe("b");

    rerender({ gpFileUrl: undefined });
    expect(result.current.effectiveRawGpFile).toBeUndefined();
    expect(result.current.parsedGpTracks).toBeNull();
    expect(result.current.isFetchingGpFile).toBe(false);
  });
});
