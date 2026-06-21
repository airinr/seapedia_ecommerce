/** @type {import('tailwindcss').Config} */
import theme from "./src/styles/tokens.js";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Font family: gunakan class `font-sans`, `font-display`, `font-mono`
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      fontSize: theme.fontSize,
      // Warna brand: gunakan class `bg-primary`, `text-secondary`, dll
      colors: theme.colors,
      boxShadow: theme.boxShadow,
    },
  },
  plugins: [],
};
