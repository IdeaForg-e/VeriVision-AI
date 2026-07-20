/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Design-token colour palette ────────────────────────────────────────
      // "primary" maps to FraudGuard brand blue
      colors: {
        primary: "#004ac6",
        "on-primary": "#ffffff",
        "primary-container": "#d3e4fe",
        "on-primary-container": "#00154c",
        "primary-fixed": "#d3e4fe",
        "on-primary-fixed": "#00154c",

        secondary: "#555f71",
        "on-secondary": "#ffffff",
        "secondary-container": "#d9e3f7",
        "on-secondary-container": "#121c2b",

        tertiary: "#6d5e78",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#f5daff",
        "on-tertiary-container": "#261431",
        "tertiary-fixed": "#f5daff",
        "on-tertiary-fixed": "#261431",
        "tertiary-container-30": "rgba(109,94,120,0.30)",

        // Surface tokens
        background: "#f8f9ff",
        "on-background": "#191c20",
        surface: "#f8f9ff",
        "on-surface": "#191c20",
        "on-surface-variant": "#43474e",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f1f4fb",
        "surface-container": "#ebeef5",
        "surface-container-high": "#e5e8ef",
        "surface-container-highest": "#dfe2ea",

        // Outline tokens
        outline: "#73777f",
        "outline-variant": "#c3c7cf",

        // Error / success tokens
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#410002",
      },

      // ── Spacing tokens ─────────────────────────────────────────────────────
      spacing: {
        "gutter": "24px",
        "card-padding": "24px",
        "stack-gap": "16px",
      },

      // ── Typography tokens ──────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      fontSize: {
        // headline sizes
        "headline-lg": ["1.5rem", { lineHeight: "2rem",    fontWeight: "700" }],
        "headline-md": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "700" }],
        "headline-sm": ["1rem",    { lineHeight: "1.5rem",  fontWeight: "700" }],
        // body sizes
        "body-lg": ["1rem",    { lineHeight: "1.5rem",  fontWeight: "400" }],
        "body-md": ["0.875rem",{ lineHeight: "1.25rem", fontWeight: "400" }],
        "body-sm": ["0.75rem", { lineHeight: "1rem",    fontWeight: "400" }],
        // label
        "label-caps": ["0.6875rem", { lineHeight: "1rem", fontWeight: "600", letterSpacing: "0.08em" }],
      },

      // ── Font-weight helpers referenced as classes ──────────────────────────
      fontWeight: {
        "tech-code": "700",
      },

      // ── Border-radius ──────────────────────────────────────────────────────
      borderRadius: {
        card: "12px",
        chip: "999px",
      },

      // ── Box-shadow ─────────────────────────────────────────────────────────
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)",
        "card-hover": "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
      },

      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
