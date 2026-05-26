import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--arkane-font-sans)"],
        serif: ["var(--arkane-font-serif)"],
        cn: ["var(--arkane-font-cn)"],
        mono: ["var(--arkane-font-sans)"]
      },
      colors: {
        arkane: {
          canvas: "oklch(6.6% 0.012 295)",
          deck: "oklch(10.2% 0.014 286)",
          panel: "oklch(14.4% 0.017 278)",
          panelHigh: "oklch(18.6% 0.021 270)",
          line: "oklch(91% 0.026 88 / 0.092)",
          lineStrong: "oklch(77% 0.066 78 / 0.24)",
          text: "oklch(91.5% 0.034 88)",
          muted: "oklch(73% 0.028 84)",
          faint: "oklch(55% 0.026 84)",
          amber: "oklch(75% 0.095 78)",
          red: "oklch(62% 0.16 27)",
          green: "oklch(71% 0.115 153)",
          cyan: "oklch(66% 0.07 238)",
          brass: "oklch(64% 0.063 79)",
          ivory: "oklch(88.5% 0.048 88)"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px oklch(91% 0.026 88 / 0.085), 0 26px 90px oklch(0% 0 0 / 0.46)",
        amber: "0 18px 38px oklch(75% 0.095 78 / 0.12)",
        inset: "inset 0 1px 0 oklch(100% 0 0 / 0.045)"
      },
      transitionTimingFunction: {
        arkane: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: []
} satisfies Config;
