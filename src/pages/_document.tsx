import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render(): React.JSX.Element {
    return (
      <Html lang='pl' className='dark'>
        <Head>
          <link
            rel='icon'
            type='image/svg+xml'
            href='/images/logolight.svg'
          />
          <link
            rel='apple-touch-icon'
            sizes='180x180'
            href='favicon/apple-touch-icon.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='favicon/favicon-32x32.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='16x16'
            href='favicon/favicon-16x16.png'
          />
          <link rel='manifest' href='/site.webmanifest' />
          <meta name="application-name" content="Riff Quest" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Riff Quest" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-TileColor" content="#0a0a0a" />
          <meta name="msapplication-tap-highlight" content="no" />
          <meta name="theme-color" content="#0a0a0a" />
          <meta name="authoriflow-verification" content="authoriflow-site-verification=vzoxwsa3l2pcr7fm5ycwo" />
          <link rel='mask-icon' href='/images/logolight.svg' color='#06b6d4' />
        </Head>
        <body>
          <Main />
          <div id="overlays" />
          <NextScript />
        </body>

      </Html>
    );
  }
}

export default MyDocument;
