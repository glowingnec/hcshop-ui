import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-dev-runtime',
      'react-router-dom',
      'lucide-react',
    ],
  },
  server: {
    port: 5173,
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/context/AppContext.tsx',
        './src/components/layout/StorefrontLayout.tsx',
        './src/pages/storefront/Phase1StorefrontPreview.tsx',
      ],
    },
  },
});
