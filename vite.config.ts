import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // The marketing website has its own package and tests.
    exclude: [...configDefaults.exclude, 'website/**'],
  }
})
