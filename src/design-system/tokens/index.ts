/**
 * Design System - Design Tokens
 * Centralized design tokens for consistent, minimal design
 */

export { type Animation,animation } from './animation';
export { type Colors,colors } from './colors';
export { type Effects,effects } from './effects';
export { type Spacing,spacing } from './spacing';
export { type Typography,typography } from './typography';

// Combined design tokens
export const designTokens = {
  colors,
  typography,
  spacing,
  animation,
  effects,
} as const;

export type DesignTokens = typeof designTokens;

// Theme configuration
export const theme = {
  // Current theme mode
  mode: 'dark' as const,
  
  // Quick access to commonly used tokens
  color: {
    // Backgrounds
    bg: {
      primary: '#0d0d0c',
      secondary: '#141414', 
      tertiary: '#334155',
    },
    
    // Text
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
    },
    
    // Borders
    border: {
      primary: '#334155',
      subtle: '#64748B33',
    },
    
    // Accent
    accent: {
      primary: '#22D3EE',
      secondary: '#10B981',
    },
  },
  
  // Quick access to spacing
  space: {
    xs: '0.5rem',
    sm: '0.75rem', 
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  
  // Quick access to typography
  text: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  
  // Quick access to radius
  radius: {
    sm: '0.25rem',
    md: '0.375rem', 
    lg: '0.5rem',
  },
  
  // Quick access to shadows
  shadow: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
} as const;

export type Theme = typeof theme;























