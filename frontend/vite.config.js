import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE: subcarpeta donde se publica (GitHub Pages: "/<repo>/"). En local y en el servidor propio es "/".
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
