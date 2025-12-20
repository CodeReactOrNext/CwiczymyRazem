import "styles/globals.css";

import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { Inter, Teko } from "next/font/google";
import Head from "next/head";
import Script from "next/script";
import { appWithTranslation } from "next-i18next";
import NextTopLoader from "nextjs-toploader";
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

import useAuthSync from "hooks/useAuthSync";

const AuthSyncWrapper = ({ children }: { children: React.ReactNode }) => {
    useAuthSync();
    return <>{children}</>;
}

const MyApp = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        
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
          <Script id='microsoft-clarity-analytics'>
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "plp3vbsypt");
          `}
          </Script>{" "}
        <ThemeModeProvider>
          <AuthSyncWrapper>
             <main className={`${teko.variable} ${inter.variable} `}>
                <Toaster theme='dark' position='top-right' />
                <NextTopLoader color='#ff3e4b' />
                <div id='overlays'></div>
                <Component {...pageProps} />
             </main>
          </AuthSyncWrapper>
        </ThemeModeProvider>
      </Provider>
    </SessionProvider>
  );
}

export default appWithTranslation(MyApp);
