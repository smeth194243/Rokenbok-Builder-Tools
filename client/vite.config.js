import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api requests to the Express server so the browser never
    // has to deal with CORS during development.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
