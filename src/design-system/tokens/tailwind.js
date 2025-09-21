/**
 * Design Tokens for Tailwind CSS
 * Export design tokens in Tailwind-compatible format
 */

// Import design tokens (CommonJS for Tailwind config)
const {
  designTokens
} = require('./index.ts');

/**
 * Transform nested object to flat object with dash-separated keys
 */
function flattenObject(obj, prefix = '', separator = '-') {
  const flattened = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}${separator}${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey, separator));
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}

/**
 * Export colors for Tailwind
 */
const tailwindColors = {
  // Keep Tailwind defaults
  transparent: 'transparent',
  current: 'currentColor',
  inherit: 'inherit',

  // Our design tokens
  white: designTokens.colors.white,
  black: designTokens.colors.black,

  // Flatten nested color objects
  ...flattenObject(designTokens.colors.gray, 'gray'),
  ...flattenObject(designTokens.colors.dark, 'dark'),
  ...flattenObject(designTokens.colors.accent.primary, 'primary'),
  ...flattenObject(designTokens.colors.accent.secondary, 'secondary'),
  ...flattenObject(designTokens.colors.accent.warning, 'warning'),
  ...flattenObject(designTokens.colors.accent.error, 'error'),

  // Semantic colors (flat structure for easy access)
  'bg-primary': designTokens.colors.semantic.background.primary,
  'bg-secondary': designTokens.colors.semantic.background.secondary,
  'bg-tertiary': designTokens.colors.semantic.background.tertiary,
  'bg-overlay': designTokens.colors.semantic.background.overlay,

  ...flattenObject(designTokens.colors.semantic.surface, 'surface'),
  ...flattenObject(designTokens.colors.semantic.border, 'border'),
  ...flattenObject(designTokens.colors.semantic.text, 'text'),
  ...flattenObject(designTokens.colors.semantic.state, 'state'),
};

/**
 * Export spacing for Tailwind
 */
const tailwindSpacing = {
  ...designTokens.spacing.space,

  // Semantic spacing with custom keys
  'component-xs': designTokens.spacing.semantic.component.xs,
  'component-sm': designTokens.spacing.semantic.component.sm,
  'component-md': designTokens.spacing.semantic.component.md,
  'component-lg': designTokens.spacing.semantic.component.lg,
  'component-xl': designTokens.spacing.semantic.component.xl,

  'layout-xs': designTokens.spacing.semantic.layout.xs,
  'layout-sm': designTokens.spacing.semantic.layout.sm,
  'layout-md': designTokens.spacing.semantic.layout.md,
  'layout-lg': designTokens.spacing.semantic.layout.lg,
  'layout-xl': designTokens.spacing.semantic.layout.xl,
  'layout-2xl': designTokens.spacing.semantic.layout['2xl'],

  'content-xs': designTokens.spacing.semantic.content.xs,
  'content-sm': designTokens.spacing.semantic.content.sm,
  'content-md': designTokens.spacing.semantic.content.md,
  'content-lg': designTokens.spacing.semantic.content.lg,
  'content-xl': designTokens.spacing.semantic.content.xl,

  'stack-xs': designTokens.spacing.semantic.stack.xs,
  'stack-sm': designTokens.spacing.semantic.stack.sm,
  'stack-md': designTokens.spacing.semantic.stack.md,
  'stack-lg': designTokens.spacing.semantic.stack.lg,
  'stack-xl': designTokens.spacing.semantic.stack.xl,
};

/**
 * Export typography for Tailwind
 */
const tailwindTypography = {
  fontFamily: designTokens.typography.fontFamily,
  fontSize: designTokens.typography.fontSize,
  fontWeight: designTokens.typography.fontWeight,
  lineHeight: designTokens.typography.lineHeight,
  letterSpacing: designTokens.typography.letterSpacing,
};

/**
 * Export effects for Tailwind
 */
const tailwindEffects = {
  boxShadow: {
    ...designTokens.effects.shadow,
    // Flatten dark shadows
    ...flattenObject(designTokens.effects.shadow.dark, 'dark'),
    // Flatten accent shadows
    ...flattenObject(designTokens.effects.shadow.accent, 'accent'),
  },

  backdropBlur: designTokens.effects.backdrop.blur,
  backdropBrightness: designTokens.effects.backdrop.brightness,
  backdropContrast: designTokens.effects.backdrop.contrast,

  backgroundImage: {
    // Gradients
    'gradient-primary': designTokens.effects.gradient.background.primary,
    'gradient-secondary': designTokens.effects.gradient.background.secondary,

    // Accent gradients
    ...flattenObject(designTokens.effects.gradient.accent, 'accent'),

    // Overlay gradients
    ...flattenObject(designTokens.effects.gradient.overlay, 'overlay'),

    // Accent overlays
    ...flattenObject(designTokens.effects.gradient.accentOverlay, 'accent-overlay'),
  },
};

