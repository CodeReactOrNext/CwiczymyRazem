// Google sign-in for the desktop app, done in the player's own browser.
//
// Google refuses to sign anyone in inside an embedded browser: an Electron
// window gets "This browser or app may not be secure" or, more confusingly,
// "JavaScript is disabled in your browser". So the app never shows Google's
// page itself. Instead (the loopback flow from RFC 8252):
//
//   1. a one-shot HTTP server listens on 127.0.0.1, on a port the OS picks;
//   2. the system browser opens <app>/desktop-login?port=…&state=…, where the
//      player signs in with Google as on the website;
//   3. that page asks the server for a Firebase custom token and POSTs it,
//      with the same `state`, to http://127.0.0.1:<port>/callback;
//   4. the app checks `state`, hands the token to the renderer, which calls
//      signInWithCustomToken.
//
// The token travels in a POST body, so it never lands in the browser's
// history. `state` is random per attempt: a page that guessed the port still
// can't log the app into an account of its choosing.

const crypto = require("crypto");
const http = require("http");

const TIMEOUT_MS = 5 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;
const CALLBACK_PATH = "/callback";

let pending = null; // { finish(outcome) } for the attempt in progress

const sameSecret = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("body-too-large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

/**
 * Runs one browser sign-in. Resolves (never rejects) with
 * `{ ok: true, token, isNewUser }` or `{ ok: false, reason }`, where reason is
 * "cancelled" | "superseded" | "timeout" | "server-error".
 *
 * Starting a new attempt ends the previous one as "superseded", so a player who
 * closed the browser tab can just click the button again.
 */
function signInWithGoogle({ appUrl, openExternal, timeoutMs = TIMEOUT_MS }) {
  if (pending) pending.finish({ ok: false, reason: "superseded" });

  const appOrigin = new URL(appUrl).origin;
  const state = crypto.randomBytes(32).toString("hex");

  return new Promise((resolve) => {
    let done = false;
    let timer = null;

    const server = http.createServer(async (req, res) => {
      const { pathname } = new URL(req.url, "http://127.0.0.1");
      if (req.method !== "POST" || pathname !== CALLBACK_PATH) {
        res.writeHead(404).end();
        return;
      }
      // Browsers send Origin on a cross-origin form POST; when they do, it has
      // to be the app's own site.
      const origin = req.headers.origin;
      if (origin && origin !== appOrigin) {
        res.writeHead(403).end();
        return;
      }

      let fields;
      try {
        fields = new URLSearchParams(await readBody(req));
      } catch {
        res.writeHead(413).end();
        return;
      }
      const token = fields.get("token");
      if (done || !token || !sameSecret(fields.get("state") ?? "", state)) {
        res.writeHead(400).end();
        return;
      }

      // Back to the site, so the tab says "you can return to the app" in the
      // site's own design instead of a bare localhost page.
      res.writeHead(303, { Location: `${appOrigin}/desktop-login?done=1` });
      res.end();
      finish({
        ok: true,
        token,
        isNewUser: fields.get("newUser") === "1",
      });
    });

    function finish(outcome) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (pending && pending.finish === finish) pending = null;
      // Let the 303 go out before the socket closes.
      setImmediate(() => {
        server.close();
        server.closeAllConnections?.();
      });
      resolve(outcome);
    }

    pending = { finish };

    server.on("error", () => finish({ ok: false, reason: "server-error" }));
    server.listen(0, "127.0.0.1", () => {
      if (done) return;
      const { port } = server.address();
      const url = new URL("/desktop-login", appOrigin);
      url.searchParams.set("port", String(port));
      url.searchParams.set("state", state);
      timer = setTimeout(() => finish({ ok: false, reason: "timeout" }), timeoutMs);
      Promise.resolve(openExternal(url.toString())).catch(() =>
        finish({ ok: false, reason: "server-error" }),
      );
    });
  });
}

/** Ends the attempt in progress, if any, as "cancelled". */
function cancelSignIn() {
  if (pending) pending.finish({ ok: false, reason: "cancelled" });
}

module.exports = { signInWithGoogle, cancelSignIn, CALLBACK_PATH };
