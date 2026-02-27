import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/web/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/page-builder/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/agents/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/workflows/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Critical layout/nav classes – fallback if content scan fails on Vercel
    "flex", "items-center", "gap-2", "gap-4", "gap-6", "ml-auto",
    "border-b", "border-gray-200", "bg-white", "px-4", "px-8", "py-4",
    "font-bold", "text-indigo-600", "text-gray-600", "text-gray-900", "text-sm", "text-gray-500",
    "hover:text-indigo-700", "hover:text-gray-900", "hover:bg-gray-100",
    "min-h-screen", "container", "mx-auto", "rounded-xl", "rounded-lg",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        receptor: {
          primary: "#7c3aed",
          secondary: "#0d9488",
          "purple-blue": "linear-gradient(to right, #7c3aed, #2563eb)",
          "green-teal": "linear-gradient(to right, #10b981, #0d9488)",
        },
      },
      backgroundImage: {
        "gradient-receptor-primary": "linear-gradient(to right, #7c3aed, #2563eb)",
        "gradient-receptor-secondary": "linear-gradient(to right, #10b981, #0d9488)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  darkMode: "class",
};
export default config;
