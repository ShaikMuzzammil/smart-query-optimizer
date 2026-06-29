import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}","./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { purple: { 900: "#1a0533", 800: "#2d0f4e", 700: "#4a1a7a", 600: "#6b28a8", 500: "#8b33cc", 400: "#a855d4", 300: "#c084fc", 200: "#d8b4fe", 100: "#f3e8ff" } } } },
  plugins: [],
};
export default config;
