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
        background: "#111116",
        card: "#20202A",
        "card-hover": "#262633",
        "card-subtle": "#171720",
        accent: {
          DEFAULT: "#B69CFF",
          light: "#CEBDFF",
          dark: "#906CFA",
          dim: "rgba(182, 156, 255, 0.15)",
          glow: "rgba(182, 156, 255, 0.35)",
        },
        secondary: "#A1A1AA",
        border: "rgba(255, 255, 255, 0.08)",
        "border-focus": "rgba(182, 156, 255, 0.4)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Cinzel", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(182, 156, 255, 0.3)",
        "glow-lg": "0 0 45px -5px rgba(182, 156, 255, 0.4)",
        "glow-card": "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 15px -3px rgba(182, 156, 255, 0.15)",
        card: "0 8px 30px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.75" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

