import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
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
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/anthropic-chat/, '/functions/v1/anthropic-chat'),
        headers: {
          'x-skip-auth': 'true'
        },
        configure: (proxy: any, _options: any) => {
          // Add proxy event listener to force content-type to be application/json
          proxy.on('proxyRes', (proxyRes: any, _req: any, _res: any) => {
            // Forward any headers from the original request
            proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
              }
            });

            // If the response has content, set the content type to JSON regardless of what was returned
            if (proxyRes.headers['content-length'] && parseInt(proxyRes.headers['content-length']) > 0) {
              console.log('Forcing content-type to application/json');
              proxyRes.headers['content-type'] = 'application/json';
            }
          });
        }
      },
    },
  },
}))
