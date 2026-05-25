import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

const CSP_BASE =
  "default-src 'self'; base-uri 'self'; font-src 'self'; form-action 'none'; img-src 'self' data: blob:; manifest-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:;";

function arkaneContentSecurityPolicy(): Plugin {
  return {
    name: "arkane-content-security-policy",
    transformIndexHtml(_html, context) {
      const development = Boolean(context.server);
      const content = development
        ? `${CSP_BASE} connect-src 'self' https://api.github.com ws://localhost:* ws://127.0.0.1:*; script-src 'self' 'sha256-mSICIGB98ITj2Yxxlelnk8fzg5H9Y8+CIj/yAwqDvwQ=';`
        : `${CSP_BASE} connect-src 'self' https://api.github.com; script-src 'self';`;
      return [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content },
          injectTo: "head"
        }
      ];
    }
  };
}

export default defineConfig({
  base: "/arkane/",
  plugins: [
    arkaneContentSecurityPolicy(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "icon.svg"],
      manifest: {
        id: "/arkane/",
        name: "Arkane Vault",
        short_name: "Arkane",
        description: "Locally encrypted vault synced only through a private GitHub repository.",
        theme_color: "#080a08",
        background_color: "#080a08",
        display: "standalone",
        orientation: "portrait",
        scope: "/arkane/",
        start_url: "/arkane/",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "/arkane/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.github\.com\//,
            handler: "NetworkOnly",
            options: {
              cacheName: "github-api-network-only"
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ],
  test: {
    environment: "node",
    globals: true
  }
});
