// vite.config.js
// Vite build configuration for the Sanitation Resilience Tracker.
// Adds two plugins:
//   1. react()       → enables JSX and React Fast Refresh in development
//   2. VitePWA()     → generates a service worker and manifest so the app works offline
//                      on Android/iOS devices used by field agents in low-connectivity areas

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // autoUpdate: the service worker updates silently in the background when a new version deploys
      registerType: "autoUpdate",

      manifest: {
        name: "SRT - Sanitation Resilience Tracker",
        short_name: "SRT",
        description: "Climate-resilient sanitation monitoring for Northern Ghana",
        theme_color: "#2e7d32",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      }
    })
  ]
});
