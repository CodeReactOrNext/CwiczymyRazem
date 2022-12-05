import Head from "next/head";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { appWithTranslation } from "next-i18next";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  
  return (

    <Provider store={store}>
      <Head>
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
        <title>Ćwiczymy Razem</title>
        <meta
          name='description'
          content='Ćwicz, zapisuj postęp, rywalizuj! Gitary w dłoń! 🎸'
        />
        <meta name='keywords' content='ćwiczenie, gitara' />
      </Head>
      <Component {...pageProps} />
    </Provider>
  );
}

export default appWithTranslation(MyApp);
