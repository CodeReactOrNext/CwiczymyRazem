import { afterEach, describe, expect, it } from "vitest";

import { cancelSignIn, signInWithGoogle } from "./desktopAuth";

const APP_URL = "https://riff.quest";

/** Starts a sign-in and returns the URL the browser would have opened. */
const start = (options = {}) => {
  let opened;
  const opening = new Promise((resolve) => {
    opened = resolve;
  });
  const result = signInWithGoogle({
    appUrl: APP_URL,
    openExternal: (url) => opened(new URL(url)),
    ...options,
  });
  return { result, opening };
};

const post = (url, fields, headers = {}) =>
  fetch(url, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(fields).toString(),
  });

const callbackOf = (opened) =>
  `http://127.0.0.1:${opened.searchParams.get("port")}/callback`;

afterEach(() => cancelSignIn());

describe("desktop Google sign-in", () => {
  it("opens the site's desktop-login page with a port and a state", async () => {
    const { opening } = start();
    const opened = await opening;
    expect(opened.origin).toBe(APP_URL);
    expect(opened.pathname).toBe("/desktop-login");
    expect(Number(opened.searchParams.get("port"))).toBeGreaterThan(0);
    expect(opened.searchParams.get("state")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("resolves with the token once the page posts it with the right state", async () => {
    const { result, opening } = start();
    const opened = await opening;
    const response = await post(
      callbackOf(opened),
      { state: opened.searchParams.get("state"), token: "custom-token", newUser: "1" },
      { Origin: APP_URL },
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${APP_URL}/desktop-login?done=1`);
    await expect(result).resolves.toEqual({
      ok: true,
      token: "custom-token",
      isNewUser: true,
    });
  });

  it("ignores a wrong state and keeps waiting", async () => {
    const { result, opening } = start();
    const opened = await opening;
    const wrong = await post(callbackOf(opened), { state: "nope", token: "evil" });
    expect(wrong.status).toBe(400);

    await post(callbackOf(opened), {
      state: opened.searchParams.get("state"),
      token: "good",
    });
    await expect(result).resolves.toMatchObject({ ok: true, token: "good", isNewUser: false });
  });

  it("refuses a post from another site", async () => {
    const { opening } = start();
    const opened = await opening;
    const response = await post(
      callbackOf(opened),
      { state: opened.searchParams.get("state"), token: "t" },
      { Origin: "https://evil.example" },
    );
    expect(response.status).toBe(403);
  });

  it("ends the previous attempt when a new one starts", async () => {
    const first = start();
    await first.opening;
    const second = start();
    await expect(first.result).resolves.toEqual({ ok: false, reason: "superseded" });
    await second.opening;
  });

  it("can be cancelled", async () => {
    const { result, opening } = start();
    await opening;
    cancelSignIn();
    await expect(result).resolves.toEqual({ ok: false, reason: "cancelled" });
  });

  it("gives up after the timeout", async () => {
    const { result } = start({ timeoutMs: 20 });
    await expect(result).resolves.toEqual({ ok: false, reason: "timeout" });
  });
});
