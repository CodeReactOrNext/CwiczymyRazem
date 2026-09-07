// Minimal request/response + one-way event protocol over any message port:
// Electron's utilityProcess (parent side) / process.parentPort (child side),
// a worker_threads MessagePort, or an in-memory pair in tests. Transport-agnostic
// on purpose so the audio engine's process boundary (audioEngineHost.js ↔
// audioProcess.js) can be unit-tested without spawning anything.
//
// Wire format:
//   { type: "call",  id, method, args }      client → server
//   { type: "reply", id, ok, result|error }  server → client
//   { type: "event", name, payload }         server → client (unsolicited)
//
// Port shape: { postMessage(msg), on("message", listener) }. Electron's
// process.parentPort hands listeners a MessageEvent ({ data }) while
// utilityProcess hands them the raw message — unwrap() accepts both.

function unwrap(m) {
  if (m && typeof m === "object" && typeof m.type !== "string" && m.data && typeof m.data.type === "string") {
    return m.data;
  }
  return m;
}

function serializeError(err) {
  if (err && typeof err === "object") {
    return { message: err.message ?? String(err), name: err.name, stack: err.stack, code: err.code };
  }
  return { message: String(err) };
}

function deserializeError(e) {
  const err = new Error((e && e.message) || "Unknown error");
  if (e && e.name && e.name !== "Error") err.name = e.name;
  if (e && e.code !== undefined) err.code = e.code;
  if (e && e.stack) err.remoteStack = e.stack;
  return err;
}

/** Client side. `onEvent(name, payload)` receives server-pushed events. */
function createRpcClient(port, { onEvent } = {}) {
  const pending = new Map();
  let nextId = 1;

  port.on("message", (raw) => {
    const msg = unwrap(raw);
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "reply") {
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(deserializeError(msg.error));
    } else if (msg.type === "event") {
      try { onEvent?.(msg.name, msg.payload); } catch { /* a bad listener must not break the port */ }
    }
  });

  return {
    call(method, ...args) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        try {
          port.postMessage({ type: "call", id, method, args });
        } catch (err) {
          pending.delete(id);
          reject(err);
        }
      });
    },
    /** Rejects every in-flight call — for when the other side went away. */
    failAll(err) {
      const error = err instanceof Error ? err : new Error(String(err || "RPC port closed"));
      for (const p of pending.values()) p.reject(error);
      pending.clear();
    },
    pendingCount() {
      return pending.size;
    },
  };
}

/** Server side. `handlers` maps method name → (sync or async) function.
 *  Returns { emit(name, payload) } for pushing events to the client. */
function createRpcServer(port, handlers) {
  port.on("message", async (raw) => {
    const msg = unwrap(raw);
    if (!msg || typeof msg !== "object" || msg.type !== "call") return;
    const handler = handlers[msg.method];
    if (typeof handler !== "function") {
      port.postMessage({ type: "reply", id: msg.id, ok: false, error: { message: `Unknown RPC method: ${msg.method}` } });
      return;
    }
    try {
      const result = await handler(...(Array.isArray(msg.args) ? msg.args : []));
      port.postMessage({ type: "reply", id: msg.id, ok: true, result });
    } catch (err) {
      port.postMessage({ type: "reply", id: msg.id, ok: false, error: serializeError(err) });
    }
  });

  return {
    emit(name, payload) {
      try { port.postMessage({ type: "event", name, payload }); } catch { /* port closing */ }
    },
  };
}

module.exports = { createRpcClient, createRpcServer, serializeError, deserializeError, unwrap };
