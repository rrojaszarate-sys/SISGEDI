import { nextui } from '@nextui-org/react'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#0070f3",
              foreground: "#ffffff",
            },
            focus: "#0070f3",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#0070f3",
              foreground: "#ffffff",
            },
            focus: "#0070f3",
          },
        },
      },
    }),
  ],
}
