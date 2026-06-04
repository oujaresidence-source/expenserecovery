import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "oklch(var(--ink) / <alpha-value>)",
        muted: "oklch(var(--muted) / <alpha-value>)",
        line: "oklch(var(--line) / <alpha-value>)",
        canvas: "oklch(var(--canvas) / <alpha-value>)",
        surface: "oklch(var(--surface) / <alpha-value>)",
        brand: "oklch(var(--brand) / <alpha-value>)",
        coral: "oklch(var(--coral) / <alpha-value>)",
        mint: "oklch(var(--mint) / <alpha-value>)",
        amber: "oklch(var(--amber) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 8px 18px oklch(0.24 0.04 250 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
