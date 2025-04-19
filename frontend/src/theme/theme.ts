export type ThemeMode = "light" | "dark";

// Palette de couleurs de base
const colors = {
  // Couleurs principales
  primary: {
    50: "#e6f1ff",
    100: "#c3daff",
    200: "#9dc2fd",
    300: "#74a9fc",
    400: "#4c91fa",
    500: "#2979f8", // Couleur principale
    600: "#1c62e3",
    700: "#134ccf",
    800: "#0d37b8",
    900: "#072799",
  },
  // Couleurs sémantiques
  success: {
    50: "#e8f7ed",
    100: "#c6ebcf",
    200: "#a1deae",
    300: "#7cd08e",
    400: "#5cc26e",
    500: "#3bb44e", // Couleur principale
    600: "#2fa542",
    700: "#229335",
    800: "#168128",
    900: "#056012",
  },
  warning: {
    50: "#fff9e6",
    100: "#ffecbf",
    200: "#ffdf99",
    300: "#ffd272",
    400: "#ffc54c",
    500: "#ffb826", // Couleur principale
    600: "#e6a31a",
    700: "#cc8e10",
    800: "#b37905",
    900: "#996500",
  },
  error: {
    50: "#feebeb",
    100: "#facece",
    200: "#f7afaf",
    300: "#f48f8f",
    400: "#f07070",
    500: "#ed5151", // Couleur principale
    600: "#d84848",
    700: "#c33f3f",
    800: "#af3636",
    900: "#9a2d2d",
  },
  // Nuances de gris
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
};

// Constantes pour les espaces, tailles et typographie
export const spacing = {
  "0": "0px",
  px: "1px",
  "0.5": "0.125rem", // 2px
  "1": "0.25rem", // 4px
  "1.5": "0.375rem", // 6px
  "2": "0.5rem", // 8px
  "2.5": "0.625rem", // 10px
  "3": "0.75rem", // 12px
  "3.5": "0.875rem", // 14px
  "4": "1rem", // 16px
  "5": "1.25rem", // 20px
  "6": "1.5rem", // 24px
  "7": "1.75rem", // 28px
  "8": "2rem", // 32px
  "9": "2.25rem", // 36px
  "10": "2.5rem", // 40px
  "11": "2.75rem", // 44px
  "12": "3rem", // 48px
  "14": "3.5rem", // 56px
  "16": "4rem", // 64px
  "20": "5rem", // 80px
  "24": "6rem", // 96px
  "28": "7rem", // 112px
  "32": "8rem", // 128px
  "36": "9rem", // 144px
  "40": "10rem", // 160px
  "44": "11rem", // 176px
  "48": "12rem", // 192px
  "52": "13rem", // 208px
  "56": "14rem", // 224px
  "60": "15rem", // 240px
  "64": "16rem", // 256px
  "72": "18rem", // 288px
  "80": "20rem", // 320px
  "96": "24rem", // 384px
};

export const borderRadius = {
  none: "0px",
  sm: "0.125rem", // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
};

export const fontSize = {
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
};

export const fontWeight = {
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
};

// Transitions et animations par défaut
export const transitions = {
  default: "all 0.3s ease",
  fast: "all 0.15s ease",
  slow: "all 0.5s ease",
};

export const animations = {
  fadeIn: "fade-in 0.3s ease-in-out",
  scaleIn: "scale-in 0.3s ease-in-out",
  slideUp: "slide-up 0.3s ease-in-out",
  slideDown: "slide-down 0.3s ease-in-out",
  slideLeft: "slide-left 0.3s ease-in-out",
  slideRight: "slide-right 0.3s ease-in-out",
};

// Définition des thèmes (variables CSS à utiliser dans le CSS global)
export const themeVariables = {
  light: {
    // Couleurs de fond
    background: {
      primary: colors.gray[50],
      secondary: colors.gray[100],
      tertiary: colors.gray[200],
    },
    // Couleurs de texte
    text: {
      primary: colors.gray[900],
      secondary: colors.gray[700],
      tertiary: colors.gray[500],
      inverted: colors.gray[50],
    },
    // Couleurs d'accent
    accent: {
      primary: colors.primary[500],
      secondary: colors.primary[600],
      tertiary: colors.primary[400],
    },
    // Couleurs d'interface
    border: colors.gray[300],
    divider: colors.gray[200],
    shadow: "rgba(0, 0, 0, 0.1)",
    shadowHover: "rgba(0, 0, 0, 0.15)",
    // Statuts
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
    // Autres couleurs contextuelles
    focus: colors.primary[500],
  },
  dark: {
    // Couleurs de fond
    background: {
      primary: colors.gray[900],
      secondary: colors.gray[800],
      tertiary: colors.gray[700],
    },
    // Couleurs de texte
    text: {
      primary: colors.gray[50],
      secondary: colors.gray[300],
      tertiary: colors.gray[400],
      inverted: colors.gray[900],
    },
    // Couleurs d'accent
    accent: {
      primary: colors.primary[400],
      secondary: colors.primary[300],
      tertiary: colors.primary[500],
    },
    // Couleurs d'interface
    border: colors.gray[600],
    divider: colors.gray[700],
    shadow: "rgba(0, 0, 0, 0.3)",
    shadowHover: "rgba(0, 0, 0, 0.4)",
    // Statuts
    success: colors.success[400],
    warning: colors.warning[400],
    error: colors.error[400],
    // Autres couleurs contextuelles
    focus: colors.primary[400],
  },
};

// Export des couleurs et variables de thème pour utilisation dans tailwind.config.ts
export const tailwindTheme = {
  colors,
  extend: {
    spacing,
    borderRadius,
    fontSize,
    fontWeight,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  transitions,
  animations,
  themeVariables,
};
