import type { SectionMapEntry } from "feature/songs/types/songSectionMap.type";

export const MIN_SECTIONS = 2;
export const MAX_SECTIONS = 40;
export const MIN_GAP_SECONDS = 3;
export const MAX_SUBMISSIONS_PER_DAY = 10;

/** Auto-generated placeholder names ("Section 1", "Section 2", …) carry no naming signal. */
export const isGenericSectionName = (name: string): boolean => {
  const trimmed = name.trim();
  if (!trimmed) return true;
  return /^section\s*\d+$/i.test(trimmed);
};

export interface ValidateSectionMapSubmissionInput {
  sections: SectionMapEntry[];
  videoDurationSeconds?: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Structural sanity check only — never rejects on naming, since generic
 * names still carry usable timing signal for consensus clustering.
 */
export const validateSectionMapSubmission = ({
  sections,
  videoDurationSeconds,
}: ValidateSectionMapSubmissionInput): ValidationResult => {
  if (sections.length < MIN_SECTIONS) {
    return { valid: false, reason: "too_few_sections" };
  }
  if (sections.length > MAX_SECTIONS) {
    return { valid: false, reason: "too_many_sections" };
  }

  for (const section of sections) {
    if (!Number.isFinite(section.startTime) || section.startTime < 0) {
      return { valid: false, reason: "invalid_start_time" };
    }
  }

  // Never trust the caller's ordering — sort before checking spacing.
  const sorted = [...sections].sort((a, b) => a.startTime - b.startTime);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime - sorted[i - 1].startTime < MIN_GAP_SECONDS) {
      return { valid: false, reason: "sections_too_close" };
    }
  }

  if (
    videoDurationSeconds !== undefined &&
    sorted[sorted.length - 1].startTime > videoDurationSeconds
  ) {
    return { valid: false, reason: "start_time_beyond_duration" };
  }

  return { valid: true };
};
