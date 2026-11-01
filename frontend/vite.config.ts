import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The browser uses one origin in development. Vite forwards API calls to
    // ASP.NET, which lets the browser safely send its HttpOnly auth cookie.
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
});
