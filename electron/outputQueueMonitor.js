// Tracks the depth of audify's internal output queue from the JS side and decides
// when a block must be DROPPED instead of written, so a late block can never
// permanently ratchet up monitoring latency.
//
// Why this exists — audify's rt_callback (node_modules/audify/src/rt_audio.cpp)
// pops ONE queued block per hardware callback and appends whatever write() gives
// it, unconditionally. A block that arrives late (the JS thread stalled past the
// callback deadline) is not discarded: the callback that needed it already played
// silence (the audible dropout), and the late block is then played one callback
// later — as is every block after it, forever. Each stall adds one more permanent
// block of latency, and nothing on the audify side ever shrinks the queue again.
// That is how "latency creeps up during a session" happens, and it's invisible to
// getStreamLatency() (which only reports the driver's own hardware latency).
//
// Depth accounting: writes are counted here, consumes come from audify's
// frame-output callback (fires once per popped block). `writes - consumed` is the
// queue depth. Read right after a write — once that callback's own dispatches have
// settled (nativeAudioEngine reads it from a setImmediate; see there for why that
// ordering matters) — a healthy stream reads exactly 1: the block just written,
// waiting for the next callback. Every extra block is pure added latency.
//
// Two recovery paths:
// - a big excess (a long stall: GC pause, a blocking IPC handler, resume from
//   sleep) is dropped immediately — the silence already happened, and playing the
//   backlog would only turn it into permanent latency;
// - a single extra block is confirmed over `confirmBlocks` consecutive readings
//   before one write is skipped. That hysteresis is what makes a race in the
//   consume accounting harmless: the reading can only ever be exact or one LOW
//   (a pop that already happened but isn't dispatched yet), never high, so a
//   sustained "one behind" reading is a real backlog, not jitter.
//
// Dropping a block means running the DSP (so filter/delay/NAM state stays
// continuous) but not handing the result to the driver — one block-sized
// discontinuity, i.e. a small click. Far better than the alternative, which is
// carrying that block as extra latency for the rest of the session.
//
// Safety margin: the healthy depth of 1 means zero slack — the block written
// during callback k must be in the queue before callback k+1, so at tiny buffer
// sizes (64 frames = 1.33ms) an irregular driver cadence plus a slow DSP block
// underruns now and then even with a perfectly idle event loop, and correcting
// each one is a click. When underruns keep coming (`marginUnderruns` within
// `marginWindowMs`), the target depth is raised by one block instead: the next
// underrun then simply leaves that extra block in flight and nothing sheds it
// — one block period of extra latency (1.33ms at 64) buys silence. Capped at
// `maxTargetDepth`; never lowered again within the same stream.
class OutputQueueMonitor {
  constructor({
    confirmBlocks = 40,
    hardLimitExcess = 3,
    marginUnderruns = 4,
    marginWindowMs = 10000,
    maxTargetDepth = 3,
    now = Date.now,
  } = {}) {
    this.confirmBlocks = confirmBlocks;
    this.hardLimitExcess = hardLimitExcess;
    this.marginUnderruns = marginUnderruns;
    this.marginWindowMs = marginWindowMs;
    this.maxTargetDepth = maxTargetDepth;
    this.now = now;
    this.reset();
  }

  reset() {
    this.writes = 0;
    this.consumed = 0;
    this.behindStreak = 0;
    this.pendingDrops = 0;
    this.wasBehind = false;
    this.targetDepth = 1;
    this.recentUnderrunsAt = [];
    // Diagnostics (see nativeAudioEngine.getDiagnostics)
    this.drops = 0;        // writes actually skipped
    this.hardEvents = 0;   // immediate-drop decisions (a real stall/overload)
    this.softEvents = 0;   // confirmed one-block-behind corrections
    this.stallEvents = 0;  // late deliveries that shed a backlog (onLateDelivery)
    this.underruns = 0;    // transitions from "on time" to "behind" — each one was an audible gap
    this.maxExcess = 0;
  }

  /** Audify popped one block (frame-output callback). */
  onConsumed() {
    this.consumed++;
  }

  /** A block reached the DSP `blocksElapsed` block periods after the previous
   *  one (≥ 2 means at least one hardware callback in between found nothing to
   *  play). audify queued every block that arrived during that stall and is
   *  now handing them over back to back; writing them all would turn the stall
   *  into permanent latency, and playing them would replay audio from before
   *  the gap. Instead drop all but the last of the backlog — the freshest block
   *  is what the next callback should play — so latency snaps straight back to
   *  normal. Returns the number of drops scheduled. */
  onLateDelivery(blocksElapsed) {
    const backlog = Math.floor(blocksElapsed);
    if (backlog < 2) return 0;
    const drops = backlog - 1;
    this.pendingDrops = Math.max(this.pendingDrops, drops);
    this.stallEvents++;
    return drops;
  }

  /** Call before writing a block. Returns true if this block must be dropped
   *  (DSP still runs — only the write is skipped). */
  shouldDropWrite() {
    if (this.pendingDrops > 0) {
      this.pendingDrops--;
      this.drops++;
      return true;
    }
    return false;
  }

  /** A block was handed to rt.write(). */
  onWritten() {
    this.writes++;
  }

  depth() {
    return this.writes - this.consumed;
  }

  /** Call after a write, once consumes up to the previous hardware callback are
   *  accounted for. Returns how many future writes this evaluation scheduled to
   *  drop (0 on a healthy stream), and whether that was a "hard" decision. */
  evaluate() {
    let excess = Math.max(0, this.depth() - this.targetDepth);
    if (excess >= 1 && !this.wasBehind && this._onUnderrun()) {
      excess = Math.max(0, this.depth() - this.targetDepth); // margin raised — re-read against the new target
    }
    if (excess > this.maxExcess) this.maxExcess = excess;

    const behind = excess >= 1;
    this.wasBehind = behind;

    if (excess >= this.hardLimitExcess) {
      this.pendingDrops = excess;
      this.behindStreak = 0;
      this.hardEvents++;
      return { drops: excess, hard: true };
    }
    if (behind) {
      this.behindStreak++;
      if (this.behindStreak >= this.confirmBlocks) {
        this.behindStreak = 0;
        this.pendingDrops = 1;
        this.softEvents++;
        return { drops: 1, hard: false };
      }
      return { drops: 0, hard: false };
    }
    this.behindStreak = 0;
    return { drops: 0, hard: false };
  }

  /** An on-time → behind transition: a hardware callback found nothing to play.
   *  Counts it, and raises the safety margin if they keep coming. Returns true
   *  when the margin was raised. */
  _onUnderrun() {
    this.underruns++;
    const t = this.now();
    this.recentUnderrunsAt.push(t);
    const cutoff = t - this.marginWindowMs;
    while (this.recentUnderrunsAt.length && this.recentUnderrunsAt[0] < cutoff) this.recentUnderrunsAt.shift();
    if (this.recentUnderrunsAt.length >= this.marginUnderruns && this.targetDepth < this.maxTargetDepth) {
      this.targetDepth++;
      this.recentUnderrunsAt = [];
      // The extra block is already in the queue (that's what "behind" means),
      // so from here on nothing sheds it: the margin is in place at no cost.
      this.behindStreak = 0;
      return true;
    }
    return false;
  }

  stats() {
    return {
      depth: this.depth(),
      drops: this.drops,
      hardEvents: this.hardEvents,
      softEvents: this.softEvents,
      stallEvents: this.stallEvents,
      underruns: this.underruns,
      maxExcess: this.maxExcess,
      safetyBlocks: this.targetDepth - 1,
    };
  }
}

module.exports = { OutputQueueMonitor };
