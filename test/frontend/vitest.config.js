import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./setup.js"],
    css: false,
  },
  resolve: {
    alias: {
      // Alias the client src so imports work from this directory
      "@": "../../client/src",
    },
  },
});
