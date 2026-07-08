import type { PlaylistKind } from "feature/songs/types/playlist.types";
import { ListMusic, Route, Trophy } from "lucide-react";

export const KIND_META: Record<
  PlaylistKind,
  {
    icon: typeof ListMusic;
    label: string;
    tagline: string;
    /** Short line shown in the creator's kind picker. */
    hint: string;
    /** Cover badge for special kinds; regular playlists stay unbadged. */
    badge?: { label: string; className: string; iconClassName: string };
  }
> = {
  playlist: {
    icon: ListMusic,
    label: "Playlist",
    tagline: "A free-form collection of songs",
    hint: "Group songs however you like — moods, bands, practice sets.",
  },
  path: {
    icon: Route,
    label: "Learning path",
    tagline: "Songs meant to be learned in order — a roadmap for your repertoire",
    hint: "A roadmap from first to last. Progress fills in as you master each song.",
    badge: {
      label: "Path",
      className: "ring-cyan-400/50 text-cyan-300",
      iconClassName: "text-cyan-300",
    },
  },
  top: {
    icon: Trophy,
    label: "Top 10",
    tagline: "A ranked list, best first",
    hint: "Your top picks with big rank numbers. Capped at ten.",
    badge: {
      label: "Top 10",
      className: "ring-amber-400/50 text-amber-300",
      iconClassName: "text-amber-300",
    },
  },
};

/**
 * Playlists without enough cover art get a deterministic gradient derived from
 * their id, so every playlist keeps a stable identity — same trick album art
 * placeholders use. Hues are picked from a curated set that sits well on zinc.
 */
const COVER_HUES = [
  { from: "#b45309", to: "#1c1007" }, // amber
  { from: "#be123c", to: "#1c0710" }, // rose
  { from: "#047857", to: "#04180f" }, // emerald
  { from: "#6d28d9", to: "#120724" }, // violet
  { from: "#0e7490", to: "#041418" }, // teal
  { from: "#c2410c", to: "#1a0c04" }, // orange
  { from: "#4d7c0f", to: "#0e1504" }, // olive
  { from: "#a21caf", to: "#180419" }, // magenta
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

export const getPlaylistHue = (seed: string) =>
  COVER_HUES[hashString(seed) % COVER_HUES.length];

export const getPlaylistGradient = (seed: string) => {
  const hue = getPlaylistHue(seed);
  return `linear-gradient(135deg, ${hue.from} 0%, ${hue.to} 100%)`;
};

/** Accent color used for header washes and small tints. */
export const getPlaylistAccent = (seed: string) => getPlaylistHue(seed).from;
