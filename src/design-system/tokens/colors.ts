/**
 * Design Tokens - Colors
 * Minimalistic Dark Theme inspired by Discord, OpenAI, Grok, Apple
 */

export const colors = {
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray Scale - Primary neutral colors
  gray: {
    50: '#FAFAFA',   // Almost white
    100: '#F5F5F5',  // Very light gray
    200: '#EEEEEE',  // Light gray
    300: '#E0E0E0',  // Medium light gray
    400: '#BDBDBD',  // Medium gray
    500: '#9E9E9E',  // Base gray
    600: '#757575',  // Dark gray
    700: '#616161',  // Darker gray
    800: '#424242',  // Very dark gray
    900: '#212121',  // Almost black
  },

  // Dark Theme Primary Scale
  dark: {
    50: '#F8FAFC',   // Lightest (for text on dark)
    100: '#F1F5F9',  // Very light
    200: '#E2E8F0',  // Light
    300: '#CBD5E1',  // Medium light
    400: '#94A3B8',  // Medium
    500: '#64748B',  // Base
    600: '#475569',  // Dark
    700: '#334155',  // Darker
    800: '#1E293B',  // Very dark
    900: '#0F172A',  // Darkest (main bg)
    950: '#020617',  // Ultra dark
  },

  // Accent Colors - Minimal and subtle
  accent: {
    // Primary - Cyan (like current)
    primary: {
      50: '#ECFEFF',
      100: '#CFFAFE', 
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',  // Main accent
      500: '#06B6D4',
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
    },
    
    // Secondary - Emerald (for success/positive)
    secondary: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',  // Main secondary
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },

    // Warning - Amber
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',  // Main warning
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },

    // Error - Red
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',  // Main error
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
  },

  // Semantic Colors - Dark Theme
  semantic: {
    // Backgrounds
    background: {
      primary: '#0F172A',      // Main app background (dark.900)
      secondary: '#1E293B',    // Card/panel background (dark.800)
      tertiary: '#334155',     // Elevated elements (dark.700)
      overlay: '#000000CC',    // Modal overlays
    },

    // Surfaces
    surface: {
      base: '#1E293B',         // Base surface
      elevated: '#334155',     // Hover/focus states
      pressed: '#475569',      // Active states
      disabled: '#64748B',     // Disabled elements
    },

    // Borders
    border: {
      primary: '#334155',      // Main borders
      secondary: '#475569',    // Secondary borders
      accent: '#22D3EE',       // Accent borders
      subtle: '#64748B33',     // Very subtle borders (20% opacity)
    },

    // Text
    text: {
      primary: '#F8FAFC',      // Main text (dark.50)
      secondary: '#CBD5E1',    // Secondary text (dark.300)
      tertiary: '#94A3B8',     // Tertiary text (dark.400)
      disabled: '#64748B',     // Disabled text (dark.500)
      inverse: '#0F172A',      // Text on light backgrounds
      accent: '#22D3EE',       // Accent text
    },

    // States
    state: {
      success: '#10B981',      // Success states
      warning: '#F59E0B',      // Warning states
      error: '#EF4444',        // Error states
      info: '#22D3EE',         // Info states
    },
  },
} as const;

export type Colors = typeof colors;

