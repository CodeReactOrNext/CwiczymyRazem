import { lookup } from "dns";
import { request } from "https";
import type { LookupFunction } from "net";

/**
 * The one HTTP GET the OAuth server makes on a stranger's say-so: fetching a
 * Client ID Metadata Document from the URL a client calls its id. Not `fetch`,
 * because its DNS lookup can't be hooked — a name could resolve to a public
 * address when checked and to a private one when fetched (DNS rebinding). Here
 * the check runs inside the socket's own lookup, so the address that's checked
 * is the address that's connected to.
 */

export class CimdFetchError extends Error {}

interface FetchLimits {
  timeoutMs: number;
  maxBytes: number;
  isPublicAddress: (address: string) => boolean;
}

/** DNS for the socket, refusing any name with a non-public address. */
const publicOnlyLookup =
  (isPublicAddress: FetchLimits["isPublicAddress"]): LookupFunction =>
  (hostname, options, callback) => {
    lookup(hostname, { all: true }, (error, addresses) => {
      if (error) return callback(error, "", 4);
      if (
        addresses.length === 0 ||
        !addresses.every(({ address }) => isPublicAddress(address))
      ) {
        return callback(
          new CimdFetchError("host doesn't resolve to a public address"),
          "",
          4,
        );
      }
      // Newer Node asks for every address (happy eyeballs), older for one.
      if ((options as { all?: boolean }).all) {
        return (callback as unknown as (e: null, a: typeof addresses) => void)(
          null,
          addresses,
        );
      }
      return callback(null, addresses[0].address, addresses[0].family);
    });
  };

/**
 * GETs `url` (https, default port — the caller checks the URL's shape) and
 * returns the status and the body as text. No redirects are followed; a body
 * over `maxBytes` is cut off and refused, whatever Content-Length says.
 */
export function fetchPublicJson(
  url: string,
  { timeoutMs, maxBytes, isPublicAddress }: FetchLimits,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        lookup: publicOnlyLookup(isPublicAddress),
        timeout: timeoutMs,
      },
      (res) => {
        const declared = Number(res.headers["content-length"]);
        if (Number.isFinite(declared) && declared > maxBytes) {
          req.destroy(new CimdFetchError("document is too large"));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy(new CimdFetchError("document is too large"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          }),
        );
        res.on("error", reject);
      },
    );
    // The whole exchange, not just an idle socket, gets `timeoutMs`.
    const deadline = setTimeout(
      () => req.destroy(new CimdFetchError("timed out")),
      timeoutMs,
    );
    req.on("timeout", () => req.destroy(new CimdFetchError("timed out")));
    req.on("error", reject);
    req.on("close", () => clearTimeout(deadline));
    req.end();
  });
}
