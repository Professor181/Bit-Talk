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
        brand: {
          green: "#25D366",
          darkGreen: "#128C7E",
          teal: "#075E54",
          light: "#DCF8C6",
          bg: "#ECE5DD",
          sidebar: "#111B21",
          sidebarHover: "#1F2C33",
          sidebarBorder: "#2A3942",
          chatBg: "#0B141A",
          msgOut: "#005C4B",
          msgIn: "#1F2C33",
          text: "#E9EDEF",
          subtext: "#8696A0",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
