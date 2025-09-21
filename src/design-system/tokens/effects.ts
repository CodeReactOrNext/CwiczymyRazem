/**
 * Design Tokens - Effects (Shadows, Borders, etc.)
 * Minimal and purposeful visual effects
 */

export const effects = {
  // Box shadows - Subtle elevation system
  shadow: {
    none: 'none',
    
    // Subtle shadows for minimal design
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',                    // Very subtle
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',  // Subtle
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // Standard
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // Elevated
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // High elevation
    
    // Dark theme optimized shadows
    dark: {
      xs: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
    },

    // Colored shadows for accents (very subtle)
    accent: {
      primary: '0 4px 6px -1px rgb(34 211 238 / 0.1), 0 2px 4px -2px rgb(34 211 238 / 0.1)',
      secondary: '0 4px 6px -1px rgb(16 185 129 / 0.1), 0 2px 4px -2px rgb(16 185 129 / 0.1)',
      warning: '0 4px 6px -1px rgb(245 158 11 / 0.1), 0 2px 4px -2px rgb(245 158 11 / 0.1)',
      error: '0 4px 6px -1px rgb(239 68 68 / 0.1), 0 2px 4px -2px rgb(239 68 68 / 0.1)',
    },
  },

  // Inner shadows
  inset: {
    none: 'none',
    sm: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
    lg: 'inset 0 4px 6px 0 rgb(0 0 0 / 0.07)',
  },

  // Borders - Clean and minimal
  border: {
    width: {
      0: '0px',
      1: '1px',       // Standard border
      2: '2px',       // Thick border (rare)
      4: '4px',       // Very thick (rare)
    },
    
    style: {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      none: 'none',
    },

    // Semantic border colors (from colors.ts)
    color: {
      primary: '#334155',     // Main borders
      secondary: '#475569',   // Secondary borders  
      accent: '#22D3EE',      // Accent borders
      subtle: '#64748B33',    // Very subtle borders
      success: '#10B981',
      warning: '#F59E0B', 
      error: '#EF4444',
    },
  },

  // Backdrop effects
  backdrop: {
    none: 'none',
    blur: {
      xs: 'blur(2px)',
      sm: 'blur(4px)',
      md: 'blur(8px)',      // Standard backdrop
      lg: 'blur(12px)',
      xl: 'blur(16px)',
    },
    brightness: {
      50: 'brightness(0.5)',
      75: 'brightness(0.75)',
      90: 'brightness(0.9)',
      100: 'brightness(1)',
      110: 'brightness(1.1)',
      125: 'brightness(1.25)',
    },
    contrast: {
      50: 'contrast(0.5)',
      75: 'contrast(0.75)',
      100: 'contrast(1)',
      125: 'contrast(1.25)',
      150: 'contrast(1.5)',
    },
  },

  // Gradients - Very subtle accent gradients
  gradient: {
    // Background gradients
    background: {
      primary: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      secondary: 'linear-gradient(180deg, #1E293B 0%, #334155 100%)',
    },

    // Accent gradients (very subtle)
    accent: {
      primary: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)',
      secondary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    },

    // Overlay gradients
    overlay: {
      dark: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
      light: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%)',
    },

    // Subtle accent overlays
    accentOverlay: {
      primary: 'linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(8, 145, 178, 0.1) 100%)',
      secondary: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.1) 100%)',
    },
  },

  // Focus rings - Accessibility
  focus: {
    ring: {
      width: '2px',
      style: 'solid', 
      color: '#22D3EE',
      offset: '2px',
    },
    outline: {
      style: 'none', // Remove default outline
    },
  },

  // Dividers
  divider: {
    horizontal: {
      height: '1px',
      background: '#334155',
    },
    vertical: {
      width: '1px', 
      background: '#334155',
    },
  },
} as const;

export type Effects = typeof effects;



