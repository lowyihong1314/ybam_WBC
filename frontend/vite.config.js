import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.VITE_API_TARGET || "http://127.0.0.1:5018";
const appBase = process.env.VITE_BASE || "/ybam_wbc/";

export default defineConfig({
  plugins: [react()],
  base: appBase,
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/wbc": apiTarget,
      "/guest_and_member": apiTarget,
      "/payment_gateway": apiTarget,
      "/socket.io": {
        target: apiTarget,
        ws: true,
      },
      "/static": apiTarget,
    },
  },
});
