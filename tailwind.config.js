const defaultTheme = require("tailwindcss/defaultTheme");
const plugin = require("tailwindcss/plugin");
/** @type {import('tailwindcss').Config} */

const rotateX = plugin(function ({
  addUtilities
}) {
  addUtilities({
    ".rotate-x-20": {
      transform: "rotateX(20deg)",
    },
    ".rotate-x-40": {
      transform: "rotateX(40deg)",
    },
    ".rotate-x-50": {
      transform: "rotateX(50deg)",
    },
    ".rotate-x-60": {
      transform: "rotateX(60deg)",
    },
    ".rotate-x-80": {
      transform: "rotateX(80deg)",
    },
  });
});
const rotateY = plugin(function ({
  addUtilities
}) {
  addUtilities({
    ".rotate-y-20": {
      transform: "rotateY(20deg)",
    },
    ".rotate-y-40": {
      transform: "rotateY(40deg)",
    },
    ".rotate-y-60": {
      transform: "rotateY(60deg)",
    },
    ".rotate-y-80": {
      transform: "rotateY(80deg)",
    },
  });
});

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
    }
  );
});

const defaultClick = plugin(function ({
  addUtilities
}) {
  addUtilities({
    ".click-behavior": {
      transform: "scale(98%)",
      transitionProperty: "transform",
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      transitionDuration: "100ms",
    },
    ".click-behavior-second": {
      transform: "scale(96%)",
    },
    ".transition-background": {
      transitionProperty: "background-color, border-color, box-shadow",
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      transitionDuration: "150ms",
    },
  });
});

const glassEffects = plugin(function ({ addUtilities }) {
  addUtilities({
    ".glass-card": {
      "background-color": "rgba(24, 24, 27, 0.4)",
    },
    ".glass-card-hover": {
      "background-color": "rgba(24, 24, 27, 0.5)",
    },
    ".blur-premium": {
      "backdrop-filter": "blur(16px) saturate(180%)",
    }
  });
});

