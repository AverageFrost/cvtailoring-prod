
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api/anthropic-chat': {
        target: 'https://kuldrlyjjimvoiedwjmf.supabase.co/functions/v1/anthropic-chat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic-chat/, ''),
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1bGRybHlqamltdm9pZWR3am1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MjExMjQsImV4cCI6MjA1NzM5NzEyNH0.IFIIgTWdFu5A2s5Ke5Uvy4l-6NW4gFNVx8sE_3Da-zI',
        },
      },
    },
  },
}))
