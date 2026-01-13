import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4444,
    host: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8881',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8881',
        changeOrigin: true,
        rewrite: (path) => {
          if (path.startsWith('/api/ai/')) {
            return path.replace(/^\/api\/ai\//, '/.netlify/functions/ai-');
          }
          return path.replace(/^\/api/, '/.netlify/functions/api');
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  define: {
    // Ensure env vars are available
    'process.env': {},
  },
});
