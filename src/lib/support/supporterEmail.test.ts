import { describe, expect, it } from "vitest";

import {
  emailFromPendingDocId,
  emailQueryVariants,
  normalizeEmail,
  pendingSupporterDocId,
} from "./supporterEmail";

describe("normalizeEmail", () => {
  it("matches the same address typed differently", () => {
    expect(normalizeEmail("  Ola@Gmail.com ")).toBe("ola@gmail.com");
    expect(normalizeEmail("ola@gmail.com")).toBe(
      normalizeEmail("OLA@GMAIL.COM"),
    );
  });

  it("rejects anything that can't be an address", () => {
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail("anonymous")).toBeNull();
  });
});

describe("pendingSupporterDocId", () => {
  it("survives a local part containing a slash", () => {
    const id = pendingSupporterDocId("a/b@example.com");
    expect(id).not.toContain("/");
    expect(emailFromPendingDocId(id)).toBe("a/b@example.com");
  });

  it("never produces a reserved id", () => {
    expect(pendingSupporterDocId("ola@gmail.com")).not.toBe(".");
    expect(pendingSupporterDocId("ola@gmail.com")).not.toBe("..");
  });

  it("gives one address exactly one document", () => {
    expect(pendingSupporterDocId(normalizeEmail("Ola@Gmail.com")!)).toBe(
      pendingSupporterDocId(normalizeEmail("ola@GMAIL.com")!),
    );
  });

  it("falls back to the raw id when it isn't encoded", () => {
    expect(emailFromPendingDocId("100%@example.com")).toBe("100%@example.com");
  });
});

describe("emailQueryVariants", () => {
  it("also looks for the casing the person signed up with", () => {
    expect(emailQueryVariants("Ola@Gmail.com")).toEqual([
      "ola@gmail.com",
      "Ola@Gmail.com",
    ]);
  });

  it("queries once when the address is already lowercase", () => {
    expect(emailQueryVariants(" ola@gmail.com ")).toEqual(["ola@gmail.com"]);
  });

  it("queries nothing for an anonymous donation", () => {
    expect(emailQueryVariants(null)).toEqual([]);
  });
});
