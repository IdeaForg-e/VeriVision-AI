/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark\"]'],
  theme: {
    extend: {
      colors: {
        // ── Aura Modern Design System Tokens ──
        surface: {
          DEFAULT: "var(--surface)",
          dim:     "var(--surface-dim)",
          bright:  "var(--surface-bright)",
          lowest:  "var(--surface-lowest)",
          low:     "var(--surface-low)",
          base:    "var(--surface-base)",
          high:    "var(--surface-high)",
          highest: "var(--surface-highest)",
          variant: "var(--surface-variant)",
        },
        primary: {
          DEFAULT:   "var(--primary)",
          container: "var(--primary-container)",
        },
        secondary: {
          DEFAULT:   "var(--secondary)",
          container: "var(--secondary-container)",
        },
        tertiary: {
          DEFAULT:   "var(--tertiary)",
          container: "var(--tertiary-container)",
        },
        // Semantic
        success: "var(--success)",
        warning: "var(--warning)",
        urgent:  "var(--urgent)",
        error:   "var(--error)",
        // Legacy aliases
        brand: {
          DEFAULT: "#007db8",
          hover:   "#0090d3",
          light:   "#8ecdff",
        },
        risk: {
          clean:    "#10b981",
          warning:  "#fca311",
          mismatch: "#f97316",
          critical: "#e94560",
        },
      },
      fontFamily: {
        // Aura Modern
        headline: ["Poppins", "system-ui", "sans-serif"],
        body:     ["Montserrat", "system-ui", "sans-serif"],
        sans:     ["Montserrat", "Inter", "system-ui", "sans-serif"],
        mono:     ["JetBrains Mono", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        full: "var(--radius-full)",
        card: "var(--radius-lg)",
        chip: "var(--radius-full)",
      },
      boxShadow: {
        glass:   "var(--glass-shadow)",
        "glass-sm": "var(--glass-shadow-sm)",
        "glow-primary": "0 0 20px var(--primary-glow)",
        panel:   "0 1px 3px 0 rgba(0, 0, 0, 0.15)",
        elevated:"0 20px 40px rgba(0, 0, 0, 0.45)",
      },
      keyframes: {
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(16px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-ring": {
          "0%":   { boxShadow: "0 0 0 0 rgba(0, 125, 184, 0.5)" },
          "70%":  { boxShadow: "0 0 0 8px rgba(0, 125, 184, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(0, 125, 184, 0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "slide-up":      "slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-left": "slide-in-left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-in":       "fade-in 0.25s ease-out",
        "pulse-ring":    "pulse-ring 1.8s ease-in-out infinite",
        shimmer:         "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};
