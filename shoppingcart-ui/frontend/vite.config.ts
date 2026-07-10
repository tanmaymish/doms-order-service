import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the demo build under /doms-order-service/, so the
// deploy workflow sets VITE_BASE_PATH accordingly. Local dev and the
// production build embedded in shoppingcart-ui both stay at /ui/.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/ui/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/ui/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // frontend-maven-plugin runs this build during `mvn package` and the
    // output lands directly on the Spring Boot app's classpath, so the
    // compiled SPA ships inside the jar with no committed build artifacts.
    // The GitHub Pages demo workflow overrides this to a throwaway dir.
    outDir: process.env.VITE_OUT_DIR || '../target/classes/static',
    emptyOutDir: true,
  },
})