const borderRadius = plugin(function ({
  addUtilities
}) {
  addUtilities({
    ".radius-default": {
      "border-radius": "12px",
    },
    ".radius-premium": {
      "border-radius": "16px",
    }
  });
});
module.exports = {
  content: [
    "src/pages/**/*.{js,ts,jsx,tsx}",
    "src/feature/**/*.{js,ts,jsx,tsx}",
    "src/components/**/*.{js,ts,jsx,tsx}",
    "src/layouts/**/*.{js,ts,jsx,tsx}",
    "src/design-system/**/*.{js,ts,jsx,tsx}",
    './src/**/*.{ts,tsx}',
  ],

  darkMode: 'class',

  theme: {
    screens: {
      xxs: '285px',
      xs: '350px',
      xsm: '500px',
      ...defaultTheme.screens
    },
    extend: {
      display: [
        'group-hover'
      ],
      dropShadow: {
        '3xl': '0 1px 3px rgba(0, 0, 0, 0.45)'
      },
      boxShadow: {
        'inset-cool': 'inset 0 -3px 8px -3px rgba(88, 96, 132,0.7)',
        'outside-cool': '0px 4px 4px 0px rgb(0 0 0 / 8%);',
        // Design system shadows
        'dark-xs': '0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'dark-sm': '0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)',
        'dark-md': '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
        'dark-lg': '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
        'dark-xl': '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
        'accent-primary': '0 0 20px rgb(34 211 238 / 0.3)',
        'accent-secondary': '0 0 20px rgb(16 185 129 / 0.3)',
      },
      gridTemplateRows: {
        '7': 'repeat(7, minmax(0, 1fr))'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        primary: '#fff',
        foreground: '#1f1f20',
        card: '#1f1f20',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },

        // ── Design System Semantic Colors ─────────────────────────────────
        // Slate-based dark scale (replaces old zinc-* raw values)
        dark: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },

        // Surface colors — use instead of raw bg-zinc-800/40 etc.
        surface: {
          base:     '#1E293B',  // bg-surface-base
          elevated: '#334155',  // bg-surface-elevated (hover states)
          pressed:  '#475569',  // bg-surface-pressed (active states)
          disabled: '#64748B',  // bg-surface-disabled
        },

        // State colors — success/warning/error/info
        state: {
          success: '#10B981',
          warning: '#F59E0B',
          error:   '#EF4444',
          info:    '#22D3EE',
        },

        // Cyan accent (same hue as old `main` but clean scale)
        cyan: {
          50:  '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',  // primary accent
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },

        // Emerald accent (success/secondary)
        emerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        teko: ['var(--font-teko)', ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0"
          },
          to: {
            height: "var(--radix-accordion-content-height)"
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)"
          },
          to: {
            height: "0"
          },
        },
        "ping-slow": {
          "0%": {
            transform: "scale(1)",
            opacity: "0.8"
          },
          "50%": {
            transform: "scale(1.1)",
            opacity: "0.4"
          },
          "100%": {
            transform: "scale(1.2)",
            opacity: "0"
          },
        },
        "skill-upgraded": {
          "0%": {
            transform: "scale(1)"
          },
          "50%": {
            transform: "scale(1.05)"
          },
          "100%": {
            transform: "scale(1)"
          },
        },
        "gradient": {
          "0%, 100%": {
            "background-position": "0% 50%"
          },
          "50%": {
            "background-position": "100% 50%"
          }
        },
        "glow-float-1": {
          "from": { transform: "translate(-15%, -10%)", opacity: "0.2" },
          "to":   { transform: "translate(15%, 10%)",  opacity: "0.4" }
        },
        "glow-float-2": {
          "from": { transform: "translate(15%, 10%)",  opacity: "0.15" },
          "to":   { transform: "translate(-15%, -10%)", opacity: "0.35" }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ping-slow": "ping-slow 0.8s ease-out",
        "skill-upgraded": "skill-upgraded 0.5s ease-in-out",
        "gradient": "gradient 6s linear infinite",
        "glow-float-1": "glow-float-1 8s ease-in-out infinite alternate",
        "glow-float-2": "glow-float-2 10s ease-in-out infinite alternate",
      },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      body: ['Inter', 'system-ui', 'sans-serif'],
      teko: ['var(--font-teko)', 'sans-serif']
    }
  },
  plugins: [
    require("tailwindcss-themer")({
      themes: [{
        name: "dark-theme",
        extend: {
          colors: {
            achievements: {
              common: "#fff",
              rare: "#b1f9ff",
              veryRare: "#ffe54c",
              epic: "rgb(110 70 255 / 1)",
            },
            mainText: {
              DEFAULT: "#ffff"
            },
            secondText: {
              DEFAULT: "#b5b5b5"
            },
            link: {
              DEFAULT: "#e5626b"
            },
            main: {
              DEFAULT: "#0891B2",
              bg: "#0891B2",
              calendar: "#0891B2",
              50: "#ecfeff",
              100: "#cffafe",
              200: "#a5f3fc",
              300: "#67e8f9",
              400: "#22d3ee",
              500: "#06b6d4",
              600: "#0891b2",
              700: "#0e7490",
              800: "#155e75",
              900: "#164e63",
            },
            second: {
              DEFAULT: "#1f1f20",
              special: "#1f1f20",
              text: "#ffa39b",
              50: "#757575",
              100: "#6B6B6B",
              200: "#575757",
              300: "#424242",
              400: "#2E2E2E",
              500: "#1f1f20",
              600: "#141414",
              700: "#0F0F0F",
              800: "#0A0A0A",
              900: "#050505",
            },
            "main-opposed": {
              DEFAULT: "#54575F",
              bg: "#212121",
              text: "#1f1f20",
              50: "#747983",
              100: "#71767F",
              200: "#696E77",
              300: "#62666F",
              400: "#5B5F67",
              500: "#54575F",
              600: "#484B51",
              700: "#3C3E44",
              800: "#303236",
              900: "#242529",
            },
            tertiary: {
              DEFAULT: "#CAC8C4",
              bg: "#0A0A0A",
              50: "#CAC7C4",
              100: "#CAC8C4",
              200: "#CAC8C4",
              300: "#CAC8C4",
              400: "#CAC8C4",
              500: "#CAC8C4",
              600: "#A9A59E",
              700: "#878278",
              800: "#615E56",
              900: "#3B3935",
            },
            error: {
              DEFAULT: "#d1002e",
              50: "#e88097",
              100: "#e36682",
              200: "#df4d6d",
              300: "#da3358",
              400: "#d61a43",
              500: "#d1002e",
              600: "#bc0029",
              700: "#a70025",
              800: "#920020",
              900: "#7d001c",
            },
            googleButtonText: {
              DEFAULT: "#555555"
            },
          },
       
        },
      }, ],
    }),
    require("tailwind-scrollbar"),
    rotateX,
    rotateY,
    scrollbarHide,
    defaultClick,
    glassEffects,
    borderRadius,
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};