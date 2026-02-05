"use client";

import { useEffect } from "react";

const Analytics = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // Contentsquare
    const csScript = document.createElement("script");
    csScript.async = true;
    csScript.src = "https://t.contentsquare.net/uxa/9e03f79f1b59f.js";
    document.head.appendChild(csScript);

    // Crazy Egg
    const ceScript = document.createElement("script");
    ceScript.type = "text/javascript";
    ceScript.async = true;
    ceScript.src = "//script.crazyegg.com/pages/scripts/0132/0608.js";
    document.head.appendChild(ceScript);
  }, []);

  return null;
};

export default Analytics;
