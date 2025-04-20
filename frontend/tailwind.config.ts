import type { Config } from "tailwindcss";
import { tailwindTheme } from "./src/theme/theme";

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: "class", // Active le thème sombre via l'attribut class (utilisé avec data-theme)
  theme: {
    extend: {
      colors: {
        ...tailwindTheme.colors,
        // Les variables CSS seront utilisées directement dans les classes, par exemple:
        // bg-[var(--background-primary)], text-[var(--text-primary)], etc.
      },
      spacing: tailwindTheme.extend.spacing,
      borderRadius: tailwindTheme.extend.borderRadius,
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      fontWeight: {
        thin: "100",
        extralight: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },
      boxShadow: {
        sm: "0 1px 2px 0 var(--shadow)",
        DEFAULT: "0 1px 3px 0 var(--shadow), 0 1px 2px -1px var(--shadow)",
        md: "0 4px 6px -1px var(--shadow), 0 2px 4px -2px var(--shadow)",
        lg: "0 10px 15px -3px var(--shadow), 0 4px 6px -4px var(--shadow)",
        xl: "0 20px 25px -5px var(--shadow), 0 8px 10px -6px var(--shadow)",
        "2xl": "0 25px 50px -12px var(--shadow)",
        inner: "inset 0 2px 4px 0 var(--shadow)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-in-out forwards",
        "scale-in": "scale-in 0.3s ease-in-out forwards",
        "slide-up": "slide-up 0.3s ease-in-out forwards",
        "slide-down": "slide-down 0.3s ease-in-out forwards",
        "slide-left": "slide-left 0.3s ease-in-out forwards",
        "slide-right": "slide-right 0.3s ease-in-out forwards",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-left": {
          "0%": { transform: "translateX(10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-right": {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
      },
      transitionDuration: {
        "250": "250ms",
        "300": "300ms",
        "400": "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
