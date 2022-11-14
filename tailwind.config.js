/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./feature/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    screens: {
      xs: "350px",
      ...defaultTheme.screens,
    },
    extend: {
      backgroundImage: {
        "old-effect": "url('/static/images/old_effect.webp')",
        "old-effect-hr": "url('/static/images/old_effect_hr.png')",
      },
      colors: {
        main: {
          DEFAULT: "#FF2A37",
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
      },
    },
    fontFamily: {
      sans: ["Teko"],
    },
  },
  plugins: [require("prettier-plugin-tailwindcss")],
};
