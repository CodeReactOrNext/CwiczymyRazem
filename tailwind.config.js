/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "main-red": "#FF2A37",
        "light-blue": "#1193A4",
        "dark-blue": "#262E52",
        "light-beige": "#F5D898",
      },
    },
    fontFamily: {
      sans: ["Teko"],
    },
  },
  plugins: [],
};
