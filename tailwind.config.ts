import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F172A",
          hover: "#020617",
          light: "#1E293B",
        },
        slate: {
          DEFAULT: "#64748B",
          text: "#475569",
          border: "#E2E8F0",
          subtle: "#F1F5F9",
        },
        sage: {
          DEFAULT: "#059669",
          hover: "#047857",
          light: "#ECFDF5",
          border: "#A7F3D0",
        },
        bg: {
          DEFAULT: "#F8FAFC",
        },
        surface: {
          DEFAULT: "#FFFFFF",
        },
        success: {
          DEFAULT: "#22C55E",
          subtle: "#22C55E15",
          text: "#16A34A",
        },
        warning: {
          DEFAULT: "#EAB308",
          subtle: "#EAB30815",
          text: "#CA8A04",
        },
        error: {
          DEFAULT: "#EF4444",
          subtle: "#EF444415",
          text: "#DC2626",
        },
        info: {
          DEFAULT: "#0EA5E9",
          subtle: "#0EA5E915",
          text: "#0284C7",
        },
      },
      fontFamily: {
        headline: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ["'DM Sans'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'Fira Code'", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 3px rgba(15, 23, 42, 0.03)",
        DEFAULT: "0 2px 6px rgba(15, 23, 42, 0.05)",
        md: "0 4px 16px rgba(15, 23, 42, 0.07)",
        lg: "0 8px 32px rgba(15, 23, 42, 0.10)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
