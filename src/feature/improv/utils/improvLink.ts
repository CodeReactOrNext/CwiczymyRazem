import type { ImprovTakeProvider } from "feature/improv/types/improv.types";

export interface ParsedTakeLink {
  provider: ImprovTakeProvider;
  /** The link as it is stored and opened: https, no tracking junk added by us. */
  url: string;
  /** Only for YouTube — enough to build a thumbnail. */
  youtubeId: string | null;
}

const YOUTUBE_ID = /^[\w-]{11}$/;

const youtubeIdOf = (link: URL): string | null => {
  const host = link.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = link.pathname.split("/")[1] ?? null;
  } else if (link.pathname === "/watch") {
    id = link.searchParams.get("v");
  } else {
    const [, kind, value] = link.pathname.split("/");
    if (kind === "shorts" || kind === "live" || kind === "embed") id = value;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
};

/**
 * A take is a link to where the video already lives. Only the three hosts the
 * page names are accepted: the bot posts the link in public, so "any URL"
 * would make it a way to push arbitrary links into the Discord thread.
 */
export const parseTakeLink = (raw: string): ParsedTakeLink | null => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500) return null;

  let link: URL;
  try {
    link = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    return null;
  }
  if (link.protocol !== "https:" && link.protocol !== "http:") return null;
  link.protocol = "https:";

  const host = link.hostname.toLowerCase().replace(/^(www|m|music)\./, "");

  if (host === "youtube.com" || host === "youtu.be") {
    const youtubeId = youtubeIdOf(link);
    if (!youtubeId) return null;
    return {
      provider: "youtube",
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
      youtubeId,
    };
  }

  if (host === "instagram.com") {
    if (!/^\/(reel|reels|p|tv)\/[\w-]+/.test(link.pathname)) return null;
    return {
      provider: "instagram",
      url: `https://www.instagram.com${link.pathname}`,
      youtubeId: null,
    };
  }

  if (host === "drive.google.com") {
    const isFile =
      /^\/file\/d\/[\w-]+/.test(link.pathname) ||
      (link.pathname === "/open" && !!link.searchParams.get("id"));
    if (!isFile) return null;
    return { provider: "drive", url: link.toString(), youtubeId: null };
  }

  return null;
};

export const youtubeThumbnail = (youtubeId: string): string =>
  `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

/** The thumbnail of a stored take link, when its host gives one away for free. */
export const takeThumbnail = (url: string): string | null => {
  const parsed = parseTakeLink(url);
  return parsed?.youtubeId ? youtubeThumbnail(parsed.youtubeId) : null;
};

export const IMPROV_PROVIDER_LABEL: Record<ImprovTakeProvider, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  drive: "Google Drive",
};
