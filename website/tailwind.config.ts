import type { Config } from "tailwindcss";

// Same token vocabulary as the Scriwo app (src/index.css there), so the site and product feel like one brand.
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: token("app"),
        surface: { DEFAULT: token("surface"), 2: token("surface-2"), 3: token("surface-3") },
        fg: { DEFAULT: token("fg"), 2: token("fg-2"), 3: token("fg-3") },
        line: "rgb(var(--c-line) / var(--line-alpha))",
        brand: { DEFAULT: token("brand"), solid: token("brand-solid"), hover: token("brand-hover") },
        gold: token("gold"),
        ok: token("ok"),
        info: token("info"),
        danger: token("danger"),
        bubble: { in: token("bubble-in"), out: token("bubble-out") },
        note: token("note"),
        ink: token("ink"),
        leaf: token("leaf"),
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        display: ['"Montserrat"', '"Inter Variable"', "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      boxShadow: { card: "var(--shadow-card)", pop: "var(--shadow-pop)" },
      maxWidth: { page: "72rem" },
    },
  },
  plugins: [],
} satisfies Config;
