import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        water: "#3b82f6",
        sleep: "#8b5cf6",
        workout: "#f97316",
      },
    },
  },
  plugins: [],
};

export default config;