/**
 * Export animation for Tailwind
 */
const tailwindAnimation = {
  transitionDuration: designTokens.animation.duration,
  transitionTimingFunction: designTokens.animation.easing,

  keyframes: designTokens.animation.keyframes,

  animation: {
    // Convert presets to Tailwind format
    'fade-in': `fadeIn ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
    'fade-out': `fadeOut ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
    'slide-in-up': `slideInUp ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
    'slide-in-down': `slideInDown ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
    'scale-in': `scaleIn ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
    'pulse-loading': `pulse ${designTokens.animation.duration.slower} ease-in-out infinite`,
    'spin-loading': `spin 1000ms linear infinite`,
  },
};

/**
 * Complete Tailwind theme object
 */
const tailwindTheme = {
  // Screens (breakpoints)
  screens: designTokens.spacing.breakpoints,

  // Colors
  colors: tailwindColors,

  // Typography
  ...tailwindTypography,

  // Spacing
  spacing: tailwindSpacing,
  borderRadius: designTokens.spacing.radius,

  // Container
  container: designTokens.spacing.container,

  // Effects
  ...tailwindEffects,

  // Animation
  ...tailwindAnimation,
};

/**
 * Utility classes for common design patterns
 */
const utilityClasses = {
  // Typography utilities
  '.text-display-large': designTokens.typography.textStyles.display.large,
  '.text-display-medium': designTokens.typography.textStyles.display.medium,
  '.text-display-small': designTokens.typography.textStyles.display.small,

  '.text-h1': designTokens.typography.textStyles.heading.h1,
  '.text-h2': designTokens.typography.textStyles.heading.h2,
  '.text-h3': designTokens.typography.textStyles.heading.h3,
  '.text-h4': designTokens.typography.textStyles.heading.h4,
  '.text-h5': designTokens.typography.textStyles.heading.h5,
  '.text-h6': designTokens.typography.textStyles.heading.h6,

  '.text-body-large': designTokens.typography.textStyles.body.large,
  '.text-body-medium': designTokens.typography.textStyles.body.medium,
  '.text-body-small': designTokens.typography.textStyles.body.small,

  '.text-label-large': designTokens.typography.textStyles.label.large,
  '.text-label-medium': designTokens.typography.textStyles.label.medium,
  '.text-label-small': designTokens.typography.textStyles.label.small,

  // Transition utilities
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
  '.hover-lift:hover': {
    transform: designTokens.animation.transform.hoverLift,
    transitionProperty: 'transform',
    transitionDuration: designTokens.animation.duration.fast,
    transitionTimingFunction: designTokens.animation.easing.easeOut,
  },
  '.hover-scale:hover': {
    transform: designTokens.animation.transform.scaleUp,
    transitionProperty: 'transform',
    transitionDuration: designTokens.animation.duration.fast,
    transitionTimingFunction: designTokens.animation.easing.easeOut,
  },
};

/**
 * Component base styles
 */
const componentStyles = {
  '.card': {
    backgroundColor: designTokens.colors.semantic.surface.base,
    border: `1px solid ${designTokens.colors.semantic.border.primary}`,
    borderRadius: designTokens.spacing.radius.lg,
    padding: designTokens.spacing.semantic.component.md,
    boxShadow: designTokens.effects.shadow.dark.md,
    backdropFilter: 'blur(12px)',
    transition: `all ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeOut}`,
  },

  '.card:hover': {
    backgroundColor: designTokens.colors.semantic.surface.elevated,
    borderColor: designTokens.colors.semantic.border.accent,
    boxShadow: designTokens.effects.shadow.accent.primary,
  },

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
  },

  '.btn:disabled': {
    opacity: '0.5',
    cursor: 'not-allowed',
  },

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
  },

  '.input::placeholder': {
    color: designTokens.colors.semantic.text.tertiary,
  },

  '.input:focus': {
    outline: 'none',
    borderColor: designTokens.colors.semantic.border.accent,
    boxShadow: `0 0 0 2px ${designTokens.colors.semantic.border.accent}33`,
  },
};

module.exports = {
  tailwindTheme,
  tailwindColors,
  tailwindSpacing,
  tailwindTypography,
  tailwindEffects,
  tailwindAnimation,
  utilityClasses,
  componentStyles,
  flattenObject,
};



