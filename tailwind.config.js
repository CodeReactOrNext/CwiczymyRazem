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
const box = plugin(function ({ addUtilities }) {
  addUtilities({
    ".box-default": {
      "border-radius": "3px",
      border: "2px solid",
      margin: "8px",
      padding: "8px",
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
      gridTemplateRows: {
        7: "repeat(7, minmax(0, 1fr))",
      },
    },
    fontFamily: {
      sans: "Teko",
      openSans: "Open Sans",
    },
  },
  plugins: [
    require("prettier-plugin-tailwindcss"),
    require("tailwindcss-themer")({
      themes: [
        {
          name: "default-theme",
          extend: {
            colors: {
              achievements: {
                common: "#fff",
                rare: "#b1f9ff",
                veryRare: "#ffe54c",
              },
              mainText: { DEFAULT: "#ffff" },

              link: { DEFAULT: "#43c5d6" },
              main: {
                DEFAULT: "#FF2A37",
                calendar: "#ffecac",
                50: "#ff5c69",
                100: "#ff525f",
                200: "#ff4855",
                300: "#ff3e4b",
                400: "#ff3441",
                500: "#ff2a37",
                600: "#f5202d",
                700: "#eb1623",
                800: "#e10c19",
                900: "#d7020f",
              },
              second: {
                DEFAULT: "#1193a4",
                special: "#1193a4",
                text: "#43c5d6",
                50: "#43c5d6",
                100: "#39bbcc",
                200: "#2fb1c2",
                300: "#25a7b8",
                400: "#1b9dae",
                500: "#1193a4",
                600: "#07899a",
                700: "#007f90",
                800: "#007586",
                900: "#006b7c",
              },
              "main-opposed": {
                DEFAULT: "#262e52",
                bg: "#30385c",
                50: "#586084",
                100: "#4e567a",
                200: "#444c70",
                300: "#3a4266",
                400: "#30385c",
                500: "#262e52",
                600: "#1c2448",
                700: "#121a3e",
                800: "#081034",
                900: "#00062a",
              },
              tertiary: {
                DEFAULT: "#f5d898",
                bg: "#f5d898",
                50: "#ffffca",
                100: "#ffffc0",
                200: "#fff6b6",
                300: "#ffecac",
                400: "#ffe2a2",
                500: "#f5d898",
                600: "#ebce8e",
                700: "#e1c484",
                800: "#d7ba7a",
                900: "#cdb070",
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
            backgroundImage: {
              "old-effect": "url('/static/images/old_effect.webp')",
              "old-effect-hr": "url('/static/images/old_effect_hr.webp')",
              guitarImage: "url('/static/images/guitar_blue.png')",
            },
          },
        },
        {
          name: "dark-theme",
          extend: {
            colors: {
              achievements: {
                common: "#fff",
                rare: "#b1f9ff",
                veryRare: "#ffe54c",
              },
              mainText: { DEFAULT: "#ffff" },
              link: { DEFAULT: "#e5626b" },
              main: {
                DEFAULT: "#FF2A37",
                bg: "#FF2A37",
                calendar: "#FF2A37",
                50: "#ff5c69",
                100: "#ff525f",
                200: "#ff4855",
                300: "#ff3e4b",
                400: "#ff3441",
                500: "#ff2a37",
                600: "#f5202d",
                700: "#eb1623",
                800: "#e10c19",
                900: "#d7020f",
              },
              second: {
                DEFAULT: "#1A1A1A",
                special: "#1A1A1A",
                text: "#ff4855",
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
                bg: "#323232",
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
              googleButtonText: { DEFAULT: "#555555" },
            },
            backgroundImage: {
              "old-effect": "url('/static/images/old_effect_dark.webp')",
              "old-effect-hr": "url('/static/images/old_effect_hr_dark.webp')",
              guitarImage: "url('/static/images/guitar_red.png')",
            },
          },
        },
      ],
    }),
    require("tailwind-scrollbar"),
    rotateX,
    rotateY,
    scrollbarHide,
    defaultClick,
    borderRadius,
  ],
};
