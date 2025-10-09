/**
 * Design Tokens - Animation
 * Minimal, fast, purposeful animations
 */

export const animation = {
  // Duration - Fast and snappy
  duration: {
    instant: '0ms',       // No animation
    fast: '100ms',        // Very quick interactions
    normal: '200ms',      // Standard interactions
    slow: '300ms',        // Slower transitions
    slower: '500ms',      // Only for complex transitions
  },

  // Easing curves - Natural feeling
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',           // Slow start
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',          // Slow end (recommended for UI)
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Slow start and end
    
    // Custom curves for specific use cases
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Subtle bounce
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',             // Sharp transition
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',   // Very smooth
  },

  // Transition presets - Common combinations
  transition: {
    // Basic transitions
    fast: {
      duration: '100ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
    normal: {
      duration: '200ms', 
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
    slow: {
      duration: '300ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },

    // Specific use cases
    hover: {
      duration: '100ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      property: 'all',
    },
    focus: {
      duration: '100ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      property: 'all',
    },
    modal: {
      duration: '200ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      property: 'all',
    },
    tooltip: {
      duration: '100ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      property: 'opacity, transform',
    },
  },

  // Transform values - Common transforms
  transform: {
    // Scale
    scaleUp: 'scale(1.02)',      // Subtle hover effect
    scaleDown: 'scale(0.98)',    // Subtle press effect
    scaleNone: 'scale(1)',       // Reset

    // Translate
    slideUp: 'translateY(-0.25rem)',     // 4px up
    slideDown: 'translateY(0.25rem)',    // 4px down  
    slideLeft: 'translateX(-0.25rem)',   // 4px left
    slideRight: 'translateX(0.25rem)',   // 4px right
    slideNone: 'translate(0)',           // Reset

    // Rotate
    rotateSlightly: 'rotate(1deg)',      // Subtle rotation
    rotateNone: 'rotate(0)',             // Reset

    // Combinations
    hoverLift: 'translateY(-0.125rem) scale(1.01)',  // Subtle lift + scale
    pressDown: 'translateY(0.125rem) scale(0.99)',   // Subtle press effect
  },

  // Opacity values
  opacity: {
    hidden: '0',
    faint: '0.1',
    subtle: '0.2', 
    light: '0.4',
    medium: '0.6',
    strong: '0.8',
    visible: '1',
  },

  // Animation keyframes - Minimal set
  keyframes: {
    // Fade animations
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },

    // Slide animations
    slideInUp: {
      from: { 
        opacity: '0', 
        transform: 'translateY(0.5rem)' 
      },
      to: { 
        opacity: '1', 
        transform: 'translateY(0)' 
      },
    },
    slideInDown: {
      from: { 
        opacity: '0', 
        transform: 'translateY(-0.5rem)' 
      },
      to: { 
        opacity: '1', 
        transform: 'translateY(0)' 
      },
    },

    // Scale animations
    scaleIn: {
      from: { 
        opacity: '0', 
        transform: 'scale(0.95)' 
      },
      to: { 
        opacity: '1', 
        transform: 'scale(1)' 
      },
    },

    // Pulse for loading states
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },

    // Subtle spin for loading
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  },

  // Predefined animations - Ready to use
  presets: {
    // Hover effects
    buttonHover: {
      duration: '100ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      transform: 'translateY(-0.125rem)',
    },
    
    // Focus effects  
    inputFocus: {
      duration: '100ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      property: 'border-color, box-shadow',
    },

    // Modal/dialog
    modalEnter: {
      duration: '200ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      keyframes: 'scaleIn',
    },

    // Tooltip
    tooltipEnter: {
      duration: '100ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      keyframes: 'fadeIn',
    },

    // Loading
    loading: {
      duration: '1000ms',
      easing: 'ease-in-out',
      keyframes: 'pulse',
      iterationCount: 'infinite',
    },
  },
} as const;

export type Animation = typeof animation;















