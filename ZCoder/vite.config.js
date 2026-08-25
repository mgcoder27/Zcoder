import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',

  build: {
    chunkSizeWarningLimit: 2000, // optional: raise warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['axios', 'lodash'], // add heavy deps here
        },
      },
    },
  },
})
