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
  };
});
