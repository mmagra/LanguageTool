import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy removed: This ensures production builds NEVER try to reach localhost.
    // If you see 404s, it means VITE_API_BASE_URL is invalid/missing.
  },
})