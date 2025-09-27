import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode === "development";

  return {
    plugins: [react(), tailwindcss()],
    server: isDev
      ? {
          proxy: {
            // Proxy API calls during development to the local backend
            // so calling `/api/*` from the Vite app forwards to
            // http://localhost:5000 (where the Backend server runs).
            "/api": {
              target: "http://localhost:5000",
              changeOrigin: true,
              secure: false,
              rewrite: (path) => path.replace(/^\/api/, "/api"),
            },
          },
        }
      : undefined,
    // Production build optimizations: split large vendor libraries into separate chunks
    build: {
      // Raise warning threshold slightly but also split manual chunks below
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Manual chunking: keep most node_modules in a single 'vendor' chunk to avoid
          // circular initialization where one vendor chunk imports React internals
          // from another (which can make React APIs undefined during evaluation).
          // Only extract very large, independent libs to their own chunks.
          manualChunks(id) {
            if (!id) return null;
            if (id.includes('node_modules')) {
              // keep particularly large independent libs separate
              if (id.includes('three')) return 'vendor_three';
              if (id.includes('gsap')) return 'vendor_gsap';
              if (id.includes('qrcode')) return 'vendor_qrcode';

              // Put everything else into a single 'vendor' chunk to ensure React and
              // its consumers are bundled together and initialized consistently.
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
