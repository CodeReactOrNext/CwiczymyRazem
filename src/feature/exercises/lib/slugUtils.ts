/**
 * Convert exercise ID (underscores) to URL slug (dashes).
 * Example: "spider_basic" → "spider-basic"
 */
export const idToSlug = (id: string): string => id.replace(/_/g, '-');

/**
 * Convert URL slug (dashes) to exercise ID (underscores).
 * Example: "spider-basic" → "spider_basic"
 */
export const slugToId = (slug: string): string => slug.replace(/-/g, '_');
