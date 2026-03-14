import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-utils': ['axios', 'lucide-react', 'react-hot-toast'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/abstract': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/source-databases': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/device': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/registrations': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/acc-registration': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/sponsorship': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/contact': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/brochure': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mail': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
