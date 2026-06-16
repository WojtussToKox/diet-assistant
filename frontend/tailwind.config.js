/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F9F8",
        surface: "#FFFFFF",
        border: "#E4EBE7",
        accent: {
          DEFAULT: "#2D6A4F",
          light: "#95D5B2",
          xlight: "#D8F3E3",
        },
        text: {
          DEFAULT: "#1A1A2E",
          muted: "#6B7280",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
        },
        warn: {
          DEFAULT: "#D97706",
          light: "#FFFBEB",
        },
        macro: {
          protein: "#3B82F6",
          fat: "#F59E0B",
          carbs: "#10B981",
          calories: "#8B5CF6",
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}