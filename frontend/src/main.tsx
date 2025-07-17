import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./AppRouter";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./context/AuthContext";
import { UserSyncProvider } from "./components/providers/UserSyncProvider";
// Import du configurateur d'intercepteurs axios
import { setupAxiosInterceptors } from "./api/axiosInterceptors";
// Configuration styled-components pour filtrer les props Framer Motion
import { StyleSheetManager } from "styled-components";
// Import du hook de navigation clavier pour l'accessibilité
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";

// Import des styles globaux (à créer selon les besoins du projet)
import "./styles/index.css";

// Initialisation des intercepteurs pour les requêtes et réponses axios
setupAxiosInterceptors();

// Fonction pour filtrer les props Framer Motion afin d'éviter les warnings
const shouldForwardProp = (prop: string, defaultValidatorFn?: (prop: string) => boolean) => {
  // Filtrer les props Framer Motion pour éviter qu'elles soient passées au DOM
  const framerMotionProps = [
    'initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 
    'whileTap', 'whileFocus', 'whileInView', 'viewport', 'layout', 
    'layoutId', 'drag', 'dragConstraints', 'dragElastic', 'dragMomentum'
  ];
  
  // Toujours bloquer les props Framer Motion
  if (framerMotionProps.includes(prop)) {
    return false;
  }
  
  // Utiliser le validateur par défaut s'il existe, sinon accepter toutes les autres props
  return typeof defaultValidatorFn === 'function' ? defaultValidatorFn(prop) : true;
};

// Rendu de l'application dans le DOM
import { HelmetProvider } from "react-helmet-async";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <UserSyncProvider syncInterval={10000}>
              <AppRouter />
            </UserSyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </StyleSheetManager>
  </React.StrictMode>
);
