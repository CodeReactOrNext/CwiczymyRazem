import Head from "next/head";
import { Provider } from "react-redux";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { appWithTranslation } from "next-i18next";

import { store } from "store/store";

import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import BetaInfo from "components/BetaInfo";
import ThemeModeProvider from "Hoc/ThemeModeProvider";

function MyApp({ Component, pageProps }: AppProps) {
  // const layoutTheme = useAppSelector(selectLayoutMode);
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
        <Component {...pageProps} />
        <ToastContainer toastClassName={"toastify-custom"} />
        <BetaInfo />
      </ThemeModeProvider>
    </Provider>
  );
}

export default appWithTranslation(MyApp);
