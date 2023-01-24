const defaultTheme = require("tailwindcss/defaultTheme");
const plugin = require("tailwindcss/plugin");
/** @type {import('tailwindcss').Config} */
// Rotate X utilities
const rotateX = plugin(function ({ addUtilities }) {
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
const rotateY = plugin(function ({ addUtilities }) {
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

const scrollbarHide = plugin(function ({ addUtilities }) {
  addUtilities(
    {
      ".scrollbar-hide": {
        /* IE and Edge */
        "-ms-overflow-style": "none",

        /* Firefox */
        "scrollbar-width": "none",

        /* Safari and Chrome */
        "&::-webkit-scrollbar": {
          display: "none",
        },
      },

      ".scrollbar-default": {
        /* IE and Edge */
        "-ms-overflow-style": "auto",

        /* Firefox */
        "scrollbar-width": "auto",

        /* Safari and Chrome */
        "&::-webkit-scrollbar": {
          display: "block",
        },
      },
    },
    ["responsive"]
  );
});

const defaultClick = plugin(function ({ addUtilities }) {
  addUtilities({
    ".click-behavior": {
      transform: "scale(95%)",
      transitionProperty: "transform",
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      transitionDuration: "100ms",
    },
    ".click-behavior-second": {
      transform: "scale(90%)",
    },
    ".transition-background": {
      transitionProperty: "background-color, border-color",
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      transitionDuration: "30ms",
    },
  });
});
const borderRadius = plugin(function ({ addUtilities }) {
  addUtilities({
    ".radius-default": {
      "border-radius": "3px",
    },
  });
});

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./feature/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    screens: {
      xxs: "285px",
      xs: "350px",
      xsm: "500px",
      ...defaultTheme.screens,
    },
    extend: {
      display: ["group-hover"],
      dropShadow: {
        "3xl": "0 1px 3px rgba(0, 0, 0, 0.45)",
      },
      boxShadow: {
        "inset-cool": "inset 0 -3px 8px -3px rgba(88, 96, 132,0.7)",
      },
      backgroundImage: {
        "old-effect": "url('/static/images/old_effect.webp')",
        "old-effect-hr": "url('/static/images/old_effect_hr.webp')",
      },
      colors: {
        achievements: {
          common: "#fff",
          rare: "#b1f9ff",
          veryRare: "#ffe54c",
        },
        mainText: { DEFAULT: "#ffff" },
        main: {
          DEFAULT: "#D3842F",
          50: "#D78F42",
          100: "#D78E40",
          200: "#D68B3C",
          300: "#D58937",
          400: "#D48633",
          500: "#D3842F",
          600: "#D1812C",
          700: "#CD7F2B",
          800: "#C87C2A",
          900: "#C47A29",
        },
        second: {
          DEFAULT: "#1A1A1A",
          50: "#757575",
          100: "#6B6B6B",
          200: "#575757",
          300: "#424242",
          400: "#2E2E2E",
          500: "#1A1A1A",
          600: "#141414",
          700: "#0F0F0F",
          800: "#0A0A0A",
          900: "#050505",
        },
        "main-opposed": {
          DEFAULT: "#54575F",
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
        googleButtonText: { DEFAULT: "#555555" },
      },
    },
    fontFamily: {
      sans: "Teko",
      openSans: "Open Sans",
    },
  },
  plugins: [
    require("prettier-plugin-tailwindcss"),
    require("tailwind-scrollbar"),
    rotateX,
    rotateY,
    scrollbarHide,
    defaultClick,
    borderRadius,
  ],
};
