import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./AppRouter";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./context/AuthContext";
// Import du configurateur d'intercepteurs axios
import { setupAxiosInterceptors } from "./api/axiosInterceptors";

// Import des styles globaux (à créer selon les besoins du projet)
import "./styles/index.css";

// Initialisation des intercepteurs pour les requêtes et réponses axios
setupAxiosInterceptors();

// Rendu de l'application dans le DOM
import { HelmetProvider } from "react-helmet-async";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>
);
