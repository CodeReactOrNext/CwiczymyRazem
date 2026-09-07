import { describe, expect, it } from "vitest";

import { createRpcClient, createRpcServer, unwrap } from "./workerRpc";

/** In-memory port pair that mimics Electron's shapes: `a` delivers raw messages
 *  (like utilityProcess in the parent), `b` wraps them in { data } (like
 *  process.parentPort in the child). Delivery is async, like the real thing. */
function makePortPair() {
  const listenersA = [];
  const listenersB = [];
  const a = {
    postMessage: (msg) => setTimeout(() => listenersB.forEach((l) => l({ data: msg })), 0),
    on: (_ev, l) => listenersA.push(l),
  };
  const b = {
    postMessage: (msg) => setTimeout(() => listenersA.forEach((l) => l(msg)), 0),
    on: (_ev, l) => listenersB.push(l),
  };
  return { a, b };
}

describe("workerRpc", () => {
  it("round-trips a call to a sync handler and an async handler", async () => {
    const { a, b } = makePortPair();
    createRpcServer(b, {
      add: (x, y) => x + y,
      later: async (v) => { await new Promise((r) => setTimeout(r, 5)); return { v }; },
    });
    const client = createRpcClient(a);
    expect(await client.call("add", 2, 3)).toBe(5);
    expect(await client.call("later", "ok")).toEqual({ v: "ok" });
    expect(client.pendingCount()).toBe(0);
  });

  it("rejects with the remote error's message and name", async () => {
    const { a, b } = makePortPair();
    createRpcServer(b, {
      boom: () => { const e = new TypeError("bad input"); e.code = "E_BAD"; throw e; },
    });
    const client = createRpcClient(a);
    await expect(client.call("boom")).rejects.toMatchObject({ message: "bad input", name: "TypeError", code: "E_BAD" });
  });

  it("rejects calls to unknown methods", async () => {
    const { a, b } = makePortPair();
    createRpcServer(b, {});
    const client = createRpcClient(a);
    await expect(client.call("nope")).rejects.toThrow(/Unknown RPC method: nope/);
  });

  it("keeps concurrent calls matched to their own replies", async () => {
    const { a, b } = makePortPair();
    createRpcServer(b, {
      echo: async (v, delayMs) => { await new Promise((r) => setTimeout(r, delayMs)); return v; },
    });
    const client = createRpcClient(a);
    const results = await Promise.all([
      client.call("echo", "slow", 20),
      client.call("echo", "fast", 1),
      client.call("echo", "mid", 10),
    ]);
    expect(results).toEqual(["slow", "fast", "mid"]);
  });

  it("delivers server events to the client's onEvent", async () => {
    const { a, b } = makePortPair();
    const server = createRpcServer(b, {});
    const events = [];
    createRpcClient(a, { onEvent: (name, payload) => events.push([name, payload]) });
    server.emit("frame", { n: 1 });
    server.emit("overload", { driftMs: 12 });
    await new Promise((r) => setTimeout(r, 5));
    expect(events).toEqual([["frame", { n: 1 }], ["overload", { driftMs: 12 }]]);
  });

  it("failAll rejects every in-flight call (the other side died)", async () => {
    const { a } = makePortPair(); // no server attached → calls never reply
    const client = createRpcClient(a);
    const p1 = client.call("x");
    const p2 = client.call("y");
    client.failAll(new Error("Audio engine process exited"));
    await expect(p1).rejects.toThrow(/exited/);
    await expect(p2).rejects.toThrow(/exited/);
    expect(client.pendingCount()).toBe(0);
  });

  it("unwrap accepts both raw messages and MessageEvent-style { data } wrappers", () => {
    const raw = { type: "call", id: 1, method: "m", args: [] };
    expect(unwrap(raw)).toBe(raw);
    expect(unwrap({ data: raw })).toBe(raw);
    // A payload that happens to have a `data` key but is itself a typed message stays as is.
    const tricky = { type: "event", name: "e", data: { type: "x" } };
    expect(unwrap(tricky)).toBe(tricky);
  });
});
