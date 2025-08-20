import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#F97316",
              foreground: "#FFFFFF",
              50: "#FFF7ED",
              100: "#FFEDD5",
              200: "#FED7AA",
              300: "#FDBA74",
              400: "#FB923C",
              500: "#F97316",
              600: "#EA580C",
              700: "#C2410C",
              800: "#9A3412",
              900: "#7C2D12",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#F97316",
              foreground: "#111111",
              50: "#1A120B",
              100: "#1F140C",
              200: "#3A2413",
              300: "#562F13",
              400: "#7A3C12",
              500: "#F97316",
              600: "#EA580C",
              700: "#C2410C",
              800: "#9A3412",
              900: "#7C2D12",
            },
          },
        },
      },
    }),
  ],
}
