import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: "#0f172a",
        "surface-card": "#1e293b",
        "surface-hover": "#334155",
        border: "#1e293b",
        "border-glow": "#3b82f6",
        primary: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          foreground: "#ffffff",
        },
        gain: {
          DEFAULT: "#10b981",
          light: "rgba(16, 185, 129, 0.15)",
          text: "#34d399",
        },
        loss: {
          DEFAULT: "#f43f5e",
          light: "rgba(244, 63, 94, 0.15)",
          text: "#fb7185",
        },
        accent: {
          cyan: "#06b6d4",
          purple: "#8b5cf6",
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
