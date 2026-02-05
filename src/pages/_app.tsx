import "styles/globals.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "assets/components/ui/tooltip";
import ErrorBoundary from "components/ErrorBoundary/ErrorBoundary";
import { Inter, Teko } from "next/font/google";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import NextTopLoader from "nextjs-toploader";
import { useState } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "store/store";
import ThemeModeProvider from "wrappers/ThemeModeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const teko = Teko({
  subsets: ["latin"],
  variable: "--font-teko",
  display: "swap",
});

import { ResponsiveInitializer } from "components/ResponsiveInitializer/ResponsiveInitializer";
import Analytics from "components/Analytics/Analytics";
import useAuthSync from "hooks/useAuthSync";
import type { AppPropsWithLayout } from "types/page";

const AuthSyncWrapper = ({ children }: { children: React.ReactNode }) => {
    useAuthSync();

    if (typeof window !== "undefined" && !(window as any)._fetchAuthPatched) {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          return await originalFetch(...args);
        } catch (error) {
          const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
          if (url.includes('/api/auth/session')) {
             if (!url.includes('callbackUrl')) {
                 import("next-auth/react").then(({ signOut }) => {
                     signOut({ redirect: true, callbackUrl: "/" });
                 });
             }
          }
          throw error;
        }
      };
      (window as any)._fetchAuthPatched = true;
    }

    return <>{children}</>;
}


const MyApp = ({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
        
        <Head>
          <meta name='viewport' content='initial-scale=1.0, width=device-width' />
          <meta
            name='google-signin-client_id'
            content={process.env.NEXT_PUBLIC_GOOGLE_QAUTH}
          />
          <title>Riff Quest</title>
          <meta
            name='description'
            content='Practice, track progress, compete! Guitar in hand! 🎸'
          />
          <meta name='keywords' content='practice, guitar' />
        </Head>
        <ErrorBoundary>
          <ThemeModeProvider>
            <AuthSyncWrapper>
               <Analytics />
               <ResponsiveInitializer />
               <TooltipProvider>
                  <main className={`${teko.variable} ${inter.variable} min-h-[100dvh] bg-zinc-950 text-foreground`}>
                     <Toaster theme='dark' position='top-right' />
                     <NextTopLoader color='#06b6d4' />
                     <div id='overlays'></div>
                     {getLayout(<Component {...pageProps} />)}
                  </main>
               </TooltipProvider>
            </AuthSyncWrapper>
            <ReactQueryDevtools initialIsOpen={false} />
          </ThemeModeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
      </Provider>
    </SessionProvider>
  );
}

export default MyApp;
