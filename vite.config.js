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
            // Proxy API calls during development to avoid CORS issues.
            // Requests to /api/* will be forwarded to the remote API.
            "/api": {
              target: "https://meditrap-1.onrender.com",
              changeOrigin: true,
              secure: false,
              rewrite: (path) => path.replace(/^\/api/, "/api"),
            },
          },
        }
      : undefined,
  };
});
