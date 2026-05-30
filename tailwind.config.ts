import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        background: { DEFAULT: "var(--background)" },
        foreground: { DEFAULT: "var(--foreground)" },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-fg)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-fg)",
        },
        muted: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: { DEFAULT: "var(--border)" },
        input: { DEFAULT: "var(--input)" },
        ring: { DEFAULT: "var(--ring)" },
        success: { DEFAULT: "var(--success)" },
        danger: { DEFAULT: "var(--danger)" },
        flame: { DEFAULT: "var(--flame)" },
        ink: { DEFAULT: "var(--ink)" },
        surface: { DEFAULT: "var(--surface)" },
        paper: { DEFAULT: "var(--bg)" },
        // Backwards compatibility colors
        bg: "hsl(var(--bg) / <alpha-value>)",
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        DEFAULT: "var(--radius)",
        md: "var(--radius)",
        lg: "calc(var(--radius) + 4px)",
        xl: "calc(var(--radius) + 8px)",
        "2xl": "calc(var(--radius) + 12px)",
      },
      fontFamily: {
        sans: ["var(--font-rubik)", "Rubik", "sans-serif"],
        he: ["var(--font-heebo)", "Heebo", "Rubik", "sans-serif"],
        ne: ["var(--font-mukta)", "Mukta", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "monospace"],
        // Backwards compatibility fonts
        display: ["var(--font-display)", "Rubik", "sans-serif"],
        body: ["var(--font-body)", "Rubik", "sans-serif"],
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        flame: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-2px) scale(1.04)" },
        },
      },
      animation: {
        "pop-in": "pop-in 320ms cubic-bezier(0.16,1,0.3,1) both",
        flame: "flame 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
