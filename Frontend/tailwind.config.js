/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#0F172A", 800: "#1E293B" },
        trust: "#10B981",
        warning: "#F59E0B",
        scam: "#EF4444",
        electric: "#3B82F6",
      },
    },
  },
  plugins: [],
};
