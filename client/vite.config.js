import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Same-origin /api in dev, so auth cookies work without CORS setup.
  server: { proxy: { '/api': 'http://localhost:8000' } },
});
