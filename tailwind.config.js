/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // Habilitar dark mode basado en clase
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        // ✅ NUEVOS COLORES CORPORATIVOS MADEYSO
        madeyso: {
          primary: "#00A651",
          "primary-light": "#33B871",
          "primary-dark": "#008742",
          secondary: "#9FD856",
          accent: "#E31E24",
          dark: "#1A1A1A",
          // Escala de verdes MADEYSO
          green: {
            50: "#E6F7EE",
            100: "#B3E6CE",
            200: "#80D5AE",
            300: "#4DC48E",
            400: "#1AB36E",
            500: "#00A651",
            600: "#008542",
            700: "#006433",
            800: "#004324",
            900: "#002115",
          },
          // Escala de lima
          lime: {
            50: "#F7FDE6",
            100: "#E8F9B8",
            200: "#D9F58A",
            300: "#CAF15C",
            400: "#BBED2E",
            500: "#9FD856",
            600: "#8AC647",
            700: "#75B438",
            800: "#60A229",
            900: "#4B901A",
          },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        scaleIn: "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
