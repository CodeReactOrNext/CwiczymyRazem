const defaultTheme = require("tailwindcss/defaultTheme");
const plugin = require("tailwindcss/plugin");

// Import our design tokens
const {
  designTokens
} = require('./src/design-system/tokens');

/** @type {import('tailwindcss').Config} */

// Custom plugins (keeping useful ones from old config)
const scrollbarHide = plugin(function ({
  addUtilities
}) {
  addUtilities({
    ".scrollbar-hide": {
      "-ms-overflow-style": "none",
      "scrollbar-width": "none",
      "&::-webkit-scrollbar": {
        display: "none",
      },
    },
    ".scrollbar-default": {
      "-ms-overflow-style": "auto",
      "scrollbar-width": "auto",
      "&::-webkit-scrollbar": {
        display: "block",
      },
    },
  }, ["responsive"]);
});

// Transform design tokens to Tailwind format
function transformColors(colors) {
  const result = {};

  function traverse(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}-${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, newKey);
      } else {
        result[newKey] = value;
      }
    }
  }

  traverse(colors);
  return result;
}

module.exports = {
  content: [
    "src/pages/**/*.{js,ts,jsx,tsx}",
    "src/feature/**/*.{js,ts,jsx,tsx}",
    "src/components/**/*.{js,ts,jsx,tsx}",
    "src/layouts/**/*.{js,ts,jsx,tsx}",
    "src/design-system/**/*.{js,ts,jsx,tsx}",
    './src/**/*.{ts,tsx}',
  ],

  // Dark mode configuration
  darkMode: 'class',

  theme: {
    // Override default screens with our breakpoints
    screens: {
      xs: designTokens.spacing.breakpoints.xs,
      sm: designTokens.spacing.breakpoints.sm,
      md: designTokens.spacing.breakpoints.md,
      lg: designTokens.spacing.breakpoints.lg,
      xl: designTokens.spacing.breakpoints.xl,
      '2xl': designTokens.spacing.breakpoints['2xl'],
    },

    // Core theme using our design tokens
    colors: {
      // Keep essential defaults
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      // Our design token colors
      white: designTokens.colors.white,
      black: designTokens.colors.black,

      // Gray scale
      gray: designTokens.colors.gray,

      // Dark theme colors (main palette)
      dark: designTokens.colors.dark,

      // Accent colors
      primary: designTokens.colors.accent.primary,
      secondary: designTokens.colors.accent.secondary,
      warning: designTokens.colors.accent.warning,
      error: designTokens.colors.accent.error,

      // Semantic colors for easy access
      bg: {
        primary: designTokens.colors.semantic.background.primary,
        secondary: designTokens.colors.semantic.background.secondary,
        tertiary: designTokens.colors.semantic.background.tertiary,
        overlay: designTokens.colors.semantic.background.overlay,
      },

      surface: designTokens.colors.semantic.surface,

      border: {
        primary: designTokens.colors.semantic.border.primary,
        secondary: designTokens.colors.semantic.border.secondary,
        accent: designTokens.colors.semantic.border.accent,
        subtle: designTokens.colors.semantic.border.subtle,
      },

      text: {
        primary: designTokens.colors.semantic.text.primary,
        secondary: designTokens.colors.semantic.text.secondary,
        tertiary: designTokens.colors.semantic.text.tertiary,
        disabled: designTokens.colors.semantic.text.disabled,
        inverse: designTokens.colors.semantic.text.inverse,
        accent: designTokens.colors.semantic.text.accent,
      },

      state: designTokens.colors.semantic.state,
    },

    // Typography from design tokens
    fontFamily: {
      sans: designTokens.typography.fontFamily.sans,
      mono: designTokens.typography.fontFamily.mono,
    },

    fontSize: designTokens.typography.fontSize,
    fontWeight: designTokens.typography.fontWeight,
    lineHeight: designTokens.typography.lineHeight,
    letterSpacing: designTokens.typography.letterSpacing,

    // Spacing from design tokens
    spacing: designTokens.spacing.space,

    // Border radius from design tokens
    borderRadius: designTokens.spacing.radius,

    // Container sizes
    container: designTokens.spacing.container,

    // Animation from design tokens
    transitionDuration: designTokens.animation.duration,
    transitionTimingFunction: designTokens.animation.easing,

    // Box shadows from design tokens
    boxShadow: {
      ...designTokens.effects.shadow,
      // Dark theme shadows
      'dark-xs': designTokens.effects.shadow.dark.xs,
      'dark-sm': designTokens.effects.shadow.dark.sm,
      'dark-md': designTokens.effects.shadow.dark.md,
      'dark-lg': designTokens.effects.shadow.dark.lg,
      'dark-xl': designTokens.effects.shadow.dark.xl,
      // Accent shadows
      'accent-primary': designTokens.effects.shadow.accent.primary,
      'accent-secondary': designTokens.effects.shadow.accent.secondary,
      'accent-warning': designTokens.effects.shadow.accent.warning,
      'accent-error': designTokens.effects.shadow.accent.error,
    },

    // Background images/gradients
    backgroundImage: {
      // Gradient backgrounds
      'gradient-primary': designTokens.effects.gradient.background.primary,
      'gradient-secondary': designTokens.effects.gradient.background.secondary,

      // Accent gradients
      'accent-primary': designTokens.effects.gradient.accent.primary,
      'accent-secondary': designTokens.effects.gradient.accent.secondary,
      'accent-warning': designTokens.effects.gradient.accent.warning,
      'accent-error': designTokens.effects.gradient.accent.error,

      // Overlay gradients
      'overlay-dark': designTokens.effects.gradient.overlay.dark,
      'overlay-light': designTokens.effects.gradient.overlay.light,

      // Accent overlays
      'accent-overlay-primary': designTokens.effects.gradient.accentOverlay.primary,
      'accent-overlay-secondary': designTokens.effects.gradient.accentOverlay.secondary,
    },

    extend: {
      // Animation keyframes from design tokens
      keyframes: designTokens.animation.keyframes,

      animation: {
        // Our design token animations
        'fade-in': `fadeIn ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
        'fade-out': `fadeOut ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
        'slide-in-up': `slideInUp ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
        'slide-in-down': `slideInDown ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
        'scale-in': `scaleIn ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
        'pulse-loading': `pulse ${designTokens.animation.duration.slower} ease-in-out infinite`,
        'spin-loading': `spin 1000ms linear infinite`,

        // Keep useful existing animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },

      // Backdrop filters
      backdropBlur: designTokens.effects.backdrop.blur,
      backdropBrightness: designTokens.effects.backdrop.brightness,
      backdropContrast: designTokens.effects.backdrop.contrast,

      // Custom utilities will be added via plugins
    },
  },

  plugins: [
    // Custom scrollbar utilities
    scrollbarHide,

    // Design system utilities plugin
    plugin(function ({
      addUtilities,
      addComponents,
      theme
    }) {
      // Add semantic spacing utilities
      addUtilities({
        // Component spacing
        '.space-component-xs': {
          padding: designTokens.spacing.semantic.component.xs
        },
        '.space-component-sm': {
          padding: designTokens.spacing.semantic.component.sm
        },
        '.space-component-md': {
          padding: designTokens.spacing.semantic.component.md
        },
        '.space-component-lg': {
          padding: designTokens.spacing.semantic.component.lg
        },
        '.space-component-xl': {
          padding: designTokens.spacing.semantic.component.xl
        },

        // Layout spacing
        '.space-layout-xs': {
          padding: designTokens.spacing.semantic.layout.xs
        },
        '.space-layout-sm': {
          padding: designTokens.spacing.semantic.layout.sm
        },
        '.space-layout-md': {
          padding: designTokens.spacing.semantic.layout.md
        },
        '.space-layout-lg': {
          padding: designTokens.spacing.semantic.layout.lg
        },
        '.space-layout-xl': {
          padding: designTokens.spacing.semantic.layout.xl
        },
        '.space-layout-2xl': {
          padding: designTokens.spacing.semantic.layout['2xl']
        },

        // Stack spacing (gap)
        '.stack-xs': {
          gap: designTokens.spacing.semantic.stack.xs
        },
        '.stack-sm': {
          gap: designTokens.spacing.semantic.stack.sm
        },
        '.stack-md': {
          gap: designTokens.spacing.semantic.stack.md
        },
        '.stack-lg': {
          gap: designTokens.spacing.semantic.stack.lg
        },
        '.stack-xl': {
          gap: designTokens.spacing.semantic.stack.xl
        },
      });

      // Add typography utilities
      addUtilities({
        // Display text styles
        '.text-display-large': {
          fontSize: designTokens.typography.textStyles.display.large.fontSize,
          fontWeight: designTokens.typography.textStyles.display.large.fontWeight,
          lineHeight: designTokens.typography.textStyles.display.large.lineHeight,
          letterSpacing: designTokens.typography.textStyles.display.large.letterSpacing,
        },
        '.text-display-medium': {
          fontSize: designTokens.typography.textStyles.display.medium.fontSize,
          fontWeight: designTokens.typography.textStyles.display.medium.fontWeight,
          lineHeight: designTokens.typography.textStyles.display.medium.lineHeight,
          letterSpacing: designTokens.typography.textStyles.display.medium.letterSpacing,
        },
        '.text-display-small': {
          fontSize: designTokens.typography.textStyles.display.small.fontSize,
          fontWeight: designTokens.typography.textStyles.display.small.fontWeight,
          lineHeight: designTokens.typography.textStyles.display.small.lineHeight,
          letterSpacing: designTokens.typography.textStyles.display.small.letterSpacing,
        },

        // Heading styles
        '.text-h1': {
          fontSize: designTokens.typography.textStyles.heading.h1.fontSize,
          fontWeight: designTokens.typography.textStyles.heading.h1.fontWeight,
          lineHeight: designTokens.typography.textStyles.heading.h1.lineHeight,
          letterSpacing: designTokens.typography.textStyles.heading.h1.letterSpacing,
        },
        '.text-h2': {
          fontSize: designTokens.typography.textStyles.heading.h2.fontSize,
          fontWeight: designTokens.typography.textStyles.heading.h2.fontWeight,
          lineHeight: designTokens.typography.textStyles.heading.h2.lineHeight,
          letterSpacing: designTokens.typography.textStyles.heading.h2.letterSpacing,
        },
        '.text-h3': {
          fontSize: designTokens.typography.textStyles.heading.h3.fontSize,
          fontWeight: designTokens.typography.textStyles.heading.h3.fontWeight,
          lineHeight: designTokens.typography.textStyles.heading.h3.lineHeight,
          letterSpacing: designTokens.typography.textStyles.heading.h3.letterSpacing,
        },
        '.text-h4': {
          fontSize: designTokens.typography.textStyles.heading.h4.fontSize,
          fontWeight: designTokens.typography.textStyles.heading.h4.fontWeight,
          lineHeight: designTokens.typography.textStyles.heading.h4.lineHeight,
          letterSpacing: designTokens.typography.textStyles.heading.h4.letterSpacing,
        },
        '.text-h5': {
          fontSize: designTokens.typography.textStyles.heading.h5.fontSize,
          fontWeight: designTokens.typography.textStyles.heading.h5.fontWeight,
          lineHeight: designTokens.typography.textStyles.heading.h5.lineHeight,
          letterSpacing: designTokens.typography.textStyles.heading.h5.letterSpacing,
        },
        '.text-h6': {
          fontSize: designTokens.typography.textStyles.heading.h6.fontSize,
          fontWeight: designTokens.typography.textStyles.heading.h6.fontWeight,
          lineHeight: designTokens.typography.textStyles.heading.h6.lineHeight,
          letterSpacing: designTokens.typography.textStyles.heading.h6.letterSpacing,
        },

        // Body text styles
        '.text-body-large': {
          fontSize: designTokens.typography.textStyles.body.large.fontSize,
          fontWeight: designTokens.typography.textStyles.body.large.fontWeight,
          lineHeight: designTokens.typography.textStyles.body.large.lineHeight,
          letterSpacing: designTokens.typography.textStyles.body.large.letterSpacing,
        },
        '.text-body-medium': {
          fontSize: designTokens.typography.textStyles.body.medium.fontSize,
          fontWeight: designTokens.typography.textStyles.body.medium.fontWeight,
          lineHeight: designTokens.typography.textStyles.body.medium.lineHeight,
          letterSpacing: designTokens.typography.textStyles.body.medium.letterSpacing,
        },
        '.text-body-small': {
          fontSize: designTokens.typography.textStyles.body.small.fontSize,
          fontWeight: designTokens.typography.textStyles.body.small.fontWeight,
          lineHeight: designTokens.typography.textStyles.body.small.lineHeight,
          letterSpacing: designTokens.typography.textStyles.body.small.letterSpacing,
        },

        // Label styles
        '.text-label-large': {
          fontSize: designTokens.typography.textStyles.label.large.fontSize,
          fontWeight: designTokens.typography.textStyles.label.large.fontWeight,
          lineHeight: designTokens.typography.textStyles.label.large.lineHeight,
          letterSpacing: designTokens.typography.textStyles.label.large.letterSpacing,
        },
        '.text-label-medium': {
          fontSize: designTokens.typography.textStyles.label.medium.fontSize,
          fontWeight: designTokens.typography.textStyles.label.medium.fontWeight,
          lineHeight: designTokens.typography.textStyles.label.medium.lineHeight,
          letterSpacing: designTokens.typography.textStyles.label.medium.letterSpacing,
        },
        '.text-label-small': {
          fontSize: designTokens.typography.textStyles.label.small.fontSize,
          fontWeight: designTokens.typography.textStyles.label.small.fontWeight,
          lineHeight: designTokens.typography.textStyles.label.small.lineHeight,
          letterSpacing: designTokens.typography.textStyles.label.small.letterSpacing,
        },
      });

      // Add transition utilities
      addUtilities({
        '.transition-fast': {
          transitionProperty: 'all',
          transitionDuration: designTokens.animation.duration.fast,
          transitionTimingFunction: designTokens.animation.easing.easeOut,
        },
        '.transition-normal': {
          transitionProperty: 'all',
          transitionDuration: designTokens.animation.duration.normal,
          transitionTimingFunction: designTokens.animation.easing.easeOut,
        },
        '.transition-slow': {
          transitionProperty: 'all',
          transitionDuration: designTokens.animation.duration.slow,
          transitionTimingFunction: designTokens.animation.easing.easeOut,
        },

        // Hover effects
        '.hover-lift': {
          '&:hover': {
            transform: designTokens.animation.transform.hoverLift,
            transitionProperty: 'transform',
            transitionDuration: designTokens.animation.duration.fast,
            transitionTimingFunction: designTokens.animation.easing.easeOut,
          }
        },
        '.hover-scale': {
          '&:hover': {
            transform: designTokens.animation.transform.scaleUp,
            transitionProperty: 'transform',
            transitionDuration: designTokens.animation.duration.fast,
            transitionTimingFunction: designTokens.animation.easing.easeOut,
          }
        },
      });

      // Add component base styles
      addComponents({
        // Card component
        '.card': {
          backgroundColor: designTokens.colors.semantic.surface.base,
          border: `1px solid ${designTokens.colors.semantic.border.primary}`,
          borderRadius: designTokens.spacing.radius.lg,
          padding: designTokens.spacing.semantic.component.md,
          boxShadow: designTokens.effects.shadow.dark.md,
          backdropFilter: 'blur(12px)',
          transition: `all ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,

          '&:hover': {
            backgroundColor: designTokens.colors.semantic.surface.elevated,
            borderColor: designTokens.colors.semantic.border.accent,
            boxShadow: designTokens.effects.shadow.accent.primary,
          }
        },

        // Button base
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: designTokens.spacing.space[2],
          padding: `${designTokens.spacing.space[3]} ${designTokens.spacing.space[6]}`,
          fontSize: designTokens.typography.fontSize.sm,
          fontWeight: designTokens.typography.fontWeight.medium,
          lineHeight: designTokens.typography.lineHeight.none,
          borderRadius: designTokens.spacing.radius.md,
          transition: `all ${designTokens.animation.duration.fast} ${designTokens.animation.easing.easeOut}`,
          cursor: 'pointer',

          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          }
        },

        // Input base
        '.input': {
          width: '100%',
          padding: `${designTokens.spacing.space[3]} ${designTokens.spacing.space[4]}`,
          fontSize: designTokens.typography.fontSize.sm,
          lineHeight: designTokens.typography.lineHeight.normal,
          backgroundColor: designTokens.colors.semantic.surface.base,
          border: `1px solid ${designTokens.colors.semantic.border.primary}`,
          borderRadius: designTokens.spacing.radius.md,
          color: designTokens.colors.semantic.text.primary,
          transition: `all ${designTokens.animation.duration.fast} ${designTokens.animation.easing.easeOut}`,

          '&::placeholder': {
            color: designTokens.colors.semantic.text.tertiary,
          },

          '&:focus': {
            outline: 'none',
            borderColor: designTokens.colors.semantic.border.accent,
            boxShadow: `0 0 0 2px ${designTokens.colors.semantic.border.accent}33`,
          }
        }
      });
    }),

    // Animation plugin
    require("tailwindcss-animate"),
  ],
};





















