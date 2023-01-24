import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang='pl'>
        <Head></Head>
        <body className='dark-theme'>
          <Main />
          <div id='overlays'></div>
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
