import { describe, expect, it, vi } from "vitest";

// clients.ts pulls in the Admin SDK through ../db; only isPublicAddress is used.
vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {},
  auth: {},
}));

import { CimdFetchError, fetchPublicJson } from "./cimdFetch";
import { isPublicAddress } from "./clients";

describe("isPublicAddress", () => {
  it.each([
    "8.8.8.8",
    "160.79.104.10",
    "2606:4700:4700::1111",
    "::ffff:8.8.8.8",
  ])("lets %s through", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });

  // Every range here was let through before, or has to stay shut.
  it.each([
    "10.0.0.5",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "198.18.0.1",
    "192.0.0.8",
    "192.0.2.1",
    "203.0.113.9",
    "224.0.0.1",
    "::1",
    "::",
    "::127.0.0.1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "fc00::1",
    "fd12::1",
    "fe80::1",
    "febf::1",
    "fec0::1",
    "ff02::1",
    "64:ff9b::7f00:1",
    "2002:7f00:1::",
    "2001:db8::1",
    "2001:0:4136:e378::1",
    "not-an-ip",
  ])("refuses %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
});

describe("fetchPublicJson", () => {
  it("refuses at the socket's own lookup when a name resolves to a private address", async () => {
    // localhost resolves to loopback on every machine: the connection is
    // refused before it is opened, whatever the URL checks said earlier.
    const fetching = fetchPublicJson("https://localhost/client.json", {
      timeoutMs: 2000,
      maxBytes: 1024,
      isPublicAddress,
    });
    await expect(fetching).rejects.toBeInstanceOf(CimdFetchError);
    await expect(fetching).rejects.toThrow(/public address/);
  });
});
