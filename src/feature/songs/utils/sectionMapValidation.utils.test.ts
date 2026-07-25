import { describe, expect, it } from "vitest";

import {
  isGenericSectionName,
  MAX_SECTIONS,
  MIN_GAP_SECONDS,
  MIN_SECTIONS,
  validateSectionMapSubmission,
} from "./sectionMapValidation.utils";

describe("isGenericSectionName", () => {
  it.each(["Section 1", "section  12", "SECTION 3", ""])(
    "treats %j as generic",
    (name) => {
      expect(isGenericSectionName(name)).toBe(true);
    }
  );

  it("treats whitespace-only names as generic", () => {
    expect(isGenericSectionName("   ")).toBe(true);
  });

  it.each(["Chorus", "Section", "Pre-Chorus", "Solo 2"])(
    "treats %j as meaningful",
    (name) => {
      expect(isGenericSectionName(name)).toBe(false);
    }
  );
});

const sectionsFrom = (startTimes: number[]) =>
  startTimes.map((startTime, i) => ({ name: `Part ${i}`, startTime }));

describe("validateSectionMapSubmission", () => {
  it("rejects fewer than MIN_SECTIONS", () => {
    const sections = sectionsFrom(
      Array.from({ length: MIN_SECTIONS - 1 }, (_, i) => i * 10)
    );
    const result = validateSectionMapSubmission({ sections });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("too_few_sections");
  });

  it("accepts exactly MIN_SECTIONS", () => {
    const sections = sectionsFrom(
      Array.from({ length: MIN_SECTIONS }, (_, i) => i * 10)
    );
    expect(validateSectionMapSubmission({ sections }).valid).toBe(true);
  });

  it("accepts exactly MAX_SECTIONS", () => {
    const sections = sectionsFrom(
      Array.from({ length: MAX_SECTIONS }, (_, i) => i * 10)
    );
    expect(validateSectionMapSubmission({ sections }).valid).toBe(true);
  });

  it("rejects more than MAX_SECTIONS", () => {
    const sections = sectionsFrom(
      Array.from({ length: MAX_SECTIONS + 1 }, (_, i) => i * 10)
    );
    const result = validateSectionMapSubmission({ sections });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("too_many_sections");
  });

  it("rejects a negative startTime", () => {
    const result = validateSectionMapSubmission({
      sections: sectionsFrom([0, -5, 20]),
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid_start_time");
  });

  it("rejects a non-finite startTime", () => {
    const result = validateSectionMapSubmission({
      sections: [
        { name: "A", startTime: 0 },
        { name: "B", startTime: Infinity },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid_start_time");
  });

  it("rejects sections spaced less than MIN_GAP_SECONDS apart", () => {
    const result = validateSectionMapSubmission({
      sections: sectionsFrom([0, MIN_GAP_SECONDS - 1]),
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("sections_too_close");
  });

  it("accepts sections spaced exactly MIN_GAP_SECONDS apart", () => {
    const result = validateSectionMapSubmission({
      sections: sectionsFrom([0, MIN_GAP_SECONDS]),
    });
    expect(result.valid).toBe(true);
  });

  it("sorts unsorted input before checking spacing", () => {
    const result = validateSectionMapSubmission({
      sections: [
        { name: "B", startTime: 40 },
        { name: "A", startTime: 0 },
        { name: "C", startTime: 20 },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it("catches overlap even when input is unsorted", () => {
    const result = validateSectionMapSubmission({
      sections: [
        { name: "B", startTime: 40 },
        { name: "A", startTime: 39 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("sections_too_close");
  });

  it("rejects a startTime beyond the given video duration", () => {
    const result = validateSectionMapSubmission({
      sections: sectionsFrom([0, 30, 200]),
      videoDurationSeconds: 180,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("start_time_beyond_duration");
  });

  it("skips the duration check when videoDurationSeconds is omitted", () => {
    const result = validateSectionMapSubmission({
      sections: sectionsFrom([0, 30, 99999]),
    });
    expect(result.valid).toBe(true);
  });

  it("is structurally valid even when every name is generic", () => {
    const result = validateSectionMapSubmission({
      sections: [
        { name: "Section 1", startTime: 0 },
        { name: "Section 2", startTime: 30 },
      ],
    });
    expect(result.valid).toBe(true);
  });
});
