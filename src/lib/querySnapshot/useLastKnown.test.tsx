// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { isPersistedQueryKey } from "./querySnapshot";
import { LAST_KNOWN_KEY, useLastKnown } from "./useLastKnown";

const wrapperFor = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe("useLastKnown", () => {
  it("shows the saved value while the fresh one is still loading", () => {
    const client = new QueryClient();
    client.setQueryData([LAST_KNOWN_KEY, "duel-rating", "uid-1"], { rating: 1042 });

    const { result } = renderHook(
      () => useLastKnown<{ rating: number }>("duel-rating", "uid-1", undefined),
      { wrapper: wrapperFor(client) },
    );

    expect(result.current).toEqual({ rating: 1042 });
  });

  it("prefers the fresh value and saves it for the next visit", () => {
    const client = new QueryClient();
    client.setQueryData([LAST_KNOWN_KEY, "duel-rating", "uid-1"], { rating: 1042 });
    const fresh = { rating: 1060 };

    const { result } = renderHook(
      () => useLastKnown("duel-rating", "uid-1", fresh),
      { wrapper: wrapperFor(client) },
    );

    expect(result.current).toEqual({ rating: 1060 });
    expect(
      client.getQueryData([LAST_KNOWN_KEY, "duel-rating", "uid-1"]),
    ).toEqual({ rating: 1060 });
  });

  it("keeps one player's value away from another", () => {
    const client = new QueryClient();
    client.setQueryData([LAST_KNOWN_KEY, "duel-rating", "uid-1"], { rating: 1042 });

    const { result } = renderHook(
      () => useLastKnown<{ rating: number }>("duel-rating", "uid-2", undefined),
      { wrapper: wrapperFor(client) },
    );

    expect(result.current).toBeUndefined();
  });

  it("uses a key the boot snapshot persists", () => {
    expect(isPersistedQueryKey([LAST_KNOWN_KEY, "song-tier", "uid-1"])).toBe(true);
  });
});
