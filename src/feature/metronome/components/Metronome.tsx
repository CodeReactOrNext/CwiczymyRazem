import {
  METRONOME_CSS,
  METRONOME_MARKUP,
  mountMetronome,
} from "feature/metronome/generated/metronomeApp";
import { useEffect, useRef } from "react";

const SHADOW_CONTENT = `<style>${METRONOME_CSS}</style>${METRONOME_MARKUP}`;

// Declarative shadow DOM: the server sends the metronome's markup in the page's
// own HTML (indexable, visible before hydration), while the shadow root keeps
// its stylesheet and Tailwind's from touching each other.
const SSR_HTML = `<template shadowrootmode="open">${SHADOW_CONTENT}</template>`;

/**
 * marxd262/Metronome, rendered in place rather than in an iframe. The app itself
 * is vanilla JS generated from the vendored upstream file by
 * scripts/buildMetronome.mjs; this component only hosts it.
 */
export const Metronome = () => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    // After a client-side navigation React inserts the <template> as inert
    // markup — only the HTML parser turns it into a shadow root — so attach one.
    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: "open" });
      shadow.innerHTML = SHADOW_CONTENT;
    }

    const root = shadow.querySelector<HTMLElement>(".rq-root");
    if (!root) return undefined;
    const teardown = mountMetronome(shadow, root);

    const shadowRoot = shadow;
    return () => {
      teardown();
      // The app binds listeners straight onto its elements; a fresh copy of the
      // markup is what lets a remount (Strict Mode, back navigation) start clean.
      shadowRoot.innerHTML = SHADOW_CONTENT;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SSR_HTML }}
    />
  );
};
