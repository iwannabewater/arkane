import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Avenir Next"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "system-ui",
          "sans-serif"
        ],
        serif: ["Charter", '"Charter Web"', "Georgia", "serif"],
        mono: [
          '"SFMono-Regular"',
          '"Cascadia Code"',
          '"JetBrains Mono"',
          "Consolas",
          "monospace"
        ]
      },
      colors: {
        arkane: {
          canvas: "oklch(8% 0.012 165)",
          deck: "oklch(11% 0.014 165)",
          panel: "oklch(15% 0.018 165)",
          panelHigh: "oklch(19% 0.022 165)",
          line: "oklch(100% 0 0 / 0.08)",
          text: "oklch(91% 0.018 100)",
          muted: "oklch(69% 0.018 120)",
          faint: "oklch(52% 0.018 130)",
          amber: "oklch(78% 0.16 78)",
          red: "oklch(66% 0.2 29)",
          green: "oklch(75% 0.14 156)",
          cyan: "oklch(78% 0.12 190)",
          brass: "oklch(64% 0.095 82)"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px oklch(100% 0 0 / 0.08), 0 18px 70px oklch(0% 0 0 / 0.35)",
        amber: "0 0 28px oklch(78% 0.16 78 / 0.18)"
      },
      transitionTimingFunction: {
        arkane: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: []
} satisfies Config;
