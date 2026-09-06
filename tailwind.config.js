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
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          dark: '#0b141a',
          card: '#111b21',
          panel: '#202c33',
          border: '#2a3942',
          bubbleOut: '#005c4b',
          bubbleIn: '#202c33',
        },
        wa: {
          green: '#25D366',
          teal: '#128C7E',
          darkTeal: '#075E54',
          blue: '#34B7F1',
          bg: '#EFEAE2',
          darkBg: '#0c1317',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
