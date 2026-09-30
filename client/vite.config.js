import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Any request to /api goes to the Express backend on port 4000
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
