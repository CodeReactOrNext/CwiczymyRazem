/**
 * Design System - Token Utilities
 * Helper functions for working with design tokens
 */

import { designTokens, theme } from '../tokens';

/**
 * Get a color value from the design tokens
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '#000000';
}

/**
 * Get a spacing value from the design tokens
 */
export function getSpacing(key: keyof typeof designTokens.spacing.space): string {
  return designTokens.spacing.space[key];
}

/**
 * Get a typography value from the design tokens
 */
export function getTypography(category: string, variant: string) {
  const typography = designTokens.typography.textStyles;
  return typography[category as keyof typeof typography]?.[variant as any];
}

/**
 * Create a CSS transition string
 */
export function createTransition(
  property: string = 'all',
  duration: keyof typeof designTokens.animation.duration = 'normal',
  easing: keyof typeof designTokens.animation.easing = 'easeOut'
): string {
  return `${property} ${designTokens.animation.duration[duration]} ${designTokens.animation.easing[easing]}`;
}

/**
 * Create a box shadow string
 */
export function createShadow(
  size: keyof typeof designTokens.effects.shadow = 'md',
  isDark: boolean = true
): string {
  if (isDark && designTokens.effects.shadow.dark[size as keyof typeof designTokens.effects.shadow.dark]) {
    return designTokens.effects.shadow.dark[size as keyof typeof designTokens.effects.shadow.dark];
  }
  return designTokens.effects.shadow[size];
}

/**
 * Create a border string
 */
export function createBorder(
  width: keyof typeof designTokens.effects.border.width = '1',
  style: keyof typeof designTokens.effects.border.style = 'solid',
  color: string = theme.color.border.primary
): string {
  return `${designTokens.effects.border.width[width]} ${designTokens.effects.border.style[style]} ${color}`;
}

/**
 * Generate responsive breakpoint media queries
 */
export function breakpoint(size: keyof typeof designTokens.spacing.breakpoints): string {
  return `@media (min-width: ${designTokens.spacing.breakpoints[size]})`;
}

/**
 * Generate CSS custom properties from design tokens
 */
export function generateCSSVariables(): Record<string, string> {
  const variables: Record<string, string> = {};
  
  // Colors
  Object.entries(theme.color).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        variables[`--color-${category}-${key}`] = value;
      });
    } else {
      variables[`--color-${category}`] = values;
    }
  });
  
  // Spacing
  Object.entries(theme.space).forEach(([key, value]) => {
    variables[`--space-${key}`] = value;
  });
  
  // Typography
  Object.entries(theme.text).forEach(([key, value]) => {
    variables[`--text-${key}`] = value;
  });
  
  // Radius
  Object.entries(theme.radius).forEach(([key, value]) => {
    variables[`--radius-${key}`] = value;
  });
  
  // Shadows
  Object.entries(theme.shadow).forEach(([key, value]) => {
    variables[`--shadow-${key}`] = value;
  });
  
  return variables;
}

/**
 * Type-safe token access
 */
export const tokens = {
  color: (path: string) => getColor(path),
  space: (key: keyof typeof designTokens.spacing.space) => getSpacing(key),
  typography: (category: string, variant: string) => getTypography(category, variant),
  transition: (property?: string, duration?: keyof typeof designTokens.animation.duration, easing?: keyof typeof designTokens.animation.easing) => 
    createTransition(property, duration, easing),
  shadow: (size?: keyof typeof designTokens.effects.shadow, isDark?: boolean) => 
    createShadow(size, isDark),
  border: (width?: keyof typeof designTokens.effects.border.width, style?: keyof typeof designTokens.effects.border.style, color?: string) => 
    createBorder(width, style, color),
  breakpoint: (size: keyof typeof designTokens.spacing.breakpoints) => breakpoint(size),
} as const;





