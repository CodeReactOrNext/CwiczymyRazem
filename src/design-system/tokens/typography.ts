/**
 * Design Tokens - Typography
 * Clean, readable, elegant typography system
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      'Inter', 
      '-apple-system', 
      'BlinkMacSystemFont', 
      'Segoe UI', 
      'Roboto', 
      'Helvetica Neue', 
      'Arial', 
      'sans-serif'
    ],
    mono: [
      'SF Mono', 
      'Monaco', 
      'Inconsolata', 
      'Roboto Mono', 
      'source-code-pro', 
      'Menlo', 
      'Consolas', 
      'monospace'
    ],
  },

  // Font Weights - Limited set for consistency
  fontWeight: {
    normal: '400',     // Regular text
    medium: '500',     // Slightly emphasized
    semibold: '600',   // Headings, important text
    bold: '700',       // Strong emphasis only
  },

  // Font Sizes - Harmonious scale
  fontSize: {
    xs: '0.75rem',     // 12px - Captions, labels
    sm: '0.875rem',    // 14px - Small text, secondary
    base: '1rem',      // 16px - Body text (base)
    lg: '1.125rem',    // 18px - Large body text
    xl: '1.25rem',     // 20px - Small headings
    '2xl': '1.5rem',   // 24px - Medium headings
    '3xl': '1.875rem', // 30px - Large headings
    '4xl': '2.25rem',  // 36px - Display headings
    '5xl': '3rem',     // 48px - Hero text (rarely used)
  },

  // Line Heights - Optimized for readability
  lineHeight: {
    none: '1',         // For headings that need tight spacing
    tight: '1.25',     // For large headings
    snug: '1.375',     // For medium headings
    normal: '1.5',     // For body text (optimal readability)
    relaxed: '1.625',  // For large body text
    loose: '2',        // For captions, special cases
  },

  // Letter Spacing - Subtle improvements
  letterSpacing: {
    tighter: '-0.05em',  // For large headings
    tight: '-0.025em',   // For headings
    normal: '0',         // Default
    wide: '0.025em',     // For small text
    wider: '0.05em',     // For labels, captions
    widest: '0.1em',     // For special emphasis
  },

  // Text Styles - Predefined combinations
  textStyles: {
    // Display text (hero sections)
    display: {
      large: {
        fontSize: '3rem',        // 48px
        fontWeight: '700',
        lineHeight: '1.25',
        letterSpacing: '-0.05em',
      },
      medium: {
        fontSize: '2.25rem',     // 36px
        fontWeight: '600',
        lineHeight: '1.25',
        letterSpacing: '-0.025em',
      },
      small: {
        fontSize: '1.875rem',    // 30px
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '-0.025em',
      },
    },

    // Headings
    heading: {
      h1: {
        fontSize: '1.875rem',    // 30px
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: '1.5rem',      // 24px
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: '1.25rem',     // 20px
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '0',
      },
      h4: {
        fontSize: '1.125rem',    // 18px
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '0',
      },
      h5: {
        fontSize: '1rem',        // 16px
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '0',
      },
      h6: {
        fontSize: '0.875rem',    // 14px
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '0.025em',
      },
    },

    // Body text
    body: {
      large: {
        fontSize: '1.125rem',    // 18px
        fontWeight: '400',
        lineHeight: '1.625',
        letterSpacing: '0',
      },
      medium: {
        fontSize: '1rem',        // 16px
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0',
      },
      small: {
        fontSize: '0.875rem',    // 14px
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0',
      },
    },

    // Labels and captions
    label: {
      large: {
        fontSize: '0.875rem',    // 14px
        fontWeight: '500',
        lineHeight: '1.375',
        letterSpacing: '0.025em',
      },
      medium: {
        fontSize: '0.75rem',     // 12px
        fontWeight: '500',
        lineHeight: '1.375',
        letterSpacing: '0.05em',
      },
      small: {
        fontSize: '0.75rem',     // 12px
        fontWeight: '400',
        lineHeight: '1.375',
        letterSpacing: '0.05em',
      },
    },

    // Code and monospace
    code: {
      inline: {
        fontSize: '0.875rem',    // 14px
        fontWeight: '400',
        lineHeight: '1.375',
        letterSpacing: '0',
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      },
      block: {
        fontSize: '0.875rem',    // 14px
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0',
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      },
    },
  },
} as const;

export type Typography = typeof typography;










