import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Guinda - Gobierno Mexicano
        guinda: {
          50: '#fdf2f2',
          100: '#fde3e3',
          200: '#fbcccc',
          300: '#f8a8a8',
          400: '#f17575',
          500: '#e54949',
          600: '#c22a2a',
          700: '#9a1f1f',  // Color principal guinda
          800: '#801d1d',
          900: '#6b1e1e',
          950: '#3a0c0c',
        },
        // Dorado institucional
        dorado: {
          50: '#fdfaeb',
          100: '#faf3c7',
          200: '#f6e58b',
          300: '#f0d04f',
          400: '#e9bc24',
          500: '#d9a316',  // Dorado principal
          600: '#bb7d10',
          700: '#965a11',
          800: '#7c4815',
          900: '#693b17',
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            primary: {
              50: '#fdf2f2',
              100: '#fde3e3',
              200: '#fbcccc',
              300: '#f8a8a8',
              400: '#f17575',
              500: '#e54949',
              600: '#c22a2a',
              700: '#9a1f1f',
              800: '#801d1d',
              900: '#6b1e1e',
              DEFAULT: '#9a1f1f',
              foreground: '#ffffff',
            },
            secondary: {
              50: '#fdfaeb',
              100: '#faf3c7',
              200: '#f6e58b',
              300: '#f0d04f',
              400: '#e9bc24',
              500: '#d9a316',
              600: '#bb7d10',
              700: '#965a11',
              800: '#7c4815',
              900: '#693b17',
              DEFAULT: '#d9a316',
              foreground: '#ffffff',
            },
            focus: '#9a1f1f',
          },
        },
      },
    }),
  ],
};
