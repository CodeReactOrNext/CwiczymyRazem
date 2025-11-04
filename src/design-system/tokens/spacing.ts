/**
 * Design Tokens - Spacing & Layout
 * Consistent spacing system based on 4px grid
 */

export const spacing = {
  // Base spacing scale (4px grid system)
  space: {
    0: '0',           // 0px
    1: '0.25rem',     // 4px
    2: '0.5rem',      // 8px
    3: '0.75rem',     // 12px
    4: '1rem',        // 16px - Base unit
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  // Semantic spacing - Common use cases
  semantic: {
    // Component internal spacing
    component: {
      xs: '0.5rem',     // 8px - Tight internal padding
      sm: '0.75rem',    // 12px - Small internal padding
      md: '1rem',       // 16px - Standard internal padding
      lg: '1.5rem',     // 24px - Large internal padding
      xl: '2rem',       // 32px - Extra large internal padding
    },

    // Layout spacing
    layout: {
      xs: '1rem',       // 16px - Small section spacing
      sm: '1.5rem',     // 24px - Medium section spacing
      md: '2rem',       // 32px - Standard section spacing
      lg: '3rem',       // 48px - Large section spacing
      xl: '4rem',       // 64px - Extra large section spacing
      '2xl': '6rem',    // 96px - Hero section spacing
    },

    // Content spacing
    content: {
      xs: '0.5rem',     // 8px - Between related elements
      sm: '0.75rem',    // 12px - Between form elements
      md: '1rem',       // 16px - Between paragraphs
      lg: '1.5rem',     // 24px - Between sections
      xl: '2rem',       // 32px - Between major sections
    },

    // Stack spacing (vertical rhythm)
    stack: {
      xs: '0.25rem',    // 4px - Very tight stacking
      sm: '0.5rem',     // 8px - Tight stacking
      md: '0.75rem',    // 12px - Standard stacking
      lg: '1rem',       // 16px - Loose stacking
      xl: '1.5rem',     // 24px - Very loose stacking
    },
  },

  // Border radius - Minimal and consistent
  radius: {
    none: '0',
    xs: '0.125rem',   // 2px - Very subtle
    sm: '0.25rem',    // 4px - Subtle
    md: '0.375rem',   // 6px - Standard
    lg: '0.5rem',     // 8px - Rounded
    xl: '0.75rem',    // 12px - More rounded
    '2xl': '1rem',    // 16px - Very rounded
    '3xl': '1.5rem',  // 24px - Heavily rounded (rare)
    full: '9999px',   // Pills, circles
  },

  // Container sizes
  container: {
    xs: '20rem',      // 320px
    sm: '24rem',      // 384px
    md: '28rem',      // 448px
    lg: '32rem',      // 512px
    xl: '36rem',      // 576px
    '2xl': '42rem',   // 672px
    '3xl': '48rem',   // 768px
    '4xl': '56rem',   // 896px
    '5xl': '64rem',   // 1024px
    '6xl': '72rem',   // 1152px
    '7xl': '80rem',   // 1280px
    full: '100%',
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type Spacing = typeof spacing;





















