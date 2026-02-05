"use client";

import Script from "next/script";

const Analytics = () => {

  return (
    <>
      {/* Contentsquare */}
      <Script
        id="contentsquare-script"
        strategy="afterInteractive"
        src="https://t.contentsquare.net/uxa/9e03f79f1b59f.js"
      />

      {/* Crazy Egg */}
      <Script
        id="crazy-egg-script"
        strategy="afterInteractive"
        src="//script.crazyegg.com/pages/scripts/0132/0608.js"
      />

      {/* Microsoft Clarity */}
      <Script
        id="microsoft-clarity"
        strategy="afterInteractive"
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
    </>
  );
};

export default Analytics;
