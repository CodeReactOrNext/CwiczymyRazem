import {
  GUILD_LOGO_FOLDER,
  isGuildLogoUrl,
} from "feature/guilds/utils/guildLogo";
import { describe, expect, it } from "vitest";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET;

const downloadUrl = (
  object: string,
  bucket = BUCKET ?? "riffquest.appspot.com",
) =>
  `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${object}?alt=media&token=6c4b0a2e`;

describe("isGuildLogoUrl", () => {
  it("takes a download URL from the folder this feature writes to", () => {
    expect(isGuildLogoUrl(downloadUrl(`${GUILD_LOGO_FOLDER}%2Fabc123`))).toBe(
      true,
    );
  });

  it("refuses an image hosted anywhere else", () => {
    expect(isGuildLogoUrl("https://example.com/crest.png")).toBe(false);
    expect(
      isGuildLogoUrl(
        "https://firebasestorage.googleapis.com.evil.test/v0/b/x/o/guildLogos%2Fa",
      ),
    ).toBe(false);
  });

  it("refuses another folder in our own bucket, avatars included", () => {
    expect(isGuildLogoUrl(downloadUrl("avatars%2Fsomebody"))).toBe(false);
  });

  it("refuses anything that is not a URL at all", () => {
    expect(isGuildLogoUrl("")).toBe(false);
    expect(isGuildLogoUrl(null)).toBe(false);
    expect(isGuildLogoUrl(undefined)).toBe(false);
    expect(isGuildLogoUrl(42)).toBe(false);
  });
});
