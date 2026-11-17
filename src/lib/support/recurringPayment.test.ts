import { describe, expect, it } from "vitest";

import { recurringPaymentKey } from "./recurringPayment";

const sec = (iso: string) => Date.parse(iso) / 1000;

describe("recurringPaymentKey", () => {
  it("keys a payment by subscription and UTC month", () => {
    expect(recurringPaymentKey("1119635", sec("2026-11-17T10:44:45Z"))).toBe(
      "1119635:2026-11",
    );
  });

  it("gives an edit later in the same period the same key", () => {
    expect(recurringPaymentKey("1", sec("2026-10-17T09:00:00Z"))).toBe(
      recurringPaymentKey("1", sec("2026-10-29T23:59:59Z")),
    );
  });

  it("gives each monthly renewal its own key, also at month ends", () => {
    const keys = [
      "2026-10-31T12:00:00Z",
      "2026-11-30T12:00:00Z",
      "2026-12-31T12:00:00Z",
    ].map((iso) => recurringPaymentKey("1", sec(iso)));
    expect(new Set(keys).size).toBe(3);
  });
});
