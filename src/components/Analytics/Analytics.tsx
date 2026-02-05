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
    </>
  );
};

export default Analytics;
