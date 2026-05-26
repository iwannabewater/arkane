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
          canvas: "oklch(7.5% 0.014 145)",
          deck: "oklch(10.5% 0.016 142)",
          panel: "oklch(15% 0.022 138)",
          panelHigh: "oklch(20% 0.028 132)",
          line: "oklch(100% 0 0 / 0.085)",
          lineStrong: "oklch(82% 0.08 86 / 0.22)",
          text: "oklch(92% 0.017 100)",
          muted: "oklch(72% 0.024 112)",
          faint: "oklch(54% 0.024 126)",
          amber: "oklch(78% 0.13 82)",
          red: "oklch(65% 0.18 28)",
          green: "oklch(74% 0.13 155)",
          cyan: "oklch(76% 0.1 190)",
          brass: "oklch(67% 0.09 84)",
          ivory: "oklch(88% 0.052 92)"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px oklch(100% 0 0 / 0.08), 0 24px 90px oklch(0% 0 0 / 0.42)",
        amber: "0 0 28px oklch(78% 0.13 82 / 0.2)",
        inset: "inset 0 1px 0 oklch(100% 0 0 / 0.05)"
      },
      transitionTimingFunction: {
        arkane: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: []
} satisfies Config;
