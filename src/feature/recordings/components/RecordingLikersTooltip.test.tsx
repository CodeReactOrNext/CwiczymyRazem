// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { getRecordingLikers } from "feature/recordings/services/getRecordingLikers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RecordingLikersTooltip } from "./RecordingLikersTooltip";

vi.mock("feature/recordings/services/getRecordingLikers", () => ({
  getRecordingLikers: vi.fn(),
}));

// jsdom ships no ResizeObserver, which Radix's popper measures the content with.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const NAMES: Record<string, string> = { a: "Apoth", b: "Cookie", c: "Riffmaster" };

const renderTooltip = (likes: string[], userId: string | null = null) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <RecordingLikersTooltip likes={likes} userId={userId}>
        <button type='button'>{likes.length}</button>
      </RecordingLikersTooltip>
    </QueryClientProvider>,
  );

  return screen.getByRole("button");
};

/** Keyboard focus opens a Radix tooltip the same way hover does. */
const open = (trigger: HTMLElement) => act(() => trigger.focus());

describe("RecordingLikersTooltip", () => {
  beforeEach(() => {
    vi.mocked(getRecordingLikers).mockReset();
    vi.mocked(getRecordingLikers).mockImplementation(async (ids) =>
      ids.map((id) => ({ id, displayName: NAMES[id] ?? `user ${id}` })),
    );
  });

  afterEach(cleanup);

  it("reads no names until the tooltip is opened", () => {
    renderTooltip(["a", "b"]);

    expect(getRecordingLikers).not.toHaveBeenCalled();
  });

  it("lists who liked it, newest like first", async () => {
    const trigger = renderTooltip(["a", "b", "c"]);

    open(trigger);

    await waitFor(() => expect(screen.getAllByText("Riffmaster").length).toBeGreaterThan(0));
    expect(getRecordingLikers).toHaveBeenCalledWith(["c", "b", "a"]);
    expect(screen.getAllByText("Liked by").length).toBeGreaterThan(0);
  });

  it("shows the viewer as \"You\" without looking them up", async () => {
    const trigger = renderTooltip(["a", "me"], "me");

    open(trigger);

    await waitFor(() => expect(screen.getAllByText("You").length).toBeGreaterThan(0));
    expect(getRecordingLikers).toHaveBeenCalledWith(["a"]);
  });

  it("reads nothing at all when the viewer is the only one who liked it", async () => {
    const trigger = renderTooltip(["me"], "me");

    open(trigger);

    await waitFor(() => expect(screen.getAllByText("You").length).toBeGreaterThan(0));
    expect(getRecordingLikers).not.toHaveBeenCalled();
  });

  it("caps the list at ten and counts the rest", async () => {
    const likes = Array.from({ length: 14 }, (_, i) => `u${i}`);
    const trigger = renderTooltip(likes);

    open(trigger);

    await waitFor(() => expect(screen.getAllByText("+4 more").length).toBeGreaterThan(0));
    // The ten newest likes, not the ten oldest.
    expect(getRecordingLikers).toHaveBeenCalledWith(likes.slice(-10).reverse());
  });

  it("keeps likes from deleted accounts in the remainder, so the list adds up", async () => {
    vi.mocked(getRecordingLikers).mockResolvedValue([{ id: "a", displayName: "Apoth" }]);
    const trigger = renderTooltip(["gone", "a"]);

    open(trigger);

    await waitFor(() => expect(screen.getAllByText("+1 more").length).toBeGreaterThan(0));
  });

  it("does not open for a recording nobody has liked", () => {
    const trigger = renderTooltip([]);

    open(trigger);

    expect(screen.queryByText("Liked by")).toBeNull();
    expect(getRecordingLikers).not.toHaveBeenCalled();
  });

  it("stays closed when the names cannot be read", async () => {
    vi.mocked(getRecordingLikers).mockRejectedValue(new Error("permission-denied"));
    const trigger = renderTooltip(["a"]);

    open(trigger);

    await waitFor(() => expect(getRecordingLikers).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Liked by")).toBeNull());
  });
});
