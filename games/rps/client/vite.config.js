import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served by the MaanX server under /rps (see server.js at the repo root).
export default defineConfig({
  base: "/rps/",
  plugins: [react()],
  server: { fs: { allow: [".."] } },
});
