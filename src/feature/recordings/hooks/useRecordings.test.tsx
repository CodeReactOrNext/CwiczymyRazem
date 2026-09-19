// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { getRecordings } from "feature/recordings/services/getRecordings";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRecordings } from "./useRecordings";

vi.mock("feature/recordings/services/getRecordings", () => ({
  getRecordings: vi.fn(),
}));

const mockedGetRecordings = vi.mocked(getRecordings);

const recordingsOf = (songId?: string) =>
  ({
    recordings: [{ id: `rec-${songId}`, songId }],
    total: 1,
    lastDoc: null,
  }) as any;

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// The song detail view swaps the song under a mounted recordings section, so the
// hook has to follow the argument instead of the value it was first mounted with.
describe("useRecordings", () => {
  beforeEach(() => {
    mockedGetRecordings.mockReset();
    mockedGetRecordings.mockImplementation(async (_page, _perPage, _userId, songId) =>
      recordingsOf(songId),
    );
  });

  afterEach(cleanup);

  it("refetches with the new song when the filter argument changes", async () => {
    const { result, rerender } = renderHook(
      ({ songId }: { songId: string }) => useRecordings(undefined, songId),
      { wrapper, initialProps: { songId: "song-a" } },
    );

    await waitFor(() => expect(result.current.recordings).toHaveLength(1));
    expect(result.current.recordings[0].songId).toBe("song-a");

    rerender({ songId: "song-b" });

    await waitFor(() => expect(result.current.recordings[0].songId).toBe("song-b"));
    expect(mockedGetRecordings).toHaveBeenLastCalledWith(
      1,
      expect.any(Number),
      undefined,
      "song-b",
      undefined,
    );
  });

  it("goes back to page 1 when the filter argument changes", async () => {
    const { result, rerender } = renderHook(
      ({ songId }: { songId: string }) => useRecordings(undefined, songId),
      { wrapper, initialProps: { songId: "song-a" } },
    );

    await waitFor(() => expect(result.current.recordings).toHaveLength(1));

    result.current.setPage(2);
    await waitFor(() => expect(result.current.page).toBe(2));

    rerender({ songId: "song-b" });

    await waitFor(() => expect(result.current.page).toBe(1));
  });
});
