/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: token("app"),
        surface: {
          DEFAULT: token("surface"),
          2: token("surface-2"),
          3: token("surface-3"),
        },
        fg: { DEFAULT: token("fg"), 2: token("fg-2"), 3: token("fg-3") },
        line: "rgb(var(--c-line) / var(--line-alpha))",
        brand: {
          DEFAULT: token("brand"),
          solid: token("brand-solid"),
          hover: token("brand-hover"),
        },
        gold: token("gold"),
        ok: token("ok"),
        warn: token("warn"),
        danger: token("danger"),
        info: token("info"),
        bubble: { in: token("bubble-in"), out: token("bubble-out") },
        note: token("note"),
      },
      fontFamily: {
        sans: [
          '"Inter Variable"',
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: { "4xl": "2rem" },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
      transitionTimingFunction: { out: "var(--ease-out)" },
      animation: {
        rise: "rise 0.38s var(--ease-out) both",
        fade: "fade 0.3s var(--ease-out) both",
        drift: "drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
