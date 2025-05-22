import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";

/**
 * Hook pour utiliser le contexte de thème
 * @returns Le thème actuel (light ou dark) et la fonction pour le changer
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  }

  // Calculer isDarkMode à partir du thème
  const isDarkMode = context.theme === "dark";

  return {
    ...context,
    isDarkMode,
  };
};

export default useTheme;
