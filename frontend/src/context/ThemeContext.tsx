import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ThemeMode } from "../theme/theme";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Récupère le thème depuis localStorage ou utilise 'light' par défaut
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Vérifie si on est côté client (pour éviter les erreurs SSR)
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      // Vérifie si le thème sauvegardé est valide ('light' ou 'dark')
      return savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : "light"; // Thème par défaut
    }
    return "light"; // Thème par défaut en SSR
  });

  // Applique l'attribut data-theme sur l'élément HTML
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);

    // Sauvegarde le thème dans localStorage
    localStorage.setItem("theme", mode);
  }, [mode]);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  // Fonction pour définir un thème spécifique
  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const value = {
    mode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte de thème
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
