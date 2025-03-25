import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendDiscordMessage } from "../utils/discord.utils";

describe("sendDiscordMessage", () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    global.fetch = vi.fn();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it("should return false when webhook URL is not configured", async () => {
    process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL = "";

    const result = await sendDiscordMessage({ username: "test" });

    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should send message successfully", async () => {
    process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL = "https://discord.webhook.url";
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

    const message = { username: "test" };
    const result = await sendDiscordMessage(message);

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("https://discord.webhook.url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  });

  it("should handle fetch errors", async () => {
    process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL = "https://discord.webhook.url";
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error")
    );

    const result = await sendDiscordMessage({ username: "test" });

    expect(result).toBe(false);
  });
});
