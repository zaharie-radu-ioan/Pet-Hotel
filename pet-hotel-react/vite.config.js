import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Port 5173 must match FRONTEND_ORIGIN in the backend (CORS).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
