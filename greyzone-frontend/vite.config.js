import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When VITE_USE_MOCK=false, /api calls are proxied to the Express backend.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
});
