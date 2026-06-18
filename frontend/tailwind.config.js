/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Light mode */
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        surface2: "var(--color-surface2)",
        border: "var(--color-border)",
        accent: {
          DEFAULT: "var(--color-accent)",
          light: "var(--color-accent-light)",
          xlight: "var(--color-accent-xlight)",
          glow: "var(--color-accent-glow)",
        },
        sidebar: {
          DEFAULT: "var(--color-sidebar)",
          text: "var(--color-sidebar-text)",
          muted: "var(--color-sidebar-muted)",
        },
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
          subtle: "var(--color-text-subtle)",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEF2F2",
        },
        warn: {
          DEFAULT: "#F59E0B",
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.06)',
        'glow': '0 0 20px var(--color-accent-glow)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: 0, transform: 'translateX(20px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        pulse2: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
      animation: {
        'fadeUp': 'fadeUp 0.35s ease both',
        'slideIn': 'slideIn 0.3s ease both',
      }
    },
  },
  plugins: [],
}