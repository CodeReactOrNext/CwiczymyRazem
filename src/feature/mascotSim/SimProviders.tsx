import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usersSlice from "feature/user/store/userSlice";
import { type DevSimData, setDevSim } from "lib/devSim";
import { type ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import type { userSliceInitialState } from "types/api.types";

export interface SimSetup {
  /** Who is "logged in" for the scene; none means signed out. */
  user?: Partial<userSliceInitialState>;
  /** React Query cache entries the scene reads, so nothing is fetched for them. */
  queries?: [readonly unknown[], unknown][];
  /** For the hooks that read Firestore directly (see lib/devSim). */
  dev?: DevSimData;
}

/**
 * Each scene gets its own store and query cache, built from its setup, so the
 * real components render as they would for that player — and the app's own
 * store (the signed-out visitor) is never touched. Remounted per scene.
 */
export const SimProviders = ({ setup, children }: { setup: SimSetup; children: ReactNode }) => {
  const [store] = useState(() =>
    configureStore({
      reducer: { user: usersSlice },
      preloadedState: { user: { ...usersSlice(undefined, { type: "@@sim/init" }), ...setup.user } },
    }),
  );
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        // Seeded data stays put; anything unseeded fails fast and quietly
        // (the simulator runs signed out, so Firestore refuses it).
        queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
        mutations: { retry: false },
      },
    });
    setup.queries?.forEach(([key, data]) => client.setQueryData(key, data));
    return client;
  });
  // Set before the first render of the scene, so the hooks' initial state sees it.
  useState(() => {
    setDevSim(setup.dev ?? null);
    return null;
  });
  useEffect(() => () => setDevSim(null), []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
};
