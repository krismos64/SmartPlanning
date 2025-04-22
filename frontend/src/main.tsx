import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./AppRouter";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./context/AuthContext";

// Import des styles globaux (à créer selon les besoins du projet)
import "./styles/index.css";

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
