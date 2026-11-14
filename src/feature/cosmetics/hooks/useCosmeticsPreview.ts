import {
  AVATAR_EFFECTS,
  BANNERS,
} from "feature/cosmetics/data/cosmeticsCatalog";
import type { EquippedCosmetics } from "feature/cosmetics/types/cosmetics.types";
import { useEffect, useSyncExternalStore } from "react";

/**
 * A local test mode that dresses every row of the feed in a random banner and
 * avatar effect, so the whole catalog can be looked at against real activity
 * without buying anything. Nothing is written anywhere: it lives in this
 * browser's localStorage and only this viewer sees it.
 *
 * `?cosmetics=random` turns it on, `?cosmetics=off` turns it off.
 */

const KEY = "riffquest-cosmetics-preview";
const EVENT = "riffquest-cosmetics-preview";

const read = (): boolean => {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

/** Reads the URL switch once and stores it; the flag itself comes from storage. */
export const useCosmeticsPreview = (): boolean => {
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("cosmetics");
    if (value !== "random" && value !== "off") return;
    try {
      if (value === "random") window.localStorage.setItem(KEY, "1");
      else window.localStorage.removeItem(KEY);
    } catch {
      return;
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return useSyncExternalStore(subscribe, read, () => false);
};

/** FNV-1a: the same row gets the same look on every render, different rows differ. */
const hash = (seed: string): number => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** A stable random banner + avatar effect for one feed row. */
export const randomLook = (seed: string): EquippedCosmetics => {
  const h = hash(seed);
  return {
    banner: BANNERS[h % BANNERS.length].id,
    avatar: AVATAR_EFFECTS[Math.floor(h / BANNERS.length) % AVATAR_EFFECTS.length].id,
  };
};
