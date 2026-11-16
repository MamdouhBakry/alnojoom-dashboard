import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// BASE_PATH lets the dashboard live in a sub-folder on shared hosting (e.g. "/admin/").
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
});
