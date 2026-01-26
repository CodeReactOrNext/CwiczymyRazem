import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render(): React.JSX.Element {
    return (
      <Html lang='en' className='dark'>
        <Head>
          {/* Google Fonts - Inter for professional typography */}
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link
            rel='preconnect'
            href='https://fonts.gstatic.com'
            crossOrigin='anonymous'
          />
          <link
            href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
            rel='stylesheet'
          />
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

          <link rel='mask-icon' href='/images/logolight.svg' color='#06b6d4' />
          <script
            id="microsoft-clarity-analytics"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "plp3vbsypt");
              `,
            }}
          />
        </Head>
        <body data-clarity-unmask="true">
          <Main />
          <div id="overlays" />
          <NextScript />
        </body>

      </Html>
    );
  }
}

export default MyDocument;
