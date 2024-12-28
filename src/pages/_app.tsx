import Head from "next/head";
import { Provider } from "react-redux";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import { store } from "store/store";
import ThemeModeProvider from "wrappers/ThemeModeProvider";

import "styles/globals.css";
import { Toaster } from "sonner";
import { Inter, Teko } from "next/font/google";

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

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Head>
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
        <meta
          name='google-signin-client_id'
          content={process.env.NEXT_PUBLIC_GOOGLE_QAUTH}
        />
        <title>Ćwiczymy Razem</title>
        <meta
          name='description'
          content='Ćwicz, zapisuj postęp, rywalizuj! Gitary w dłoń! 🎸'
        />
        <meta name='keywords' content='ćwiczenie, gitara' />
      </Head>
      <ThemeModeProvider>
        <Toaster theme='dark' position='top-right' />

        <div id='overlays'></div>
        <main className={`  ${teko.variable} ${inter.variable} `}>
          <Component {...pageProps} />
        </main>
      </ThemeModeProvider>
    </Provider>
  );
}

export default appWithTranslation(MyApp);
