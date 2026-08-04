import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/')
          ) {
            return 'react-vendor';
          }

          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons';
          }

          if (
            id.includes('/src/EngineeringToolkit.tsx') ||
            id.includes('/src/ZyTutor.tsx')
          ) {
            return 'workspace-tools';
          }
        },
      },
    },
  },
});
